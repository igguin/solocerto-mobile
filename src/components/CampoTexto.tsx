/**
 * Campo de texto com rótulo em cima, ícone e borda que destaca quando está em foco.
 * Para senha, mostra o botão de olho (mostrar/esconder) com área de toque de 48px.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import type { NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes, raio } from '@/constants/tema';

interface Props extends Omit<TextInputProps, 'ref'> {
  rotulo: string;
  icone: NomeIcone;
  senha?: boolean;
  temErro?: boolean;
  ref?: Ref<TextInputInstance>; // React 19: ref é uma prop normal (não precisa de forwardRef)
}

export function CampoTexto({
  rotulo,
  icone,
  senha = false,
  temErro = false,
  style,
  onFocus,
  onBlur,
  ref,
  ...resto
}: Props) {
  const [foco, setFoco] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const corBorda = temErro ? cores.perigo : foco ? cores.primaria : cores.bordaSuave;

  return (
    <View style={styles.bloco}>
      <Text style={styles.rotulo} nativeID={`rotulo-${rotulo}`}>
        {rotulo}
      </Text>
      <View style={[styles.caixa, { borderColor: corBorda }, foco && styles.caixaFoco]}>
        <MaterialCommunityIcons
          name={icone}
          size={26}
          color={foco ? cores.primaria : cores.textoSecundario}
        />
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor="#64748B"
          secureTextEntry={senha && !mostrarSenha}
          accessibilityLabel={rotulo}
          accessibilityLabelledBy={`rotulo-${rotulo}`}
          {...resto}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
        />
        {senha && (
          <Pressable
            onPress={() => setMostrarSenha((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
            hitSlop={8}
            style={styles.olho}
          >
            <MaterialCommunityIcons
              name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
              size={26}
              color={cores.textoSecundario}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 6 },
  rotulo: { fontSize: fontes.pequena, fontWeight: '700', color: cores.texto },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingLeft: espaco.m,
    paddingRight: 4,
    borderRadius: raio.m - 4,
    borderWidth: 2,
    backgroundColor: cores.fundoCartao,
  },
  caixaFoco: { backgroundColor: '#FFFFFF' },
  input: {
    flex: 1,
    fontSize: fontes.normal,
    color: cores.texto,
    paddingVertical: 12,
    outlineStyle: 'none', // web: tira o contorno padrão (a borda já mostra o foco)
  } as object,
  olho: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
