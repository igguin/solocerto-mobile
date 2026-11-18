/** Uma plantação (talhão) do produtor. Vem da API: GET /plantacoes */
export interface Plantacao {
  id: number; // o mesmo "plantacaoId" das leituras
  nome: string; // ex.: "Talhão 1"
  cultura: string; // ex.: "Soja"
  hectares: number; // ex.: 8.5
}

/** O que o app envia para cadastrar uma plantação nova: POST /plantacoes (o id vem da API). */
export type NovaPlantacao = Omit<Plantacao, 'id'>;
