/**
 * Gráfico de barras simples, feito só com <View> (sem biblioteca de gráficos).
 * Cada barra = uma leitura. Altura = umidade (0 a 100%). Cor = estado.
 * Linhas tracejadas marcam os limites 30% (seco) e 70% (bom).
 *
 * Para o leitor de tela, o gráfico inteiro vira um resumo em texto.
 */
import { StyleSheet, Text, View } from 'react-native';

import { ESTADOS } from '@/constants/estados';
import { cores, espaco, fontes } from '@/constants/tema';
import type { LeituraLocal } from '@/types/leitura';
import { formatarHora } from '@/utils/formato';

const ALTURA = 180;
const MAX_BARRAS = 12;

export function GraficoUmidade({ leituras }: { leituras: LeituraLocal[] }) {
  // Só leituras do sensor (sem as irrigações), da mais antiga para a mais nova.
  const dados = leituras
    .filter((l) => l.evento !== 'irrigacao_confirmada')
    .slice(0, MAX_BARRAS)
    .reverse();

  if (dados.length === 0) {
    return <Text style={styles.vazio}>Ainda não há leituras para o gráfico.</Text>;
  }

  const valores = dados.map((d) => Math.round(d.umidadeSolo));
  const primeira = dados[0];
  const ultima = dados[dados.length - 1];
  const resumo =
    `Gráfico da umidade nas últimas ${dados.length} leituras, ` +
    `das ${formatarHora(primeira.criadoEm)} às ${formatarHora(ultima.criadoEm)}. ` +
    `Menor: ${Math.min(...valores)}%. Maior: ${Math.max(...valores)}%. Agora: ${valores[valores.length - 1]}%.`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={resumo}>
      <Text style={styles.titulo}>Umidade nas últimas leituras</Text>
      <View style={styles.area}>
        {/* Linhas de referência */}
        <Linha valor={70} texto="70% bom" />
        <Linha valor={30} texto="30% seco" />
        {/* Barras */}
        <View style={styles.barras}>
          {dados.map((d) => (
            <View key={d.localId} style={styles.colunaBarra}>
              <View
                style={[
                  styles.barra,
                  {
                    height: Math.max(4, (d.umidadeSolo / 100) * ALTURA),
                    backgroundColor: ESTADOS[d.estado].corFundo,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.eixo}>
        <Text style={styles.textoEixo}>{formatarHora(primeira.criadoEm)}</Text>
        <Text style={styles.textoEixo}>{formatarHora(ultima.criadoEm)}</Text>
      </View>
    </View>
  );
}

function Linha({ valor, texto }: { valor: number; texto: string }) {
  return (
    <View style={[styles.linha, { bottom: (valor / 100) * ALTURA }]}>
      <Text style={styles.textoLinha}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: fontes.grande, fontWeight: '700', color: cores.texto, marginBottom: espaco.p },
  area: {
    height: ALTURA,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.borda,
    justifyContent: 'flex-end',
  },
  barras: { flexDirection: 'row', alignItems: 'flex-end', height: ALTURA, gap: 4, paddingHorizontal: 4 },
  colunaBarra: { flex: 1, justifyContent: 'flex-end', height: ALTURA },
  barra: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  linha: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  textoLinha: { position: 'absolute', right: 4, top: -24, fontSize: 14, fontWeight: '700', color: cores.texto },
  eixo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  textoEixo: { fontSize: fontes.pequena, color: cores.textoSecundario },
  vazio: { fontSize: fontes.normal, color: cores.textoSecundario },
});
