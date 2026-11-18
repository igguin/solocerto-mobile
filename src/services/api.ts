/**
 * PORTA ÚNICA de dados do app.
 *
 * As telas só conhecem a interface `SoloCertoApi` e o objeto `api`.
 * Quem responde de verdade pode ser:
 *   - mockApi  -> dados simulados (padrão, enquanto a API Java não tem o endpoint)
 *   - httpApi  -> API real (Spring Boot) via fetch
 *
 * A escolha é feita pela variável EXPO_PUBLIC_USE_MOCK (arquivo .env).
 * Trocar mock por API real NÃO exige mudar nenhuma tela.
 */
import type { Leitura, NovaIrrigacao } from '@/types/leitura';
import type { NovaPlantacao, Plantacao } from '@/types/plantacao';
import type { NovaConta, Sessao } from '@/types/usuario';

import { criarHttpApi } from './httpApi';
import { mockApi } from './mockApi';

export interface SoloCertoApi {
  /** Login. Dá erro (ErroLogin) se e-mail ou senha estiverem errados. */
  entrar(email: string, senha: string): Promise<Sessao>;
  /** Cria a conta e já devolve a sessão (entra direto). Dá erro (ErroCadastro) se o e-mail já existir. */
  cadastrar(dados: NovaConta): Promise<Sessao>;
  /** Guarda o token do login para mandar nas próximas chamadas (null = saiu). */
  definirToken(token: string | null): void;
  /** Plantações (talhões) do produtor. */
  getPlantacoes(): Promise<Plantacao[]>;
  /** Cadastra uma plantação nova do produtor logado. Devolve a plantação com o id da API. */
  criarPlantacao(dados: NovaPlantacao): Promise<Plantacao>;
  /** Histórico de leituras e eventos da plantação (mais recente primeiro). */
  getLeituras(plantacaoId: number): Promise<Leitura[]>;
  /** Leitura mais recente do sensor. */
  getUltimaLeitura(plantacaoId: number): Promise<Leitura | null>;
  /** Envia o evento "Irriguei". Devolve o evento salvo (com id da API). */
  registrarIrrigacao(dados: NovaIrrigacao): Promise<Leitura>;
}

// Só usa a API real se EXPO_PUBLIC_USE_MOCK for exatamente "false".
export const USANDO_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const api: SoloCertoApi = USANDO_MOCK ? mockApi : criarHttpApi(API_URL);
