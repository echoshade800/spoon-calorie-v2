const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for WebAssembly files
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('wasm');

// Add process polyfill for web
config.resolver.alias = {
  ...config.resolver.alias,
  process: require.resolve('process/browser'),
};

// Configure globals for web
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;