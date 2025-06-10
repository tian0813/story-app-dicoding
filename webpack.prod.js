// webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');


module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
     new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'), 
  }),
    new WebpackPwaManifest({
      name: 'Story App',
      short_name: 'Story',
      description: 'Dicoding Story Application',
      background_color: '#ffffff',
      theme_color: '#4B7BE5',
      inject: true,
      fingerprints: false,
      publicPath: '.', 
      icons: [
        {
          src: path.resolve('src/public/images/icons/web-app-manifest-512x512.png'),
          sizes: [96, 128, 192, 256, 384, 512],
          destination: path.join('images', 'icons'),
        },
      ],
    }),

    new InjectManifest({
      swSrc: path.resolve(__dirname, './src/public/sw.js'),
      swDest: 'sw.bundle.js',
    })
  ],
});