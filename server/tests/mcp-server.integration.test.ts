import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

const serverScriptPath = path.join(__dirname, '../src/index.ts');

// Overwriting env variable for testing
const CHAIN_ENV = 'mainnet';

const testAccountsByNetwork = {
  mainnet: {
    chainEnv: 'mainnet',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    tokenContract: '0xA8580F3363684d76055bdC6660CaeFe8709744e1',
  },
  goerli: {
    chainEnv: 'goerli',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    tokenContract: '0xA8580F3363684d76055bdC6660CaeFe8709744e1',
  },
  sepolia: {
    chainEnv: 'sepolia',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    tokenContract: '0xA8580F3363684d76055bdC6660CaeFe8709744e1',
  },
  local: {
    chainEnv: 'local',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    tokenContract: '0xA8580F3363684d76055bdC6660CaeFe8709744e1',
  },
};

const testAccountConfig = testAccountsByNetwork[CHAIN_ENV];

let mcpClient: Client;
let transport: StdioClientTransport;

describe('MCP Server Integration (SDK Client)', () => {
  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: 'node',
      args: ['--loader', 'ts-node/esm', serverScriptPath],
      env: {
        ...process.env,
        CHAIN_ENV: CHAIN_ENV,
      },
    });
    mcpClient = new Client({ name: 'integration-test', version: '1.0.0' });
    await mcpClient.connect(transport);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await mcpClient.close();
  });

  it('should return balances for all wallets', async () => {
    const result = await mcpClient.callTool({
      name: 'getAllWalletsBalances',
      arguments: {},
    });
    const contentArr = result.content as any[];
    expect(contentArr).toBeInstanceOf(Array);
    expect(contentArr[0]).toHaveProperty('text');
    console.log(contentArr[0].text);
    const balances = JSON.parse(contentArr[0].text);
    expect(typeof balances).toBe('object');
    expect(Object.keys(balances).length).toBeGreaterThan(0);
  }, 5000);

  it('should return the current block number', async () => {
    const result = await mcpClient.callTool({
      name: 'getLatestBlockNumber',
      arguments: {},
    });
    const contentArr = result.content as any[];
    expect(contentArr).toBeInstanceOf(Array);
    expect(contentArr[0]).toHaveProperty('text');
    const blockNumber = contentArr[0].text;
    expect(typeof blockNumber).toBe('string');
    console.log("blockNumber", blockNumber);
  }, 5000);

  it('should return the current gas price', async () => {
    const result = await mcpClient.callTool({
      name: 'getCurrentGasPrice',
      arguments: {},
    });
    const contentArr = result.content as any[];
    expect(contentArr).toBeInstanceOf(Array);
    expect(contentArr[0]).toHaveProperty('text');
    const gasPrice = contentArr[0].text;
    expect(typeof gasPrice).toBe('string');
    console.log("gasPrice", gasPrice);
  }, 5000);

  it('should return an ETH account balance', async () => {
    const result = await mcpClient.callTool({
      name: 'getEthBalance',
      arguments: {
        address: testAccountConfig.address,
      },
    });
    const contentArr = result.content as any[];
    expect(contentArr).toBeInstanceOf(Array);
    expect(contentArr[0]).toHaveProperty('text');
    const balance = contentArr[0].text;
    expect(typeof balance).toBe('string');
    console.log("balance", balance);
  }, 5000);

  it('should return a token balance', async () => {
    const result = await mcpClient.callTool({
      name: 'getTokenBalance',
      arguments: {
        address: testAccountConfig.address,
        tokenContract: testAccountConfig.tokenContract,
      },
    });
    const contentArr = result.content as any[];
    expect(contentArr).toBeInstanceOf(Array);
    expect(contentArr[0]).toHaveProperty('text');
    const balance = contentArr[0].text;
    expect(typeof balance).toBe('string');
    console.log("balance", balance);
  }, 5000);
});

process.stdin.on('data', (data) => {
  console.error('Raw stdin data:', data.toString());
}); 