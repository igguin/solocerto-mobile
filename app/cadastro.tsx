/**
 * Tela CRIAR CONTA.
 * Mesmo visual do login: topo com gradiente e um cartão branco com o formulário.
 *
 * Campos: nome, cidade, e-mail, senha e repetir a senha.
 * Confere tudo antes de enviar (mensagens curtas e em português simples).
 * Se a API aceitar, a conta já entra direto: o Stack.Protected (app/_layout.tsx)
 * leva sozinho para as abas. A senha nunca é salva no celular.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoTexto } from '@/components/CampoTexto';
import { Faixa } from '@/components/Faixa';
import { cores, espaco, fontes, gradienteMarca, raio, sombra } from '@/constants/tema';
import { useSessao } from '@/context/SessaoContext';
import { ErroCadastro } from '@/types/usuario';

const SENHA_MINIMA = 6;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Campo = 'nome' | 'cidade' | 'email' | 'senha' | 'confirmar';

/** Confere o formulário. Devolve a mensagem do primeiro problema e qual campo é. */
function validar(v: Record<Campo, string>): { campo: Campo; msg: string } | null {
  if (v.nome.trim().length < 3) return { campo: 'nome', msg: 'Escreva seu nome (pelo menos 3 letras).' };
  if (!v.cidade.trim()) return { campo: 'cidade', msg: 'Escreva a sua cidade.' };
  if (!EMAIL_VALIDO.test(v.email.trim())) return { campo: 'email', msg: 'O e-mail parece errado. Exemplo: nome@email.com' };
  if (v.senha.length < SENHA_MINIMA)
    return { campo: 'senha', msg: `A senha precisa ter pelo menos ${SENHA_MINIMA} letras ou números.` };
  if (v.confirmar !== v.senha) return { campo: 'confirmar', msg: 'As duas senhas estão diferentes.' };
  return null;
}

export default function TelaCadastro() {
  const { criarConta } = useSessao();
  const insets = useSafeAreaInsets();

  const refCidade = useRef<TextInputInstance>(null);
  const refEmail = useRef<TextInputInstance>(null);
  const refSenha = useRef<TextInputInstance>(null);
  const refConfirmar = useRef<TextInputInstance>(null);

  const [valores, setValores] = useState<Record<Campo, string>>({
    nome: '',
    cidade: '',
    email: '',
    senha: '',
    confirmar: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<{ campo: Campo | null; msg: string } | null>(null);

  const mudar = (campo: Campo) => (texto: string) => setValores((v) => ({ ...v, [campo]: texto }));

  function mostrarErro(campo: Campo | null, msg: string) {
    setErro({ campo, msg });
    AccessibilityInfo.announceForAccessibility(msg);
  }

  async function aoCriar() {
    const problema = validar(valores);
    if (problema) {
      mostrarErro(problema.campo, problema.msg);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await criarConta(valores);
      // Não precisa navegar: o Stack.Protected abre as abas sozinho.
    } catch (e) {
      if (e instanceof ErroCadastro) mostrarErro('email', e.message);
      else mostrarErro(null, 'Não foi possível criar a conta. Verifique a internet e tente de novo.');
      setEnviando(false);
    }
  }

  function voltarParaLogin() {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient
          colors={gradienteMarca}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.topo, { paddingTop: insets.top + espaco.m }]}
        >
          <Pressable
            onPress={voltarParaLogin}
            accessibilityRole="button"
            accessibilityLabel="Voltar para entrar"
            style={({ pressed }) => [styles.voltar, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.logo} accessible accessibilityLabel="SoloCerto">
            <MaterialCommunityIcons name="account-plus" size={44} color={cores.primaria} />
          </View>
          <Text style={styles.marca} accessibilityRole="header">
            Criar conta
          </Text>
          <Text style={styles.slogan}>Leva menos de um minuto.</Text>
        </LinearGradient>

        <View style={styles.cartao}>
          {erro && <Faixa tipo="erro" titulo="Confira os dados" texto={erro.msg} />}

          <CampoTexto
            rotulo="Seu nome"
            icone="account-outline"
            value={valores.nome}
            onChangeText={mudar('nome')}
            placeholder="Ex.: Maria da Silva"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => refCidade.current?.focus()}
            temErro={erro?.campo === 'nome'}
          />

          <CampoTexto
            ref={refCidade}
            rotulo="Cidade"
            icone="map-marker-outline"
            value={valores.cidade}
            onChangeText={mudar('cidade')}
            placeholder="Ex.: Campinas"
            autoCapitalize="words"
            textContentType="addressCity"
            returnKeyType="next"
            onSubmitEditing={() => refEmail.current?.focus()}
            temErro={erro?.campo === 'cidade'}
          />

          <CampoTexto
            ref={refEmail}
            rotulo="E-mail"
            icone="email-outline"
            value={valores.email}
            onChangeText={mudar('email')}
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => refSenha.current?.focus()}
            temErro={erro?.campo === 'email'}
          />

          <CampoTexto
            ref={refSenha}
            rotulo="Senha"
            icone="lock-outline"
            senha
            value={valores.senha}
            onChangeText={mudar('senha')}
            placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => refConfirmar.current?.focus()}
            temErro={erro?.campo === 'senha'}
          />

          <CampoTexto
            ref={refConfirmar}
            rotulo="Repita a senha"
            icone="lock-check-outline"
            senha
            value={valores.confirmar}
            onChangeText={mudar('confirmar')}
            placeholder="Digite a senha de novo"
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={aoCriar}
            temErro={erro?.campo === 'confirmar'}
          />

          <Pressable
            onPress={aoCriar}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Criar conta"
            accessibilityState={{ disabled: enviando, busy: enviando }}
            style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <>
                <Text style={styles.botaoTexto}>Criar conta</Text>
                <MaterialCommunityIcons name="check" size={28} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Pressable
            onPress={voltarParaLogin}
            accessibilityRole="button"
            accessibilityLabel="Já tenho conta. Entrar"
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.linkTexto}>
              Já tem conta? <Text style={styles.linkDestaque}>Entrar</Text>
            </Text>
          </Pressable>

          <Text style={styles.rodape}>
            Projeto acadêmico · FIAP Global Solution{'\n'}Use apenas dados fictícios.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1 },
  topo: {
    alignItems: 'center',
    paddingHorizontal: espaco.g,
    paddingBottom: 72,
  },
  voltar: {
    alignSelf: 'flex-start',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.25)',
  },
  marca: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', marginTop: espaco.m, letterSpacing: -0.5 },
  slogan: { fontSize: fontes.normal, color: '#DCFCE7', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  cartao: {
    flex: 1,
    marginTop: -48,
    marginHorizontal: espaco.m,
    marginBottom: espaco.g,
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    padding: espaco.g,
    gap: espaco.m,
    ...sombra,
  },
  botao: {
    minHeight: 64,
    borderRadius: raio.m,
    backgroundColor: cores.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
    marginTop: espaco.p,
    boxShadow: '0px 6px 16px rgba(22, 101, 52, 0.35)',
  },
  botaoPressionado: { backgroundColor: cores.primariaEscura },
  botaoTexto: { color: '#FFFFFF', fontSize: fontes.grande, fontWeight: '900' },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  linkTexto: { fontSize: fontes.pequena, color: cores.textoSecundario },
  linkDestaque: { color: cores.primaria, fontWeight: '900', textDecorationLine: 'underline' },
  rodape: { fontSize: 14, color: cores.textoSecundario, textAlign: 'center', lineHeight: 20 },
});
