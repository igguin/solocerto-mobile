/**
 * Layout da ÁREA LOGADA (só aparece para quem entrou).
 *
 *  DadosProvider -> busca dados da API, salva no SQLite, observa a internet.
 *                   Fica AQUI (e não nas abas) para a tela "Nova plantação"
 *                   também conseguir usar os dados.
 *  Stack         -> (tabs)           = as 4 abas do app
 *                   nova-plantacao   = formulário que abre por cima das abas
 *
 * Quando o produtor sai da conta, esta área é desmontada e os dados somem
 * da memória; na próxima conta tudo começa do zero.
 */
import { Stack } from 'expo-router';

import { cores } from '@/constants/tema';
import { DadosProvider } from '@/context/DadosContext';

export default function AreaLogadaLayout() {
  return (
    <DadosProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: cores.fundo },
          headerStyle: { backgroundColor: cores.cartao },
          headerTintColor: cores.texto,
          headerTitleStyle: { fontSize: 24, fontWeight: '900' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="nova-plantacao" options={{ title: 'Nova plantação' }} />
      </Stack>
    </DadosProvider>
  );
}
