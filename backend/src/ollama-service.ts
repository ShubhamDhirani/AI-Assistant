import fetch, { Response } from 'node-fetch';
import { Readable } from 'stream';
import { Message } from './types.js';
import { OLLAMA_API_URL, MODEL, SYSTEM_PROMPT } from './config';

export async function sendToOllama(messages: Message[]): Promise<string> {
  const context = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Previous conversation:\n${context}\n\nAssistant: `;
  
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt,
      system: SYSTEM_PROMPT,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split('\n').filter(Boolean);
  let fullResponse = '';
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      if (data.response) {
        fullResponse += data.response;
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  }
  
  return fullResponse;
}
