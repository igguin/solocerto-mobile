/**
 * Uma linha do histórico: leitura, alerta ou irrigação.
 * Cada linha é lida pelo leitor de tela como uma frase só.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { ESTADOS, type NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes } from '@/constants/tema';
import type { LeituraLocal } from '@/types/leitura';
import { formatarDataHora, formatarDuracao, formatarHora } from '@/utils/formato';

interface Descricao {
  icone: NomeIcone;
  titulo: string;
  detalhe: string;
  cor: string;
  corIcone: string;
}

function descrever(l: LeituraLocal): Descricao {
  if (l.evento === 'irrigacao_confirmada') {
    return {
      icone: 'water',
      titulo: 'Você irrigou',
      detalhe:
        l.tempoReacaoSeg != null
          ? `${formatarDuracao(l.tempoReacaoSeg)} depois do alerta`
          : 'Sem alerta antes',
      cor: cores.azul,
      corIcone: '#FFFFFF',
    };
  }
  if (l.evento === 'alerta_critico') {
    return {
      icone: 'alert-octagon',
      titulo: 'Alerta: solo seco',
      detalhe: 'Precisava irrigar',
      cor: ESTADOS.CRITICO.corFundo,
      corIcone: '#FFFFFF',
    };
  }
  const info = ESTADOS[l.estado];
  return {
    icone: info.icone,
    titulo: info.titulo === 'ATENÇÃO' ? 'Solo médio' : info.titulo === 'SOLO BOM' ? 'Solo bom' : 'Solo seco',
    detalhe: 'Leitura do sensor',
    cor: info.corFundo,
    corIcone: info.corTexto,
  };
}

export function ItemHistorico({ leitura, ultimo = false }: { leitura: LeituraLocal; ultimo?: boolean }) {
  const d = descrever(leitura);
  const pendente = !leitura.sincronizado;
  const umidade = Math.round(leitura.umidadeSolo);
  return (
    <View
      style={[styles.item, !ultimo && styles.divisoria]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        `${d.titulo}, umidade ${umidade} por cento. ${d.detalhe}. ${formatarDataHora(leitura.criadoEm)}.` +
        (pendente ? ' Ainda não enviado.' : '')
      }
    >
      <View style={[styles.icone, { backgroundColor: d.cor }]}>
        <MaterialCommunityIcons name={d.icone} size={26} color={d.corIcone} />
      </View>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{d.titulo}</Text>
        <Text style={styles.detalhe}>{d.detalhe}</Text>
        {pendente ? (
          <View style={styles.pendente}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={18} color="#8A4B00" />
            <Text style={styles.pendenteTexto}>Aguardando internet</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.direita}>
        <Text style={styles.umidade}>{umidade}%</Text>
        <Text style={styles.hora}>{formatarHora(leitura.criadoEm)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingVertical: 12,
    minHeight: 72,
  },
  divisoria: { borderBottomWidth: 1, borderBottomColor: cores.divisoria },
  icone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  titulo: { fontSize: fontes.normal, fontWeight: '800', color: cores.texto },
  detalhe: { fontSize: 16, color: cores.textoSecundario, marginTop: 2 },
  pendente: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pendenteTexto: { fontSize: 16, color: '#8A4B00', fontWeight: '800' },
  direita: { alignItems: 'flex-end' },
  umidade: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto },
  hora: { fontSize: 16, color: cores.textoSecundario },
});
