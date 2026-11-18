/**
 * Cartãozinho com ícone + rótulo + valor.
 * Ex.: "Temperatura do ar: 28 °C", "Alertas: 3".
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes, raio, sombra } from '@/constants/tema';

interface Props {
  icone: NomeIcone;
  rotulo: string;
  valor: string;
  corIcone?: string;
}

export function InfoMini({ icone, rotulo, valor, corIcone = cores.primaria }: Props) {
  return (
    <View style={styles.cartao} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <View style={[styles.circulo, { backgroundColor: corIcone }]}>
        <MaterialCommunityIcons name={icone} size={26} color="#FFFFFF" />
      </View>
      <Text style={styles.valor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.rotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flex: 1,
    minWidth: 100,
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    padding: espaco.m,
    gap: 4,
    ...sombra,
  },
  circulo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  valor: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.textoSecundario },
});
