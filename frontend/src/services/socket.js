import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io('https://campus-connect-ph1q.onrender.com');
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('user_connect', userId);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
