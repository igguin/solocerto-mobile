/**
 * Régua de umidade: uma barra com as 3 faixas (Seco | Médio | Bom)
 * e uma setinha mostrando onde o solo está agora.
 * Ajuda o produtor a ver se está longe ou perto de ficar seco.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { ESTADOS } from '@/constants/estados';
import { cores, espaco, fontes } from '@/constants/tema';

const FAIXAS = [
  { tamanho: 30, cor: ESTADOS.CRITICO.corFundo, nome: 'Seco', limite: '0–30%' },
  { tamanho: 40, cor: ESTADOS.MODERADO.corFundo, nome: 'Médio', limite: '31–70%' },
  { tamanho: 30, cor: ESTADOS.BOM.corFundo, nome: 'Bom', limite: '71–100%' },
];

export function ReguaUmidade({ valor }: { valor: number }) {
  const posicao = Math.min(100, Math.max(0, valor));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Régua de umidade. O solo está em ${Math.round(valor)} por cento. Seco vai até 30, bom é acima de 70.`}
    >
      <Text style={styles.titulo}>Onde o solo está agora</Text>

      {/* Setinha "você está aqui" */}
      <View style={styles.areaSeta}>
        <View style={[styles.seta, { left: `${posicao}%` }]}>
          <Text style={styles.valorSeta}>{Math.round(valor)}%</Text>
          <MaterialCommunityIcons name="menu-down" size={36} color={cores.texto} style={styles.iconeSeta} />
        </View>
      </View>

      <View style={styles.barra}>
        {FAIXAS.map((f) => (
          <View key={f.nome} style={{ flex: f.tamanho, backgroundColor: f.cor }} />
        ))}
      </View>

      <View style={styles.legenda}>
        {FAIXAS.map((f) => (
          <View key={f.nome} style={[styles.itemLegenda, { flex: f.tamanho }]}>
            <Text style={styles.nome}>{f.nome}</Text>
            <Text style={styles.limite}>{f.limite}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.normal, fontWeight: '700', color: cores.texto, marginBottom: espaco.p },
  areaSeta: { height: 52, marginHorizontal: 20 },
  seta: { position: 'absolute', bottom: -10, width: 60, marginLeft: -30, alignItems: 'center' },
  valorSeta: { fontSize: fontes.pequena, fontWeight: '900', color: cores.texto },
  iconeSeta: { marginTop: -10 },
  barra: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: cores.texto,
    marginHorizontal: 20,
    gap: 2,
    backgroundColor: cores.texto,
  },
  legenda: { flexDirection: 'row', marginTop: 6, marginHorizontal: 20 },
  itemLegenda: { alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: '800', color: cores.texto },
  limite: { fontSize: 14, color: cores.textoSecundario },
});
