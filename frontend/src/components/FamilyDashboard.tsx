import React, { useState, useEffect } from 'react';

interface Fragment {
    id: number;
    category: string;
    content: string;
    context: string;
}

export const FamilyDashboard: React.FC = () => {
    const [pending, setPending] = useState<Fragment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
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
    };

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

    if (loading) return <div className="text-center p-12 text-slate-400">Loading stories for review...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">Review Stories</h2>
                <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
                    {pending.length} Pending
                </span>
            </div>

            {pending.length === 0 ? (
                <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4">
                    <div className="text-4xl">✨</div>
                    <p className="text-xl text-slate-400 font-medium italic">No new stories to review right now.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pending.map(frag => (
                        <div key={frag.id} className="premium-card p-8 group hover:border-blue-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{frag.category}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingId(frag.id); setEditContent(frag.content); }}
                                        className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(frag.id)}
                                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {editingId === frag.id ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdate(frag.id)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Save</button>
                                        <button onClick={() => setEditingId(null)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-2xl text-slate-900 font-bold leading-tight mb-4">{frag.content}</p>
                                    {frag.context && <p className="text-sm text-slate-400 italic leading-relaxed mb-6">Originally from: {frag.context}</p>}
                                    <button
                                        onClick={() => handleVerify(frag.id)}
                                        className="w-full py-4 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm"
                                    >
                                        Confirm Memory
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
