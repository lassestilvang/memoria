import React, { useEffect, useState } from 'react';
import { useConversation } from '@elevenlabs/react';

export const Interviewer: React.FC = () => {
    const conversation = useConversation({
        onConnect: () => console.log("Connected to ElevenLabs"),
        onDisconnect: () => console.log("Disconnected from ElevenLabs"),
        onMessage: (message) => console.log("Message:", message),
        onError: (error) => console.error("Error:", error),
    });

    const [agentId, setAgentId] = useState(import.meta.env.VITE_ELEVENLABS_AGENT_ID || '');

    const startConversation = async () => {
        if (!agentId) {
            alert('Please provide an Agent ID');
            return;
        }
        try {
            await conversation.startSession({
                agentId: agentId,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const stopConversation = async () => {
        await conversation.endSession();
    };

    const status = conversation.status;
    const isConnected = status === 'connected';
    const isSpeaking = conversation.isSpeaking;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-8 bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto mt-10">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-green-100 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-gray-100'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected
                        ? (isSpeaking ? 'bg-green-500 animate-pulse scale-110' : 'bg-green-500')
                        : 'bg-gray-400'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">
                    {isConnected ? 'Biographer Active' : 'Ready to Start'}
                </h2>
                <p className="text-gray-500">
                    {isConnected
                        ? (isSpeaking ? 'Listening...' : 'Listening...') // SDK status 'speaking' means agent is speaking.
                        : 'Press start to begin your interview.'}
                </p>
                {isConnected && isSpeaking && <p className="text-sm text-green-600 font-medium">Agent Speaking...</p>}
            </div>

            <div className="w-full">
                {!import.meta.env.VITE_ELEVENLABS_AGENT_ID && (
                    <input
                        type="text"
                        placeholder="Agent ID"
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        className="w-full mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                )}

                <button
                    onClick={isConnected ? stopConversation : startConversation}
                    className={`w-full py-4 rounded-xl text-lg font-semibold text-white transition-all transform active:scale-95 shadow-lg ${isConnected
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                >
                    {isConnected ? 'End Session' : 'Start Session'}
                </button>
            </div>

            <div className="text-xs text-center text-gray-400 mt-4">
                Status: {status}
            </div>
        </div>
    );
};
