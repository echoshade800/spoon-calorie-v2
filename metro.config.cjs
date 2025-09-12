const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix file watcher issues
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver.alias,
    '@': './',
  },
};

// Disable file watching for problematic directories
config.watcher = {
  additionalExts: ['cjs', 'mjs'],
  watchman: {
    deferStates: ['hg.update'],
  },
};

// Add transformer options to prevent watch mode issues
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;