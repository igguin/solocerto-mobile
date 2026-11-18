/** Produtor logado. */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cidade: string;
}

/** O que a API devolve no login e no cadastro: POST /auth/login e POST /auth/cadastro */
export interface Sessao {
  token: string; // enviado nas próximas chamadas (Authorization: Bearer ...)
  usuario: Usuario;
}

/** Dados da tela "Criar conta". A senha só vai para a API, nunca fica salva no celular. */
export interface NovaConta {
  nome: string;
  cidade: string;
  email: string;
  senha: string;
}

/** Erro de login com mensagem pronta para mostrar ao produtor. */
export class ErroLogin extends Error {}

/** Erro de cadastro (ex.: e-mail já usado) com mensagem pronta para mostrar. */
export class ErroCadastro extends Error {}
