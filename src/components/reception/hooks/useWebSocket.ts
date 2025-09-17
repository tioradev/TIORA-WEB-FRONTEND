import { useState, useRef } from 'react';

// Hook for managing WebSocket state
export const useWebSocket = () => {
  // WebSocket state for real-time updates
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Manual reconnection function for the retry button
  const handleRetryConnection = () => {
    console.log('🔄 [WEBSOCKET] Manual retry requested');
    window.location.reload(); // Simple approach - reload the page to restart WebSocket
  };

  return {
    wsConnected,
    setWsConnected,
    wsRef,
    reconnectAttemptsRef,
    handleRetryConnection,
  };
};
