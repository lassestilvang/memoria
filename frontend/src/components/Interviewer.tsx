import React, { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';

interface Fragment {
    id: number | null;
    category: string;
    content: string;
    context: string;
}

export const Interviewer: React.FC = () => {
    const [agentId, setAgentId] = useState(import.meta.env.VITE_ELEVENLABS_AGENT_ID || '');
    const [error, setError] = useState<string | null>(null);
    const [fragments, setFragments] = useState<Fragment[]>([]);
    const [showSummary, setShowSummary] = useState(false);
    const [era, setEra] = useState<'modern' | 'vintage' | 'sepia'>('modern');
    const [seed, setSeed] = useState('');

    const eraThemes = {
        modern: 'bg-slate-50',
        vintage: 'bg-amber-50/30 sepia-25',
        sepia: 'bg-stone-100 sepia-50'
    };

    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setError(null);
        },
        onDisconnect: () => {
            console.log("Disconnected from ElevenLabs");
            setShowSummary(true);
        },
        onMessage: (message: { message: string }) => console.log("Message:", message),
        onError: (err: unknown) => {
            console.error("Error:", err);
            setError(typeof err === 'string' ? err : (err as { message?: string })?.message || 'Unknown error');
        },
    });

    const fetchMemories = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8000/memories');
            if (res.ok) {
                const data = await res.json();
                setFragments(data.fragments || []);
                if (data.era) setEra(data.era);
            }
        } catch (err) {
            console.error("Failed to fetch memories", err);
        }
    }, []);

    // Poll for memories during session
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (conversation.status === 'connected') {
            interval = setInterval(fetchMemories, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [conversation.status, fetchMemories]);

    const startConversation = async () => {
        setError(null);
        setShowSummary(false);
        if (!agentId) {
            alert('Please provide an Agent ID');
            return;
        }
        try {
            await conversation.startSession({
                agentId: agentId as string,
                connectionType: 'webrtc',
            });
        } catch (err: unknown) {
            console.error(err);
            const error = err as { name?: string; message?: string };
            if (error.name === 'NotAllowedError') {
                setError('Microphone access denied. Please grant permission in settings.');
            } else {
                setError(error.message || 'Failed to start session');
            }
        }
    };

    const stopConversation = async () => {
        await conversation.endSession();
    };

    const handleAddSeed = async () => {
        if (!seed.trim()) return;
        try {
            const res = await fetch('http://localhost:8000/seeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: seed })
            });
            if (res.ok) {
                setSeed('');
                alert("Story seed added! The AI will try to bring it up.");
            }
        } catch (err) {
            console.error("Failed to add seed", err);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('http://localhost:8000/export?user_name=Lasse');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Memoir_Lasse_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to generate export");
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("Export service not reachable");
        }
    };

    const status = conversation.status;
    const isConnected = status === 'connected';
    const isSpeaking = conversation.isSpeaking;

    // Determine era theme
    const currentTheme = eraThemes[era];

    return (
        <div className={`flex flex-col lg:flex-row gap-8 max-w-6xl w-full mx-auto p-4 relative min-h-screen transition-colors duration-1000 ${currentTheme}`}>
            {/* Main Interviewer Card */}
            <div className={`premium-card p-10 md:p-16 flex flex-col items-center space-y-12 flex-1 transition-all duration-500 
                ${showSummary ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>

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
                    <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-md">
                        {isConnected
                            ? (isSpeaking ? 'Agent is speaking...' : 'It is your turn to speak.')
                            : 'Tap the button below whenever you are ready to share a memory.'}
                    </p>
                </div>

                <div className="w-full pt-4 space-y-4">
                    {!import.meta.env.VITE_ELEVENLABS_AGENT_ID && (
                        <input
                            type="text"
                            placeholder="Paste Agent ID here"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="w-full mb-4 px-6 py-4 border-2 border-slate-100 rounded-2xl text-xl focus:border-blue-500 outline-none transition-all"
                        />
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={isConnected ? stopConversation : startConversation}
                            className={`senior-button flex-[2] shadow-2xl shadow-blue-500/20 
                                ${isConnected
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isConnected ? 'End Session' : 'Start Session'}
                        </button>

                        <label className={`senior-button flex-1 bg-white border-4 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 cursor-pointer flex items-center justify-center transition-all 
                            ${isConnected ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                            const base64 = (reader.result as string).split(',')[1];
                                            try {
                                                await fetch('http://localhost:8000/vision-context', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ image: base64 })
                                                });
                                                fetchMemories();
                                            } catch (err) {
                                                console.error("Vision upload failed", err);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="text-xl font-medium text-center text-rose-600 mt-6 p-6 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
                        {error}
                    </div>
                )}

                <div className="w-full space-y-4 pt-6 mt-6 border-t border-slate-100">
                    <p className="text-slate-400 font-bold text-center uppercase tracking-widest text-xs">Family Guidance</p>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            placeholder="Add a topic (e.g. 'Ask about the 1968 town dance')"
                            className="flex-1 p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-lg placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleAddSeed}
                            className="px-8 bg-blue-100 text-blue-600 rounded-2xl font-black hover:bg-blue-200 transition-colors uppercase tracking-tight text-sm"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="text-sm font-bold tracking-widest uppercase text-slate-300">
                    Connection: {status}
                </div>
            </div>

            {/* Story Map / Memories Sidebar */}
            <div className={`premium-card p-8 w-full lg:w-96 flex flex-col transition-all duration-500 
                ${isConnected || fragments.length > 0 ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                        <span className="w-3 h-3 bg-blue-600 rounded-full mr-3 animate-pulse" />
                        Live Captures
                    </h3>
                    <button
                        onClick={handleExport}
                        className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors text-blue-600"
                        title="Export Memoir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {fragments.length === 0 ? (
                        <p className="text-xl text-slate-400 italic text-center mt-20">No memories captured yet...</p>
                    ) : (
                        fragments.map((frag, i) => (
                            <div key={i} className={`group p-6 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 transition-all duration-300 shadow-sm
                                ${frag.category === 'Visual Memory' ? 'border-l-4 border-l-purple-500' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{frag.category}</span>
                                    {frag.category === 'Visual Memory' && <span className="text-lg">📸</span>}
                                </div>
                                <p className="text-xl text-slate-900 font-bold leading-tight mt-2">{frag.content}</p>
                                {frag.context && <p className="text-sm text-slate-400 mt-3 italic leading-relaxed">{frag.context}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Session Summary Modal */}
            {showSummary && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 p-6">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 p-12 text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto scale-125 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-slate-900">Wonderful stories!</h2>
                            <p className="text-2xl text-slate-500 font-medium">We've safely stored {fragments.length} new treasures in your digital heirloom.</p>
                        </div>
                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={startConversation}
                                className="senior-button flex-1 bg-blue-600 text-white"
                            >
                                Start New Session
                            </button>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="senior-button flex-1 bg-slate-100 text-slate-600 border-none"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
