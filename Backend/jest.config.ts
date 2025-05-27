// ==========================================================
// 🧪 C.H.A.O.S. TEST CONFIGURATION 🧪
// ==========================================================
// ▀█▀ █▀▀ █▀ ▀█▀   █▀ █▀▀ ▀█▀ █░█ █▀█
// ░█░ ██▄ ▄█ ░█░   ▄█ ██▄ ░█░ █▄█ █▀▀
// ==========================================================
// [CODEX-1337] JEST CONFIG FOR BACKEND TEST FRAMEWORK
// [CODEX-1337] TYPESCRIPT TRANSPILATION WITH TS-JEST
// [CODEX-1337] MOCKING AND COVERAGE SETUP
// [CODEX-1337] PLATFORM-AGNOSTIC PATH CONFIGURATION
// ==========================================================
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

// Get the base URL from tsconfig
const { baseUrl, paths } = compilerOptions;

// Create module name mapper from paths
const moduleNameMapper = paths && baseUrl 
  ? pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' })
  : {};

/**
 * [CODEX-1337] JEST CONFIGURATION FOR C.H.A.O.S BACKEND
 * Advanced test configuration with TypeScript support, code coverage
 * and intelligent module mapping
 */
const config: Config = {
  // Display name for the test suite
  displayName: 'C.H.A.O.S Backend Tests',
  
  // Basic test environment configuration
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  
  // Module name mapping with TypeScript paths support
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Handle static assets and styles if needed
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/test/__mocks__/fileMock.ts',
  },
  
  // TypeScript configuration with ESM support
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: true,
    }],
  },
  
  // Setup files and patterns to ignore
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // Timeout configuration
  testTimeout: 30000,
  
  // Pretty reporting
  verbose: true,
  
  // Platform-agnostic path settings for cross-platform support
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Clear mock state between tests
  clearMocks: true,
  resetMocks: false,
};

export default config;
