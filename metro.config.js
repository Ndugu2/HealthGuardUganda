const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .wasm files (needed for expo-sqlite on web)
config.resolver.assetExts.push('wasm');

module.exports = config;
