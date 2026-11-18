/**
 * Tela "Histórico": números do resumo, gráfico simples e lista separada por dia
 * (Hoje, Ontem, 13/11...). Tudo vem do SQLite, então funciona sem internet.
 * No topo, o indicador de impacto: tempo médio de resposta aos alertas.
 */
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/components/Cartao';
import { AvisoOffline } from '@/components/Faixa';
import { GraficoUmidade } from '@/components/GraficoUmidade';
import { InfoMini } from '@/components/InfoMini';
import { ItemHistorico } from '@/components/ItemHistorico';
import { ESTADOS } from '@/constants/estados';
import { cores, espaco, fontes, raio } from '@/constants/tema';
import { useDados } from '@/context/DadosContext';
import type { LeituraLocal } from '@/types/leitura';

/** Agrupa a lista por dia: [{ title: 'Hoje', data: [...] }, ...] */
function agruparPorDia(lista: LeituraLocal[]) {
  const hoje = new Date();
  const ontem = new Date(Date.now() - 86_400_000);
  const nomeDoDia = (d: Date) => {
    if (d.toDateString() === hoje.toDateString()) return 'Hoje';
    if (d.toDateString() === ontem.toDateString()) return 'Ontem';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const grupos: { title: string; data: LeituraLocal[] }[] = [];
  for (const l of lista) {
    const nome = nomeDoDia(new Date(l.criadoEm));
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.title === nome) ultimo.data.push(l);
    else grupos.push({ title: nome, data: [l] });
  }
  return grupos;
}

/** "15 min" / "1h 20min" (versão curta para o cartãozinho) */
function duracaoCurta(seg: number) {
  const min = Math.max(1, Math.round(seg / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h}h ${min % 60}min` : `${h}h`;
}

export default function TelaHistorico() {
  const { historico, plantacaoAtual, online, atualizando, atualizar } = useDados();

  const respostas = historico
    .filter((l) => l.evento === 'irrigacao_confirmada' && l.tempoReacaoSeg != null)
    .map((l) => l.tempoReacaoSeg as number);
  const media = respostas.length ? respostas.reduce((a, b) => a + b, 0) / respostas.length : null;
  const alertas = historico.filter((l) => l.evento === 'alerta_critico').length;
  const irrigacoes = historico.filter((l) => l.evento === 'irrigacao_confirmada').length;

  const cabecalho = (
    <View style={styles.cabecalho}>
      {!online && <AvisoOffline />}

      {plantacaoAtual && (
        <Text style={styles.plantacao} accessibilityRole="header">
          {plantacaoAtual.nome} · {plantacaoAtual.cultura}
        </Text>
      )}

      <View style={styles.linhaMini}>
        <InfoMini
          icone="alert-octagon"
          rotulo="Alertas de seco"
          valor={String(alertas)}
          corIcone={ESTADOS.CRITICO.corFundo}
        />
        <InfoMini icone="water" rotulo="Irrigações" valor={String(irrigacoes)} corIcone={cores.azul} />
      </View>
      <InfoMini
        icone="timer-outline"
        rotulo="Tempo médio para irrigar depois do alerta"
        valor={media != null ? duracaoCurta(media) : '—'}
        corIcone={cores.primaria}
      />

      <Cartao>
        <GraficoUmidade leituras={historico} />
      </Cartao>

      <Text style={styles.tituloLista} accessibilityRole="header">
        Todas as leituras
      </Text>
    </View>
  );

  return (
    <SectionList
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      sections={agruparPorDia(historico)}
      keyExtractor={(l) => String(l.localId)}
      renderItem={({ item, index, section }) => (
        <View
          style={[
            styles.itemFundo,
            index === 0 && styles.itemPrimeiro,
            index === section.data.length - 1 && styles.itemUltimo,
          ]}
        >
          <ItemHistorico leitura={item} ultimo={index === section.data.length - 1} />
        </View>
      )}
      renderSectionHeader={({ section }) => (
        <Text style={styles.dia} accessibilityRole="header">
          {section.title}
        </Text>
      )}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={<Text style={styles.vazio}>Nenhuma leitura salva ainda.</Text>}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={atualizar}
          colors={[cores.primaria]}
          tintColor={cores.primaria}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.m, paddingBottom: espaco.g * 2 },
  cabecalho: { gap: espaco.m, marginBottom: espaco.p },
  linhaMini: { flexDirection: 'row', gap: espaco.m },
  plantacao: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto },
  tituloLista: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto, marginTop: espaco.p },
  dia: {
    fontSize: fontes.normal,
    fontWeight: '800',
    color: cores.primaria,
    marginTop: espaco.m,
    marginBottom: espaco.p,
  },
  itemFundo: { backgroundColor: cores.cartao, paddingHorizontal: espaco.m },
  itemPrimeiro: { borderTopLeftRadius: raio.m, borderTopRightRadius: raio.m },
  itemUltimo: { borderBottomLeftRadius: raio.m, borderBottomRightRadius: raio.m },
  vazio: { fontSize: fontes.normal, color: cores.textoSecundario, paddingVertical: espaco.g },
});
