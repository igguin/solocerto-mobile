/**
 * Cartão grande da tela "Hoje": umidade atual + estado.
 * O estado aparece por COR + ÍCONE + TEXTO (nunca só pela cor).
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { ESTADOS } from '@/constants/estados';
import { espaco, fontes, raio, sombra } from '@/constants/tema';
import type { Estado } from '@/types/leitura';

interface Props {
  umidade: number;
  estado: Estado;
}

export function CartaoEstado({ umidade, estado }: Props) {
  const info = ESTADOS[estado];
  const textoEscuro = info.corTexto !== '#FFFFFF';
  // Caixinhas semitransparentes por cima da cor do cartão.
  const fundoSuave = textoEscuro ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)';

  return (
    <View
      style={[styles.cartao, { backgroundColor: info.corFundo }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Umidade do solo: ${Math.round(umidade)} por cento. ${info.titulo}. ${info.conselho}`}
    >
      <View style={styles.topo}>
        <Text style={[styles.rotulo, { color: info.corTexto }]}>Umidade do solo</Text>
        <View style={[styles.selo, { backgroundColor: fundoSuave }]}>
          <MaterialCommunityIcons name={info.icone} size={26} color={info.corTexto} />
          <Text style={[styles.seloTexto, { color: info.corTexto }]}>{info.titulo}</Text>
        </View>
      </View>

      <View style={styles.linhaNumero}>
        <MaterialCommunityIcons name="water-percent" size={56} color={info.corTexto} />
        <Text style={[styles.numero, { color: info.corTexto }]}>
          {Math.round(umidade)}
          <Text style={styles.porcento}>%</Text>
        </Text>
      </View>

      <View style={[styles.conselho, { backgroundColor: fundoSuave }]}>
        <MaterialCommunityIcons name="lightbulb-on" size={30} color={info.corTexto} />
        <Text style={[styles.conselhoTexto, { color: info.corTexto }]}>{info.conselho}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: raio.g,
    padding: espaco.g,
    gap: espaco.m,
    ...sombra,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espaco.p,
  },
  rotulo: { fontSize: fontes.normal, fontWeight: '700' },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  seloTexto: { fontSize: fontes.pequena, fontWeight: '800', letterSpacing: 0.5 },
  linhaNumero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  numero: { fontSize: fontes.gigante, fontWeight: '900', lineHeight: fontes.gigante * 1.1 },
  porcento: { fontSize: fontes.gigante / 2, fontWeight: '800' },
  conselho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    padding: espaco.m,
    borderRadius: raio.m,
  },
  conselhoTexto: { flex: 1, fontSize: fontes.grande, fontWeight: '700', lineHeight: 30 },
});
