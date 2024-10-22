const path = require('path');

module.exports = {
  entry: './app/static/src/index.tsx',  // Changed to .tsx
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],  // Added .jsx
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'app/static/dist'),
  },
};
