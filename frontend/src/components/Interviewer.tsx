import React, { useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';

export const Interviewer: React.FC = () => {
    const [agentId, setAgentId] = useState(import.meta.env.VITE_ELEVENLABS_AGENT_ID || '');
    const [error, setError] = useState<string | null>(null);
    const [fragments, setFragments] = useState<any[]>([]);

    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setError(null);
        },
        onDisconnect: () => console.log("Disconnected from ElevenLabs"),
        onMessage: (message) => console.log("Message:", message),
        onError: (err) => {
            console.error("Error:", err);
            setError(typeof err === 'string' ? err : (err as any)?.message || 'Unknown error');
        },
    });

    // Poll for memories during session
    useEffect(() => {
        let interval: any;
        if (conversation.status === 'connected') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:8000/memories');
                    if (res.ok) {
                        const data = await res.json();
                        setFragments(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch memories", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [conversation.status]);

    const startConversation = async () => {
        setError(null);
        if (!agentId) {
            alert('Please provide an Agent ID');
            return;
        }
        try {
            await conversation.startSession({
                agentId: agentId as string,
            });
        } catch (err: any) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please grant permission in settings.');
            } else {
                setError(err.message || 'Failed to start session');
            }
        }
    };

    const stopConversation = async () => {
        await conversation.endSession();
    };

    const status = conversation.status;
    const isConnected = status === 'connected';
    const isSpeaking = conversation.isSpeaking;

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full mx-auto p-4">
            {/* Main Interviewer Card */}
            <div className="premium-card p-10 md:p-16 flex flex-col items-center space-y-12 flex-1">
                {/* Visual Voice Feedback */}
                <div className="relative">
                    {isConnected && (
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-voice-pulse scale-150" />
                    )}
                    <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 z-10 relative 
                        ${isConnected ? 'bg-blue-600 shadow-2xl scale-110' : 'bg-slate-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className={`h-24 w-24 transition-colors duration-500 ${isConnected ? 'text-white' : 'text-slate-400'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                </div>

                <div className="text-center space-y-6">
                    <h2 className="text-4xl font-bold text-slate-900">
                        {isConnected ? 'I am listening' : 'Ready to talk?'}
                    </h2>
                    <p className="text-2xl text-slate-500 font-medium leading-relaxed">
                        {isConnected
                            ? (isSpeaking ? 'Agent is speaking...' : 'It is your turn to speak.')
                            : 'Tap the button below whenever you are ready to share a memory.'}
                    </p>
                </div>

                <div className="w-full pt-4">
                    {!import.meta.env.VITE_ELEVENLABS_AGENT_ID && (
                        <input
                            type="text"
                            placeholder="Paste Agent ID here"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="w-full mb-8 px-6 py-4 border-2 border-slate-100 rounded-2xl text-xl focus:border-blue-500 outline-none transition-all"
                        />
                    )}

                    <button
                        onClick={isConnected ? stopConversation : startConversation}
                        className={`senior-button w-full shadow-2xl shadow-blue-500/20 
                            ${isConnected
                                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isConnected ? 'End Session' : 'Start Session'}
                    </button>

                    {!isConnected && (
                        <button
                            onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).catch(console.error)}
                            className="w-full text-center mt-6 text-lg text-blue-600 font-bold hover:underline"
                        >
                            Check Microphone
                        </button>
                    )}
                </div>

                {error && (
                    <div className="text-xl font-medium text-center text-rose-600 mt-6 p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
                        {error}
                    </div>
                )}

                <div className="text-sm font-bold tracking-widest uppercase text-slate-300">
                    Connection: {status}
                </div>
            </div>

            {/* Story Map / Memories Sidebar */}
            <div className={`premium-card p-8 w-full lg:w-80 flex flex-col transition-all duration-500 
                ${isConnected || fragments.length > 0 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                    Captured Memories
                </h3>
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                    {fragments.length === 0 ? (
                        <p className="text-slate-400 italic">No memories captured yet...</p>
                    ) : (
                        fragments.map((frag, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-right duration-300">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">{frag.category}</span>
                                <p className="text-slate-900 font-medium leading-snug mt-1">{frag.content}</p>
                                {frag.context && <p className="text-xs text-slate-400 mt-2 italic">{frag.context}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
