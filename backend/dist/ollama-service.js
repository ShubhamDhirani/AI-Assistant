"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToOllama = sendToOllama;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("./config");
function sendToOllama(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const prompt = `Previous conversation:\n${context}\n\nAssistant: `;
        const response = yield (0, node_fetch_1.default)(config_1.OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config_1.MODEL,
                prompt: prompt,
                system: config_1.SYSTEM_PROMPT,
                stream: true
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const text = yield response.text();
        const lines = text.split('\n').filter(Boolean);
        let fullResponse = '';
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.response) {
                    fullResponse += data.response;
                }
            }
            catch (e) {
                console.error('Error parsing JSON:', e);
            }
        }
        return fullResponse;
    });
}
