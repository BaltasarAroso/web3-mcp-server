import { describe, it, expect } from 'vitest';
import { getChainConfig } from './index.js';

/*
  Example unit test file for server-side logic.

  Demonstrates how to write and organize tests for utility functions and configuration logic
  in the server codebase using Vitest. Add additional tests here as you expand your server functionality.
*/

// Unit tests for getChainConfig
describe('getChainConfig', () => {
  it('returns mainnet by default', () => {
    const mainnet = getChainConfig('mainnet');
    expect(mainnet).toHaveProperty('id');
    expect(mainnet.name.toLowerCase()).toContain('ethereum');
  });

  it('returns goerli config', () => {
    const goerli = getChainConfig('goerli');
    expect(goerli.name.toLowerCase()).toContain('goerli');
  });

  it('returns sepolia config', () => {
    const sepolia = getChainConfig('sepolia');
    expect(sepolia.name.toLowerCase()).toContain('sepolia');
  });

  it('returns local config', () => {
    const local = getChainConfig('local');
    expect(local.name.toLowerCase()).toContain('localhost');
    expect(local.id).toBe(31337);
  });
});