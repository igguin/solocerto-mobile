/**
 * Botão grande e fácil de tocar (altura mínima 80px, bem acima dos 48px exigidos).
 * Mostra "carregando" e fica desabilitado enquanto salva, para evitar toque duplo.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes, raio } from '@/constants/tema';

interface Props {
  titulo: string;
  dica: string; // accessibilityHint: o que acontece ao tocar
  icone: NomeIcone;
  onPress: () => void;
  carregando?: boolean;
}

export function BotaoGrande({ titulo, dica, icone, onPress, carregando = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: carregando, busy: carregando }}
      style={({ pressed }) => [
        styles.botao,
        pressed && styles.pressionado,
        carregando && styles.carregando,
      ]}
    >
      <View style={styles.circulo}>
        {carregando ? (
          <ActivityIndicator size="large" color={cores.azul} />
        ) : (
          <MaterialCommunityIcons name={icone} size={38} color={cores.azul} />
        )}
      </View>
      <View style={styles.textos}>
        <Text style={styles.texto}>{carregando ? 'Salvando...' : titulo}</Text>
        {!carregando && <Text style={styles.dica}>Toque quando terminar de irrigar</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 80,
    borderRadius: raio.g,
    backgroundColor: cores.azul,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingHorizontal: espaco.m,
    paddingVertical: espaco.m,
    borderBottomWidth: 6,
    borderBottomColor: '#08306B', // "degrau" que dá cara de botão físico
    boxShadow: '0px 4px 12px rgba(13, 71, 161, 0.35)',
  },
  pressionado: { borderBottomWidth: 2, transform: [{ translateY: 4 }] },
  carregando: { opacity: 0.8 },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  texto: { color: '#FFFFFF', fontSize: fontes.titulo + 2, fontWeight: '900' },
  dica: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 2 },
});
