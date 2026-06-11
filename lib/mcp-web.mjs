import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { Tools } from "./tools/allTools.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ioBrokerAdapterApi } from "./api_adapter.mjs";
import * as utils from "@iobroker/adapter-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)).toString());
/* function log(msg){
appendFileSync( '/home/holger/errorlog', msg + '\n')
} */
const server = new McpServer({
	name: "iobroker-mcp-server",
	version: pkg.version,
	capabilities: {
		logging: {},
		resources: {},
		tools: {},
	},
});
class MCP_Web_Server {
	constructor(server, webSettings, adapter, instanceSettings, app) {
		this.server = server;
		this.webSettings = webSettings;
		this.adapter = adapter;
		this.instanceSettings = instanceSettings;
		this.app = app;
		this.readyCallback = null;
		this.init();
	}
	async handleRequest(req, res) {
		console.log("Received MCP request");
		try {
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});
			res.on("close", () => {
				console.log("Request closed");
				transport.close();
				server.close();
			});
			await server.connect(transport);
			await transport.handleRequest(req, res, req.body);
		} catch (error) {
			console.log("Error handling MCP request:", error);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: "Internal server error",
					},
					id: null,
				});
			}
		}
	}
	async methodNotAllowed(req, res) {
		console.log("Method not allowed:", req.method);
		res.writeHead(405).end(
			JSON.stringify({
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message: "Method not allowed: " + req.method,
				},
				id: null,
			}),
		);
	}
	init() {
		const splitedId = this.instanceSettings._id.split(".");
		const base = `/${splitedId[2]}/${splitedId[3]}/`;
		this.adapter.subscribeForeignObjects("*");
		this.API = new ioBrokerAdapterApi({
			adapter: this.adapter,
			namespace: this.adapter.namespace,
			geminiApiKey: this.instanceSettings.geminiApiKey,
			embeddingModel: this.instanceSettings.embeddingModel,
			dbPath: utils.getAbsoluteInstanceDataDir(this.adapter) + "/vectraIndex",
		});
		this.Tools = Tools;
		for (const toolName in this.Tools) {
			const tool = this.Tools[toolName];
			server.tool(tool.name, tool.desc, tool.params, tool.call(this.API));
		}
		const router = express.Router();
		router.use(express.static(path.join(__dirname, "public")));
		router.post("/mcp", this.handleRequest);
		router.post("/message", this.handleRequest);
		router.post("/tool", this.handleRequest);
		router.post("/sse", this.handleRequest);
		router.get("/mcp", this.methodNotAllowed);
		router.delete("/mcp", this.methodNotAllowed);
		this.app.use(base, router);
	}
}

export { MCP_Web_Server };
