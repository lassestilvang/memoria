import React, { useState, useEffect, useCallback } from 'react';

interface Fragment {
    id: number;
    category: string;
    content: string;
    context: string;
    audio_url?: string;
}

export const FamilyDashboard: React.FC = () => {
    const [pending, setPending] = useState<Fragment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [synthesizing, setSynthesizing] = useState(false);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/fragments/pending');
            const data = await res.json();
            setPending(data);
        } catch (err) {
            console.error("Failed to fetch pending fragments", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleVerify = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:8000/fragments/${id}/verify`, { method: 'POST' });
            if (res.ok) {
                setPending(pending.filter(f => f.id !== id));
            }
        } catch (err) {
            console.error("Verification failed", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this memory?")) return;
        try {
            const res = await fetch(`http://localhost:8000/fragments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPending(pending.filter(f => f.id !== id));
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:8000/fragments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent })
            });
            if (res.ok) {
                setPending(pending.map(f => f.id === id ? { ...f, content: editContent } : f));
                setEditingId(null);
            }
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const handleSynthesize = async () => {
        setSynthesizing(true);
        try {
            const res = await fetch('http://localhost:8000/synthesize', { method: 'POST' });
            if (res.ok) {
                alert("Memoir narrative synthesized successfully! You can now export the full PDF.");
                // Trigger export automatically
                const exportRes = await fetch('http://localhost:8000/export?user_name=Lasse');
                if (exportRes.ok) {
                    const blob = await exportRes.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Memoir_Lasse_Full_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
            } else {
                alert("Failed to synthesize. Make sure you have verified fragments.");
            }
        } catch (err) {
            console.error("Synthesis failed", err);
        } finally {
            setSynthesizing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-8 reveal-1">
            <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-2xl font-display text-gold/60 animate-pulse">Curating your stories...</p>
        </div>
    );

    return (
        <div className="space-y-12 max-w-5xl mx-auto pb-24 px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 reveal-1">
                <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-5xl font-display text-gradient">Review Stories</h2>
                    <p className="text-silver/40 text-lg font-light">Refine and verify the memories captured during sessions.</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="px-6 py-2 bg-gold/10 border border-gold/20 rounded-full">
                        <span className="text-gold font-black uppercase tracking-[0.2em] text-xs">
                            {pending.length} Pending Approval
                        </span>
                    </div>
                    {pending.length === 0 && (
                        <button
                            onClick={handleSynthesize}
                            disabled={synthesizing}
                            className="premium-button button-primary px-8 text-sm"
                        >
                            {synthesizing ? 'Synthesizing...' : 'Generate Full Memoir'}
                        </button>
                    )}
                </div>
            </div>

            {pending.length === 0 ? (
                <div className="glass-card p-24 text-center space-y-8 reveal-2">
                    <div className="text-6xl animate-float inline-block">✨</div>
                    <div className="space-y-4">
                        <p className="text-3xl font-display text-white">All stories are verified</p>
                        <p className="text-xl text-silver/40 font-light max-w-md mx-auto italic">
                            The digital heirloom is up to date. You can now generate the full synthesized biography.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-8">
                    {pending.map((frag, idx) => (
                        <div key={frag.id}
                            className={`glass-card p-10 group transition-all duration-500 reveal-${(idx % 3) + 1}
                                ${editingId === frag.id ? 'border-gold/50 bg-gold/5 shadow-gold/10' : ''}`}>

                            <div className="flex justify-between items-start mb-8">
                                <div className="flex flex-col gap-3">
                                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gold uppercase tracking-[0.2em] w-fit">
                                        {frag.category}
                                    </span>
                                    {frag.audio_url && (
                                        <div className="flex items-center gap-4 text-xs text-gold/60 font-bold uppercase tracking-widest mt-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                            Original Moment
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => { setEditingId(frag.id); setEditContent(frag.content); }}
                                        className="p-3 bg-white/5 hover:bg-gold hover:text-midnight rounded-xl transition-all"
                                        title="Edit Story"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(frag.id)}
                                        className="p-3 bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                        title="Discard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {editingId === frag.id ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-8 bg-white/5 border border-gold/30 rounded-[2rem] text-2xl font-display text-white focus:ring-2 focus:ring-gold/50 outline-none min-h-[150px] custom-scrollbar"
                                        autoFocus
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => handleUpdate(frag.id)} className="premium-button button-primary px-12">Save Changes</button>
                                        <button onClick={() => setEditingId(null)} className="premium-button button-secondary">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <p className="text-3xl md:text-4xl font-display text-white leading-tight">"{frag.content}"</p>
                                        {frag.context && (
                                            <p className="text-silver/40 italic flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {frag.context}
                                            </p>
                                        )}
                                    </div>

                                    {frag.audio_url && (
                                        <div className="audio-player-container">
                                            <audio controls src={frag.audio_url} className="w-full h-12 rounded-full opacity-60 hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleVerify(frag.id)}
                                        className="premium-button button-primary w-full text-lg group"
                                    >
                                        Verify & Add to Memoir
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
