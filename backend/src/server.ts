import express, { Request, Response } from 'express';
import cors from 'cors';
import { Message, ChatRequest } from './types';
import { sendToOllama } from './ollama-service';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Chat history
let chatHistory: Message[] = [];

// Routes
app.post('/api/chat', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  try {
    const { messages } = req.body;
    chatHistory = messages;
    const response = await sendToOllama(messages);
    
    // Simulate streaming by sending characters one by one
    const delay = 20; // milliseconds between each character
    for (let i = 0; i < response.length; i++) {
      res.write(response[i]);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clear', (_req: Request, res: Response) => {
  chatHistory = [];
  res.json({ message: 'Chat history cleared' });
});

app.get('/api/history', (_req: Request, res: Response) => {
  res.json({ messages: chatHistory });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
