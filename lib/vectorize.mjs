import { GoogleGenAI } from "@google/genai";
import { LocalIndex } from "vectra";
import { join } from "node:path";
import { homedir } from "node:os";
const dbPath = join(homedir(), ".iobroker-mcp-server", "/vectraIndex");

export class VectorDB {
	constructor(options) {
		console.log(options.dbPath || dbPath);
		this.options = options || {};
		this.ai = new GoogleGenAI({ apiKey: options.apiKey });
		this.dimensionality = options.dimensionality || 768;
		this.modelName = options.modelName || "gemini-embedding-exp-03-07";
		this.index = new LocalIndex(options.dbPath || dbPath);
		this.ai = new GoogleGenAI({ apiKey: options.apiKey });
	}
	model(retrievOrSet, text) {
		return {
			model: "gemini-embedding-exp-03-07",
			contents: text,
			config: {
				taskType: retrievOrSet === "set" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY",
				outputDimensionality: this.dimensionality,
			},
		};
	}
	async get_index_vectors(text) {
		return await this.ai.models.embedContent(this.model("set", text));
	}
	async get_retrive_vectors(text) {
		return await this.ai.models.embedContent(this.model("get", text));
	}
	async init() {
		if (!(await this.index.isIndexCreated())) {
			await this.index.createIndex();
		}
	}
	async write(id, txt, metadata) {
		const vectors = await this.get_index_vectors(txt);
		if (!vectors || !vectors.embeddings || !vectors.embeddings.length) {
			throw new Error("Failed to generate embeddings for the provided text.");
		} else {
			return await this.index.upsertItem({
				id: id,
				vector: vectors.embeddings[0].values,
				metadata: metadata,
			});
		}
	}
	async find(txt, filter = {}, limit = 10) {
		let vectors = await this.get_retrive_vectors(txt);
		if (!vectors || !vectors.embeddings || !vectors.embeddings.length || !vectors.embeddings[0].values) {
			throw new Error("Failed to generate embeddings for the provided text.");
		}
		return await this.index.queryItems(vectors.embeddings[0].values, JSON.stringify(filter), limit);
	}
	async deleteItem(id) {
		return await this.index.deleteItem(id);
	}
}

/*
Example metadata:
const metadata = {
  type: "enum",
  name: "A Name",
  common: {
    role: "admin",
    credits: 20,
    group: "admin"
  }
};

// 1. Match type and role
const filter1 = {
  type: "enum",
  common: { role: "admin" }
};
// Returns true

// 2. Credits greater than or equal to 10
const filter2 = {
  common: { credits: { $gte: 10 } }
};
// Returns true

// 3. Name is not "Other Name"
const filter3 = {
  name: { $ne: "Other Name" }
};
// Returns true

// 4. Group is in a list
const filter4 = {
  common: { group: { $in: ["admin", "user"] } }
};
// Returns true

// 5. Combine with $and
const filter5 = {
  $and: [
    { type: "enum" },
    { common: { credits: { $gt: 10 } } }
  ]
};
// Returns true

// 6. Combine with $or
const filter6 = {
  $or: [
    { type: "device" },
    { common: { role: "admin" } }
  ]
};
// Returns true
*/
