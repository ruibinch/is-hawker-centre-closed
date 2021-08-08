module.exports = {
  roots: ['<rootDir>'],
  projects: ['<rootDir>/bot/jest.config.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageReporters: ['text', 'text-summary'],
};
