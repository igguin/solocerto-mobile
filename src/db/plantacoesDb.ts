/**
 * Funções das tabelas "plantacoes" e "preferencias".
 * Guardar as plantações no celular permite trocar de plantação mesmo sem internet.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Plantacao } from '@/types/plantacao';

/** Grava (ou atualiza) UMA plantação. */
export async function salvarPlantacao(db: SQLiteDatabase, p: Plantacao): Promise<void> {
  await db.runAsync(
    `INSERT INTO plantacoes (id, nome, cultura, hectares) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, cultura = excluded.cultura, hectares = excluded.hectares`,
    p.id,
    p.nome,
    p.cultura,
    p.hectares,
  );
}

/**
 * Troca a lista do celular pela lista que veio da API.
 * A API é quem manda: plantação que não veio mais (ex.: de outra conta) sai do celular.
 */
export async function salvarPlantacoes(db: SQLiteDatabase, plantacoes: Plantacao[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM plantacoes');
    for (const p of plantacoes) await salvarPlantacao(db, p);
  });
}

/**
 * Ao SAIR da conta: apaga os dados do produtor guardados neste celular
 * (plantações, leituras e a plantação escolhida). Assim a próxima pessoa que
 * entrar não vê nada da conta anterior.
 */
export async function limparDadosDoUsuario(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM plantacoes');
    await db.runAsync('DELETE FROM leituras');
    await db.runAsync("DELETE FROM preferencias WHERE chave = 'plantacaoSelecionada'");
  });
}

export async function listarPlantacoes(db: SQLiteDatabase): Promise<Plantacao[]> {
  return db.getAllAsync<Plantacao>('SELECT id, nome, cultura, hectares FROM plantacoes ORDER BY id');
}

export async function lerPreferencia(db: SQLiteDatabase, chave: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM preferencias WHERE chave = ?', chave);
  return r?.valor ?? null;
}

export async function removerPreferencia(db: SQLiteDatabase, chave: string): Promise<void> {
  await db.runAsync('DELETE FROM preferencias WHERE chave = ?', chave);
}

export async function salvarPreferencia(db: SQLiteDatabase, chave: string, valor: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO preferencias (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    valor,
  );
}
