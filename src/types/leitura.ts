/**
 * Tipos do contrato de dados do SoloCerto.
 * É o MESMO formato que o ESP32 envia para a API.
 */

export type Estado = 'CRITICO' | 'MODERADO' | 'BOM';

export type Evento = 'leitura' | 'alerta_critico' | 'irrigacao_confirmada';

/** Uma leitura (ou evento) exatamente como vem da API / do ESP32. */
export interface Leitura {
  id: number;
  plantacaoId: number;
  evento: Evento;
  umidadeSolo: number; // 0 a 100 (%)
  umidadeAr: number | null; // %
  temperaturaAr: number | null; // °C
  estado: Estado;
  tempoReacaoSeg: number | null; // só nas irrigações: segundos desde o alerta crítico
  criadoEm: string; // data/hora ISO, ex: "2026-11-15T14:30:00.000Z"
}

/** Dados que o app envia quando o produtor aperta "Irriguei". */
export interface NovaIrrigacao {
  plantacaoId: number;
  umidadeSolo: number;
  umidadeAr: number | null;
  temperaturaAr: number | null;
  tempoReacaoSeg: number | null;
  criadoEm: string;
}

/**
 * Leitura como fica guardada no celular (SQLite).
 * - localId: id do banco do celular
 * - remoteId: id da API (null enquanto não foi enviada)
 * - sincronizado: false = ainda falta enviar para a API
 */
export interface LeituraLocal extends Omit<Leitura, 'id'> {
  localId: number;
  remoteId: number | null;
  sincronizado: boolean;
}

/** Regra de estado do projeto: <=30 CRITICO, <=70 MODERADO, >70 BOM. */
export function calcularEstado(umidadeSolo: number): Estado {
  if (umidadeSolo <= 30) return 'CRITICO';
  if (umidadeSolo <= 70) return 'MODERADO';
  return 'BOM';
}
