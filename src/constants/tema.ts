/**
 * Cores e tamanhos usados no app inteiro (o "design system" do SoloCerto).
 * Pensado para acessibilidade: fontes grandes, alto contraste
 * (todas as combinações de texto passam de 4.5:1, a maioria passa de 7:1)
 * e alvos de toque de no mínimo 48px.
 */

export const cores = {
  fundo: '#F3F5F2', // cinza-esverdeado bem claro (fundo das telas)
  cartao: '#FFFFFF',
  fundoCartao: '#F7F9F6', // blocos dentro de cartões
  texto: '#0F172A', // quase preto azulado
  textoSecundario: '#475569', // cinza (7.6:1 no branco)
  borda: '#64748B',
  bordaSuave: '#E2E8F0',
  divisoria: '#E5E9E3',
  primaria: '#166534', // verde da marca (7:1 com branco)
  primariaEscura: '#0F3D24',
  primariaClara: '#DCFCE7',
  textoSobrePrimaria: '#FFFFFF',
  azul: '#1E40AF', // irrigação / água (8.7:1 com branco)
  azulEscuro: '#172E7C',
  avisoFundo: '#0F2A4A', // aviso "sem internet"
  avisoTexto: '#FFFFFF',
  erroFundo: '#FEF3C7',
  erroTexto: '#0F172A',
  erroBorda: '#B45309',
  perigo: '#B91C1C',
  sucessoFundo: '#ECFDF3',
};

/** Gradiente da marca (topo da tela Hoje e tela de login). */
export const gradienteMarca = ['#0B2E1B', '#14532D', '#1F7A44'] as const;

export const fontes = {
  pequena: 18,
  normal: 20,
  grande: 24,
  titulo: 28,
  gigante: 96,
};

/** Tamanho mínimo de qualquer coisa que dá para tocar. */
export const ALVO_TOQUE_MIN = 48;

export const espaco = {
  p: 8,
  m: 16,
  g: 24,
};

/** Sombra suave dos cartões (funciona no Android, iOS e web). */
export const sombra = {
  boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.06), 0px 4px 16px rgba(15, 23, 42, 0.08)',
} as const;

export const raio = {
  m: 16,
  g: 24,
};
