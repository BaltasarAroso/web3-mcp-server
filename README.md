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

## Integrating MCP Server with Claude and Cursor IDE

Both Claude and Cursor IDE allow you to add custom MCP servers via their settings. The process is nearly identical for both tools:

### Steps to Add MCP Server

1. **Build your MCP server:**
   ```bash
   npm run build
   ```
   This compiles the server to the `server/build` directory.

2. **Open the settings in your tool:**
   - **Cursor IDE:** Go to `Settings` > `MCP`.
   - **Claude (Desktop):** Go to `Settings` > `Developer` > `Edit Config`.

3. **Add a new global MCP server:**
   - You can do this via the UI or by editing the JSON config file directly.
   - Example JSON config:
     ```json
     {
       "mcpServers": {
         "web3-tools": {
           "command": "node",
           "args": ["$GITHUB_REPO/server/build/index.js"]
         }
       }
     }
     ```
     Replace `$GITHUB_REPO` with the path to your local repository directory.

4. **Save the config and restart/reload the tool if needed.**

5. **To update tools:**
   - Always run `npm run build` after making changes to your server code.
   - You may need to manually refresh the tool or restart the MCP server for changes to take effect.

*Note: The UI and config file locations may change as these tools evolve. Refer to their documentation for the latest details.*

## Next Steps
- [x] Add write (transaction) support for testnet/local
- [x] Ensure comprehensive demonstration via unit and integration (e2e) tests using Vitest (`npm test` runs all tests)
- [ ] Refactor code into modules for maintainability
- [ ] Add basic rate limiting or warning about RPC usage