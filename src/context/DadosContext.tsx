/**
 * DadosContext = o "cérebro" do app.
 *
 * Junta as 3 peças e entrega tudo pronto para as telas:
 *   1. API (mock ou real)    -> busca plantações e leituras novas
 *   2. SQLite (celular)      -> guarda tudo, funciona sem internet
 *   3. NetInfo (internet)    -> sabe se está online
 *
 * Fluxo:
 *   - Ao abrir: lê do celular a plantação escolhida da última vez e mostra
 *     o que já está salvo. Depois busca as plantações e as leituras na API.
 *   - A cada 20 segundos: busca a última leitura da plantação ABERTA,
 *     salva no SQLite e envia irrigações pendentes.
 *   - Tela Plantações: atualiza o resumo de TODAS as plantações.
 *   - "Irriguei": salva no SQLite PRIMEIRO (nunca se perde) e depois envia.
 *   - "Adicionar plantação": envia para a API (precisa de internet, porque o id
 *     vem do servidor), salva no SQLite e já abre a plantação nova.
 *
 * Todas as tarefas que mexem no banco passam por uma FILA (uma de cada vez),
 * para duas atualizações nunca gravarem ao mesmo tempo.
 */
import NetInfo from '@react-native-community/netinfo';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { PLANTACAO_PADRAO_ID } from '@/constants/propriedade';
import {
  buscarAlertaSemResposta,
  contarLeituras,
  listarLeituras,
  listarPendentes,
  marcarSincronizado,
  salvarIrrigacaoLocal,
  salvarLeiturasDaApi,
  ultimaLeituraDe,
} from '@/db/leiturasDb';
import {
  lerPreferencia,
  listarPlantacoes,
  salvarPlantacao,
  salvarPlantacoes,
  salvarPreferencia,
} from '@/db/plantacoesDb';
import { api } from '@/services/api';
import type { LeituraLocal, NovaIrrigacao } from '@/types/leitura';
import type { NovaPlantacao, Plantacao } from '@/types/plantacao';

const INTERVALO_ATUALIZACAO_MS = 20_000;
const CHAVE_PLANTACAO = 'plantacaoSelecionada';

export interface ResultadoIrrigacao {
  enviado: boolean; // true = chegou na API; false = ficou salvo no celular
  tempoReacaoSeg: number | null;
}

interface DadosContextValor {
  plantacoes: Plantacao[];
  plantacaoAtual: Plantacao | null;
  resumo: Record<number, LeituraLocal | null>; // última leitura de cada plantação
  ultima: LeituraLocal | null; // última leitura da plantação aberta
  historico: LeituraLocal[]; // da plantação aberta, mais recente primeiro
  online: boolean;
  atualizando: boolean;
  carregou: boolean; // true depois da 1ª sincronização (para saber se a lista vazia é "vazia mesmo")
  erro: string | null;
  pendentes: number; // irrigações esperando internet (todas as plantações)
  atualizar: () => Promise<void>;
  atualizarTodas: () => Promise<void>;
  escolherPlantacao: (id: number) => Promise<void>;
  registrarIrrigacao: () => Promise<ResultadoIrrigacao>;
  adicionarPlantacao: (dados: NovaPlantacao) => Promise<Plantacao>;
}

const DadosContext = createContext<DadosContextValor | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();

  const [plantacoes, setPlantacoes] = useState<Plantacao[]>([]);
  const [plantacaoId, setPlantacaoId] = useState(PLANTACAO_PADRAO_ID);
  const [resumo, setResumo] = useState<Record<number, LeituraLocal | null>>({});
  const [historico, setHistorico] = useState<LeituraLocal[]>([]);
  const [online, setOnline] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [carregou, setCarregou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState(0);

  // refs: valores que as funções assíncronas leem "na hora", sem esperar re-render.
  const onlineRef = useRef(true);
  const plantacaoIdRef = useRef(PLANTACAO_PADRAO_ID);
  const fila = useRef<Promise<unknown>>(Promise.resolve());
  const tarefasNaFila = useRef(0);

  /** Coloca uma tarefa na fila: só começa quando a anterior terminar. */
  const naFila = useCallback(<T,>(tarefa: () => Promise<T>): Promise<T> => {
    tarefasNaFila.current += 1;
    const resultado = fila.current.catch(() => {}).then(tarefa);
    fila.current = resultado.finally(() => {
      tarefasNaFila.current -= 1;
    });
    return resultado;
  }, []);

  /** Lê o SQLite e atualiza a tela. */
  /**
   * Se a plantação escolhida não existe na lista (ex.: conta nova, ou ela foi
   * apagada), passa a usar a primeira da lista.
   */
  const garantirSelecao = useCallback(
    async (lista: Plantacao[]) => {
      if (lista.length === 0 || lista.some((p) => p.id === plantacaoIdRef.current)) return;
      plantacaoIdRef.current = lista[0].id;
      setPlantacaoId(lista[0].id);
      await salvarPreferencia(db, CHAVE_PLANTACAO, String(lista[0].id));
    },
    [db],
  );

  const recarregarDoCelular = useCallback(async () => {
    const lista = await listarPlantacoes(db);
    await garantirSelecao(lista);
    const id = plantacaoIdRef.current;
    const [hist, listaPendentes, ultimas] = await Promise.all([
      listarLeituras(db, id),
      listarPendentes(db),
      Promise.all(lista.map((p) => ultimaLeituraDe(db, p.id))),
    ]);
    setPlantacoes(lista);
    setHistorico(hist);
    setPendentes(listaPendentes.length);
    setResumo(Object.fromEntries(lista.map((p, i) => [p.id, ultimas[i]])));
  }, [db, garantirSelecao]);

  /** Envia para a API as irrigações que ficaram salvas só no celular. */
  const enviarPendentes = useCallback(async () => {
    for (const p of await listarPendentes(db)) {
      const salvo = await api.registrarIrrigacao({
        plantacaoId: p.plantacaoId,
        umidadeSolo: p.umidadeSolo,
        umidadeAr: p.umidadeAr,
        temperaturaAr: p.temperaturaAr,
        tempoReacaoSeg: p.tempoReacaoSeg,
        criadoEm: p.criadoEm,
      });
      await marcarSincronizado(db, p.localId, salvo.id);
    }
  }, [db]);

  /** Busca as leituras de UMA plantação na API e salva no celular. */
  const buscarLeiturasDe = useCallback(
    async (id: number) => {
      // Primeira vez desta plantação: baixa o histórico todo.
      if ((await contarLeituras(db, id)) === 0) {
        await salvarLeiturasDaApi(db, await api.getLeituras(id));
      }
      const nova = await api.getUltimaLeitura(id);
      if (nova) await salvarLeiturasDaApi(db, [nova]);
    },
    [db],
  );

  /** Sincroniza com a API (se tiver internet) e recarrega a tela. */
  const sincronizar = useCallback(
    async (todas: boolean) => {
      setAtualizando(true);
      try {
        if (onlineRef.current) {
          if (todas || (await listarPlantacoes(db)).length === 0) {
            await salvarPlantacoes(db, await api.getPlantacoes());
          }
          const plantacoesSalvas = await listarPlantacoes(db);
          await garantirSelecao(plantacoesSalvas);
          const lista = plantacoesSalvas.map((p) => p.id);
          // Só busca leituras de plantações que existem (conta nova pode não ter nenhuma).
          const ids = todas ? lista : lista.filter((id) => id === plantacaoIdRef.current);
          for (const id of ids) await buscarLeiturasDe(id);
          await enviarPendentes();
          setErro(null);
        }
      } catch (e) {
        console.warn('Falha ao falar com a API:', e);
        setErro('Não foi possível falar com o servidor. Mostrando os dados salvos no celular.');
      } finally {
        await recarregarDoCelular();
        setAtualizando(false);
        setCarregou(true);
      }
    },
    [db, garantirSelecao, buscarLeiturasDe, enviarPendentes, recarregarDoCelular],
  );

  const atualizar = useCallback(() => naFila(() => sincronizar(false)), [naFila, sincronizar]);
  const atualizarTodas = useCallback(() => naFila(() => sincronizar(true)), [naFila, sincronizar]);

  /** Troca a plantação aberta e lembra a escolha no celular. */
  const escolherPlantacao = useCallback(
    async (id: number) => {
      plantacaoIdRef.current = id;
      setPlantacaoId(id);
      await salvarPreferencia(db, CHAVE_PLANTACAO, String(id));
      await naFila(recarregarDoCelular); // mostra já o que tem salvo
      await atualizar(); // e busca o que há de novo
    },
    [db, naFila, recarregarDoCelular, atualizar],
  );

  /** Botão "Irriguei" (na plantação aberta). */
  const registrarIrrigacao = useCallback(
    () =>
      naFila(async (): Promise<ResultadoIrrigacao> => {
        const id = plantacaoIdRef.current;
        const agora = new Date();

        // Tempo de reação = agora - primeiro alerta crítico ainda sem resposta.
        const alerta = await buscarAlertaSemResposta(db, id);
        const tempoReacaoSeg = alerta
          ? Math.max(0, Math.round((agora.getTime() - Date.parse(alerta.criadoEm)) / 1000))
          : null;

        const leituraAtual = await ultimaLeituraDe(db, id);
        const dados: NovaIrrigacao = {
          plantacaoId: id,
          umidadeSolo: leituraAtual?.umidadeSolo ?? 0,
          umidadeAr: leituraAtual?.umidadeAr ?? null,
          temperaturaAr: leituraAtual?.temperaturaAr ?? null,
          tempoReacaoSeg,
          criadoEm: agora.toISOString(),
        };

        // 1) Salva no celular primeiro: mesmo sem internet o registro não se perde.
        const localId = await salvarIrrigacaoLocal(db, dados);

        // 2) Tenta enviar (sincronizar manda os pendentes e já busca a leitura nova).
        await sincronizar(false);

        const aindaPendente = (await listarPendentes(db)).some((p) => p.localId === localId);
        return { enviado: !aindaPendente, tempoReacaoSeg };
      }),
    [db, naFila, sincronizar],
  );

  /** Cadastra uma plantação nova na API, guarda no celular e já deixa ela aberta. */
  const adicionarPlantacao = useCallback(
    async (dados: NovaPlantacao): Promise<Plantacao> => {
      const nova = await naFila(async () => {
        const criada = await api.criarPlantacao(dados);
        await salvarPlantacao(db, criada);
        return criada;
      });
      await escolherPlantacao(nova.id); // abre a nova e busca a 1ª leitura do sensor
      return nova;
    },
    [db, naFila, escolherPlantacao],
  );

  // Observa a internet. Quando volta, atualiza (e envia o que estava pendente).
  useEffect(() => {
    const cancelar = NetInfo.addEventListener((estado) => {
      const conectado = estado.isConnected !== false && estado.isInternetReachable !== false;
      const voltou = conectado && !onlineRef.current;
      onlineRef.current = conectado;
      setOnline(conectado);
      if (voltou) void atualizar();
    });
    return cancelar;
  }, [atualizar]);

  // Ao abrir: recupera a plantação escolhida, sincroniza tudo e liga a atualização automática.
  useEffect(() => {
    let ativo = true;
    void naFila(async () => {
      const salva = Number(await lerPreferencia(db, CHAVE_PLANTACAO));
      if (salva && ativo) {
        plantacaoIdRef.current = salva;
        setPlantacaoId(salva);
      }
      await recarregarDoCelular(); // mostra logo o que já está salvo
    });
    void atualizarTodas();

    const timer = setInterval(() => {
      // Se ainda tem tarefa rodando (internet lenta), pula esta rodada.
      if (tarefasNaFila.current === 0) void atualizar();
    }, INTERVALO_ATUALIZACAO_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [db, naFila, recarregarDoCelular, atualizar, atualizarTodas]);


  const valor = useMemo<DadosContextValor>(
    () => ({
      plantacoes,
      plantacaoAtual: plantacoes.find((p) => p.id === plantacaoId) ?? null,
      resumo,
      ultima: historico.find((l) => l.evento !== 'irrigacao_confirmada') ?? null,
      historico,
      online,
      atualizando,
      carregou,
      erro,
      pendentes,
      atualizar,
      atualizarTodas,
      escolherPlantacao,
      registrarIrrigacao,
      adicionarPlantacao,
    }),
    [
      plantacoes,
      plantacaoId,
      resumo,
      historico,
      online,
      atualizando,
      carregou,
      erro,
      pendentes,
      atualizar,
      atualizarTodas,
      escolherPlantacao,
      registrarIrrigacao,
      adicionarPlantacao,
    ],
  );

  return <DadosContext.Provider value={valor}>{children}</DadosContext.Provider>;
}

/** Hook que as telas usam: const { ultima, registrarIrrigacao } = useDados(); */
export function useDados(): DadosContextValor {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return ctx;
}
