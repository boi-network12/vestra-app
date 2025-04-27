import { io } from 'socket.io-client';
import { decryptMessage } from '../../utils/encryption';
import { saveMessageToStorage, updateChatsList } from './storageUtils';
import { MESSAGE_STATUS } from '../../constants/messageStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const initializeSocket = (apiUrl, userId, chatId, setIsConnected, setSocket, setIsTyping, recipientId, typingTimeoutRef) => {
  const socketInstance = io(apiUrl, {
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
    socketInstance.emit('join-chat', chatId);
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

  socketInstance.on('typing', ({ senderId }) => {
    if (senderId === recipientId) {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    }
  });

  socketInstance.on('stop-typing', ({ senderId }) => {
    if (senderId === recipientId) {
      setIsTyping(false);
    }
  });

  setSocket(socketInstance);
  return socketInstance;
};

export const cleanupSocket = socket => {
  socket.disconnect();
};

export const setupMessageListeners = (socket, userId, recipientId, setMessages, saveMessageToStorage, updateChatsList, chatId, seenMessageIds) => {
  const handleNewMessage = async encryptedMessage => {
    try {
      if (seenMessageIds.current.has(encryptedMessage._id)) {
        console.log('Duplicate message ignored:', encryptedMessage._id);
        return;
      }
      seenMessageIds.current.add(encryptedMessage._id);

      const decrypted = decryptMessage(encryptedMessage, userId, recipientId);
      if (!decrypted) {
        console.error('Failed to decrypt message');
        return;
      }

      setMessages(prev => {
        const exists = prev.some(msg => msg._id === decrypted._id);
        if (exists) return prev;
        return [...prev, decrypted];
      });

      await saveMessageToStorage(decrypted);
      await updateChatsList(decrypted);

      // Emit delivered status
      socket.emit('message-delivered', {
        messageId: decrypted._id,
        chatId,
        recipientId: userId,
      });
    } catch (error) {
      console.error('Message processing error:', error);
    }
  };

  const handleMessageDelivered = ({ messageId }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.DELIVERED } : msg
      )
    );
    updateMessageStatusInStorage(chatId, messageId, MESSAGE_STATUS.DELIVERED);
  };

  const handleMessageRead = ({ messageId }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.READ } : msg
      )
    );
    updateMessageStatusInStorage(chatId, messageId, MESSAGE_STATUS.READ);
  };

  const handleMessageFailed = ({ messageId }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
      )
    );
    updateMessageStatusInStorage(chatId, messageId, MESSAGE_STATUS.FAILED);
  };

  socket.on('new-message', handleNewMessage);
  socket.on('message-delivered', handleMessageDelivered);
  socket.on('message-read', handleMessageRead);
  socket.on('message-error', handleMessageFailed);

  return () => {
    socket.off('new-message', handleNewMessage);
    socket.off('message-delivered', handleMessageDelivered);
    socket.off('message-read', handleMessageRead);
    socket.off('message-error', handleMessageFailed);
  };
};

const updateMessageStatusInStorage = async (chatId, messageId, status) => {
  try {
    const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      const updated = messages.map(msg =>
        msg._id === messageId ? { ...msg, status } : msg
      );
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error updating message status in storage:', error);
  }
};