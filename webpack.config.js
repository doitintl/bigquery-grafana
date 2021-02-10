const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  node: {
    fs: 'empty',
  },
  context: path.join(__dirname, 'src'),
  entry: {
    module: './module.ts',
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'amd',
  },
  externals: [
    'lodash',
    function(context, request, callback) {
      var prefix = 'grafana/';
      if (request.indexOf(prefix) === 0) {
        return callback(null, request.substr(prefix.length));
      }
      callback();
    },
  ],
  plugins: [
    new CleanWebpackPlugin('doitintl-bigquery-datasource/', {allowExternal: true}),
    new CleanWebpackPlugin('doitintl-bigquery-datasource-*.zip', {allowExternal: true}),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CopyWebpackPlugin([
      { from: 'plugin.json', to: '.' },
      { from: '../README.md', to: '.' },
      { from: '../LICENSE.md', to: '.' },
      { from: 'img/*', to: '.' },
      { from: 'partials/*', to: '.' },
    ]),
    new CopyWebpackPlugin([
      { from: 'plugin.json', to: '../doitintl-bigquery-datasource/' },
      { from: '../README.md', to: '../doitintl-bigquery-datasource/' },
      { from: '../LICENSE.md', to: '../doitintl-bigquery-datasource/' },
      { from: 'img/*', to: '../doitintl-bigquery-datasource/' },
      { from: 'partials/*', to: '../doitintl-bigquery-datasource/' },
    ]),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: [
          {
            loader: 'babel-loader',
            options: { presets: ['env'] },
          },
          'ts-loader',
        ],
        exclude: /(node_modules)/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
