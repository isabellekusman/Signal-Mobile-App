
import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface Signal {
    type: 'RED' | 'GREEN' | 'YELLOW';
    text: string;
}

export interface Connection {
    id: string;
    name: string;
    tag: string;
    zodiac: string;
    lastActive: string;
    icon: string;
    status: 'active' | 'archived';
    signals: Signal[];
}

const INITIAL_CONNECTIONS: Connection[] = [
    {
        id: '1',
        name: 'Samuel',
        tag: 'SITUATIONSHIP',
        zodiac: 'LIBRA',
        lastActive: 'LAST ACTIVE 2D AGO',
        icon: 'leaf-outline',
        status: 'active',
        signals: [],
    },
    {
        id: '2',
        name: 'Nicholas',
        tag: 'TALKING',
        zodiac: 'CAPRICORN',
        lastActive: 'LAST ACTIVE 4H AGO',
        icon: 'flash-outline',
        status: 'active',
        signals: [],
    },
    {
        id: '3',
        name: 'Thomas',
        tag: 'DATING',
        zodiac: 'AQUARIUS',
        lastActive: 'LAST ACTIVE 1W AGO',
        icon: 'water-outline',
        status: 'active',
        signals: [],
    },
];

interface ConnectionsContextType {
    connections: Connection[];
    addConnection: (connection: Connection) => void;
    updateConnection: (id: string, updates: Partial<Connection>) => void;
    deleteConnection: (id: string) => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: ReactNode }) {
    const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);

    const addConnection = (connection: Connection) => {
        setConnections((prev) => [connection, ...prev]);
    };

    const updateConnection = (id: string, updates: Partial<Connection>) => {
        setConnections((prev) =>
            prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn))
        );
    };

    const deleteConnection = (id: string) => {
        setConnections((prev) => prev.filter((conn) => conn.id !== id));
    };

    return (
        <ConnectionsContext.Provider value={{ connections, addConnection, updateConnection, deleteConnection }}>
            {children}
        </ConnectionsContext.Provider>
    );
}

export function useConnections() {
    const context = useContext(ConnectionsContext);
    if (context === undefined) {
        throw new Error('useConnections must be used within a ConnectionsProvider');
    }
    return context;
}
