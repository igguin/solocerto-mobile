/**
 * Cartão branco com cantos arredondados e sombra leve.
 * Usado para agrupar informações nas telas.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { cores, espaco, raio, sombra } from '@/constants/tema';

interface Props extends ViewProps {
  children: ReactNode;
}

export function Cartao({ children, style, ...resto }: Props) {
  return (
    <View style={[styles.cartao, style]} {...resto}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    padding: espaco.m,
    ...sombra,
  },
});
