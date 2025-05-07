import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Create server instance
const server = new McpServer({
  name: "web3-tools",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

import { createPublicClient, formatEther, http, formatGwei, createWalletClient, parseEther, WalletClient } from 'viem';
import { mainnet, goerli, sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';
import { privateKeyToAccount } from 'viem/accounts';

// Select chain based on CHAIN_ENV
const CHAIN_ENV = process.env.CHAIN_ENV || 'mainnet';

const localChain = {
    id: 31337,
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
        public: { http: ['http://127.0.0.1:8545'] },
    },
    blockExplorers: undefined,
    contracts: undefined,
};

function getChainConfig(env: string) {
    switch (env) {
        case 'goerli':
            return goerli;
        case 'sepolia':
            return sepolia;
        case 'local':
            return localChain;
        case 'mainnet':
        default:
            return mainnet;
    }
}

// Create a viem client for the mainnet
const client = createPublicClient({
    chain: getChainConfig(CHAIN_ENV),
    transport: http()
});

const PRIVATE_KEY = process.env.PRIVATE_KEY;

// List of wallets to use for testing (from hardhat)
const listOfWallets = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
]

let walletClient: WalletClient | undefined = undefined;
if (PRIVATE_KEY) {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    walletClient = createWalletClient({
        chain: getChainConfig(CHAIN_ENV),
        transport: http(),
        account,
    });
}

// Converts BigInt values to strings for safe JSON serialization
function replacer(key: string, value: any) {
    return typeof value === 'bigint' ? value.toString() : value;
}

/* -------------------------------------------------------------------------- */
/*                              Define Web3 Tools                             */
/* -------------------------------------------------------------------------- */
async function getEthBalance(address: string): Promise<string> {
    try {
        const balance = await client.getBalance({ address: address as `0x${string}` });
        return formatEther(balance);
    } catch (error: any) {
        throw new Error("Error getting balance: " + error.message);
    }
}

async function getTransactionDetails(txHash: string): Promise<string> {
    try {
        const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
        return `Transaction: ${JSON.stringify(tx, replacer, 2)}\nReceipt: ${JSON.stringify(receipt, replacer, 2)}`;
    } catch (error: any) {
        throw new Error("Error getting transaction details: " + error.message);
    }
}

async function getBlockDetails(blockNumberOrHash: string | number): Promise<string> {
    try {
        // Determine if input is a number (block number) or string (hash)
        let block;
        if (typeof blockNumberOrHash === 'number' || !isNaN(Number(blockNumberOrHash))) {
            block = await client.getBlock({ blockNumber: BigInt(blockNumberOrHash) });
        } else {
            block = await client.getBlock({ blockHash: blockNumberOrHash as `0x${string}` });
        }
        return `Block: ${JSON.stringify(block, replacer, 2)}`;
    } catch (error: any) {
        throw new Error("Error getting block details: " + error.message);
    }
}

async function getLatestBlockNumber(): Promise<string> {
    try {
        const blockNumber = await client.getBlockNumber();
        return blockNumber.toString();
    } catch (error: any) {
        throw new Error("Error getting latest block number: " + error.message);
    }
}

async function getCurrentGasPrice(): Promise<string> {
    try {
        const gasPrice = await client.getGasPrice();
        const gasPriceGwei = formatGwei(gasPrice);
        return `${gasPriceGwei} Gwei`;
    } catch (error: any) {
        throw new Error("Error getting current gas price: " + error.message);
    }
}

const erc20Abi = [
    {
        constant: true,
        inputs: [
            {
                name: "_owner",
                type: "address"
            }
        ],
        name: "balanceOf",
        outputs: [
            {
                name: "",
                type: "uint256"
            }
        ],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
            {
                name: "",
                type: "uint8"
            }
        ],
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [
            {
                name: "",
                type: "string"
            }
        ],
        type: "function"
    }
];

async function getTokenBalance(address: string, tokenContract: string): Promise<string> {
    try {
        const decimalsRaw = await client.readContract({
            address: tokenContract as `0x${string}`,
            abi: erc20Abi,
            functionName: 'decimals',
        });
        const decimals = Number(decimalsRaw);
        const balanceRaw = await client.readContract({
            address: tokenContract as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
        });
        const balance = BigInt(balanceRaw as string);
        const symbol = await client.readContract({
            address: tokenContract as `0x${string}`,
            abi: erc20Abi,
            functionName: 'symbol',
        });
        const formatted = (balance / BigInt(10 ** decimals)).toString();
        return `${formatted} ${symbol}`;
    } catch (error: any) {
        throw new Error("Error getting token balance: " + error.message);
    }
}

async function getContractReadMethod(contractAddress: string, abi: any, method: string, args: any[]): Promise<string> {
    try {
        const result = await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: abi,
            functionName: method,
            args: args,
        });
        return `Result: ${JSON.stringify(result, replacer, 2)}`;
    } catch (error: any) {
        throw new Error("Error calling contract method: " + error.message);
    }
}

async function resolveEnsName(ensName: string): Promise<string> {
    try {
        const address = await client.getEnsAddress({ name: normalize(ensName) });
        if (!address) throw new Error("ENS name not found");
        return address;
    } catch (error: any) {
        throw new Error("Error resolving ENS name: " + error.message);
    }
}

async function lookupEnsName(address: string): Promise<string> {
    try {
        const name = await client.getEnsName({ address: address as `0x${string}` });
        if (!name) throw new Error("No ENS name found for this address");
        return name;
    } catch (error: any) {
        throw new Error("Error looking up ENS name: " + error.message);
    }
}

/* -------------------------------------------------------------------------- */
/*                           Add tools to the server                          */
/* -------------------------------------------------------------------------- */
server.tool('getEthBalance', 'Get the balance of an Ethereum address', 
    {
        address: z.string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
        .refine(addr => addr !== "0x0000000000000000000000000000000000000000", {
            message: "Zero address is not allowed"
        })
        .describe("The address to get the balance of"),
    },
    async ({ address }) => {
        try {
            const balance = await getEthBalance(address);
            return {
                content: [{
                type: "text",
                    text: balance.toString()
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('getTransactionDetails', 'Get details of a transaction by its hash',
    {
        txHash: z.string().describe("The transaction hash to look up"),
    },
    async ({ txHash }) => {
        try {
            const retval = await getTransactionDetails(txHash);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('getBlockDetails', 'Get details of a block by its number or hash',
    {
        blockNumberOrHash: z.string().describe("The block number or block hash to look up"),
    },
    async ({ blockNumberOrHash }) => {
        try {
            const retval = await getBlockDetails(blockNumberOrHash);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('getLatestBlockNumber', 'Get the latest block number',
    {},
    async () => {
        try {
            const retval = await getLatestBlockNumber();
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('getCurrentGasPrice', 'Get the current gas price (in Gwei)',
    {},
    async () => {
        try {
            const retval = await getCurrentGasPrice();
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('getTokenBalance', 'Get the ERC-20 token balance of an address',
    {
        address: z.string()
          .describe("The address to get the token balance of")
          .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
          .refine(addr => addr !== "0x0000000000000000000000000000000000000000", {
            message: "Zero address is not allowed"
          }),
        tokenContract: z.string()
          .describe("The ERC-20 token contract address")
          .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address")
          .refine(addr => addr !== "0x0000000000000000000000000000000000000000", {
            message: "Zero address is not allowed"
          }),
    },
    async ({ address, tokenContract }) => {
        try {
            const retval = await getTokenBalance(address, tokenContract);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('callContractMethod', 'Call a read-only method on a smart contract',
    {
        contractAddress: z.string()
            .describe("The contract address")
            .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address")
            .refine(addr => addr !== "0x0000000000000000000000000000000000000000", {
                message: "Zero address is not allowed"
            }),
        abi: z.string().describe("The contract ABI as a JSON string"),
        method: z.string().describe("The method name to call"),
        args: z.array(z.string()).describe("Arguments for the method as strings (will be parsed)").optional(),
    },
    async ({ contractAddress, abi, method, args }) => {
        try {
            const parsedAbi = JSON.parse(abi);
            const parsedArgs = args ? args.map(arg => {
                try {
                    return JSON.parse(arg);
                } catch {
                    return arg;
                }
            }) : [];
            const retval = await getContractReadMethod(contractAddress, parsedAbi, method, parsedArgs);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('resolveEnsName', 'Resolve an ENS name to an Ethereum address',
    {
        ensName: z.string().describe("The ENS name to resolve (e.g. vitalik.eth)"),
    },
    async ({ ensName }) => {
        try {
            const retval = await resolveEnsName(ensName);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

server.tool('lookupEnsName', 'Lookup the ENS name for an Ethereum address',
    {
        address: z.string()
            .describe("The Ethereum address to lookup the ENS name for")
            .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
            .refine(addr => addr !== "0x0000000000000000000000000000000000000000", {
                message: "Zero address is not allowed"
            }),
    },
    async ({ address }) => {
        try {
            const retval = await lookupEnsName(address);
            return {
                content: [{
                    type: "text",
                    text: retval
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: error.message
                }]
            };
        }
    }
);

/* ----------------------------- Write Functions ---------------------------- */
async function sendEth(to: string, amount: string): Promise<string> {
    if (!walletClient || !walletClient.account) throw new Error('Wallet client not configured. Set PRIVATE_KEY in your .env file.');
    try {
        const hash = await walletClient.sendTransaction({
            chain: getChainConfig(CHAIN_ENV),
            to: to as `0x${string}`,
            value: parseEther(amount),
            account: walletClient.account,
        });
        return `Transaction sent! Hash: ${hash}`;
    } catch (error: any) {
        throw new Error('Error sending ETH: ' + error.message);
    }
}

server.tool('sendEth', 'Send ETH from the configured wallet to an address',
    {
        to: z.string()
            .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
            .refine(addr => addr !== '0x0000000000000000000000000000000000000000', {
                message: 'Zero address is not allowed'
            })
            .describe('Recipient address'),
        amount: z.string()
            .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
                message: 'Amount must be a positive number (in ETH)'
            })
            .describe('Amount of ETH to send (as a string, in ETH)'),
    },
    async ({ to, amount }) => {
        try {
            const result = await sendEth(to, amount);
            return {
                content: [{
                    type: 'text',
                    text: result
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: 'text',
                    text: error.message
                }]
            };
        }
    }
);

// Helper function to get balances for all wallets in listOfWallets
async function getAllWalletsBalances(): Promise<{ [address: string]: string }> {
    const results: { [address: string]: string } = {};
    for (const address of listOfWallets) {
        try {
            results[address] = await getEthBalance(address);
        } catch (error: any) {
            results[address] = `Error: ${error.message}`;
        }
    }
    return results;
}

server.tool('getAllWalletsBalances', 'Get the ETH balance of all addresses in the listOfWallets',
    {},
    async () => {
        try {
            const balances = await getAllWalletsBalances();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(balances, null, 2)
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: 'text',
                    text: error.message
                }]
            };
        }
    }
);

/* -------------------------------------------------------------------------- */
/*                                Main Function                               */
/* -------------------------------------------------------------------------- */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Web3 MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});