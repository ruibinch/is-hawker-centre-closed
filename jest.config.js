module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/src/bot/*.ts',
    '<rootDir>/src/features/**/*.ts',
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'text-summary'],
};
