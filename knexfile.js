require('ts-node/register');
require('tsconfig-paths/register');

const config = require('./src/config/knexfile.ts').default;

module.exports = config;