
const path = require('path');

// No need to require autoprefixer here if you're requiring it directly in postcssOptions
// const autoprefixer = require('autoprefixer');

// It's a good practice to output to a dedicated build directory
const BUILD_DIR = path.resolve(__dirname, 'dist'); // Changed to 'dist' folder
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Add this line

module.exports = {
  // Set mode to 'development' or 'production' for better defaults and optimizations
  mode: 'development', // or 'production'

  entry: ['./wbprop.scss', './wbprop.js'],
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
    publicPath: '/' // This publicPath is often used for assets served from the root
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Path to your source index.html file
      filename: 'index.html'    // Output filename in the BUILD_DIR
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader', // Injects CSS into the DOM
          'css-loader',   // Interprets @import and url() like import/require()
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer'), // Autoprefixer should be here
                  // You can add other PostCSS plugins here, e.g., cssnano for minification in production
                  // require('cssnano')({
                  //   preset: 'default',
                  // }),
                ],
              },
              sourceMap: true, // Generate source maps for easier debugging
            },
          },
          {
            loader: 'sass-loader', // Compiles Sass to CSS
            options: {
              // This is crucial for resolving @material imports
              sassOptions: {
                includePaths: [
                  path.resolve(__dirname, 'node_modules'), // Tell Sass to look in node_modules
                ],
              },
              sourceMap: true, // Generate source maps for Sass
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/, // Exclude node_modules for faster transpilation
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource', // Use Webpack 5's built-in asset modules
        generator: {
          filename: 'fonts/[name][ext]', // Output fonts to a 'fonts' directory
        },
      },
      // You might also want a rule for images
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
    ],
  },
  // Add a devtool for better source mapping in development
  devtool: 'eval-source-map', // Or 'source-map' for production
};