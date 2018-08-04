const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  cache: true,

  entry: {
    content: [ path.resolve(__dirname, 'src/content.js') ],
    background: [ path.resolve(__dirname, 'src/background.js') ]
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'src/manifest.json'
      },
      {
        from: 'src/assets/*.png',
        to: path.resolve(__dirname, 'dist/[name].[ext]')
      }
    ]),

    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],

  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loaders: [ 'babel-loader?cacheDirectory' ],
        include: [
          path.resolve(__dirname, 'src')
        ]
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
      }
    ]
  }
};
