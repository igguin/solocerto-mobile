/**
 * Tela NOVA PLANTAÇÃO: o produtor cadastra um talhão novo.
 *
 * Campos:
 *   - Nome (ex.: "Talhão 3", "Horta do fundo")
 *   - Cultura: botões grandes com as mais comuns + "Outra" (abre um campo de texto)
 *   - Tamanho em hectares (aceita vírgula: "2,5")
 *
 * Ao salvar: envia para a API (DadosContext.adicionarPlantacao), guarda no
 * SQLite, deixa a plantação nova ABERTA e volta para a tela Hoje.
 * Precisa de internet, porque quem cria o id da plantação é o servidor.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';

import { CampoTexto } from '@/components/CampoTexto';
import { AvisoOffline, Faixa } from '@/components/Faixa';
import { CULTURAS_COMUNS, iconeDaCultura } from '@/constants/culturas';
import { cores, espaco, fontes, raio, sombra } from '@/constants/tema';
import { useDados } from '@/context/DadosContext';

const OUTRA = 'Outra';
const HECTARES_MAX = 10_000;

type Campo = 'nome' | 'cultura' | 'hectares';

/** "2,5" -> 2.5 ; texto inválido -> NaN */
function lerHectares(texto: string): number {
  const limpo = texto.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(limpo) ? Number(limpo) : NaN;
}

export default function TelaNovaPlantacao() {
  const { adicionarPlantacao, online, plantacoes } = useDados();
  const campoHectares = useRef<TextInputInstance>(null);

  const [nome, setNome] = useState(`Talhão ${plantacoes.length + 1}`);
  const [cultura, setCultura] = useState<string | null>(null);
  const [outraCultura, setOutraCultura] = useState('');
  const [hectares, setHectares] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<{ campo: Campo | null; msg: string } | null>(null);

  function mostrarErro(campo: Campo | null, msg: string) {
    setErro({ campo, msg });
    AccessibilityInfo.announceForAccessibility(msg);
  }

  async function aoSalvar() {
    const culturaFinal = (cultura === OUTRA ? outraCultura : (cultura ?? '')).trim();
    const ha = lerHectares(hectares);

    if (!nome.trim()) return mostrarErro('nome', 'Dê um nome para a plantação.');
    if (plantacoes.some((p) => p.nome.trim().toLowerCase() === nome.trim().toLowerCase()))
      return mostrarErro('nome', 'Você já tem uma plantação com esse nome.');
    if (!culturaFinal) return mostrarErro('cultura', 'Escolha o que está plantado.');
    if (!(ha > 0) || ha > HECTARES_MAX)
      return mostrarErro('hectares', 'Escreva o tamanho em hectares. Exemplo: 2,5');
    if (!online) return mostrarErro(null, 'Sem internet. Conecte para cadastrar a plantação.');

    setErro(null);
    setSalvando(true);
    try {
      const nova = await adicionarPlantacao({
        nome: nome.trim(),
        cultura: culturaFinal,
        hectares: Math.round(ha * 100) / 100,
      });
      AccessibilityInfo.announceForAccessibility(`Plantação ${nova.nome} cadastrada e aberta.`);
      router.back();
      router.navigate('/'); // abre a tela Hoje já com a plantação nova
    } catch (e) {
      console.warn(e);
      mostrarErro(null, 'Não foi possível salvar. Verifique a internet e tente de novo.');
      setSalvando(false);
    }
  }

  const opcoes = [...CULTURAS_COMUNS, OUTRA];

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {!online && <AvisoOffline />}
        {erro && <Faixa tipo="erro" titulo="Confira os dados" texto={erro.msg} />}

        <View style={styles.cartao}>
          <CampoTexto
            rotulo="Nome da plantação"
            icone="tag-outline"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Talhão 3"
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={40}
            temErro={erro?.campo === 'nome'}
          />
        </View>

        <View style={[styles.cartao, erro?.campo === 'cultura' && styles.cartaoErro]}>
          <Text style={styles.rotulo} accessibilityRole="header">
            O que está plantado?
          </Text>
          <View style={styles.grade} accessibilityRole="radiogroup">
            {opcoes.map((c) => {
              const marcada = cultura === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCultura(c);
                    if (erro?.campo === 'cultura') setErro(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: marcada }}
                  accessibilityLabel={c === OUTRA ? 'Outra cultura' : c}
                  style={({ pressed }) => [
                    styles.opcao,
                    marcada && styles.opcaoMarcada,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={c === OUTRA ? 'dots-horizontal-circle-outline' : iconeDaCultura(c)}
                    size={30}
                    color={marcada ? '#FFFFFF' : cores.primaria}
                  />
                  <Text style={[styles.opcaoTexto, marcada && styles.opcaoTextoMarcada]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          {cultura === OUTRA && (
            <CampoTexto
              rotulo="Qual cultura?"
              icone="sprout-outline"
              value={outraCultura}
              onChangeText={setOutraCultura}
              placeholder="Ex.: Tomate"
              autoCapitalize="sentences"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => campoHectares.current?.focus()}
              maxLength={30}
              temErro={erro?.campo === 'cultura'}
            />
          )}
        </View>

        <View style={styles.cartao}>
          <CampoTexto
            ref={campoHectares}
            rotulo="Tamanho (hectares)"
            icone="ruler-square"
            value={hectares}
            onChangeText={setHectares}
            placeholder="Ex.: 2,5"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={aoSalvar}
            temErro={erro?.campo === 'hectares'}
          />
          <Text style={styles.dica}>1 hectare é mais ou menos um campo de futebol.</Text>
        </View>

        <Pressable
          onPress={aoSalvar}
          disabled={salvando}
          accessibilityRole="button"
          accessibilityLabel="Salvar plantação"
          accessibilityHint="Cadastra a plantação e abre ela na tela Hoje"
          accessibilityState={{ disabled: salvando, busy: salvando }}
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={28} color="#FFFFFF" />
              <Text style={styles.botaoTexto}>Salvar plantação</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.m, gap: espaco.m, paddingBottom: espaco.g * 2 },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    padding: espaco.m,
    gap: espaco.m,
    borderWidth: 2,
    borderColor: 'transparent',
    ...sombra,
  },
  cartaoErro: { borderColor: cores.perigo },
  rotulo: { fontSize: fontes.pequena, fontWeight: '700', color: cores.texto },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.p },
  opcao: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 84,
    borderRadius: raio.m - 4,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.fundoCartao,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: espaco.p,
  },
  opcaoMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { fontSize: 16, fontWeight: '800', color: cores.texto, textAlign: 'center' },
  opcaoTextoMarcada: { color: '#FFFFFF' },
  dica: { fontSize: 16, color: cores.textoSecundario },
  botao: {
    minHeight: 64,
    borderRadius: raio.m,
    backgroundColor: cores.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
    boxShadow: '0px 6px 16px rgba(22, 101, 52, 0.35)',
  },
  botaoPressionado: { backgroundColor: cores.primariaEscura },
  botaoTexto: { color: '#FFFFFF', fontSize: fontes.grande, fontWeight: '900' },
});
