import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SparklesIcon, ArrowUpCircleIcon } from './icons';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AiChatPanel: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [apiKeyExists, setApiKeyExists] = useState(true);

    useEffect(() => {
        if (!process.env.API_KEY) {
            setError('API key is not configured. Please set the API_KEY environment variable.');
            setApiKeyExists(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatRef.current = ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: "You are a helpful AI assistant integrated into a futuristic workspace application called 'BWS: Bookmark Work Space'. Be concise and helpful. Format your responses using markdown where appropriate.",
              },
            });
            // Initial message from AI
            setMessages([{ role: 'model', text: 'Hello! How can I help you today in your workspace?' }]);
        } catch (e: any) {
            setError(`Failed to initialize AI: ${e.message}`);
        }
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chat container when new messages are added
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isLoading || !input.trim()) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        // Add a placeholder for the model's response
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        try {
            if (!chatRef.current) {
                throw new Error("Chat session not initialized.");
            }
            const stream = await chatRef.current.sendMessageStream({ message: input });

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'model') {
                        return [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + chunkText }];
                    }
                    return prev;
                });
            }

        } catch (e: any) {
            const errorMessage = `Error communicating with AI: ${e.message}`;
            setError(errorMessage);
            // Remove the model's placeholder message on error
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === 'model' && lastMessage.text === '') {
                    return prev.slice(0, -1);
                }
                return prev;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-full w-full flex flex-col gap-4 text-sm animate-fade-in-fast">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-500/50">
                                <SparklesIcon className="w-5 h-5 text-cyan-300"/>
                            </div>
                        )}
                        <div className={`p-3 rounded-lg max-w-xs md:max-w-md break-words ${msg.role === 'user' ? 'bg-fuchsia-900/50 text-fuchsia-200' : 'bg-gray-800/60 text-gray-200'}`}>
                           {msg.text ? <pre className="text-sm whitespace-pre-wrap font-mono">{msg.text}</pre> : (
                                <div className="flex items-center justify-center h-5">
                                    <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse mx-1" style={{animationDelay: '0s'}}></div>
                                    <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse mx-1" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse mx-1" style={{animationDelay: '0.4s'}}></div>
                                </div>
                           )}
                        </div>
                    </div>
                ))}
            </div>
            
            {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
            
            <form onSubmit={handleSubmit} className="flex-shrink-0 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI..."
                    disabled={isLoading || !apiKeyExists}
                    className="flex-grow p-2 bg-gray-900/70 border border-fuchsia-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 disabled:opacity-50"
                />
                <button type="submit" disabled={isLoading || !input.trim() || !apiKeyExists} className="p-2 bg-fuchsia-900/50 hover:bg-fuchsia-500/70 border border-fuchsia-500 rounded-md transition-all text-fuchsia-300 hover:text-white hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.8)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10">
                    {isLoading ? <Spinner /> : <ArrowUpCircleIcon className="w-6 h-6" />}
                </button>
            </form>
        </div>
    );
}

export default AiChatPanel;
