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
        modern: '',
        vintage: 'bg-gold/5 backdrop-sepia-[0.3]',
        sepia: 'bg-gold/[0.02] backdrop-sepia-[0.5]'
    };

    const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                chunksRef.current = [];
                const formData = new FormData();
                formData.append('file', blob);
                try {
                    const res = await fetch('http://localhost:8000/upload-audio', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    console.log("Audio uploaded:", data.audio_url);
                    // In a production app, we'd link this URL to the last extracted fragment
                } catch (err) {
                    console.error("Audio upload failed", err);
                }
            };
            mediaRecorder.start();
            setRecorder(mediaRecorder);
        } catch (err) {
            console.error("Failed to start recorder", err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
            recorder.stream.getTracks().forEach(track => track.stop());
            setRecorder(null);
        }
    }, [recorder]);

    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setError(null);
            startRecording();
        },
        onDisconnect: () => {
            console.log("Disconnected from ElevenLabs");
            setShowSummary(true);
            stopRecording();
        },
        onMessage: (message: { message: string }) => console.log("Message:", message),
        onError: (err: unknown) => {
            console.error("Error:", err);
            setError(typeof err === 'string' ? err : (err as { message?: string })?.message || 'Unknown error');
            stopRecording();
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
        <div className={`flex flex-col lg:flex-row gap-8 max-w-7xl w-full mx-auto p-4 md:p-8 relative min-h-screen transition-all duration-1000 ${currentTheme}`}>
            {/* Main Interviewer Card */}
            <div className={`glass-card p-8 md:p-16 flex flex-col items-center space-y-12 flex-1 relative overflow-hidden reveal-1 
                ${showSummary ? 'opacity-20 blur-md pointer-events-none' : 'opacity-100'}`}>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -ml-32 -mb-32" />

                {/* Visual Voice Feedback */}
                <div className="relative reveal-2">
                    {isConnected && (
                        <div className="absolute inset-0 bg-gold/20 rounded-full animate-voice-pulse scale-125" />
                    )}
                    <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center transition-all duration-700 z-10 relative 
                        ${isConnected ? 'bg-gradient-to-br from-gold to-gold-light shadow-2xl scale-105' : 'bg-white/5 border border-white/10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className={`h-20 w-20 md:h-28 md:w-28 transition-all duration-500 ${isConnected ? 'text-midnight translate-y-[-2px]' : 'text-white/20'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                </div>

                <div className="text-center space-y-6 reveal-3">
                    <h2 className="text-4xl md:text-5xl font-display text-gradient">
                        {isConnected ? 'Speaking with Memoria' : 'Ready to share?'}
                    </h2>
                    <p className="text-xl md:text-2xl text-silver/60 font-light leading-relaxed max-w-lg mx-auto">
                        {isConnected
                            ? (isSpeaking ? 'Agent is speaking...' : 'It is your turn to speak.')
                            : 'Memoria is here to listen and preserve your most precious life stories.'}
                    </p>
                </div>

                <div className="w-full pt-4 space-y-6 reveal-3">
                    {!import.meta.env.VITE_ELEVENLABS_AGENT_ID && (
                        <input
                            type="text"
                            placeholder="Paste Agent ID here"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="input-field w-full"
                        />
                    )}

                    <div className="flex flex-col sm:flex-row gap-6">
                        <button
                            onClick={isConnected ? stopConversation : startConversation}
                            className={`premium-button flex-[3] text-xl 
                                ${isConnected
                                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                    : 'button-primary'
                                }`}
                        >
                            {isConnected ? (
                                <>
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    End Session
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Begin Interview
                                </>
                            )}
                        </button>

                        <label className={`premium-button flex-1 button-secondary cursor-pointer
                            ${isConnected ? 'opacity-100 hover:scale-105' : 'opacity-20 pointer-events-none'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
                    <div className="w-full text-lg font-medium text-center text-rose-400 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in zoom-in-95 duration-300">
                        {error}
                    </div>
                )}

                <div className="w-full space-y-4 pt-8 mt-4 border-t border-white/5 reveal-3">
                    <p className="text-white/30 font-bold text-center uppercase tracking-[0.2em] text-[10px]">Family Guidance</p>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            placeholder="Add a topic (e.g. 'Ask about meeting Maria')"
                            className="input-field flex-1"
                        />
                        <button
                            onClick={handleAddSeed}
                            className="px-6 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-gold hover:text-midnight transition-all active:scale-90"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/10">
                    Connection: {status}
                </div>
            </div>

            {/* Story Map / Memories Sidebar */}
            <div className={`lg:w-96 flex flex-col gap-8 transition-all duration-700 reveal-2
                ${isConnected || fragments.length > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>

                <div className="glass-card p-8 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-display text-white flex items-center gap-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
                            </span>
                            Live Feed
                        </h3>
                        <button
                            onClick={handleExport}
                            className="p-3 bg-white/5 hover:bg-gold hover:text-midnight rounded-xl transition-all duration-300 group"
                            title="Export Digital Heirloom"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {fragments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 px-8 py-20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 border border-white/20 rounded-full p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <p className="text-lg font-light leading-relaxed">Awaiting your first story. Everything you share is securely preserved.</p>
                            </div>
                        ) : (
                            fragments.map((frag, i) => (
                                <div key={i} className={`p-6 rounded-3xl border transition-all duration-300 animate-in slide-in-from-right-8 fade-in h-fit
                                    ${frag.category === 'Visual Memory'
                                        ? 'bg-blue-500/10 border-blue-500/20 shadow-blue-500/5'
                                        : 'bg-white/[0.02] border-white/5 hover:border-gold/30 shadow-xl'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{frag.category}</span>
                                        {frag.category === 'Visual Memory' && <span className="text-lg">📸</span>}
                                    </div>
                                    <p className="text-lg text-white font-medium leading-tight mt-3">{frag.content}</p>
                                    {frag.context && <p className="text-xs text-silver/40 mt-3 italic leading-relaxed">{frag.context}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Legend Card */}
                <div className="glass-card p-6 bg-gold/5 border-gold/10">
                    <p className="text-xs text-gold/60 leading-relaxed italic">
                        "Your legacy is the greatest gift you can leave behind. Memoria is honored to be your scribe."
                    </p>
                </div>
            </div>

            {/* Session Summary Modal */}
            {showSummary && (
                <div className="absolute inset-0 z-50 p-6 flex items-center justify-center bg-midnight/80 backdrop-blur-xl">
                    <div className="glass-card max-w-xl w-full p-12 text-center space-y-10 border-gold/30 shadow-gold/20 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-gold text-midnight rounded-full flex items-center justify-center mx-auto scale-125 mb-4 shadow-2xl shadow-gold/40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-6xl font-display text-gradient">Wonderful stories!</h2>
                            <p className="text-xl md:text-2xl text-silver/60 font-light max-w-sm mx-auto">
                                We've safely stored {fragments.length} new treasures in your digital heirloom.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <button
                                onClick={startConversation}
                                className="premium-button flex-1 button-primary text-lg"
                            >
                                Start New Session
                            </button>
                            <button
                                onClick={() => setShowSummary(false)}
                                className="premium-button flex-1 button-secondary text-lg"
                            >
                                View Fragments
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
