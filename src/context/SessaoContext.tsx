/**
 * SessaoContext = quem está logado.
 *
 * - entrar(email, senha): chama a API (api.entrar). Se der certo, guarda a
 *   sessão (token + dados do produtor) no SQLite, na tabela "preferencias".
 *   A SENHA NUNCA É SALVA no celular.
 * - criarConta(dados): chama a API (api.cadastrar). A conta nova já entra direto,
 *   do mesmo jeito que o login (a API devolve a sessão).
 * - Ao abrir o app, lê a sessão salva: quem já entrou não precisa digitar de novo
 *   (e consegue abrir o app sem internet).
 * - sair(): apaga a sessão e os dados do produtor guardados no celular.
 *   O Expo Router manda de volta para a tela de login.
 *
 * Observação: num app em produção o token ficaria no expo-secure-store
 * (cofre criptografado do celular). Aqui usamos o SQLite para funcionar
 * também na web e manter o projeto simples.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { lerPreferencia, limparDadosDoUsuario, removerPreferencia, salvarPreferencia } from '@/db/plantacoesDb';
import { api } from '@/services/api';
import type { NovaConta, Sessao } from '@/types/usuario';

const CHAVE_SESSAO = 'sessao';

interface SessaoContextValor {
  sessao: Sessao | null;
  carregando: boolean; // true enquanto lê a sessão salva ao abrir o app
  entrar: (email: string, senha: string) => Promise<void>;
  criarConta: (dados: NovaConta) => Promise<void>;
  sair: () => Promise<void>;
}

const SessaoContext = createContext<SessaoContextValor | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir: recupera a sessão salva (se houver).
  useEffect(() => {
    (async () => {
      try {
        const salva = await lerPreferencia(db, CHAVE_SESSAO);
        if (salva) {
          const s = JSON.parse(salva) as Sessao;
          api.definirToken(s.token);
          setSessao(s);
        }
      } catch (e) {
        console.warn('Sessão salva inválida, pedindo login de novo.', e);
      } finally {
        setCarregando(false);
      }
    })();
  }, [db]);

  /** Guarda a sessão no celular e libera as telas do app. */
  const comecarSessao = useCallback(
    async (nova: Sessao) => {
      api.definirToken(nova.token);
      await salvarPreferencia(db, CHAVE_SESSAO, JSON.stringify(nova));
      setSessao(nova);
    },
    [db],
  );

  const entrar = useCallback(
    async (email: string, senha: string) => {
      await comecarSessao(await api.entrar(email.trim(), senha));
    },
    [comecarSessao],
  );

  const criarConta = useCallback(
    async (dados: NovaConta) => {
      const nova = await api.cadastrar({
        nome: dados.nome.trim(),
        cidade: dados.cidade.trim(),
        email: dados.email.trim().toLowerCase(),
        senha: dados.senha,
      });
      await comecarSessao(nova);
    },
    [comecarSessao],
  );

  const sair = useCallback(async () => {
    await removerPreferencia(db, CHAVE_SESSAO);
    await limparDadosDoUsuario(db);
    api.definirToken(null);
    setSessao(null);
  }, [db]);

  const valor = useMemo(
    () => ({ sessao, carregando, entrar, criarConta, sair }),
    [sessao, carregando, entrar, criarConta, sair],
  );
  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao(): SessaoContextValor {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  return ctx;
}
