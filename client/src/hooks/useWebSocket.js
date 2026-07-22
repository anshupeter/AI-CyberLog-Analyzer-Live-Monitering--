import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = `ws://localhost:5000/ws`;

export default function useWebSocket() {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const mountedRef = useRef(true);
    const maxMessages = 500;

    const connect = useCallback(() => {
        // Don't reconnect if unmounted
        if (!mountedRef.current) return;

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null; // prevent reconnect loop
            wsRef.current.close();
        }

        try {
            console.log('🔌 WebSocket connecting to', WS_URL);
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                if (!mountedRef.current) return;
                setIsConnected(true);
                console.log('🔌 WebSocket connected');
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const data = JSON.parse(event.data);
                    // Only track log and threat messages in the messages array
                    if (data.type === 'log' || data.type === 'threat') {
                        setMessages((prev) => {
                            const updated = [...prev, data];
                            return updated.length > maxMessages ? updated.slice(-maxMessages) : updated;
                        });
                    }
                } catch (e) {
                    console.error('WebSocket message parse error:', e);
                }
            };

            ws.onclose = (event) => {
                if (!mountedRef.current) return;
                setIsConnected(false);
                console.log('🔌 WebSocket disconnected, reconnecting in 3s...');
                reconnectTimer.current = setTimeout(connect, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            if (mountedRef.current) {
                reconnectTimer.current = setTimeout(connect, 3000);
            }
        }
    }, []);

    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { messages, isConnected, sendMessage, clearMessages };
}
