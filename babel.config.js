const path = require('path');

module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './app/_src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};


