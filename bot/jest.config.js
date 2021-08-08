const base = require('../jest.config.js');

module.exports = {
  ...base,
  rootDir: './',
  setupFiles: ['<rootDir>/test/setEnvVars.js'],
  collectCoverageFrom: [
    '<rootDir>/src/bot/*.ts',
    '!<rootDir>/src/bot/sender.ts',
    '<rootDir>/src/services/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
