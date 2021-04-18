module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/common/*.ts',
    '!<rootDir>/src/dataCollection/*.ts',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'text-summary'],
};
