module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/test/setEnvVars.js', '<rootDir>/test/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/src/bot/*.ts',
    '!<rootDir>/src/bot/(sender|telegram).ts',
    '<rootDir>/src/bot/services/**/*.ts',
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  coverageReporters: ['text', 'text-summary'],
};
