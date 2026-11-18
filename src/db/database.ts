/**
 * Criação do banco SQLite do celular (expo-sqlite).
 *
 * Guardamos TUDO numa tabela só, "leituras", porque o contrato da API
 * também é um só: leitura, alerta_critico e irrigacao_confirmada são eventos.
 * Assim o histórico funciona mesmo sem internet.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

export const NOME_BANCO = 'solocerto.db';

/**
 * Versão do banco. Cada vez que a estrutura muda, sobe 1 e cria um bloco "if" novo.
 *   v1: tabela leituras
 *   v2: tabelas plantacoes e preferencias (escolha de plantação)
 */
const VERSAO_BANCO = 2;

/** Roda quando o app abre (onInit do SQLiteProvider). Cria as tabelas se precisar. */
export async function migrarBanco(db: SQLiteDatabase): Promise<void> {
  const resultado = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versaoAtual = resultado?.user_version ?? 0;
  if (versaoAtual >= VERSAO_BANCO) return;

  if (versaoAtual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS leituras (
        local_id         INTEGER PRIMARY KEY AUTOINCREMENT,
        remote_id        INTEGER UNIQUE,              -- id da API (NULL = ainda não enviado)
        plantacao_id     INTEGER NOT NULL,
        evento           TEXT    NOT NULL,            -- leitura | alerta_critico | irrigacao_confirmada
        umidade_solo     REAL    NOT NULL,
        umidade_ar       REAL,
        temperatura_ar   REAL,
        estado           TEXT    NOT NULL,            -- CRITICO | MODERADO | BOM
        tempo_reacao_seg INTEGER,
        criado_em        TEXT    NOT NULL,            -- data ISO (UTC)
        sincronizado     INTEGER NOT NULL DEFAULT 1   -- 0 = falta enviar para a API
      );
      CREATE INDEX IF NOT EXISTS idx_leituras_criado_em ON leituras (criado_em);
    `);
  }

  if (versaoAtual < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plantacoes (
        id       INTEGER PRIMARY KEY,   -- mesmo id da API (plantacaoId)
        nome     TEXT NOT NULL,
        cultura  TEXT NOT NULL,
        hectares REAL NOT NULL
      );
      -- Configurações do app no formato chave/valor (ex.: plantação escolhida).
      CREATE TABLE IF NOT EXISTS preferencias (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${VERSAO_BANCO}`);
}
