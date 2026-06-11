import { GoogleGenAI } from "@google/genai";
import * as utils from "@iobroker/adapter-core";
// Load your modules here, e.g.:
// import fs from "node:fs";
class McpServer extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "mcp-server",
		});
		this.on("ready", this.onReady.bind(this));

		this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	async onReady() {}

	onUnload(callback) {
		try {
			callback();
		} catch (e) {
			callback();
		}
	}

	//If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	/**
	 * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	 * Using this method requires "common.messagebox" property to be set to true in io-package.json
	 * @param {ioBroker.Message} obj
	 */
	/**
	 * Helper function to fetch and process models (avoids code duplication)
	 * @param {string} apiKey The API key to use
	 * @returns {Promise<Array<{value: string, label: string}>>}
	 */
	async fetchAndFilterGeminiModels(apiKey, modelType) {
		const models = [{ label: "Enter API Key & click Refresh", value: "" }];
		this.genAI = new GoogleGenAI({ apiKey: apiKey });
		const modelsPager = await this.genAI.models.list();

		for await (const m of modelsPager) {
			if (m.supportedActions && m.supportedActions.includes(modelType)) {
				models.push({ value: m.name || "", label: m.displayName || m.name || "none" });
			}
		}
		return models;
	}

	async onMessage(obj) {
		const apiKey = obj.message?.apiKey || this.config.apiKey;
		try {
			let models = [{ label: "Enter API Key & Save", value: "" }];
			switch (obj.command) {
				case "getGeminiModels": {
					if (!apiKey) return;
					models = await this.fetchAndFilterGeminiModels(apiKey, "generateContent");
					break;
				}
				default:
					this.log.warn(`[onMessage] Unhandled command: ${obj.command}`);
					break;
			}
			this.sendTo(obj.from, obj.command, models, obj.callback);
		} catch (e) {
			this.log.error(`[onMessage] Error during command processing: ${e.message}`);
			this.sendTo(obj.from, obj.command, [{ label: `Error: ${e.message}`, value: "" }], obj.callback);
		}
	}
}

export default (options) => new McpServer(options);
export { McpServer };
