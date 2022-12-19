process.env.NODE_ENV = 'test'

module.exports = {
  require: ['ts-node/register/transpile-only', 'earljs/mocha'],
  extension: ['ts'],
  watchExtensions: ['ts'],
  spec: ['src/**/*.test.ts'],
  timeout: 300_000,
}
