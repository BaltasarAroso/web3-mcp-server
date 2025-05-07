import { Anthropic } from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import { MessageParam, Tool } from "@anthropic-ai/sdk/resources/index.mjs";

dotenv.config();

const DEFAULT_SERVER_PATH = "../server/src/index.ts";
const DEFAULT_MODEL = "claude-3-5-sonnet-latest";
const DEFAULT_MAX_TOKENS = 1000;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }


    /* -------------------------------------------------------------------------- */
    /*                        Server Connection Management                        */
    /* -------------------------------------------------------------------------- */
    async connectToServer(serverScriptPath: string) {
        try {
        const isJs = serverScriptPath.endsWith(".js");
        const isTs = serverScriptPath.endsWith(".ts");
        const isPy = serverScriptPath.endsWith(".py");
        if (!isJs && !isTs && !isPy) {
            throw new Error("Server script must be a .js or .ts or .py file");
        }
        const command = isPy
            ? process.platform === "win32"
            ? "python"
            : "python3"
            : isTs
            ? "ts-node"
            : "node";
    
        this.transport = new StdioClientTransport({
            command,
            args: [serverScriptPath],
        });
        this.mcp.connect(this.transport);
    
        const toolsResult = await this.mcp.listTools();
        this.tools = toolsResult.tools.map((tool) => {
            return {
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
            };
        });
        console.log(
            "Connected to server with tools:",
            this.tools.map(({ name }) => name)
        );
        } catch (e) {
        console.log("Failed to connect to MCP server: ", e);
        throw e;
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                           Query Processing Logic                           */
    /* -------------------------------------------------------------------------- */
    async processQuery(query: string) {
        const messages: MessageParam[] = [
        {
            role: "user",
            content: query,
        },
        ];
    
        const response = await this.anthropic.messages.create({
            model: DEFAULT_MODEL,
            max_tokens: DEFAULT_MAX_TOKENS,
            messages,
            tools: this.tools,
        });
    
        const finalText = [];
        const toolResults = [];
    
        for (const content of response.content) {
        if (content.type === "text") {
            finalText.push(content.text);
        } else if (content.type === "tool_use") {
            const toolName = content.name;
            const toolArgs = content.input as { [x: string]: unknown } | undefined;
    
            const result = await this.mcp.callTool({
                name: toolName,
                arguments: toolArgs,
            });
            toolResults.push(result);
            finalText.push(
                `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
            );
    
            messages.push({
                role: "user",
                content: result.content as string,
            });
    
            const response = await this.anthropic.messages.create({
                model: DEFAULT_MODEL,
                max_tokens: DEFAULT_MAX_TOKENS,
                messages,
            });
    
            finalText.push(
                response.content[0].type === "text" ? response.content[0].text : ""
            );
        }
        }
    
        return finalText.join("\n");
    }

    /* -------------------------------------------------------------------------- */
    /*                         Interactive Chat Interface                         */
    /* -------------------------------------------------------------------------- */

    async chatLoop() {
        const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        });
    
        try {
        console.log("\nMCP Client Started!");
        console.log("Type your queries or 'quit' to exit.");
    
        while (true) {
            const message = await rl.question("\nQuery: ");
            if (message.toLowerCase() === "quit") {
            break;
            }
            const response = await this.processQuery(message);
            console.log("\n" + response);
        }
        } finally {
        rl.close();
        }
    }
    
    async cleanup() {
        await this.mcp.close();
    }

}

async function main() {
    const mcpClient = new MCPClient();
    try {
      await mcpClient.connectToServer(DEFAULT_SERVER_PATH);
      await mcpClient.chatLoop();
    } finally {
      await mcpClient.cleanup();
      process.exit(0);
    }
}
  
main();