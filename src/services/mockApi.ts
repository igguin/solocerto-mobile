/**
 * API SIMULADA (mock). Finge ser o ESP32 + a API Java.
 *
 * Como simula:
 *  - 3 plantações fictícias, cada uma começando numa situação diferente:
 *      Talhão 1 (soja)   -> irrigada há algumas horas, agora MODERADO
 *      Talhão 2 (milho)  -> acabou de ser irrigada, agora BOM
 *      Horta (feijão)    -> ninguém irrigou, agora CRÍTICO
 *  - Para cada uma, cria um histórico das últimas 12 horas (uma leitura a cada 30 min).
 *  - A cada chamada de getUltimaLeitura gera uma leitura NOVA:
 *    o solo vai secando com o passar do tempo (+ um pouco de variação).
 *  - De vez em quando (6% das leituras) acontece uma "queda brusca"
 *    (dia muito quente) e a umidade cai para a faixa crítica -> alerta_critico.
 *  - Quando o produtor aperta "Irriguei", a umidade sobe para perto de 88%.
 *
 * Os ids usam o horário em milissegundos (+ id da plantação) para não repetir.
 *
 * CONTAS E PLANTAÇÕES NOVAS
 *  - Para "Criar conta" e "Adicionar plantação" funcionarem de verdade no modo
 *    demonstração, o mock guarda usuários e plantações num banco SQLite SEPARADO
 *    ("mock-servidor.db"). Ele faz o papel do banco do servidor Java: o banco do
 *    app (solocerto.db) continua sendo só o "cache" do celular.
 *  - O token do mock é "demo.<idDoUsuario>.<horário>". Assim o mock sabe de quem
 *    são as plantações pedidas em getPlantacoes.
 *  - Plantação nova começa SEM histórico: o "sensor" manda a primeira leitura
 *    logo depois de cadastrar.
 *
 * Observação: um servidor de verdade guardaria a senha com hash (ex.: BCrypt no
 * Spring). Aqui é só simulação e o "servidor" fica no próprio celular.
 */
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { calcularEstado, type Leitura, type NovaIrrigacao } from '@/types/leitura';
import type { NovaPlantacao, Plantacao } from '@/types/plantacao';
import { ErroCadastro, ErroLogin, type NovaConta, type Sessao, type Usuario } from '@/types/usuario';

import type { SoloCertoApi } from './api';

/**
 * Conta de demonstração (fictícia). A senha NÃO fica salva no banco do app:
 * só no "servidor" simulado, que é quem confere o login.
 */
export const CONTA_DEMO = { email: 'carlos@example.com', senha: '123456' };

const USUARIO_DEMO: Usuario = { id: 1, nome: 'Carlos Ferreira', email: CONTA_DEMO.email, cidade: 'Campinas' };

const PLANTACOES_DEMO: Plantacao[] = [
  { id: 1, nome: 'Talhão 1', cultura: 'Soja', hectares: 8.5 },
  { id: 2, nome: 'Talhão 2', cultura: 'Milho', hectares: 3.2 },
  { id: 3, nome: 'Horta', cultura: 'Feijão', hectares: 1.5 },
];

// ---------- "Banco do servidor" simulado ----------

let servidor: Promise<SQLiteDatabase> | null = null;

/** Abre (uma vez só) o banco do servidor simulado e cria a conta de demonstração. */
function bancoServidor(): Promise<SQLiteDatabase> {
  servidor ??= (async () => {
    const db = await openDatabaseAsync('mock-servidor.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        nome   TEXT NOT NULL,
        email  TEXT NOT NULL UNIQUE COLLATE NOCASE,
        cidade TEXT NOT NULL,
        senha  TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS plantacoes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        nome       TEXT NOT NULL,
        cultura    TEXT NOT NULL,
        hectares   REAL NOT NULL
      );
    `);
    await db.runAsync(
      'INSERT OR IGNORE INTO usuarios (id, nome, email, cidade, senha) VALUES (?, ?, ?, ?, ?)',
      USUARIO_DEMO.id,
      USUARIO_DEMO.nome,
      USUARIO_DEMO.email,
      USUARIO_DEMO.cidade,
      CONTA_DEMO.senha,
    );
    for (const p of PLANTACOES_DEMO) {
      await db.runAsync(
        'INSERT OR IGNORE INTO plantacoes (id, usuario_id, nome, cultura, hectares) VALUES (?, ?, ?, ?, ?)',
        p.id,
        USUARIO_DEMO.id,
        p.nome,
        p.cultura,
        p.hectares,
      );
    }
    return db;
  })();
  servidor.catch(() => {
    servidor = null; // se falhar, tenta abrir de novo na próxima chamada
  });
  return servidor;
}

/** Usuário dono do token atual (definirToken). Sessões antigas sem id = conta demo. */
let usuarioLogadoId: number = USUARIO_DEMO.id;

function novaSessao(usuario: Usuario): Sessao {
  return { token: `demo.${usuario.id}.${Date.now()}`, usuario };
}

/** Como o histórico de cada plantação começa (umidade inicial, quanto seca por slot, quando irrigou). */
const CENARIOS: Record<number, { inicio: number; secagem: number; irrigouNoSlot: number | null }> = {
  1: { inicio: 80, secagem: 4, irrigouNoSlot: 13 },
  2: { inicio: 75, secagem: 3, irrigouNoSlot: 20 },
  3: { inicio: 70, secagem: 2.2, irrigouNoSlot: null },
};

const MEIA_HORA_MS = 30 * 60 * 1000;
const SECAGEM_POR_SEGUNDO = 0.03; // ~2 pontos de umidade por minuto (acelerado para demonstração)
const CHANCE_QUEDA_BRUSCA = 0.06; // com leitura a cada 20s, ~1 queda a cada 5 min

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const arredondar = (v: number) => Math.round(v * 10) / 10;

function montarLeitura(
  plantacaoId: number,
  quando: number,
  umidadeSolo: number,
  evento?: Leitura['evento'],
  tempoReacaoSeg: number | null = null,
): Leitura {
  const u = Math.round(limitar(umidadeSolo, 5, 100));
  const estado = calcularEstado(u);
  return {
    id: quando + plantacaoId, // único entre plantações
    plantacaoId,
    evento: evento ?? (estado === 'CRITICO' ? 'alerta_critico' : 'leitura'),
    umidadeSolo: u,
    umidadeAr: arredondar(55 + Math.sin(quando / 3.6e6) * 15),
    temperaturaAr: arredondar(27 + Math.cos(quando / 3.6e6) * 4),
    estado,
    tempoReacaoSeg,
    criadoEm: new Date(quando).toISOString(),
  };
}

/** Histórico inicial de uma plantação: 24 leituras das últimas 12h. */
function gerarHistoricoInicial(plantacaoId: number): Leitura[] {
  const c = CENARIOS[plantacaoId] ?? CENARIOS[1];
  const agoraSlot = Math.floor(Date.now() / MEIA_HORA_MS) * MEIA_HORA_MS;
  const lista: Leitura[] = [];
  let primeiroAlerta: number | null = null;

  for (let i = 0; i < 24; i++) {
    const quando = agoraSlot - (23 - i) * MEIA_HORA_MS;
    const ruido = Math.sin(i * 1.7 + plantacaoId) * 2;
    const depoisDeIrrigar = c.irrigouNoSlot != null && i > c.irrigouNoSlot;
    const umidade = depoisDeIrrigar
      ? 88 - 3 * (i - (c.irrigouNoSlot as number) - 1) + ruido
      : c.inicio - c.secagem * i + ruido;

    const leitura = montarLeitura(plantacaoId, quando, umidade);
    lista.push(leitura);
    if (leitura.evento === 'alerta_critico' && primeiroAlerta == null) primeiroAlerta = quando;

    if (i === c.irrigouNoSlot) {
      // Produtor irrigou 15 minutos depois desta leitura.
      const quandoIrrigou = quando + 15 * 60 * 1000;
      const reacao = primeiroAlerta != null ? Math.round((quandoIrrigou - primeiroAlerta) / 1000) : null;
      lista.push(montarLeitura(plantacaoId, quandoIrrigou, umidade, 'irrigacao_confirmada', reacao));
      primeiroAlerta = null;
    }
  }
  return lista;
}

// "Memória" do mock enquanto o app está aberto (uma por plantação).
interface EstadoSimulado {
  historico: Leitura[];
  umidadeAtual: number;
  ultimoMomento: number;
}
const simulacao = new Map<number, EstadoSimulado>();

function estadoDe(plantacaoId: number): EstadoSimulado {
  let s = simulacao.get(plantacaoId);
  if (!s) {
    if (CENARIOS[plantacaoId]) {
      // Plantações da conta demo: já têm 12 horas de histórico.
      const historico = gerarHistoricoInicial(plantacaoId);
      s = {
        historico,
        umidadeAtual: historico[historico.length - 1].umidadeSolo,
        ultimoMomento: Date.now(),
      };
    } else {
      // Plantação cadastrada pelo produtor: sensor novo, sem histórico ainda.
      s = { historico: [], umidadeAtual: 55 + Math.random() * 20, ultimoMomento: Date.now() };
    }
    simulacao.set(plantacaoId, s);
  }
  return s;
}

function gerarNovaLeitura(plantacaoId: number): Leitura {
  const s = estadoDe(plantacaoId);
  const agora = Date.now();
  const segundos = (agora - s.ultimoMomento) / 1000;
  s.ultimoMomento = agora;

  s.umidadeAtual -= segundos * SECAGEM_POR_SEGUNDO + (Math.random() - 0.5) * 2;
  if (Math.random() < CHANCE_QUEDA_BRUSCA && s.umidadeAtual > 30) {
    s.umidadeAtual = 18 + Math.random() * 10; // queda brusca -> crítico
  }
  s.umidadeAtual = limitar(s.umidadeAtual, 8, 100);

  const nova = montarLeitura(plantacaoId, agora, s.umidadeAtual);
  s.historico.push(nova);
  return nova;
}

export const mockApi: SoloCertoApi = {
  async entrar(email, senha) {
    await espera(700);
    const db = await bancoServidor();
    const linha = await db.getFirstAsync<Usuario & { senha: string }>(
      'SELECT id, nome, email, cidade, senha FROM usuarios WHERE email = ?',
      email.trim(),
    );
    if (!linha || linha.senha !== senha) {
      throw new ErroLogin('E-mail ou senha incorretos.');
    }
    const { senha: _senha, ...usuario } = linha;
    return novaSessao(usuario);
  },

  async cadastrar(dados: NovaConta) {
    await espera(700);
    const db = await bancoServidor();
    const email = dados.email.trim().toLowerCase();
    const existe = await db.getFirstAsync('SELECT id FROM usuarios WHERE email = ?', email);
    if (existe) {
      throw new ErroCadastro('Já existe uma conta com este e-mail. Tente entrar.');
    }
    const r = await db.runAsync(
      'INSERT INTO usuarios (nome, email, cidade, senha) VALUES (?, ?, ?, ?)',
      dados.nome.trim(),
      email,
      dados.cidade.trim(),
      dados.senha,
    );
    return novaSessao({
      id: r.lastInsertRowId,
      nome: dados.nome.trim(),
      email,
      cidade: dados.cidade.trim(),
    });
  },

  definirToken(token) {
    // Token "demo.<id>.<horário>": pega o id do usuário. Sessões antigas = conta demo.
    const id = Number(token?.split('.')[1]);
    usuarioLogadoId = Number.isInteger(id) && id > 0 ? id : USUARIO_DEMO.id;
  },

  async getPlantacoes() {
    await espera(200);
    const db = await bancoServidor();
    return db.getAllAsync<Plantacao>(
      'SELECT id, nome, cultura, hectares FROM plantacoes WHERE usuario_id = ? ORDER BY id',
      usuarioLogadoId,
    );
  },

  async criarPlantacao(dados: NovaPlantacao) {
    await espera(400);
    const db = await bancoServidor();
    const r = await db.runAsync(
      'INSERT INTO plantacoes (usuario_id, nome, cultura, hectares) VALUES (?, ?, ?, ?)',
      usuarioLogadoId,
      dados.nome,
      dados.cultura,
      dados.hectares,
    );
    return { id: r.lastInsertRowId, ...dados };
  },

  async getLeituras(plantacaoId) {
    await espera(300); // simula a demora da rede
    return [...estadoDe(plantacaoId).historico].reverse(); // mais recente primeiro
  },

  async getUltimaLeitura(plantacaoId) {
    await espera(300);
    return gerarNovaLeitura(plantacaoId);
  },

  async registrarIrrigacao(dados: NovaIrrigacao) {
    await espera(400);
    const s = estadoDe(dados.plantacaoId);
    const evento: Leitura = {
      ...montarLeitura(dados.plantacaoId, Date.parse(dados.criadoEm), dados.umidadeSolo, 'irrigacao_confirmada', dados.tempoReacaoSeg),
      umidadeAr: dados.umidadeAr,
      temperaturaAr: dados.temperaturaAr,
    };
    s.historico.push(evento);
    // Depois de irrigar, o solo fica úmido.
    s.umidadeAtual = 86 + Math.random() * 4;
    s.ultimoMomento = Date.now();
    return evento;
  },
};
