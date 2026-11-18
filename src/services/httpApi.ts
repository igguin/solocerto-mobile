/**
 * Implementação REAL da API, usando fetch.
 * Fica pronta para quando o grupo terminar o endpoint no Spring Boot.
 *
 * Endpoints esperados (combinar com o back-end):
 *   POST {API_URL}/auth/login  { email, senha }    -> { token, usuario }
 *   POST {API_URL}/auth/cadastro { nome, cidade, email, senha } -> { token, usuario }
 *                                (409 = e-mail já cadastrado)
 *   GET  {API_URL}/plantacoes                      -> Plantacao[] (só as do produtor logado)
 *   POST {API_URL}/plantacoes  { nome, cultura, hectares } -> Plantacao salva (com id)
 *   GET  {API_URL}/leituras?plantacaoId=1          -> Leitura[]
 *   GET  {API_URL}/leituras/ultima?plantacaoId=1   -> Leitura
 *   POST {API_URL}/leituras  (corpo = evento)      -> Leitura salva
 *
 * Depois do login, todas as chamadas levam o cabeçalho
 *   Authorization: Bearer <token>
 */
import { calcularEstado, type Leitura, type NovaIrrigacao } from '@/types/leitura';
import type { NovaPlantacao, Plantacao } from '@/types/plantacao';
import { ErroCadastro, ErroLogin, type NovaConta, type Sessao } from '@/types/usuario';

import type { SoloCertoApi } from './api';

const TEMPO_LIMITE_MS = 8000;

/** Garante que o estado está certo mesmo se a API mandar sem ele. */
function normalizar(l: Leitura): Leitura {
  return { ...l, estado: l.estado ?? calcularEstado(l.umidadeSolo) };
}

export function criarHttpApi(baseUrl: string): SoloCertoApi {
  const base = baseUrl.replace(/\/+$/, ''); // tira "/" do final
  let token: string | null = null;

  /** fetch com tempo limite (para não travar com internet ruim) e com o token do login. */
  async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      const resposta = await fetch(`${base}${caminho}`, {
        ...opcoes,
        signal: controle.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...opcoes.headers,
        },
      });
      if (resposta.status === 401 && caminho === '/auth/login') {
        throw new ErroLogin('E-mail ou senha incorretos.');
      }
      if (resposta.status === 409 && caminho === '/auth/cadastro') {
        throw new ErroCadastro('Já existe uma conta com este e-mail. Tente entrar.');
      }
      if (!resposta.ok) {
        throw new Error(`API respondeu ${resposta.status}`);
      }
      return (await resposta.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async entrar(email, senha) {
      return requisitar<Sessao>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
    },

    async cadastrar(dados: NovaConta) {
      return requisitar<Sessao>('/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },

    definirToken(novo) {
      token = novo;
    },

    async getPlantacoes() {
      return requisitar<Plantacao[]>('/plantacoes');
    },

    async criarPlantacao(dados: NovaPlantacao) {
      return requisitar<Plantacao>('/plantacoes', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },

    async getLeituras(plantacaoId) {
      const lista = await requisitar<Leitura[]>(`/leituras?plantacaoId=${plantacaoId}`);
      return lista.map(normalizar);
    },

    async getUltimaLeitura(plantacaoId) {
      const l = await requisitar<Leitura | null>(`/leituras/ultima?plantacaoId=${plantacaoId}`);
      return l ? normalizar(l) : null;
    },

    async registrarIrrigacao(dados: NovaIrrigacao) {
      const corpo: Omit<Leitura, 'id'> = {
        ...dados,
        evento: 'irrigacao_confirmada',
        estado: calcularEstado(dados.umidadeSolo),
      };
      const salvo = await requisitar<Leitura>('/leituras', {
        method: 'POST',
        body: JSON.stringify(corpo),
      });
      return normalizar(salvo);
    },
  };
}
