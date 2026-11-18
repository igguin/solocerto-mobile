/** Funções pequenas para mostrar datas e tempos em português simples. */

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "14:05" */
export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "Domingo, 15 de novembro" */
export function dataPorExtenso(d: Date): string {
  const dia = DIAS[d.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "15/11 às 14:05" */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)} às ${formatarHora(iso)}`;
}

/** "agora mesmo", "há 5 minutos", "há 2 horas" */
export function tempoRelativo(iso: string, agora = Date.now()): string {
  const seg = Math.max(0, Math.round((agora - Date.parse(iso)) / 1000));
  if (seg < 60) return 'agora mesmo';
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const dias = Math.round(h / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** 930 -> "15 minutos"; 5400 -> "1 hora e 30 minutos" */
export function formatarDuracao(segundos: number): string {
  const totalMin = Math.max(1, Math.round(segundos / 60));
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  const txtMin = `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  if (h === 0) return txtMin;
  const txtH = `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return min === 0 ? txtH : `${txtH} e ${txtMin}`;
}
