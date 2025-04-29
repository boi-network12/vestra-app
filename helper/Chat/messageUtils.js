import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptMessage } from '../../utils/encryption';
import config from '../../config';

const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries} failed: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const fetchLinkPreview = async (url, token) => {
  try {
    const response = await axios.post(
      `${config.API_URL}/messages/link-preview`,
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
};

export const uploadFiles = async (selectedMedia, token, setUploading, setSelectedMedia) => {
  if (selectedMedia.length === 0) return [];

  setUploading(true);
  const formData = new FormData();
  const filesToUpload = [];
  const gifFiles = [];

  // Separate GIFs from other files
  selectedMedia.forEach(media => {
    if (media.type === 'gif') {
      gifFiles.push({
        url: media.uri,
        type: 'gif',
        name: media.name,
        size: media.size || 0,
      });
    } else {
      filesToUpload.push(media);
    }
  });

  let uploadedFiles = [];

  if (filesToUpload.length > 0) {
    try {
      for (const media of filesToUpload) {
        const ext = media.name.split('.').pop().toLowerCase();
        const extensionToMime = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          mp4: 'video/mp4',
          mov: 'video/quicktime',
          '3gp': 'video/3gpp',
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          m4a: 'audio/x-m4a',
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          txt: 'text/plain',
        };

        const mimeType = extensionToMime[ext] || 'application/octet-stream';

        formData.append('files', {
          uri: media.uri,
          name: media.name || `file_${Date.now()}.${ext}`,
          type: mimeType,
        });
      }

      const response = await retryRequest(() =>
        axios.post(`${config.API_URL}/messages/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 60000, 
        })
      );

      uploadedFiles = response.data.map((file, index) => ({
        ...file,
        duration: filesToUpload[index].duration || file.duration || 0,
        size: filesToUpload[index].size || file.size || 0,
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }

  const allFiles = [...uploadedFiles, ...gifFiles];
  setUploading(false);
  return allFiles;
};

export const sendMessage = async ({
  messageData,
  socket,
  isConnected,
  chatId,
  recipientId,
  userId,
}) => {
  try {
    if (isConnected && socket) {
      return new Promise((resolve, reject) => {
        const tempId = messageData._id;
        socket.emit('send-message', { chatId, messageData, recipientId }, (ack) => {
          if (ack?.error) {
            reject(new Error(ack.error));
          } else {
            resolve({
              shouldReplace: true,
              tempId,
              serverId: ack.messageId,
            });
          }
        });
      });
    } else {
      console.log('Socket not connected, saving as pending');
      await AsyncStorage.setItem(
        `pending_${messageData._id}`,
        JSON.stringify({ chatId, messageData, recipientId })
      );
      return { status: 'pending' };
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};