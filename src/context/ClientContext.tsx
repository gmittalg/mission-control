'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Client {
    id: string;
    name: string;
}

interface ClientContextType {
    activeClientId: string;
    clients: Client[];
    setActiveClientId: (id: string) => void;
    isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
    const [activeClientId, setActiveClientId] = useState<string>('default');
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load clients and initial active client
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch('/api/clients');
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize active client from localStorage
        const savedClient = localStorage.getItem('mc_active_client_id');
        if (savedClient) {
            setActiveClientId(savedClient);
        }

        fetchClients();
    }, []);

    const handleSetActiveClient = useCallback((id: string) => {
        setActiveClientId(id);
        localStorage.setItem('mc_active_client_id', id);
        // Reload the page to reset all states and switch contexts properly
        window.location.reload();
    }, []);

    // Intercept fetch to add X-Client-Id header
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource, config] = args;

            // Only for relative /api paths
            const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : resource.url;

            if (url.startsWith('/api') || url.includes(window.location.origin + '/api')) {
                const newConfig = { ...(config || {}) };
                const headers = new Headers(newConfig.headers || {});

                if (!headers.has('X-Client-Id')) {
                    headers.set('X-Client-Id', activeClientId);
                }

                newConfig.headers = headers;
                return originalFetch(url, newConfig);
            }

            return originalFetch(...args);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [activeClientId]);

    return (
        <ClientContext.Provider
            value={{
                activeClientId,
                clients,
                setActiveClientId: handleSetActiveClient,
                isLoading
            }}
        >
            {children}
        </ClientContext.Provider>
    );
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
}
