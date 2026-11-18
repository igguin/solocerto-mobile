/**
 * Layout RAIZ (Expo Router). Envolve o app inteiro.
 *
 *  SQLiteProvider  -> abre o banco "solocerto.db" e cria as tabelas (migrarBanco)
 *  SessaoProvider  -> sabe quem está logado
 *  Stack           -> duas "áreas":
 *      login, cadastro -> só aparecem para quem NÃO entrou
 *      (app)           -> abas + "Nova plantação", só para quem entrou
 *
 * Stack.Protected faz o redirecionamento sozinho: ao entrar, vai para as abas;
 * ao sair, volta para o login.
 */
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { cores } from '@/constants/tema';
import { SessaoProvider, useSessao } from '@/context/SessaoContext';
import { migrarBanco, NOME_BANCO } from '@/db/database';

function Navegacao() {
  const { sessao, carregando } = useSessao();

  if (carregando) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.primariaEscura }}
        accessible
        accessibilityLabel="Abrindo o SoloCerto"
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Protected guard={!sessao}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
      <Stack.Protected guard={!!sessao}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={NOME_BANCO} onInit={migrarBanco}>
      <SessaoProvider>
        <StatusBar style="dark" />
        <Navegacao />
      </SessaoProvider>
    </SQLiteProvider>
  );
}
