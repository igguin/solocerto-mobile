// Configuração do Metro (o "empacotador" do Expo).
// Só é necessária para o expo-sqlite funcionar no navegador (npx expo start --web).
// No celular (Expo Go) nada disso é usado.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O SQLite na web roda em WebAssembly (.wasm).
config.resolver.assetExts.push('wasm');

// Cabeçalhos exigidos pelo SQLite na web (SharedArrayBuffer).
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
