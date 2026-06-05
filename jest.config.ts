import type { Config } from 'jest'

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Suites de integração/e2e compartilham o mesmo Postgres e usam TRUNCATE no
  // afterEach; rodar em paralelo faz uma suite limpar o banco no meio de outra
  // (duplicate key / id NaN). Serializa a execução para isolar os suites.
  maxWorkers: 1,
}

export default config