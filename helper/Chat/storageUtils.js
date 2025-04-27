import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptMessage } from '../../utils/encryption';

export const loadMessagesFromStorage = async (chatId, userId, recipientId, setMessages) => {
  try {
    const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      const decryptedMessages = messages.map(msg =>
        decryptMessage(msg, userId, recipientId)
      );
      setMessages(decryptedMessages);
    }
  } catch (error) {
    console.error('Error loading messages from storage:', error);
  }
};

export const saveMessageToStorage = async message => {
  try {
    const chatId = message.chatId;
    const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    const messages = savedMessages ? JSON.parse(savedMessages) : [];
    const exists = messages.some(msg => msg._id === message._id);
    if (!exists) {
      messages.push(message);
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(messages));
    }
  } catch (error) {
    console.error('Error saving message to storage:', error);
  }
};

export const updateMessageInStorage = async (chatId, tempId, updates) => {
  try {
    const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      const updatedMessages = messages.map(msg =>
        msg._id === tempId ? { ...msg, ...updates } : msg
      );
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    }
  } catch (error) {
    console.error('Error updating message in storage:', error);
  }
};

export const updateChatsList = async (message) => {
  try {
    const savedChats = await AsyncStorage.getItem(`chats_${message.sender}`);
    let chats = savedChats ? JSON.parse(savedChats) : [];

    const chatId = message.chatId;
    const recipientId = message.recipient;
    const senderId = message.sender;

    const participants = [senderId, recipientId].sort();
    const existingChatIndex = chats.findIndex(chat => chat.chatId === chatId);

    const chatData = {
      chatId,
      participants: [
        { _id: senderId, name: 'Sender' }, // Replace with actual user data
        { _id: recipientId, name: 'Recipient' }, // Replace with actual recipient data
      ],
      lastMessage: message.text || 'Media',
      updatedAt: new Date().toISOString(),
    };

    if (existingChatIndex !== -1) {
      chats[existingChatIndex] = chatData;
    } else {
      chats.unshift(chatData);
    }

    await AsyncStorage.setItem(`chats_${message.sender}`, JSON.stringify(chats));
  } catch (error) {
    console.error('Error updating chats list:', error);
  }
};