const WebpackPwaManifest = require('webpack-pwa-manifest');


const config = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  }
  // plugins: [
  //   new WebpackPwaManifest({
  //     fingerprints: false,
  //     inject: false,
  //     name: 'Budget Tracker',
  //     short_name: 'Budget Tracker',
  //     description: 'An application for your wallet!',
  //     background_color: '#01579b',
  //     theme_color: '#ffffff',
  //     start_url: '/',
  //     icons: [
  //       {
  //         src: path.resolve('./icons/icon-192x192.png'),
  //         sizes: [192,512],
          
  //       }
  //     ]
  //   })
  // ],

}
module.exports = config;