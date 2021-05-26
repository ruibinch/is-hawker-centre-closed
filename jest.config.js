module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/test/helpers/setEnvVars.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/src/bot/*.ts',
    '!<rootDir>/src/bot/sender.ts',
    '<rootDir>/src/services/**/*.ts',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'text-summary'],
};
