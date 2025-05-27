// Minimal Jest configuration for testing
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
};
