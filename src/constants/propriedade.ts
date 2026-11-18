/**
 * Configurações da propriedade.
 * O nome e a cidade do produtor agora vêm do LOGIN (sessao.usuario),
 * e as plantações vêm da API (getPlantacoes). Tudo fictício.
 */

/** Plantação aberta na primeira vez que o app é usado. */
export const PLANTACAO_PADRAO_ID = 1;

/** 8.5 -> "8,5 ha" */
export function formatarHectares(ha: number): string {
  return `${String(ha).replace('.', ',')} ha`;
}
