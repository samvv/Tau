
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const projectDir = path.resolve(__dirname);
const distDir = path.join(projectDir, 'dist');

const constants = {	
  isDebug: true
}

module.exports = [
  {
    context: projectDir,
    entry: './src/main.ts',
    target: 'electron-main',
    output: {
      path: distDir,
      filename: 'main.bundle.js',
    },
    resolve: {
      extensions: [ '.js', '.mjs', '.ts', '.tsx' ],
    },
    devServer: {
      devMiddleware: {
        writeToDisk: true,
      },
      static: {
        directory: distDir,
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
              ]
            }
          }
        }
      ]
    },
    plugins: [
      new CopyPlugin({ 
        patterns: [
          { from: 'index.html', to: distDir },
          { from: 'fonts', to: path.join(distDir, 'fonts') },
        ]
      }),
      new webpack.DefinePlugin(constants)
    ]
  },
  {
    context: projectDir,
    entry: './src/renderer.tsx',
    target: 'electron-renderer',
    output: {
      path: distDir,
      filename: 'renderer.bundle.js',
    },
    resolve: {
      extensions: [ '.js', '.mjs', '.ts', '.tsx' ],
    },
    externals: {
      neovim: 'neovim',
    },
    externalsType: 'commonjs-module',
    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.tsx?/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }],
                '@babel/preset-typescript',
              ],
              plugins: [
                '@emotion/babel-plugin',
                '@babel/plugin-proposal-class-properties',
              ]
            },
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin(constants),
    ]
  }
]
