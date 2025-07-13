
import { useState, useRef } from 'react';
import './App.css';
import type { Message } from './types';


function formatTimestamp(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState<(Message & { timestamp: string })[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const controllerRef = useRef<AbortController | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const timestamp = formatTimestamp(new Date());
    const userMessage: Message & { timestamp: string } = { role: 'user', content: input, timestamp };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    controllerRef.current = new AbortController();
    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
        signal: controllerRef.current.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message & { timestamp: string } = { role: 'assistant', content: '', timestamp: formatTimestamp(new Date()) };
      setMessages([...newMessages, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage = {
          ...assistantMessage,
          content: assistantMessage.content + chunk
        };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      const err = error as Error & { name?: string };
      if (err.name !== 'AbortError') {
        console.error('Error:', err);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      controllerRef.current = null;
    }
  };


  const handleClear = async () => {
    try {
      await fetch('http://localhost:4000/api/clear', { method: 'POST' });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleStop = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    document.body.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
  };


  return (
    <div className={`app-container ${theme}-theme`}>
      <div className="chat-container">
        <div className="header">
          <h1>AI Chat Assistant</h1>
          <button onClick={toggleTheme} className="clear-button" style={{ marginRight: '1rem' }}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleClear} className="clear-button">
            Clear Chat
          </button>
        </div>

        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.role === 'user' ? 'user-message' : 'assistant-message'
              }`}
            >
              <div className="message-content" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="role">{message.role === 'user' ? 'You' : 'Assistant'}:</span>
                  <span className="timestamp" style={{ fontSize: '0.85em', color: '#8E8EA0', marginLeft: '1em' }}>{message.timestamp}</span>
                </div>
                <p style={{ marginTop: '0.5em' }}>{message.content}</p>
                {message.role === 'assistant' && (
                  <div style={{ marginTop: '1em', textAlign: 'right' }}>
                    <button
                      className="copy-button"
                      style={{ fontSize: '0.9em', padding: '0.3em 0.7em', borderRadius: '4px', border: 'none', background: '#dae3da19', color: 'white', cursor: 'pointer' }}
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      title="Copy response"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <div className="loading">AI is thinking...</div>}
        </div>

        <form onSubmit={handleSend} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </button>
          {isLoading && (
            <button type="button" className="clear-button" onClick={handleStop} style={{ background: '#e57373', color: 'white' }}>
              Stop
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default App
