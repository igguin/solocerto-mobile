/**
 * Funções para ler e gravar na tabela "leituras".
 * As telas não usam SQL direto: passam por aqui (através do DadosContext).
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Estado, Evento, Leitura, LeituraLocal, NovaIrrigacao } from '@/types/leitura';
import { calcularEstado } from '@/types/leitura';

/** Formato da linha como está no SQLite (nomes com _). */
interface LinhaLeitura {
  local_id: number;
  remote_id: number | null;
  plantacao_id: number;
  evento: Evento;
  umidade_solo: number;
  umidade_ar: number | null;
  temperatura_ar: number | null;
  estado: Estado;
  tempo_reacao_seg: number | null;
  criado_em: string;
  sincronizado: number;
}

function linhaParaLeitura(l: LinhaLeitura): LeituraLocal {
  return {
    localId: l.local_id,
    remoteId: l.remote_id,
    plantacaoId: l.plantacao_id,
    evento: l.evento,
    umidadeSolo: l.umidade_solo,
    umidadeAr: l.umidade_ar,
    temperaturaAr: l.temperatura_ar,
    estado: l.estado,
    tempoReacaoSeg: l.tempo_reacao_seg,
    criadoEm: l.criado_em,
    sincronizado: l.sincronizado === 1,
  };
}

/** Data sempre no mesmo formato ISO UTC, para ordenar e comparar como texto. */
const isoPadrao = (data: string) => new Date(data).toISOString();

/**
 * Salva leituras que vieram da API.
 * "INSERT OR IGNORE" + remote_id UNIQUE = não duplica se a mesma leitura vier de novo.
 */
export async function salvarLeiturasDaApi(db: SQLiteDatabase, leituras: Leitura[]): Promise<void> {
  if (leituras.length === 0) return;
  await db.withTransactionAsync(async () => {
    for (const l of leituras) {
      await db.runAsync(
        `INSERT OR IGNORE INTO leituras
          (remote_id, plantacao_id, evento, umidade_solo, umidade_ar, temperatura_ar,
           estado, tempo_reacao_seg, criado_em, sincronizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        l.id,
        l.plantacaoId,
        l.evento,
        l.umidadeSolo,
        l.umidadeAr,
        l.temperaturaAr,
        l.estado ?? calcularEstado(l.umidadeSolo),
        l.tempoReacaoSeg,
        isoPadrao(l.criadoEm),
      );
    }
  });
}

/** Histórico, do mais recente para o mais antigo. */
export async function listarLeituras(
  db: SQLiteDatabase,
  plantacaoId: number,
  limite = 200,
): Promise<LeituraLocal[]> {
  const linhas = await db.getAllAsync<LinhaLeitura>(
    `SELECT * FROM leituras WHERE plantacao_id = ?
     ORDER BY criado_em DESC, local_id DESC LIMIT ?`,
    plantacaoId,
    limite,
  );
  return linhas.map(linhaParaLeitura);
}

/** Última leitura do SENSOR (sem contar irrigações) de uma plantação. */
export async function ultimaLeituraDe(
  db: SQLiteDatabase,
  plantacaoId: number,
): Promise<LeituraLocal | null> {
  const linha = await db.getFirstAsync<LinhaLeitura>(
    `SELECT * FROM leituras
     WHERE plantacao_id = ? AND evento <> 'irrigacao_confirmada'
     ORDER BY criado_em DESC, local_id DESC LIMIT 1`,
    plantacaoId,
  );
  return linha ? linhaParaLeitura(linha) : null;
}

export async function contarLeituras(db: SQLiteDatabase, plantacaoId: number): Promise<number> {
  const r = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM leituras WHERE plantacao_id = ?',
    plantacaoId,
  );
  return r?.total ?? 0;
}

/**
 * Primeiro alerta crítico que ainda não foi "respondido" por uma irrigação.
 * É dele que contamos o tempo de reação do produtor.
 */
export async function buscarAlertaSemResposta(
  db: SQLiteDatabase,
  plantacaoId: number,
): Promise<LeituraLocal | null> {
  const linha = await db.getFirstAsync<LinhaLeitura>(
    `SELECT * FROM leituras
     WHERE plantacao_id = ?
       AND evento = 'alerta_critico'
       AND criado_em > COALESCE(
         (SELECT MAX(criado_em) FROM leituras
          WHERE plantacao_id = ? AND evento = 'irrigacao_confirmada'), '')
     ORDER BY criado_em ASC LIMIT 1`,
    plantacaoId,
    plantacaoId,
  );
  return linha ? linhaParaLeitura(linha) : null;
}

/** Grava o "Irriguei" no celular, marcado como "falta enviar". Devolve o local_id. */
export async function salvarIrrigacaoLocal(db: SQLiteDatabase, dados: NovaIrrigacao): Promise<number> {
  const r = await db.runAsync(
    `INSERT INTO leituras
      (remote_id, plantacao_id, evento, umidade_solo, umidade_ar, temperatura_ar,
       estado, tempo_reacao_seg, criado_em, sincronizado)
     VALUES (NULL, ?, 'irrigacao_confirmada', ?, ?, ?, ?, ?, ?, 0)`,
    dados.plantacaoId,
    dados.umidadeSolo,
    dados.umidadeAr,
    dados.temperaturaAr,
    calcularEstado(dados.umidadeSolo),
    dados.tempoReacaoSeg,
    isoPadrao(dados.criadoEm),
  );
  return r.lastInsertRowId;
}

/** Irrigações que ainda não chegaram na API (ex.: produtor estava sem internet). */
export async function listarPendentes(db: SQLiteDatabase): Promise<LeituraLocal[]> {
  const linhas = await db.getAllAsync<LinhaLeitura>(
    'SELECT * FROM leituras WHERE sincronizado = 0 ORDER BY criado_em ASC',
  );
  return linhas.map(linhaParaLeitura);
}

/** Depois que a API confirmou, guarda o id dela e marca como enviado. */
export async function marcarSincronizado(
  db: SQLiteDatabase,
  localId: number,
  remoteId: number,
): Promise<void> {
  // Se a API já tinha devolvido esse evento numa listagem, apaga a cópia repetida.
  await db.runAsync('DELETE FROM leituras WHERE remote_id = ? AND local_id <> ?', remoteId, localId);
  await db.runAsync(
    'UPDATE leituras SET remote_id = ?, sincronizado = 1 WHERE local_id = ?',
    remoteId,
    localId,
  );
}
