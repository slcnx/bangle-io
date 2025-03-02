module.exports = {
  testRunner: 'jest-circus/runner',
  testPathIgnorePatterns: [
    `<rootDir>/.yarn`,
    `<rootDir>/tooling/e2e`,
    `<rootDir>/tooling/playwright-e2e`,
  ],
  transformIgnorePatterns: [],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [`<rootDir>/.yarn`],
  // collectCoverage: true,
  clearMocks: true,
  setupFiles: ['<rootDir>/tooling/_scripts/jest-setup.js'],
  setupFilesAfterEnv: ['@bangle.dev/jest-utils'],
  globalSetup: '<rootDir>/tooling/_scripts/jest-global-setup.js',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tooling/_scripts/fileMock.js',
    '\\.(css)$': '<rootDir>/tooling/_scripts/styleMock.js',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
