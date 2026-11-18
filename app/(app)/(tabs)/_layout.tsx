/**
 * Layout das ABAS (só aparece para quem fez login).
 *
 *  Tabs -> navegação em abas: Hoje | Plantações | Histórico | Ajuda
 *  (o DadosProvider fica um nível acima, em app/(app)/_layout.tsx)
 *
 * Cada arquivo desta pasta vira uma aba:
 *   index.tsx -> "Hoje"            plantacoes.tsx -> "Plantações"
 *   historico.tsx -> "Histórico"   ajuda.tsx -> "Ajuda"
 *
 * O "(tabs)" entre parênteses é um GRUPO: não aparece no endereço da tela.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import type { NomeIcone } from '@/constants/estados';
import { cores } from '@/constants/tema';

/** Ícone da aba: cheio quando está selecionada, contorno quando não está. */
function iconeDaAba(cheio: NomeIcone, contorno: NomeIcone) {
  function IconeDaAba({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <MaterialCommunityIcons name={focused ? cheio : contorno} size={28} color={color as string} />;
  }
  return IconeDaAba;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Cabeçalho branco e limpo (a tela Hoje usa um topo próprio, com gradiente).
        headerStyle: { backgroundColor: cores.cartao },
        headerTintColor: cores.texto,
        headerTitleStyle: { fontSize: 26, fontWeight: '900' },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: cores.fundo },
        // Barra de abas
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '800', marginTop: 2 },
        tabBarItemStyle: { minHeight: 56, paddingVertical: 4 },
        tabBarStyle: {
          backgroundColor: cores.cartao,
          borderTopWidth: 1,
          borderTopColor: cores.bordaSuave,
          minHeight: 68,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          headerShown: false,
          tabBarAccessibilityLabel: 'Hoje: como está o solo agora',
          tabBarIcon: iconeDaAba('home-variant', 'home-variant-outline'),
        }}
      />
      <Tabs.Screen
        name="plantacoes"
        options={{
          title: 'Plantações',
          tabBarAccessibilityLabel: 'Plantações: ver e escolher a plantação',
          tabBarIcon: iconeDaAba('sprout', 'sprout-outline'),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarAccessibilityLabel: 'Histórico: leituras e irrigações anteriores',
          tabBarIcon: iconeDaAba('chart-box', 'chart-box-outline'),
        }}
      />
      <Tabs.Screen
        name="ajuda"
        options={{
          title: 'Ajuda',
          tabBarAccessibilityLabel: 'Ajuda e conta',
          tabBarIcon: iconeDaAba('help-circle', 'help-circle-outline'),
        }}
      />
    </Tabs>
  );
}
