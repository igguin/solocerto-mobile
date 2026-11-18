import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import type { Estado } from '@/types/leitura';

export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface InfoEstado {
  titulo: string; // texto curto mostrado junto da cor
  conselho: string; // o que fazer, em uma frase
  oQueFazer: string[]; // passos mais detalhados (tela Ajuda)
  faixa: string; // faixa de umidade
  icone: NomeIcone;
  corFundo: string;
  corTexto: string;
}

/**
 * Cada estado tem COR + TEXTO + ÍCONE.
 * Assim quem não enxerga cores (daltonismo) ou usa leitor de tela
 * entende o estado do mesmo jeito.
 */
export const ESTADOS: Record<Estado, InfoEstado> = {
  CRITICO: {
    titulo: 'SOLO SECO',
    conselho: 'Irrigue agora.',
    oQueFazer: [
      'Ligue a irrigação hoje, o quanto antes.',
      'Quando terminar, aperte o botão "Irriguei".',
      'Solo seco por muito tempo faz a planta perder produção.',
    ],
    faixa: 'Umidade até 30%',
    icone: 'alert-octagon',
    corFundo: '#B71C1C', // vermelho escuro + texto branco
    corTexto: '#FFFFFF',
  },
  MODERADO: {
    titulo: 'ATENÇÃO',
    conselho: 'Ainda não precisa irrigar. Fique de olho.',
    oQueFazer: [
      'Não precisa irrigar agora.',
      'Olhe o app de novo mais tarde.',
      'Em dia muito quente, a umidade cai mais rápido.',
    ],
    faixa: 'Umidade de 31% a 70%',
    icone: 'alert',
    corFundo: '#F9A825', // amarelo + texto preto
    corTexto: '#111111',
  },
  BOM: {
    titulo: 'SOLO BOM',
    conselho: 'Não irrigue. A terra está úmida.',
    oQueFazer: [
      'Não irrigue agora.',
      'Água demais é desperdício e pode estragar a raiz.',
    ],
    faixa: 'Umidade acima de 70%',
    icone: 'check-circle',
    corFundo: '#1B5E20', // verde escuro + texto branco
    corTexto: '#FFFFFF',
  },
};
