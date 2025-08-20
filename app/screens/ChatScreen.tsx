

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Send, Loader, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatResponseStream } from '../services/geminiService';
import useProfileStore from '../store/profileStore';
import { useTranslation } from '../hooks/useTranslation';

interface Message {
    role: 'user' | 'model';
    text: string;
}

// Configuration for token limit
const TOKEN_LIMIT = 5500;
const CHARS_PER_TOKEN = 4; // A common approximation
const CHARACTER_LIMIT = TOKEN_LIMIT * CHARS_PER_TOKEN;

const ChatScreen = (): React.ReactNode => {
    const navigate = useNavigate();
    const location = useLocation();
    const profile = useProfileStore((state) => state.profile);
    const { t, language } = useTranslation();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // Use `any` for SpeechRecognition to avoid webkit prefix issues

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (profile?.name && messages.length === 0) {
            setMessages([{role: 'model', text: t('chatInitialGreeting', { name: profile.name })}])
        }
    }, [profile?.name, t, messages.length]);

    // --- Speech Recognition Setup ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = language;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognitionRef.current = recognition;
    }, [language]);
    
    // --- Auto-start voice input from HomeScreen ---
    useEffect(() => {
        if (location.state?.startVoice) {
            // Clear the state to prevent re-triggering on refresh or navigation
            navigate('.', { replace: true, state: {} });
            
            // Short delay to ensure UI is ready and user perceives the transition
            setTimeout(() => {
                handleMicClick();
            }, 300);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);


    const handleMicClick = () => {
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInput(''); // Clear input before starting
            recognitionRef.current.start();
        }
    };


    const handleSend = async () => {
        if (input.trim() === '' || !profile) return;

        const newUserMessage: Message = { role: 'user', text: input };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        // Truncate history based on token limit
        let charCount = 0;
        const truncatedHistory: Message[] = [];
        // Iterate backwards from the latest message
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
            const message = updatedMessages[i];
            const messageLength = message.text.length;
            if (charCount + messageLength <= CHARACTER_LIMIT) {
                truncatedHistory.unshift(message); // Add to the beginning to maintain order
                charCount += messageLength;
            } else {
                // Stop adding messages once the limit is reached
                break;
            }
        }

        const chatHistory = truncatedHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        try {
            const stream = await getChatResponseStream(chatHistory, input, profile);
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'model', text: t('chatError') }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="flex items-center p-4 border-b border-surface-light sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-light mr-4">
                    <ChevronLeft />
                </button>
                <h1 className="text-xl font-bold">{t('chatTitle')}</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-3xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-surface-light text-text rounded-bl-lg'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && messages[messages.length - 1].role === 'user' && (
                     <motion.div layout className="flex justify-start">
                         <div className="bg-surface-light text-text px-4 py-3 rounded-3xl rounded-bl-lg">
                             <Loader className="animate-spin w-5 h-5"/>
                         </div>
                     </motion.div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-surface-light sticky bottom-0 bg-background/80 backdrop-blur-md">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && input.trim() !== '' && handleSend()}
                        placeholder={isListening ? t('listeningPlaceholder') : t('chatPlaceholder')}
                        className="flex-1 w-full pl-6 pr-6 py-3 text-lg bg-surface rounded-full focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary"
                        disabled={isLoading || isListening}
                    />
                    {input.trim() === '' && !isListening ? (
                         <button onClick={handleMicClick} disabled={isLoading} className="bg-primary p-3 rounded-full text-white">
                             <Mic className="w-6 h-6" />
                         </button>
                    ) : (
                         <button onClick={handleSend} disabled={isLoading || isListening || input.trim() === ''} className={`p-3 rounded-full text-white ${isListening ? 'bg-error animate-pulse' : 'bg-primary'} disabled:opacity-50`}>
                             {isListening ? <Mic className="w-6 h-6" /> : (isLoading ? <Loader className="animate-spin w-6 h-6"/> : <Send className="w-6 h-6" />)}
                         </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ChatScreen;