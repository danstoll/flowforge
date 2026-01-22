/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/server'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.server.json',
      },
    ],
  },
  collectCoverageFrom: [
    'src/server/**/*.ts',
    '!src/server/**/*.d.ts',
    '!src/server/**/index.ts',
  ],
  coverageDirectory: 'coverage/server',
  verbose: true,
};
