/**
 * Faixa de aviso (ícone + texto). Usada para:
 *  - "Sem internet" (tipo "offline")
 *  - erro ao falar com o servidor (tipo "erro")
 *  - confirmação do "Irriguei" (tipo "sucesso")
 *
 * accessibilityLiveRegion / role "alert" fazem o leitor de tela
 * anunciar o aviso assim que ele aparece.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes } from '@/constants/tema';

type TipoFaixa = 'offline' | 'erro' | 'sucesso';

const ESTILO: Record<TipoFaixa, { fundo: string; texto: string; icone: NomeIcone; borda: string }> = {
  offline: { fundo: cores.avisoFundo, texto: cores.avisoTexto, icone: 'wifi-off', borda: cores.avisoFundo },
  erro: { fundo: cores.erroFundo, texto: cores.erroTexto, icone: 'cloud-alert', borda: '#8A6D00' },
  sucesso: { fundo: cores.sucessoFundo, texto: cores.texto, icone: 'check-circle', borda: cores.primaria },
};

interface Props {
  tipo: TipoFaixa;
  titulo: string;
  texto?: string;
}

export function Faixa({ tipo, titulo, texto }: Props) {
  const e = ESTILO[tipo];
  return (
    <View
      style={[styles.faixa, { backgroundColor: e.fundo, borderColor: e.borda }]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={texto ? `${titulo}. ${texto}` : titulo}
    >
      <MaterialCommunityIcons name={e.icone} size={32} color={e.texto} />
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: e.texto }]}>{titulo}</Text>
        {texto ? <Text style={[styles.texto, { color: e.texto }]}>{texto}</Text> : null}
      </View>
    </View>
  );
}

/** Aviso fixo de "sem internet". */
export function AvisoOffline() {
  return (
    <Faixa
      tipo="offline"
      titulo="Sem internet"
      texto="Mostrando dados salvos no celular. O que você registrar será enviado quando a internet voltar."
    />
  );
}

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    padding: espaco.m,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 56,
  },
  textos: { flex: 1 },
  titulo: { fontSize: fontes.normal, fontWeight: '700' },
  texto: { fontSize: fontes.pequena, marginTop: 4, lineHeight: 24 },
});
