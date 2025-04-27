import CryptoJS from 'crypto-js';
import config from '../config';

// Generate consistent encryption key for a user pair
const generateKey = (userId1, userId2) => {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required for key generation');
  }
  
  // Convert to string and sort consistently
  const id1 = userId1.toString();
  const id2 = userId2.toString();
  const sortedIds = [id1, id2].sort();
  
  // Use a consistent separator and salt
  const combined = `${sortedIds[0]}|${sortedIds[1]}|${config.ENCRYPTION_SALT}`;
  
  return CryptoJS.SHA256(combined).toString();
};

export const encryptMessage = (message, senderId, recipientId) => {
  try {
    const key = generateKey(senderId, recipientId);
    
    if (typeof message === 'object') {
      const encryptedText = message.text 
        ? CryptoJS.AES.encrypt(message.text, key).toString()
        : '';
        
      return {
        ...message,
        text: encryptedText,
        encrypted: true
      };
    }
    
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return message;
  }
};

export const decryptMessage = (encrypted, userId1, userId2) => {
  try {
    if (!encrypted) return encrypted;
    
    // Handle already decrypted messages
    if (typeof encrypted === 'object' && !encrypted.encrypted) {
      return encrypted;
    }

    const key = generateKey(userId1, userId2);
    
    if (typeof encrypted === 'object') {
      const bytes = CryptoJS.AES.decrypt(encrypted.text, key);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      
      return {
        ...encrypted,
        text: decryptedText || encrypted.text,
        encrypted: false
      };
    }
    
    // Handle string decryption
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return bytes.toString(CryptoJS.enc.Utf8) || encrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted;
  }
};