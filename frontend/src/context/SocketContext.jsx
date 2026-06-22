import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:5001', {
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