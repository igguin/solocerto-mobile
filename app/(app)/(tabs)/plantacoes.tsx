/**
 * Tela "Plantações": mostra todas as plantações do produtor, cada uma com
 * a situação do solo agora (cor + ícone + texto + %), e deixa escolher qual abrir.
 * Ao tocar numa plantação, ela vira a "aberta" e o app volta para a tela Hoje.
 * O botão "Adicionar plantação" abre o formulário (app/(app)/nova-plantacao.tsx).
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AvisoOffline } from '@/components/Faixa';
import { iconeDaCultura } from '@/constants/culturas';
import { ESTADOS } from '@/constants/estados';
import { InfoMini } from '@/components/InfoMini';
import { formatarHectares } from '@/constants/propriedade';
import { cores, espaco, fontes, raio, sombra } from '@/constants/tema';
import { useDados } from '@/context/DadosContext';
import { useSessao } from '@/context/SessaoContext';
import type { LeituraLocal } from '@/types/leitura';
import type { Plantacao } from '@/types/plantacao';
import { tempoRelativo } from '@/utils/formato';

export default function TelaPlantacoes() {
  const { plantacoes, plantacaoAtual, resumo, online, atualizando, carregou, atualizarTodas, escolherPlantacao } =
    useDados();
  const { sessao } = useSessao();

  // Toda vez que a tela aparece, atualiza o resumo de todas as plantações.
  useFocusEffect(
    useCallback(() => {
      void atualizarTodas();
    }, [atualizarTodas]),
  );

  function abrir(p: Plantacao) {
    void escolherPlantacao(p.id);
    router.navigate('/');
  }

  // Quantas plantações estão com solo seco agora (aparece no topo).
  const secas = plantacoes.filter((p) => resumo[p.id]?.estado === 'CRITICO').length;
  const areaTotal = Math.round(plantacoes.reduce((soma, p) => soma + p.hectares, 0) * 10) / 10;

  return (
    <FlatList
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      data={plantacoes}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          {!online && <AvisoOffline />}
          <View style={styles.linhaMini}>
            <InfoMini
              icone="sprout"
              rotulo={`Área total${sessao ? ` · ${sessao.usuario.cidade}` : ''}`}
              valor={formatarHectares(areaTotal)}
            />
            <InfoMini
              icone="alert-octagon"
              rotulo="Com solo seco"
              valor={String(secas)}
              corIcone={secas > 0 ? ESTADOS.CRITICO.corFundo : cores.textoSecundario}
            />
          </View>
          <BotaoAdicionar />
          {plantacoes.length > 0 && <Text style={styles.instrucao}>Toque em uma plantação para abrir.</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <CartaoPlantacao
          plantacao={item}
          leitura={resumo[item.id] ?? null}
          selecionada={item.id === plantacaoAtual?.id}
          onPress={() => abrir(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: espaco.m }} />}
      ListEmptyComponent={
        carregou ? (
          <View style={styles.vazioCaixa}>
            <MaterialCommunityIcons name="sprout-outline" size={56} color={cores.textoSecundario} />
            <Text style={styles.vazioTitulo}>Nenhuma plantação ainda</Text>
            <Text style={styles.vazio}>
              {online
                ? 'Toque em "Adicionar plantação" para cadastrar a primeira.'
                : 'Conecte à internet para ver ou cadastrar suas plantações.'}
            </Text>
          </View>
        ) : (
          <Text style={styles.vazio}>Carregando plantações...</Text>
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={atualizarTodas}
          colors={[cores.primaria]}
          tintColor={cores.primaria}
        />
      }
    />
  );
}

/** Botão "Adicionar plantação": abre o formulário de cadastro. */
function BotaoAdicionar() {
  return (
    <Pressable
      onPress={() => router.push('/nova-plantacao')}
      accessibilityRole="button"
      accessibilityLabel="Adicionar plantação"
      accessibilityHint="Abre o formulário para cadastrar uma plantação nova"
      style={({ pressed }) => [styles.adicionar, pressed && styles.pressionado]}
    >
      <View style={styles.adicionarIcone}>
        <MaterialCommunityIcons name="plus" size={30} color={cores.primaria} />
      </View>
      <Text style={styles.adicionarTexto}>Adicionar plantação</Text>
    </Pressable>
  );
}

interface PropsCartao {
  plantacao: Plantacao;
  leitura: LeituraLocal | null;
  selecionada: boolean;
  onPress: () => void;
}

function CartaoPlantacao({ plantacao, leitura, selecionada, onPress }: PropsCartao) {
  const info = leitura ? ESTADOS[leitura.estado] : null;
  const umidade = leitura ? Math.round(leitura.umidadeSolo) : null;

  const descricaoEstado = info
    ? `${info.titulo}, umidade ${umidade} por cento. ${info.conselho}`
    : 'Ainda sem leituras.';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionada }}
      accessibilityLabel={
        `${plantacao.nome}, ${plantacao.cultura}, ${formatarHectares(plantacao.hectares).replace('ha', 'hectares')}. ` +
        `${descricaoEstado}${selecionada ? ' Plantação aberta agora.' : ''}`
      }
      accessibilityHint="Abre esta plantação na tela Hoje"
      style={({ pressed }) => [
        styles.cartao,
        selecionada && styles.cartaoSelecionado,
        pressed && styles.pressionado,
      ]}
    >
      {/* Faixa colorida na esquerda = estado do solo */}
      <View style={[styles.faixaEstado, { backgroundColor: info?.corFundo ?? cores.divisoria }]} />

      <View style={styles.corpo}>
        <View style={styles.linhaTopo}>
          <View style={styles.iconeCultura}>
            <MaterialCommunityIcons
              name={iconeDaCultura(plantacao.cultura)}
              size={32}
              color={cores.primaria}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.nome}>{plantacao.nome}</Text>
            <Text style={styles.detalhe}>
              {plantacao.cultura} · {formatarHectares(plantacao.hectares)}
            </Text>
          </View>
          {selecionada && (
            <View style={styles.seloAberta}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.seloAbertaTexto}>Aberta</Text>
            </View>
          )}
        </View>

        {info && leitura ? (
          <View style={styles.linhaEstado}>
            <View style={[styles.chip, { backgroundColor: info.corFundo }]}>
              <MaterialCommunityIcons name={info.icone} size={22} color={info.corTexto} />
              <Text style={[styles.chipTexto, { color: info.corTexto }]}>{info.titulo}</Text>
            </View>
            <Text style={styles.umidade}>{umidade}%</Text>
          </View>
        ) : (
          <Text style={styles.detalhe}>Ainda sem leituras</Text>
        )}

        {leitura && <Text style={styles.quando}>Atualizado {tempoRelativo(leitura.criadoEm)}</Text>}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={32} color={cores.textoSecundario} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.m, paddingBottom: espaco.g * 2 },
  cabecalho: { gap: espaco.m, marginBottom: espaco.m },
  linhaMini: { flexDirection: 'row', gap: espaco.m },
  titulo: { fontSize: fontes.titulo, fontWeight: '900', color: cores.texto },
  subtitulo: { fontSize: fontes.pequena, color: cores.textoSecundario },
  instrucao: { fontSize: fontes.pequena, color: cores.texto, fontWeight: '700', marginTop: espaco.p },
  flex: { flex: 1 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    overflow: 'hidden',
    minHeight: 120,
    paddingRight: espaco.p,
    borderWidth: 3,
    borderColor: 'transparent',
    ...sombra,
  },
  cartaoSelecionado: { borderColor: cores.primaria },
  pressionado: { opacity: 0.8 },
  faixaEstado: { width: 10, alignSelf: 'stretch' },
  corpo: { flex: 1, padding: espaco.m, gap: espaco.p },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeCultura: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto },
  detalhe: { fontSize: fontes.pequena, color: cores.textoSecundario },
  seloAberta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cores.primaria,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  seloAbertaTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  linhaEstado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipTexto: { fontSize: 16, fontWeight: '900' },
  umidade: { fontSize: fontes.titulo, fontWeight: '900', color: cores.texto },
  quando: { fontSize: 16, color: cores.textoSecundario },
  vazio: { fontSize: fontes.normal, color: cores.textoSecundario, paddingVertical: espaco.g, textAlign: 'center' },
  vazioCaixa: { alignItems: 'center', paddingVertical: espaco.g, gap: espaco.p },
  vazioTitulo: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto },
  adicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: espaco.m,
    borderRadius: raio.m,
    backgroundColor: cores.primaria,
    boxShadow: '0px 6px 16px rgba(22, 101, 52, 0.30)',
  },
  adicionarIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adicionarTexto: { fontSize: fontes.normal, fontWeight: '900', color: '#FFFFFF' },
});
