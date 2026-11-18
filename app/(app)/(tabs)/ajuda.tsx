/**
 * Tela "Ajuda": explica, em linguagem simples, o que cada cor quer dizer
 * e o que fazer em cada caso. Conteúdo fixo (vem de constants/estados.ts).
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/components/Cartao';
import { ESTADOS, type NomeIcone } from '@/constants/estados';
import { cores, espaco, fontes, raio, sombra } from '@/constants/tema';
import { useSessao } from '@/context/SessaoContext';
import type { Estado } from '@/types/leitura';
import { confirmar } from '@/utils/confirmar';

const ORDEM: Estado[] = ['CRITICO', 'MODERADO', 'BOM'];

const PASSOS: { icone: NomeIcone; texto: string }[] = [
  { icone: 'access-point', texto: 'Um sensor na terra mede a umidade do solo.' },
  { icone: 'cellphone', texto: 'O app mostra se a terra está seca, média ou boa.' },
  { icone: 'water', texto: 'Irrigou? Aperte o botão "Irriguei" na tela Hoje.' },
  { icone: 'leaf', texto: 'Assim você usa só a água que a planta precisa.' },
];

export default function TelaAjuda() {
  const { sessao, sair } = useSessao();

  async function aoSair() {
    if (await confirmar('Sair da conta?', 'Você vai precisar entrar de novo com e-mail e senha. Os dados guardados neste celular serão apagados.', 'Sair')) {
      await sair();
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo} accessibilityRole="header">
        O que cada cor quer dizer
      </Text>

      {ORDEM.map((estado) => {
        const info = ESTADOS[estado];
        return (
          <View
            key={estado}
            style={styles.cartaoEstado}
            accessible
            accessibilityLabel={`${info.titulo}. ${info.faixa}. O que fazer: ${info.oQueFazer.join(' ')}`}
          >
            <View style={[styles.faixaCor, { backgroundColor: info.corFundo }]}>
              <MaterialCommunityIcons name={info.icone} size={40} color={info.corTexto} />
              <View style={styles.flex}>
                <Text style={[styles.estado, { color: info.corTexto }]}>{info.titulo}</Text>
                <Text style={[styles.faixa, { color: info.corTexto }]}>{info.faixa}</Text>
              </View>
            </View>
            <View style={styles.passos}>
              <Text style={styles.subtitulo}>O que fazer:</Text>
              {info.oQueFazer.map((passo) => (
                <View key={passo} style={styles.linhaPasso}>
                  <MaterialCommunityIcons name="check" size={24} color={cores.primaria} />
                  <Text style={styles.passo}>{passo}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <Text style={styles.titulo} accessibilityRole="header">
        Como funciona
      </Text>
      <Cartao style={styles.listaPassos}>
        {PASSOS.map((p, i) => (
          <View
            key={p.texto}
            style={styles.linhaComoFunciona}
            accessible
            accessibilityLabel={`Passo ${i + 1}: ${p.texto}`}
          >
            <View style={styles.numero}>
              <Text style={styles.numeroTexto}>{i + 1}</Text>
            </View>
            <MaterialCommunityIcons name={p.icone} size={30} color={cores.primaria} />
            <Text style={styles.passo}>{p.texto}</Text>
          </View>
        ))}
      </Cartao>

      <Text style={styles.titulo} accessibilityRole="header">
        Sem internet?
      </Text>
      <Cartao style={styles.semInternet}>
        <MaterialCommunityIcons name="wifi-off" size={36} color={cores.avisoFundo} />
        <Text style={styles.passo}>
          O app continua mostrando as últimas leituras salvas no celular. O botão “Irriguei” também
          funciona: o registro é enviado sozinho quando a internet voltar.
        </Text>
      </Cartao>

      <Text style={styles.titulo} accessibilityRole="header">
        Sua conta
      </Text>
      <Cartao style={styles.conta}>
        <View style={styles.contaLinha} accessible accessibilityLabel={`Conectado como ${sessao?.usuario.nome}, ${sessao?.usuario.email}`}>
          <View style={styles.contaAvatar}>
            <MaterialCommunityIcons name="account" size={30} color={cores.primaria} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.contaNome}>{sessao?.usuario.nome}</Text>
            <Text style={styles.contaEmail}>{sessao?.usuario.email}</Text>
            <Text style={styles.contaEmail}>{sessao?.usuario.cidade}</Text>
          </View>
        </View>
        <Pressable
          onPress={aoSair}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          style={({ pressed }) => [styles.botaoSair, pressed && { backgroundColor: '#FEE2E2' }]}
        >
          <MaterialCommunityIcons name="logout" size={24} color={cores.perigo} />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </Pressable>
      </Cartao>

      <Text style={styles.rodape}>
        SoloCerto · Projeto acadêmico FIAP Global Solution{'\n'}Todos os dados são fictícios.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.m, gap: espaco.m, paddingBottom: espaco.g * 2 },
  flex: { flex: 1 },
  titulo: { fontSize: fontes.titulo, fontWeight: '900', color: cores.texto, marginTop: espaco.p },
  cartaoEstado: {
    borderRadius: raio.m,
    overflow: 'hidden',
    backgroundColor: cores.cartao,
    ...sombra,
  },
  faixaCor: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, padding: espaco.m },
  estado: { fontSize: fontes.grande, fontWeight: '900' },
  faixa: { fontSize: fontes.pequena, fontWeight: '700' },
  passos: { padding: espaco.m, gap: espaco.p },
  subtitulo: { fontSize: fontes.normal, fontWeight: '800', color: cores.texto },
  linhaPasso: { flexDirection: 'row', gap: espaco.p, alignItems: 'flex-start' },
  passo: { flex: 1, fontSize: fontes.normal, color: cores.texto, lineHeight: 28 },
  listaPassos: { gap: espaco.m },
  linhaComoFunciona: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  numero: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { color: '#FFFFFF', fontSize: fontes.pequena, fontWeight: '900' },
  semInternet: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  conta: { gap: espaco.m },
  contaLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  contaAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contaNome: { fontSize: fontes.normal, fontWeight: '900', color: cores.texto },
  contaEmail: { fontSize: 16, color: cores.textoSecundario },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.perigo,
  },
  botaoSairTexto: { fontSize: fontes.pequena, fontWeight: '800', color: cores.perigo },
  rodape: { fontSize: 16, color: cores.textoSecundario, marginTop: espaco.m, textAlign: 'center' },
});
