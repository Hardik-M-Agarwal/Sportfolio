import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Derive the Socket.io server URL from VITE_API_URL by stripping the
// trailing /api path, e.g. https://sportfolio-backend.onrender.com/api
// -> https://sportfolio-backend.onrender.com
// Falls back to localhost for local dev if VITE_API_URL is not set.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
  .replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinMatch = (matchId) => {
    socketRef.current?.emit('join_match', matchId);
  };

  const leaveMatch = (matchId) => {
    socketRef.current?.emit('leave_match', matchId);
  };

  const onScoreUpdate = (callback) => {
    socketRef.current?.on('score_update', callback);
    return () => socketRef.current?.off('score_update', callback);
  };

  const onMatchStarted = (callback) => {
    socketRef.current?.on('match_started', callback);
    return () => socketRef.current?.off('match_started', callback);
  };

  return (
    <SocketContext.Provider value={{ connected, joinMatch, leaveMatch, onScoreUpdate, onMatchStarted }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);