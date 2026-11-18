/**
 * Tela "Hoje": a mais importante.
 *
 * Topo (gradiente verde): saudação, data, status da internet, avatar (sair)
 * e a plantação aberta com o botão "Trocar".
 * Conteúdo: umidade agora + estado (cor + texto + ícone), última leitura,
 * botão grande "Irriguei", régua de umidade e clima.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoGrande } from '@/components/BotaoGrande';
import { Cartao } from '@/components/Cartao';
import { CartaoEstado } from '@/components/CartaoEstado';
import { Faixa } from '@/components/Faixa';
import { InfoMini } from '@/components/InfoMini';
import { ReguaUmidade } from '@/components/ReguaUmidade';
import { iconeDaCultura } from '@/constants/culturas';
import { formatarHectares } from '@/constants/propriedade';
import { cores, espaco, fontes, gradienteMarca, raio } from '@/constants/tema';
import { useDados } from '@/context/DadosContext';
import { useSessao } from '@/context/SessaoContext';
import { USANDO_MOCK } from '@/services/api';
import { confirmar } from '@/utils/confirmar';
import { dataPorExtenso, formatarDuracao, formatarHora, tempoRelativo } from '@/utils/formato';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "Carlos Ferreira" -> "CF" */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export default function TelaHoje() {
  const {
    plantacoes,
    plantacaoAtual,
    ultima,
    online,
    atualizando,
    carregou,
    erro,
    pendentes,
    atualizar,
    registrarIrrigacao,
  } = useDados();
  const semPlantacoes = carregou && plantacoes.length === 0; // conta nova
  const { sessao, sair } = useSessao();
  const insets = useSafeAreaInsets();
  const [salvando, setSalvando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{ titulo: string; texto: string } | null>(null);
  const [, setRelogio] = useState(0);

  // Topo é escuro: ícones da barra de status ficam brancos só nesta tela.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  // Atualiza o texto "há X minutos" a cada 30 segundos.
  useEffect(() => {
    const t = setInterval(() => setRelogio((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  async function aoTocarIrriguei() {
    setSalvando(true);
    try {
      const r = await registrarIrrigacao();
      const hora = formatarHora(new Date().toISOString());
      const partes = [
        r.tempoReacaoSeg != null
          ? `Você respondeu ao alerta em ${formatarDuracao(r.tempoReacaoSeg)}.`
          : 'Não havia alerta de solo seco.',
        r.enviado ? 'Enviado para o sistema.' : 'Salvo no celular. Vamos enviar quando a internet voltar.',
      ];
      const msg = { titulo: `Irrigação registrada às ${hora}`, texto: partes.join(' ') };
      setConfirmacao(msg);
      AccessibilityInfo.announceForAccessibility(`${msg.titulo}. ${msg.texto}`);
    } catch (e) {
      console.warn(e);
      setConfirmacao({ titulo: 'Não foi possível registrar', texto: 'Tente de novo.' });
    } finally {
      setSalvando(false);
    }
  }

  async function aoTocarAvatar() {
    if (await confirmar('Sair da conta?', 'Você vai precisar entrar de novo com e-mail e senha. Os dados guardados neste celular serão apagados.', 'Sair')) {
      await sair();
    }
  }

  const nome = sessao?.usuario.nome ?? '';
  const primeiroNome = nome.split(' ')[0];

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={atualizar}
          colors={[cores.primaria]}
          tintColor="#FFFFFF"
          progressViewOffset={insets.top}
          accessibilityLabel="Puxe para atualizar"
        />
      }
    >
      {/* ===== TOPO COM GRADIENTE ===== */}
      <LinearGradient
        colors={gradienteMarca}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + espaco.m }]}
      >
        <View style={styles.heroLinha}>
          <View style={styles.flex}>
            <Text style={styles.heroData}>{dataPorExtenso(new Date())}</Text>
            <Text style={styles.heroOla} accessibilityRole="header">
              {saudacao()}, {primeiroNome}!
            </Text>
          </View>
          <Pressable
            onPress={aoTocarAvatar}
            accessibilityRole="button"
            accessibilityLabel={`Conta de ${nome}. Toque para sair`}
            style={({ pressed }) => [styles.avatarUsuario, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.avatarTexto}>{iniciais(nome)}</Text>
          </Pressable>
        </View>

        {/* Status da conexão */}
        <View
          style={[styles.status, !online && styles.statusOffline]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={
            online ? 'Conectado. Dados atualizados sozinhos.' : 'Sem internet. Mostrando dados salvos no celular.'
          }
        >
          <MaterialCommunityIcons
            name={online ? 'access-point' : 'wifi-off'}
            size={18}
            color={online ? '#BBF7D0' : '#FFFFFF'}
          />
          <Text style={styles.statusTexto}>
            {online ? 'Sensor conectado · atualiza sozinho' : 'Sem internet · dados salvos no celular'}
          </Text>
        </View>

        {/* Plantação aberta + Trocar */}
        <Pressable
          onPress={() => router.navigate('/plantacoes')}
          accessibilityRole="button"
          accessibilityLabel={
            plantacaoAtual
              ? `Plantação aberta: ${plantacaoAtual.nome}, ${plantacaoAtual.cultura}. Trocar plantação`
              : 'Escolher plantação'
          }
          accessibilityHint="Abre a lista de plantações"
          style={({ pressed }) => [styles.seletor, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.iconePlantacao}>
            <MaterialCommunityIcons
              name={iconeDaCultura(plantacaoAtual?.cultura ?? '')}
              size={28}
              color={cores.primaria}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.seletorRotulo}>Plantação</Text>
            <Text style={styles.seletorNome} numberOfLines={1}>
              {plantacaoAtual
                ? `${plantacaoAtual.nome} · ${plantacaoAtual.cultura}`
                : semPlantacoes
                  ? 'Nenhuma cadastrada'
                  : 'Carregando...'}
            </Text>
            {plantacaoAtual && (
              <Text style={styles.seletorDetalhe}>
                {formatarHectares(plantacaoAtual.hectares)} · {sessao?.usuario.cidade}
              </Text>
            )}
          </View>
          <View style={styles.trocar}>
            <Text style={styles.trocarTexto}>Trocar</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={cores.primariaEscura} />
          </View>
        </Pressable>
      </LinearGradient>

      {/* ===== CONTEÚDO ===== */}
      <View style={styles.corpo}>
        {online && erro && <Faixa tipo="erro" titulo="Servidor fora do ar" texto={erro} />}

        {semPlantacoes ? (
          <Cartao style={styles.boasVindas}>
            <View style={styles.boasVindasIcone}>
              <MaterialCommunityIcons name="sprout" size={48} color={cores.primaria} />
            </View>
            <Text style={styles.boasVindasTitulo} accessibilityRole="header">
              Bem-vindo ao SoloCerto!
            </Text>
            <Text style={styles.boasVindasTexto}>
              Cadastre sua primeira plantação para ver a umidade do solo aqui.
            </Text>
            <Pressable
              onPress={() => router.push('/nova-plantacao')}
              accessibilityRole="button"
              accessibilityLabel="Adicionar plantação"
              accessibilityHint="Abre o formulário para cadastrar uma plantação"
              style={({ pressed }) => [styles.botaoAdicionar, pressed && { opacity: 0.85 }]}
            >
              <MaterialCommunityIcons name="plus-circle" size={28} color="#FFFFFF" />
              <Text style={styles.botaoAdicionarTexto}>Adicionar plantação</Text>
            </Pressable>
          </Cartao>
        ) : ultima ? (
          <>
            <CartaoEstado umidade={ultima.umidadeSolo} estado={ultima.estado} />

            <View
              style={styles.atualizacao}
              accessible
              accessibilityLabel={`Última leitura do sensor às ${formatarHora(ultima.criadoEm)}, ${tempoRelativo(ultima.criadoEm)}`}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color={cores.textoSecundario} />
              <Text style={styles.atualizacaoTexto}>
                Última leitura às <Text style={styles.negrito}>{formatarHora(ultima.criadoEm)}</Text> ·{' '}
                {tempoRelativo(ultima.criadoEm)}
              </Text>
            </View>

            <BotaoGrande
              titulo="Irriguei"
              icone="water"
              dica="Registra que você irrigou agora"
              onPress={aoTocarIrriguei}
              carregando={salvando}
            />

            {confirmacao && (
              <Faixa tipo="sucesso" titulo={confirmacao.titulo} texto={confirmacao.texto} />
            )}

            {pendentes > 0 && (
              <Faixa
                tipo="erro"
                titulo={`${pendentes} ${pendentes === 1 ? 'irrigação esperando' : 'irrigações esperando'} internet`}
                texto="Está salvo no celular e será enviado sozinho."
              />
            )}

            <Text style={styles.secao} accessibilityRole="header">
              Detalhes
            </Text>

            <Cartao>
              <ReguaUmidade valor={ultima.umidadeSolo} />
            </Cartao>

            <View style={styles.linhaMini}>
              <InfoMini
                icone="thermometer"
                rotulo="Temperatura do ar"
                valor={ultima.temperaturaAr != null ? `${Math.round(ultima.temperaturaAr)} °C` : '—'}
                corIcone="#B45309"
              />
              <InfoMini
                icone="weather-cloudy"
                rotulo="Umidade do ar"
                valor={ultima.umidadeAr != null ? `${Math.round(ultima.umidadeAr)}%` : '—'}
                corIcone={cores.azul}
              />
            </View>
          </>
        ) : (
          <Cartao style={styles.carregando} accessible accessibilityLabel="Carregando leituras">
            <ActivityIndicator size="large" color={cores.primaria} />
            <Text style={styles.atualizacaoTexto}>
              {online ? 'Buscando a primeira leitura do sensor...' : 'Sem leituras salvas. Conecte à internet.'}
            </Text>
          </Cartao>
        )}

        {USANDO_MOCK && (
          <View style={styles.mock} accessible accessibilityLabel="Modo demonstração: dados simulados do sensor">
            <MaterialCommunityIcons name="flask-outline" size={18} color={cores.textoSecundario} />
            <Text style={styles.mockTexto}>Modo demonstração · dados simulados</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingBottom: espaco.g * 2 },
  flex: { flex: 1 },

  // Topo
  hero: {
    paddingHorizontal: espaco.m,
    paddingBottom: 56, // espaço para o cartão de umidade "subir" por cima
    gap: espaco.m,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  heroData: { fontSize: 16, color: '#BBF7D0', fontWeight: '700' },
  heroOla: { fontSize: fontes.titulo, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  avatarUsuario: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTexto: { fontSize: fontes.pequena, fontWeight: '900', color: cores.primariaEscura },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statusOffline: { backgroundColor: cores.perigo },
  statusTexto: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: raio.m,
    padding: 12,
    minHeight: 72,
  },
  iconePlantacao: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seletorRotulo: { fontSize: 14, color: '#BBF7D0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  seletorNome: { fontSize: fontes.normal, fontWeight: '900', color: '#FFFFFF' },
  seletorDetalhe: { fontSize: 15, color: '#DCFCE7' },
  trocar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  trocarTexto: { fontSize: 16, fontWeight: '800', color: cores.primariaEscura },

  // Conteúdo
  corpo: { marginTop: -40, paddingHorizontal: espaco.m, gap: espaco.m },
  atualizacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  atualizacaoTexto: { fontSize: 17, color: cores.textoSecundario, textAlign: 'center', flexShrink: 1 },
  negrito: { fontWeight: '900', color: cores.texto },
  secao: {
    fontSize: fontes.normal,
    fontWeight: '900',
    color: cores.texto,
    marginTop: espaco.p,
  },
  linhaMini: { flexDirection: 'row', gap: espaco.m },
  carregando: { alignItems: 'center', gap: espaco.m, paddingVertical: espaco.g * 2 },
  boasVindas: { alignItems: 'center', gap: espaco.m, paddingVertical: espaco.g },
  boasVindasIcone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boasVindasTitulo: { fontSize: fontes.grande, fontWeight: '900', color: cores.texto, textAlign: 'center' },
  boasVindasTexto: { fontSize: fontes.pequena, color: cores.textoSecundario, textAlign: 'center', lineHeight: 26 },
  botaoAdicionar: {
    alignSelf: 'stretch',
    minHeight: 64,
    borderRadius: raio.m,
    backgroundColor: cores.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
  },
  botaoAdicionarTexto: { color: '#FFFFFF', fontSize: fontes.normal, fontWeight: '900' },
  mock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: espaco.p },
  mockTexto: { fontSize: 15, color: cores.textoSecundario },
});
