'use client';

import { useState } from 'react';
import { useClient } from '@/context/ClientContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export function ClientSwitcher() {
    const { activeClientId, clients, setActiveClientId, isLoading } = useClient();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) return <div className="w-40 h-8 bg-mc-bg-tertiary animate-pulse rounded" />;

    const activeClient = clients.find(c => c.id === activeClientId) || { id: 'default', name: 'Default' };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-mc-bg-tertiary rounded hover:bg-mc-bg transition-colors border border-mc-border"
            >
                <Globe className="w-4 h-4 text-mc-accent-cyan" />
                <span className="text-sm font-medium">{activeClient.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-mc-bg-secondary border border-mc-border rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="p-2 text-xs text-mc-text-secondary uppercase font-bold tracking-wider border-b border-mc-border">
                            Switch Client
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {clients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        setActiveClientId(client.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-mc-bg-tertiary ${client.id === activeClientId ? 'text-mc-accent-cyan bg-mc-bg-tertiary/50' : 'text-mc-text'
                                        }`}
                                >
                                    <span className="truncate">{client.name}</span>
                                    {client.id === activeClientId && <Check className="w-4 h-4" />}
                                </button>
                            ))}

                            {/* Fallback for default if not in list */}
                            {!clients.some(c => c.id === 'default') && (
                                <button
                                    onClick={() => {
                                        setActiveClientId('default');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-mc-bg-tertiary ${activeClientId === 'default' ? 'text-mc-accent-cyan bg-mc-bg-tertiary/50' : 'text-mc-text'
                                        }`}
                                >
                                    <span className="truncate">Default</span>
                                    {activeClientId === 'default' && <Check className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
