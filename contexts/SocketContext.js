// contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptMessage } from '../utils/encryption';
import { saveMessageToStorage, updateChatsList } from '../helper/Chat/storageUtils';
import config from '../config';
import { MESSAGE_STATUS } from '../constants/messageStatus';

const SocketContext = createContext();

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const seenMessageIds = new Set();

  // Update message status in AsyncStorage
  const updateMessageStatusInStorage = async (chatId, messageId, status) => {
    try {
      const messagesKey = `messages_${chatId}`;
      const existingMessages = await AsyncStorage.getItem(messagesKey);
      let messages = existingMessages ? JSON.parse(existingMessages) : [];

      messages = messages.map(msg =>
        msg._id === messageId ? { ...msg, status } : msg
      );

      await AsyncStorage.setItem(messagesKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Error updating message status in storage:', error);
    }
  };

  // Handle message read event
  const handleMessageRead = async (chatId, messageId) => {
    await updateMessageStatusInStorage(chatId, messageId, MESSAGE_STATUS.READ);
    // Notify components or state management about the read status
    // You can use a global event emitter or context to propagate this change
  };

  // Handle message delivered event
  const handleMessageDelivered = async (chatId, messageId) => {
    await updateMessageStatusInStorage(chatId, messageId, MESSAGE_STATUS.DELIVERED);
    // Notify components or state management about the delivered status
  };

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(config.API_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      query: { userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', err => {
      console.log('Connection error:', err.message);
    });

    socketInstance.on('reconnect', attempt => {
      console.log(`Reconnected after ${attempt} attempts`);
    });

    socketInstance.on('new-message', async encryptedMessage => {
      try {
        if (seenMessageIds.has(encryptedMessage._id)) {
          console.log('Duplicate message ignored:', encryptedMessage._id);
          return;
        }
        seenMessageIds.add(encryptedMessage._id);

        const decrypted = decryptMessage(encryptedMessage, userId, encryptedMessage.sender);
        if (!decrypted) {
          console.error('Failed to decrypt message');
          return;
        }

        await saveMessageToStorage(decrypted);
        await updateChatsList(decrypted);

        socketInstance.emit('message-delivered', {
          messageId: decrypted._id,
          chatId: decrypted.chatId,
          recipientId: userId,
        });

        // Notify components about the new message
      } catch (error) {
        console.error('Message processing error:', error);
      }
    });

    // Handle message delivered event from server
    socketInstance.on('message-delivered', ({ messageId, chatId }) => {
      handleMessageDelivered(chatId, messageId);
    });

    // Handle message read event from server
    socketInstance.on('message-read', ({ messageId, chatId }) => {
      handleMessageRead(chatId, messageId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);