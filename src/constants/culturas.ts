/** Ícone de cada cultura (só visual). Cultura desconhecida usa o broto. */
import type { NomeIcone } from './estados';

const ICONES: Record<string, NomeIcone> = {
  soja: 'sprout',
  milho: 'corn',
  feijão: 'seed',
  feijao: 'seed',
  café: 'coffee',
  cafe: 'coffee',
  hortaliças: 'leaf',
  hortalicas: 'leaf',
  mandioca: 'carrot',
};

/** Culturas que aparecem como botões na tela "Nova plantação" (além de "Outra"). */
export const CULTURAS_COMUNS = ['Soja', 'Milho', 'Feijão', 'Café', 'Hortaliças', 'Mandioca'];

export function iconeDaCultura(cultura: string): NomeIcone {
  return ICONES[cultura.trim().toLowerCase()] ?? 'sprout';
}
