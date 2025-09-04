import { getDefaultConfig } from 'expo/metro-config/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = getDefaultConfig(__dirname);

// Add support for WebAssembly files
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('wasm');

// Add process polyfill for web
config.resolver.alias = {
  ...config.resolver.alias,
  process: 'process/browser',
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

export default config;