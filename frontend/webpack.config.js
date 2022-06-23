const path = require('path');

module.exports = {
  entry: './www/auth.js',
  output: {
    filename: 'auth-v{version}.min.js',
    path: path.resolve(__dirname, 'builds')
  }
}