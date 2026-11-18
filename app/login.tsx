/**
 * Tela de LOGIN.
 * Topo com o gradiente e a marca; embaixo um cartão branco com e-mail e senha.
 * No modo demonstração (mock) aparece um botão que preenche a conta de teste.
 * O botão "Criar conta" abre a tela de cadastro (app/cadastro.tsx).
 *
 * Depois de entrar, o Stack.Protected (app/_layout.tsx) leva sozinho para as abas.
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
import { USANDO_MOCK } from '@/services/api';
import { CONTA_DEMO } from '@/services/mockApi';
import { ErroLogin } from '@/types/usuario';

export default function TelaLogin() {
  const { entrar } = useSessao();
  const insets = useSafeAreaInsets();
  const campoSenha = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setErro(null);
    setEntrando(true);
    try {
      await entrar(email, senha);
      // Não precisa navegar: o Stack.Protected troca de tela sozinho.
    } catch (e) {
      const msg =
        e instanceof ErroLogin
          ? e.message
          : 'Não foi possível conectar. Verifique a internet e tente de novo.';
      setErro(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      setEntrando(false);
    }
  }

  function usarContaDemo() {
    setEmail(CONTA_DEMO.email);
    setSenha(CONTA_DEMO.senha);
    setErro(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.rolagem}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Topo com a marca */}
        <LinearGradient
          colors={gradienteMarca}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.topo, { paddingTop: insets.top + espaco.g * 2 }]}
        >
          <View style={styles.logo} accessible accessibilityLabel="SoloCerto">
            <MaterialCommunityIcons name="sprout" size={56} color={cores.primaria} />
          </View>
          <Text style={styles.marca} accessibilityRole="header">
            SoloCerto
          </Text>
          <Text style={styles.slogan}>Irrigue na hora certa.{'\n'}Sem desperdício.</Text>
        </LinearGradient>

        {/* Cartão do formulário */}
        <View style={styles.cartao}>
          <Text style={styles.titulo} accessibilityRole="header">
            Entrar
          </Text>
          <Text style={styles.subtitulo}>Acesse com o e-mail cadastrado.</Text>

          {erro && <Faixa tipo="erro" titulo="Não deu certo" texto={erro} />}

          <CampoTexto
            rotulo="E-mail"
            icone="email-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => campoSenha.current?.focus()}
            temErro={!!erro && !email.trim()}
          />

          <CampoTexto
            ref={campoSenha}
            rotulo="Senha"
            icone="lock-outline"
            senha
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={aoEntrar}
            temErro={!!erro && !senha}
          />

          <Pressable
            onPress={aoEntrar}
            disabled={entrando}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
            accessibilityState={{ disabled: entrando, busy: entrando }}
            style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          >
            {entrando ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <>
                <Text style={styles.botaoTexto}>Entrar</Text>
                <MaterialCommunityIcons name="arrow-right" size={28} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/cadastro')}
            accessibilityRole="button"
            accessibilityLabel="Ainda não tem conta? Criar conta"
            accessibilityHint="Abre o cadastro de produtor"
            style={({ pressed }) => [styles.botaoCriar, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={cores.primaria} />
            <Text style={styles.botaoCriarTexto}>Criar conta</Text>
          </Pressable>

          {USANDO_MOCK && (
            <View style={styles.demo}>
              <View style={styles.demoTopo}>
                <MaterialCommunityIcons name="flask-outline" size={22} color={cores.primaria} />
                <Text style={styles.demoTitulo}>Modo demonstração</Text>
              </View>
              <Text style={styles.demoTexto}>
                E-mail: {CONTA_DEMO.email}
                {'\n'}Senha: {CONTA_DEMO.senha}
              </Text>
              <Pressable
                onPress={usarContaDemo}
                accessibilityRole="button"
                accessibilityLabel="Preencher com a conta de demonstração"
                style={({ pressed }) => [styles.botaoDemo, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.botaoDemoTexto}>Usar conta de demonstração</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.rodape}>
            Projeto acadêmico · FIAP Global Solution{'\n'}Todos os dados são fictícios.
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
    paddingBottom: 72, // espaço para o cartão "subir" por cima
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.25)',
  },
  marca: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', marginTop: espaco.m, letterSpacing: -0.5 },
  slogan: {
    fontSize: fontes.normal,
    color: '#DCFCE7',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
    fontWeight: '600',
  },
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
  titulo: { fontSize: fontes.titulo + 4, fontWeight: '900', color: cores.texto },
  subtitulo: { fontSize: fontes.pequena, color: cores.textoSecundario, marginTop: -8 },
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
  botaoCriar: {
    minHeight: 56,
    borderRadius: raio.m,
    borderWidth: 2,
    borderColor: cores.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
  },
  botaoCriarTexto: { color: cores.primaria, fontSize: fontes.normal, fontWeight: '900' },
  demo: {
    backgroundColor: cores.primariaClara,
    borderRadius: raio.m,
    padding: espaco.m,
    gap: espaco.p,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  demoTopo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  demoTitulo: { fontSize: fontes.pequena, fontWeight: '800', color: cores.primariaEscura },
  demoTexto: { fontSize: 16, color: cores.texto, lineHeight: 24 },
  botaoDemo: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  botaoDemoTexto: { fontSize: 16, fontWeight: '800', color: cores.primaria },
  rodape: { fontSize: 14, color: cores.textoSecundario, textAlign: 'center', lineHeight: 20 },
});
