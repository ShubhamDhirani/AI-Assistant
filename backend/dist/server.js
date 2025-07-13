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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ollama_service_1 = require("./ollama-service");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Chat history
let chatHistory = [];
// Routes
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messages } = req.body;
        chatHistory = messages;
        const response = yield (0, ollama_service_1.sendToOllama)(messages);
        // Simulate streaming by sending characters one by one
        const delay = 20; // milliseconds between each character
        for (let i = 0; i < response.length; i++) {
            res.write(response[i]);
            yield new Promise(resolve => setTimeout(resolve, delay));
        }
        res.end();
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/clear', (_req, res) => {
    chatHistory = [];
    res.json({ message: 'Chat history cleared' });
});
app.get('/api/history', (_req, res) => {
    res.json({ messages: chatHistory });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
