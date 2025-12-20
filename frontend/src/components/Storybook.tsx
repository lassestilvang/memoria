import React, { useState, useEffect, useCallback } from 'react';

interface Fragment {
    id: number;
    category: string;
    content: string;
    context: string;
    audio_url?: string;
    image_url?: string;
}

interface StorybookProps {
    onBack: () => void;
}

export const Storybook: React.FC<StorybookProps> = ({ onBack }) => {
    const [fragments, setFragments] = useState<Fragment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [narrative, setNarrative] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [memRes, synthRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/memories?verified=true`),
                fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/synthesize`, { method: 'POST' }) // Ensure we have the latest
            ]);

            const memData = await memRes.json();
            setFragments(memData.fragments || []);

            const synthData = await synthRes.json();
            setNarrative(synthData.narrative);
        } catch (err) {
            console.error("Failed to fetch storybook data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const nextFragment = () => {
        if (currentIndex < fragments.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevFragment = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-8">
            <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-2xl font-display text-gold/60">Opening the heirloom...</p>
        </div>
    );

    if (fragments.length === 0) return (
        <div className="text-center p-24 space-y-8">
            <h2 className="text-4xl font-display text-white">No stories found</h2>
            <p className="text-silver/40">Verify and add some memories to your digital heirloom first.</p>
            <button onClick={onBack} className="premium-button button-secondary">Go Back</button>
        </div>
    );

    const currentFrag = fragments[currentIndex];

    return (
        <div className="fixed inset-0 bg-midnight z-[100] flex flex-col items-center justify-center p-8 md:p-12 animate-in fade-in duration-700">
            {/* Background Narrative Overlay (Subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden p-24 select-none">
                <p className="text-4xl font-display text-white leading-loose text-justify">
                    {narrative}
                </p>
            </div>

            <button
                onClick={onBack}
                className="absolute top-8 left-8 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-silver/60 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                {/* Visual Side */}
                <div className="relative group reveal-1">
                    <div className="absolute inset-0 bg-gold/20 blur-[100px] rounded-full group-hover:bg-gold/30 transition-all duration-1000" />
                    <div className="relative aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5">
                        {currentFrag.image_url ? (
                            <img
                                src={currentFrag.image_url}
                                alt={currentFrag.category}
                                className="w-full h-full object-cover animate-in zoom-in-110 duration-1000"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-12 text-center">
                                <span className="text-6xl opacity-20">📜</span>
                                <p className="text-silver/40 italic font-light">No image attached to this memory yet.</p>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-midnight/90 to-transparent">
                            <span className="px-4 py-1.5 bg-gold text-midnight rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                {currentFrag.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Story Side */}
                <div className="space-y-12 reveal-2">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-gold/60 font-black uppercase tracking-[0.3em] text-xs">
                            <span className="w-12 h-px bg-gold/20" />
                            Fragment {currentIndex + 1} of {fragments.length}
                        </div>
                        <p className="text-4xl md:text-6xl font-display text-white leading-tight">
                            "{currentFrag.content}"
                        </p>
                        {currentFrag.context && (
                            <p className="text-xl md:text-2xl text-silver/40 font-light italic border-l-2 border-gold/20 pl-6">
                                {currentFrag.context}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Original Audio Moment</p>
                        {currentFrag.audio_url ? (
                            <audio
                                key={currentFrag.id} // Reset audio on fragment change
                                controls
                                autoPlay
                                src={currentFrag.audio_url}
                                className="w-full h-16 rounded-full brightness-75 hover:brightness-100 transition-all"
                            />
                        ) : (
                            <p className="text-silver/20 italic">No audio recorded for this segment.</p>
                        )}
                    </div>

                    <div className="flex gap-6 pt-12">
                        <button
                            disabled={currentIndex === 0}
                            onClick={prevFragment}
                            className="p-6 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 disabled:opacity-20 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            disabled={currentIndex === fragments.length - 1}
                            onClick={nextFragment}
                            className="p-6 bg-gold text-midnight rounded-full hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-gold/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
