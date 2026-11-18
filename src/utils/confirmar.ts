/**
 * Pergunta "Sim / Não" que funciona no celular (Alert) e no navegador (window.confirm).
 * Uso: if (await confirmar('Sair da conta?', 'Você vai precisar entrar de novo.')) { ... }
 */
import { Alert, Platform } from 'react-native';

export function confirmar(titulo: string, mensagem: string, textoSim = 'Sim'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoSim, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
