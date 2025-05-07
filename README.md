# Web3 MCP Server

This project implements a Model Context Protocol (MCP) server that interacts with Ethereum networks using the [viem](https://viem.sh/) library. It supports querying balances, transactions, blocks, ENS, and more.

## Project Structure
- **server/**: Main focus. Contains the MCP server implementation and all core logic. So the commands and instructions below will assume its directory: `cd server`.
- **client/**: Used for testing the MCP server. You can use this folder to run test scripts or interact with the server during development. To run the client run: `cd client; npm i && npm start`

## Features
- Get ETH and ERC-20 token balances
- Query transaction and block details
- ENS name resolution and reverse lookup
- Call read-only contract methods
- Supports mainnet, Goerli, Sepolia, and local (Hardhat) networks

## Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create a `.env` file** (optional, for environment variables):
   ```env
   CHAIN_ENV=mainnet # or goerli, sepolia, local
   ```
   - If not set, defaults to `mainnet`.
   - For `local`, ensure a node is running at `http://127.0.0.1:8545`.

## Running the Server

```bash
npm start
```

## Switching Networks
Set the `CHAIN_ENV` environment variable to one of:
- `mainnet`
- `goerli`
- `sepolia`
- `local`

Example:
```bash
CHAIN_ENV=goerli npm start
```

## Testing the MCP Server
You can test the MCP server using the [`mcp-cli`](https://github.com/wong2/mcp-cli) tool:

```bash
npx @wong2/mcp-cli npm start
```

This allows you to list tools, call them, and inspect the server's capabilities interactively.

## Next Steps
- [x] Add write (transaction) support for testnet/local
- [ ] Provide a demonstration script or notebook
- [ ] Refactor code into modules for maintainability
- [ ] Add tests and more documentation
- [ ] Add basic rate limiting or warning about RPC usage