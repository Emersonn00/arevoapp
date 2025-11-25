const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configurar o resolver para reconhecer o alias @
config.resolver.alias = {
  '@': path.join(__dirname, 'app', '_src'),
};

// NÃO bloquear _src no resolver - precisamos que os imports funcionem
// O expo-router já ignora _src automaticamente por causa do underscore

module.exports = config;


