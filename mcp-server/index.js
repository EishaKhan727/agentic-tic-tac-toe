import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const server = new Server(
  {
    name: "tic-tac-toe-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_game_architecture",
        description: "Returns an overview of the application architecture, component hierarchy, and where state is stored.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "explain_win_logic",
        description: "Inspects and explains the win check algorithm and winning combination matrices.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_discovery_findings",
        description: "Reads the system discovery report and returns high-priority codebase risks and dead code.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === "get_game_architecture") {
    return {
      content: [
        {
          type: "text",
          text: `App Architecture Summary:
- Framework: React (bootstrapped with Vite)
- State Storage: Board state (9-element array) and turn state ('X' | 'O') are managed inside src/Board.jsx (or App.jsx) via React useState.
- UI Rendering: Renders a 3x3 grid using standard button/div elements.
- Status & Controls: Turn indicators, winner/draw status banner, and restart button resetting board state to initial blank array.`,
        },
      ],
    };
  }

  if (name === "explain_win_logic") {
    return {
      content: [
        {
          type: "text",
          text: `Win Logic Algorithm:
- Checks 8 pre-defined winning triplet indices:
  * Rows: [0, 1, 2], [3, 4, 5], [6, 7, 8]
  * Columns: [0, 3, 6], [1, 4, 7], [2, 5, 8]
  * Diagonals: [0, 4, 8], [2, 4, 6]
- Evaluates after every valid move. If any triplet matches and is non-null, the current symbol is declared the winner and further cell clicks are disabled.
- If all 9 indices are non-null with no matching triplet, a draw state is triggered.`,
        },
      ],
    };
  }

  if (name === "get_discovery_findings") {
    try {
      const reportPath = path.join(projectRoot, "DISCOVERY_REPORT.md");
      const content = fs.readFileSync(reportPath, "utf-8");
      return { content: [{ type: "text", text: content }] };
    } catch {
      return { content: [{ type: "text", text: "DISCOVERY_REPORT.md not found in repository root." }] };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
