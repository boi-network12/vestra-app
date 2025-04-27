import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  PermissionsAndroid,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../../utils/theme';
import { io } from 'socket.io-client';
import config from '../../../../../config';
import { decryptMessage, encryptMessage } from '../../../../../utils/encryption';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreenHeader from '../../../../../components/Headers/ChatScreenHeader';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Video, Audio } from 'expo-av';
import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import axios from 'axios';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

// Message status constants
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  READ: 'read',
};

const AUDIO_RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  }
}

// check doc permission
const checkPermissions = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (result.canceled) {
      console.log('Permission not granted or user canceled');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Media Upload Modal Component
const MediaUploadModal = ({ visible, onClose, onSelectMedia, onSelectDocument, colors }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Media</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.mediaOptions}>
          {['photo', 'video', 'document'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.mediaOption}
              onPress={() => (type === 'document' ? onSelectDocument() : onSelectMedia(type))}
            >
              <Ionicons
                name={type === 'photo' ? 'image' : type === 'video' ? 'videocam' : 'document'}
                size={hp(4)}
                color={colors.primary}
              />
              <Text style={[styles.mediaOptionText, { color: colors.text }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

// Media Preview Component
const MediaPreview = ({ media, onRemove, colors }) => {
  const getMediaType = () => {
    const ext = media.name?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', '3gp'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
    return 'file';
  };


  const renderMedia = () => {
    const type = media.type || getMediaType();
    if (type === 'image') {
      return <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} resizeMode="cover" />;
    } else if (type === 'video') {
      return (
        <View style={styles.videoPreviewContainer}>
          <Video
            source={{ uri: media.uri }}
            style={styles.videoPreview}
            resizeMode="cover"
            shouldPlay={false}
            isMuted={true}
            useNativeControls={false}
          />
          <Ionicons name="play" size={hp(5)} color="white" style={styles.videoPlayIcon} />
        </View>
      );
    } else {
      return (
        <View style={[styles.filePreviewContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="document" size={hp(5)} color={colors.primary} />
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="middle">
            {media.name}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.mediaPreviewContainer}>
      {renderMedia()}
      <TouchableOpacity style={styles.removeMediaButton} onPress={() => onRemove(media.id)}>
        <Ionicons name="close-circle" size={hp(3)} color={colors.errorText} />
      </TouchableOpacity>
    </View>
  );
};

// Link Preview Component
const LinkPreview = ({ preview, onRemove, colors }) => {
  if (!preview) return null;

  return (
    <View style={[styles.linkPreviewContainer, { backgroundColor: colors.card }]}>
      {preview.image && (
        <Image source={{ uri: preview.image }} style={styles.linkPreviewImage} resizeMode="cover" />
      )}
      <View style={styles.linkPreviewTextContainer}>
        <Text style={[styles.linkPreviewTitle, { color: colors.text }]} numberOfLines={1}>
          {preview.title || preview.url}
        </Text>
        {preview.description && (
          <Text style={[styles.linkPreviewDescription, { color: colors.subText }]} numberOfLines={2}>
            {preview.description}
          </Text>
        )}
        <Text style={[styles.linkPreviewUrl, { color: colors.primary }]} numberOfLines={1}>
          {new URL(preview.url).hostname}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeLinkButton} onPress={onRemove}>
        <Ionicons name="close" size={hp(2.5)} color={colors.subText} />
      </TouchableOpacity>
    </View>
  );
};

// Typing Indicator Component
const TypingIndicator = ({ isTyping, colors }) => {
  if (!isTyping) return null;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1);
    setTimeout(() => animate(dot2), 100);
    setTimeout(() => animate(dot3), 200);

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.typingContainer, { backgroundColor: colors.card }]}>
      <Animated.View
        style={[
          styles.typingDot,
          { backgroundColor: colors.subText, transform: [{ translateY: dot1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          { backgroundColor: colors.subText, transform: [{ translateY: dot2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          { backgroundColor: colors.subText, transform: [{ translateY: dot3 }] },
        ]}
      />
    </View>
  );
};

TypingIndicator.displayName = 'TypingIndicator';

// Main ChatScreen Component
export default function ChatScreen() {
  const { chatId, recipient: recipientString } = useLocalSearchParams();
  const recipient = recipientString ? JSON.parse(recipientString) : null;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [linkPreview, setLinkPreview] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const flatListRef = useRef();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef(0);
  const recordingIntervalRef = useRef(null);

  // handle Typing 
  useEffect(() => {
    if (!socket || !newMessage.trim()) {
      // If no message or no socket, ensure typing is stopped
      socket?.emit('stop-typing', { chatId, senderId: user._id });
      return;
    }

    socket.emit('typing', { chatId, senderId: user._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

     // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId, senderId: user._id });
      setIsTyping(false); // Ensure local state is updated
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, socket, chatId, user._id]);

  // Add this useEffect to handle read receipts
  useEffect(() => {
    if (!socket || !user?._id) return;

    // When joining chat, mark messages as read
    socket.emit('mark-messages-read', { chatId, userId: user._id });

    // Handle messages being marked as read by recipient
    const handleMessagesRead = ({ readerId }) => {
      if (readerId === recipient._id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.sender === user._id && msg.recipient === recipient._id && msg.status !== 'read' 
              ? { ...msg, status: 'read' } 
              : msg
          )
        );
      }
    };

    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, chatId, user?._id, recipient?._id]);

  // Extract URLs for link preview
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = newMessage.match(urlRegex);

    if (urls && urls.length > 0) {
      const fetchLinkPreview = async () => {
        try {
          const response = await axios.post(
            `${config.API_URL}/messages/link-preview`,
            { url: urls[0] },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.token}`,
              },
            }
          );
          setLinkPreview(response.data);
        } catch (error) {
          setLinkPreview(null);
        }
      };
      fetchLinkPreview();
    } else {
      setLinkPreview(null);
    }
  }, [newMessage, user.token]);

  // In your ChatScreen component
  const handleInputChange = (text) => {
    setNewMessage(text);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // If there's text, emit typing event
    if (text.trim()) {
      socket.emit('typing', { chatId, senderId: user._id });
      
      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { chatId, senderId: user._id });
      }, 2000);
    } else {
      // If input is cleared, immediately stop typing
      socket.emit('stop-typing', { chatId, senderId: user._id });
    }
  };

  // Handle media selection
  const handleSelectMedia = async (type) => {
    setMediaModalVisible(false);
    try {
      let result;
      if (type === 'photo') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
      } else if (type === 'video') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          quality: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileUri = asset.uri.startsWith('file://') ? asset.uri : `file://${asset.uri}`;

        const mediaItem = {
          id: Date.now().toString(),
          uri: fileUri,
          type: type === 'photo' ? 'image' : 'video',
          name: asset.uri ? asset.uri.split('/').pop() : `media_${Date.now()}`,
          size: asset.fileSize || 0,
        };

        if (type === 'video') {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(mediaItem.uri, { time: 1000 });
            mediaItem.thumbnail = uri;
          } catch (e) {
            console.error('Error generating video thumbnail:', e);
          }
        }

        if (type === 'photo' && asset.fileSize > 2 * 1024 * 1024) {
          const compressedImage = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 1000 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
          );
          mediaItem.uri = compressedImage.uri;
          mediaItem.size = compressedImage.size || asset.fileSize;
        }

        setSelectedMedia((prev) => [...prev, mediaItem]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
    }
  };

  // Handle document selection
  const handleSelectDocument = async () => {
    setMediaModalVisible(false);
    const hasPermission = await checkPermissions()
    if (!hasPermission) return

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'audio/*',
          '*/*', 
        ],
        copyToCacheDirectory: true,
      });


      // Check if the result is successful
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Determine file type
        let fileType = 'file';
        if (document.mimeType?.startsWith('audio/')) {
          fileType = 'audio';
        }

        const fileItem = {
          id: Date.now().toString(),
          uri: document.uri,
          type: fileType,
          name: document.name || `document_${Date.now()}`,
          size: document.size || 0,
          mimeType: document.mimeType || 'application/octet-stream',
        };

        // For audio files, try to get duration
        if (fileType === 'audio') {
          try {
            const sound = new Audio.Sound();
            await sound.loadAsync({ uri: document.uri });
            const status = await sound.getStatusAsync();
            fileItem.duration = status.durationMillis / 1000; // Convert to seconds
            await sound.unloadAsync();
          } catch (audioError) {
            console.error('Error getting audio duration:', audioError);
          }
        }

        setSelectedMedia((prev) => [...prev, fileItem]);
      } else {
        console.log('Document picking canceled or no assets returned');
      }
    } catch (error) {
      console.error('Error selecting document:', error);
    }
  };

  // Remove media
  const removeMedia = (id) => {
    setSelectedMedia((prev) => prev.filter((item) => item.id !== id));
  };

  // Remove link preview
  const removeLinkPreview = () => {
    setLinkPreview(null);
    setNewMessage(newMessage.replace(/(https?:\/\/[^\s]+)/g, ''));
  };

  // Format audio duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Request audio permissions
  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone for voice messages',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Failed to request audio permission:', err);
        return false;
      }
    }
    return true;
  };

  // Upload files
  // Upload files (updated version)
  const uploadFiles = async () => {
    if (selectedMedia.length === 0) return [];

    setUploading(true);
    const formData = new FormData();

    try {
      for (const media of selectedMedia) {
        let mimeType;
        const ext = media.name.split('.').pop().toLowerCase(); // Default MIME type

        // Map extensions to MIME types
        const extensionToMime = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
          mp4: 'video/mp4', mov: 'video/quicktime', '3gp': 'video/3gpp',
          mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/x-m4a',
          pdf: 'application/pdf', doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          txt: 'text/plain',
        };

        mimeType = extensionToMime[ext] || 'application/octet-stream';
        
        
        // Create file object with proper type
        const file = {
          uri: media.uri,
          name: media.name || `file_${Date.now()}.${ext}`,
          type: mimeType,
        };
  
        formData.append('files', file);
      }

      const response = await axios.post(`${config.API_URL}/messages/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Update file sizes and durations in the response
      const uploadedFiles = response.data.map((file, index) => {
        const originalMedia = selectedMedia[index];
        return {
          ...file,
          duration: originalMedia.duration || file.duration || 0,
          size: originalMedia.size || file.size || 0,
        };
      });

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error; // Re-throw to handle in calling function
    } finally {
      setUploading(false);
      setSelectedMedia([]);
    }
  };

  // Validate recipient
  if (!recipient || !recipient._id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: wp(4) }}>Error: Invalid recipient</Text>
      </SafeAreaView>
    );
  }

  // Socket.io setup
  useEffect(() => {
    if (!user?._id) return;

    const socketInstance = io(config.API_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      query: { userId: user._id },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    setSocket(socketInstance);

    socketInstance.on('reconnect', (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socketInstance.emit('join-chat', chatId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.log('Connection error:', err.message);
    });

    socketInstance.on('typing', ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(true);
      }
    });

    socketInstance.on('stop-typing', ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, chatId]);

  useEffect(() => {
    if (!socket) return;
  
    const handleTyping = ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(true);
        
        // Automatically stop typing after 3 seconds if no new typing event
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };
  
    const handleStopTyping = ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(false);
      }
    };
  
    socket.on('typing', handleTyping);
    socket.on('stop-typing', handleStopTyping);
  
    return () => {
      socket.off('typing', handleTyping);
      socket.off('stop-typing', handleStopTyping);
    };
  }, [socket, recipient._id]);


  // Message handling
  useEffect(() => {
    if (!socket || !recipient?._id) return;

    const handleNewMessage = async (encryptedMessage) => {
      try {
        const decrypted = decryptMessage(encryptedMessage, user._id, recipient._id);
        if (!decrypted) {
          console.error('Failed to decrypt message');
          return;
        }

        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === decrypted._id ||
              (msg.text === decrypted.text &&
                msg.sender === decrypted.sender &&
                Math.abs(new Date(msg.createdAt) - new Date(decrypted.createdAt)) < 1000)
          );
          if (exists) {
            return prev.map((msg) =>
              msg._id === decrypted._id ? { ...msg, status: decrypted.status } : msg
            );
          }
          return [...prev, decrypted];
        });

        await saveMessageToStorage(decrypted);
        await updateChatsList(decrypted);
      } catch (error) {
        console.error('Message processing error:', error);
      }
    };

    const handleMessageDelivered = (messageId) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.DELIVERED } : msg
        )
      );
      
      // Update AsyncStorage
      updateMessageStatusInStorage(messageId, MESSAGE_STATUS.DELIVERED);
    };

    const handleMessageRead = (messageIds) => {
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg._id) ? { ...msg, status: MESSAGE_STATUS.READ } : msg
        )
      );
      
      // Update AsyncStorage
      messageIds.forEach(id => 
        updateMessageStatusInStorage(id, MESSAGE_STATUS.READ)
      );
    };

    const handleMessageFailed = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
        )
      );
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
  }, [socket, user?._id, recipient?._id]);

  // Helper function to update status in storage
  const updateMessageStatusInStorage = async (messageId, status) => {
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

  // Load messages from storage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);

          const decryptedMessages = await Promise.all(
            parsedMessages.map(async (msg) => {
              try {
                const decrypted = decryptMessage(msg, user._id, recipient._id);
                return decrypted || msg;
              } catch (decryptError) {
                console.error('Error decrypting message:', decryptError);
                return msg;
              }
            })
          );

          setMessages(decryptedMessages.filter((m) => m));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [chatId, user._id, recipient._id]);

  // Navigation setup
  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      swipeEnabled: false,
    });
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    };
  }, [navigation]);

  // Save message to AsyncStorage
  const saveMessageToStorage = async (message) => {
    try {
      const encryptedMsg = {
        ...message,
        text: message.encrypted
          ? message.text
          : encryptMessage(message.text, user._id, recipient._id),
        encrypted: true,
      };

      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];

      if (!updatedMessages.some((msg) => msg._id === encryptedMsg._id)) {
        updatedMessages.push(encryptedMsg);
        await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Update chats list
  const updateChatsList = async (message) => {
    try {
      const chatData = {
        chatId,
        participants: [user, recipient],
        lastMessage: encryptMessage(message.text, user._id, recipient._id),
        updatedAt: new Date().toISOString(),
      };

      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      let chats = savedChats ? JSON.parse(savedChats) : [];

      const existingIndex = chats.findIndex((chat) => chat.chatId === chatId);
      if (existingIndex >= 0) {
        chats[existingIndex] = chatData;
      } else {
        chats.unshift(chatData);
      }

      await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(chats));
    } catch (error) {
      console.error('Error updating chats list:', error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedMedia.length === 0 && !linkPreview) return;

    let files = [];
    if (selectedMedia.length > 0) {
      files = await uploadFiles();
    }

    const messageId = uuidv4();

    const messageData = {
      _id: messageId,
      text: newMessage,
      sender: user._id,
      recipient: recipient._id,
      files,
      linkPreview,
      replyTo: replyingTo?._id || null,
      status: MESSAGE_STATUS.SENDING,
      createdAt: new Date().toISOString(),
      encrypted: true,
      isRead: false,
    };

    try {
      setMessages((prev) => [...prev, messageData]);
      setNewMessage('');
      setLinkPreview(null);
      setReplyingTo(null)

      const encryptedMessage = encryptMessage({ text: newMessage }, user._id, recipient._id);

      if (isConnected) {
        socket.emit('send-message', {
          chatId,
          encryptedMessage,
          recipientId: recipient._id,
          files,
          link: linkPreview?.url,
          replyTo: replyingTo?._id || null,
        });
      } else {
        await AsyncStorage.setItem(
          `pending_${messageId}`,
          JSON.stringify({
            chatId,
            encryptedMessage,
            recipientId: recipient._id,
            files,
            link: linkPreview?.url,
            replyTo: replyingTo?._id || null,
          })
        );
      }

      await saveMessageToStorage(messageData);
      await updateChatsList(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageData._id ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const handleVoiceNote = async () => {
    //  implement voice note
    try {
      if (isRecording) {
        clearInterval(recordingIntervalRef.current);
        await recording.stopAndUnloadAsync();
        setIsRecording(false);
        setRecordingStatus('idle');


        const uri = recording.getURI()
        const duration = recordingDurationRef.current;

        const voiceNote = {
          id: Date.now().toString(),
          uri,
          type: 'audio',
          name: `voice_note_${Date.now()}.m4a`,
          size: 0,
          duration,
          mimeType: 'audio/x-m4a',
        }

        setSelectedMedia([voiceNote]);
        setRecording(null);
        recordingDurationRef.current = 0;
        setRecordingDuration(0);
      } else {
        const hasPermission = await requestAudioPermission();
        if (!hasPermission) {
          console.log('Microphone permission denied');
          return;
        }
         

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { recording: newRecording, status } = await Audio.Recording.createAsync(
          AUDIO_RECORDING_OPTIONS
        );

        setRecording(newRecording);
        setIsRecording(true);
        setRecordingStatus('recording');
        
        recordingIntervalRef.current = setInterval(() => {
          recordingDurationRef.current += 1;
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to handle voice note:', error);
      setIsRecording(false);
      setRecordingStatus('idle');
      clearInterval(recordingIntervalRef.current);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
    }
  }
 
  // Handle playing video
  const handlePlayVideo = (url) => {
    Linking.openURL(url);
  };

  // Handle opening document
  const handleOpenDocument = (url) => {
    Linking.openURL(url);
  };

  // Handle reply action
  const handleReply = (message) => {
    setReplyingTo(message);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];
      updatedMessages = updatedMessages.filter((msg) => msg._id !== messageId);
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Delete selected messages
  const handleDeleteSelectedMessages = async () => {
    try {
      setMessages((prev) => prev.filter((msg) => !selectedMessages.includes(msg._id)));
      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];
      updatedMessages = updatedMessages.filter((msg) => !selectedMessages.includes(msg._id));
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
      setSelectedMessages([]);
      setIsMultiSelect(false);
    } catch (error) {
      console.error('Error deleting selected messages:', error);
    }
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Render avatar
  const renderAvatar = (senderId, name, profilePicture) => {
    const isCurrentUser = senderId === user._id;
    const avatarText = name ? name.charAt(0).toUpperCase() : '';

    return (
      <View
        style={[
          styles.avatarContainer,
          { backgroundColor: isCurrentUser ? colors.primary : colors.card },
        ]}
      >
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
        ) : (
          <Text
            style={[
              styles.avatarText,
              { color: isCurrentUser ? colors.background : colors.text },
            ]}
          >
            {avatarText}
          </Text>
        )}
      </View>
    );
  };

  // Update your message rendering logic
  const renderRepliedMessage = (replyToId) => {
    if (!replyToId) return null;
    
    const repliedMessage = messages.find(msg => msg._id === replyToId);
    if (!repliedMessage) return null;

    return (
      <View style={styles.repliedMessageContainer}>
        <Text style={styles.repliedMessageSender}>
          {repliedMessage.sender === user._id ? 'You' : recipient.name}
        </Text>
        <Text style={styles.repliedMessageText} numberOfLines={1}>
          {repliedMessage.text || (repliedMessage.files ? 'Media' : 'Message')}
        </Text>
      </View>
    );
  };

  // Add Reply Preview above input
  const renderReplyPreview = () => {
    if (!replyingTo) return null;

    return (
      <View style={[styles.replyPreviewContainer, { backgroundColor: colors.card }]}>
        <View style={styles.replyPreviewContent}>
          <Text style={[styles.replyPreviewSender, { color: colors.text }]}>
            Replying to {replyingTo.sender === user._id ? 'yourself' : recipient.name}
          </Text>
          <Text
            style={[styles.replyPreviewText, { color: colors.subText }]}
            numberOfLines={1}
          >
            {replyingTo.text || 'Media message'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeReplyButton}
          onPress={() => setReplyingTo(null)}
        >
          <Ionicons name="close" size={hp(2.5)} color={colors.subText} />
        </TouchableOpacity>
      </View>
    );
  };

  // Message Item Component
  const MessageItem = React.memo(
    ({ item, user, recipient, isMultiSelect, selectedMessages, toggleMessageSelection, handleDeleteMessage, colors, onReply }) => {
      const isCurrentUser = item.sender === user._id;
      const sender = isCurrentUser ? user : recipient;
      const isSelected = selectedMessages.includes(item._id);
      const fadeAnim = useRef(new Animated.Value(1)).current;

      const repliedToMessage = item.replyTo ? messages.find((msg) => msg._id === item.replyTo) : null;

      useEffect(() => {
        if (isSelected) {
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }, [isSelected]);

      // Updated renderRightActions for reply
      const renderRightActions = (progress, dragX) => {
        const trans = dragX.interpolate({
          inputRange: [-100, 0],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            style={[
              styles.replyAction,
              { transform: [{ translateX: trans }], backgroundColor: colors.primary },
            ]}
          >
            <TouchableOpacity onPress={() => onReply(item)}>
              <Ionicons name="arrow-undo" size={hp(2.5)} color={colors.background} />
            </TouchableOpacity>
          </Animated.View>
        );
      };

      // Render media preview based on file type
      const renderMediaPreview = (file, index) => {
        const isImage = file.type === 'image';
        const isVideo = file.type === 'video';
        const isAudio = file.type === 'audio';
        const isFile = file.type === 'file';

        if (isImage) {
          return (
            <Image
              source={{ uri: file.url }}
              style={styles.mediaInMessage}
              resizeMode="cover"
            />
          );
        }

        if (isVideo) {
          return (
            <TouchableOpacity
              style={styles.videoContainer}
              onPress={() => handlePlayVideo(file.url)}
            >
              {file.thumbnail ? (
                <Image
                  source={{ uri: file.thumbnail }}
                  style={styles.mediaInMessage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.mediaInMessage,
                    styles.videoFallback,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Ionicons name="play" size={hp(5)} color={colors.text} />
                </View>
              )}
              <Ionicons
                name="play"
                size={hp(4)}
                color={colors.background}
                style={styles.videoPlayIconInMessage}
              />
            </TouchableOpacity>
          );
        }

        if (isAudio || isFile) {
          return (
            <TouchableOpacity
              style={[
                styles.documentContainer,
                isCurrentUser ? styles.currentUserDocument : styles.otherUserDocument,
                {
                  backgroundColor: isCurrentUser ? colors.card : colors.background,
                },
              ]}
              onPress={async () => {
                if (isAudio) {
                  try {
                    const soundObject = new Audio.Sound();
                    await soundObject.loadAsync({ uri: file.url });
                    Alert.alert(
                      'Voice Message',
                      `Duration: ${formatDuration(file.duration || 0)}`,
                      [
                        {
                          text: 'Play',
                          onPress: async () => {
                            await soundObject.playAsync();
                          },
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel',
                          onPress: async () => {
                            await soundObject.unloadAsync();
                          },
                        },
                      ]
                    );
                  } catch (error) {
                    console.error('Error playing audio:', error);
                    Alert.alert('Error', 'Could not play audio message');
                  }
                } else {
                  handleOpenDocument(file.url);
                }
              }}
            >
              <Ionicons
                name={isAudio ? 'musical-notes' : 'document'}
                size={hp(4)}
                color={isCurrentUser ? colors.background : colors.primary}
              />
              <View style={styles.audioInfo}>
                <Text
                  style={[
                    styles.documentName,
                    { color: isCurrentUser ? colors.background : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {isAudio ? 'Voice Message' : file.name}
                </Text>
                {isAudio ? (
                  <Text
                    style={[
                      styles.audioDuration,
                      { color: isCurrentUser ? colors.subText : colors.subText },
                    ]}
                  >
                    {formatDuration(file.duration || 0)}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.documentSize,
                      { color: isCurrentUser ? colors.subText : colors.subText },
                    ]}
                  >
                    {formatFileSize(file.size)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }
  
        return null;
      }

      return (
        <Swipeable
          renderRightActions={renderRightActions}
          overshootRight={false}
          enabled={!isMultiSelect}
        >
          <Pressable
            onLongPress={() => {
              setIsMultiSelect(true);
              toggleMessageSelection(item._id);
            }}
            onPress={() => {
              if (isMultiSelect) {
                toggleMessageSelection(item._id);
              }
            }}
            style={({ pressed }) => [
              styles.messageWrapper,
              isCurrentUser ? styles.currentUserWrapper : styles.otherUserWrapper,
              isSelected && { backgroundColor: colors.card },
              pressed && isMultiSelect && { opacity: 0.8 },
            ]}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {!isCurrentUser && renderAvatar(sender._id, sender.name, sender.profilePicture)}
              <View
                style={[
                  styles.messageContainer,
                  isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
                  {
                    backgroundColor: isCurrentUser ? colors.primary : colors.card,
                    borderColor: item.isRead ? colors.primary : colors.subText,
                    borderWidth: item.isRead ? 1 : 0,
                  },
                ]}
              >
                {repliedToMessage && (
                  <View
                    style={[
                      styles.repliedMessageContainer,
                      {
                        backgroundColor: isCurrentUser
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.05)',
                        borderLeftColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.repliedMessageSender,
                        { color: isCurrentUser ? colors.background : colors.text },
                      ]}
                    >
                      {repliedToMessage.sender === user._id ? user.name : recipient.name}
                    </Text>
                    <Text
                      style={[
                        styles.repliedMessageText,
                        { color: isCurrentUser ? colors.background : colors.subText },
                      ]}
                      numberOfLines={1}
                    >
                      {repliedToMessage.text || 'Media message'}
                    </Text>
                  </View>
                )}
                {item.text && (
                  <Text
                    style={[
                      styles.messageText,
                      isCurrentUser ? styles.currentUserText : styles.otherUserText,
                      { color: isCurrentUser ? colors.background : colors.text },
                    ]}
                  >
                    {item.text}
                  </Text>
                )}

                {item.linkPreview && (
                  <TouchableOpacity
                    style={[
                      styles.linkPreviewInMessage,
                      isCurrentUser
                        ? styles.currentUserLinkPreview
                        : styles.otherUserLinkPreview,
                      { backgroundColor: isCurrentUser ? colors.card : colors.background },
                    ]}
                    onPress={() => Linking.openURL(item.linkPreview.url)}
                  >
                    {item.linkPreview.image && (
                      <Image
                        source={{ uri: item.linkPreview.image }}
                        style={styles.linkPreviewImageInMessage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.linkPreviewTextInMessage}>
                      <Text
                        style={[styles.linkPreviewTitleInMessage, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.linkPreview.title || item.linkPreview.url}
                      </Text>
                      {item.linkPreview.description && (
                        <Text
                          style={[styles.linkPreviewDescriptionInMessage, { color: colors.subText }]}
                          numberOfLines={2}
                        >
                          {item.linkPreview.description}
                        </Text>
                      )}
                      <Text
                        style={[styles.linkPreviewUrlInMessage, { color: colors.primary }]}
                        numberOfLines={1}
                      >
                        {new URL(item.linkPreview.url).hostname}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

              {item.files && item.files.length > 0 && (
                  <View style={styles.filesContainer}>
                    {item.files.map((file, index) => (
                      <View key={index} style={styles.fileContainer}>
                        {renderMediaPreview(file, index)}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
                      { color: isCurrentUser ? colors.subText : colors.subText },
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  {isCurrentUser && (
                    <Ionicons
                      name={
                        item.status === 'failed'
                          ? 'warning'
                          : item.status === 'delivered'
                          ? 'checkmark-done'
                          : item.status === 'read'
                          ? 'checkmark-done'
                          : 'checkmark'
                      }
                      size={hp(2)}
                      color={
                        item.status === 'failed'
                          ? colors.errorText
                          : item.status === 'read'
                          ? colors.primary
                          : colors.subText
                      }
                    />
                  )}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </Swipeable>
      );
    }
  );

  // Format date separator
  const formatDateSeparator = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return messageDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Render message item
  const renderMessageItem = useCallback(
    ({ item, index }) => {
      const showDateSeparator =
        index === 0 ||
        new Date(messages[index - 1].createdAt).toDateString() !== new Date(item.createdAt).toDateString();

      return (
        <>
          {showDateSeparator && (
            <View style={[styles.dateSeparator, { backgroundColor: colors.placeholder}]}>
              <Text style={[styles.dateSeparatorText, { color: colors.text }]}>
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
          )}
          <MessageItem
            item={item}
            user={user}
            recipient={recipient}
            isMultiSelect={isMultiSelect}
            selectedMessages={selectedMessages}
            toggleMessageSelection={toggleMessageSelection}
            handleDeleteMessage={handleDeleteMessage}
            onReply={handleReply}
            colors={colors}
          />
        </>
      );
    },
    [user, recipient, isMultiSelect, selectedMessages, toggleMessageSelection, handleDeleteMessage, handleReply, colors, messages]
  );

  const getStatusBarHeight = () => {
    return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  };

  // Render UI
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: getStatusBarHeight(),
        }}
      >
        <ChatScreenHeader
          colors={colors}
          user={user}
          title={recipient.name}
          recipient={recipient}
          navigation={navigation}
        />

        {recordingStatus === 'recording' && (
          <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]}>
            <View style={styles.recordingDot} />
            <Text style={[styles.recordingText, { color: colors.background }]}>
              Recording: {formatDuration(recordingDuration)}
            </Text>
            <TouchableOpacity
              onPress={handleVoiceNote}
              style={styles.stopRecordingButton}
            >
              <Ionicons name="stop" size={hp(3)} color={colors.background} />
            </TouchableOpacity>
          </View>
        )}

        {isMultiSelect && (
          <View style={[styles.multiSelectHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => {
                setIsMultiSelect(false);
                setSelectedMessages([]);
              }}
            >
              <Ionicons name="close" size={hp(3)} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.multiSelectTitle, { color: colors.text }]}>
              {selectedMessages.length} Selected
            </Text>
            <TouchableOpacity
              onPress={handleDeleteSelectedMessages}
              disabled={selectedMessages.length === 0}
            >
              <Ionicons
                name="trash"
                size={hp(3)}
                color={selectedMessages.length > 0 ? colors.errorText : colors.subText}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.chatBackground, { backgroundColor: colors.background }]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={<TypingIndicator isTyping={isTyping} colors={colors} />}
          />
        </View>

        {selectedMedia.length > 0 && (
          <ScrollView
            horizontal
            style={[styles.mediaPreviewScroll, { backgroundColor: colors.card }]}
            contentContainerStyle={styles.mediaPreviewScrollContent}
          >
            {selectedMedia.map((media) => (
              <MediaPreview
                key={media.id}
                media={media}
                onRemove={removeMedia}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}

        {linkPreview && (
          <LinkPreview preview={linkPreview} onRemove={removeLinkPreview} colors={colors} />
        )}

        {renderReplyPreview()}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.inputContainer, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.card }]}
            onPress={() => setMediaModalVisible(true)}
          >
            <Ionicons name="add" size={hp(3.5)} color={colors.primary} />
          </TouchableOpacity>

          {!newMessage.trim() && !linkPreview && (
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="image-outline" size={hp(3.5)} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.inputBg, color: colors.text },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />

            {newMessage.trim() || selectedMedia.length > 0 || linkPreview ? (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleSendMessage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons
                    name="send"
                    size={hp(2)}
                    color={colors.background}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleVoiceNote}
                onLongPress={handleVoiceNote}
              >
                <Ionicons
                  name={isRecording ? 'mic-off' : 'mic'}
                  size={hp(2.5)}
                  color={colors.background}
                />
              </TouchableOpacity>
            )}
        </KeyboardAvoidingView>

        <MediaUploadModal
          visible={mediaModalVisible}
          onClose={() => setMediaModalVisible(false)}
          onSelectMedia={handleSelectMedia}
          onSelectDocument={handleSelectDocument}
          colors={colors}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: wp(3),
    paddingBottom: hp(1),
    flexGrow: 1,
  },
  chatBackground: {
    flex: 1,
  },

  // Date separator
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    marginVertical: hp(1),
  },
  dateSeparatorText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '500',
  },

  // Multi-select header
  multiSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#FFFFFF',
  },
  multiSelectTitle: {
    fontSize: hp(2),
    fontWeight: '600',
  },

  // Message wrapper
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: hp(0.5),
  },
  currentUserWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  otherUserWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  // Avatar styles
  avatarContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(1.5),
    backgroundColor: '#E0E0E0',
    marginBottom: hp(1)
  },
  avatarImage: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  avatarText: {
    fontSize: hp(2),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Message bubbles
  messageContainer: {
    maxWidth: wp(65),
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    marginVertical: hp(0.8),
  },
  currentUserMessage: {
    borderBottomRightRadius: wp(1),
    marginLeft: wp(30)
  },
  otherUserMessage: {
    borderBottomLeftRadius: wp(1),
    marginRight: wp(30), 
  },
  messageText: {
    fontSize: hp(2),
    lineHeight: hp(2.6),
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },

  // Message footer
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: hp(0.3),
  },
  messageTime: {
    fontSize: hp(1.3),
    color: '#999999',
    marginRight: wp(1),
  },

  // Swipe actions
  deleteAction: {
    width: wp(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
  },

  // Media in messages
  filesContainer: {
    marginTop: hp(0.8),
  },
  fileContainer: {
    marginBottom: hp(0.5),
  },
  mediaInMessage: {
    width: wp(60),
    height: hp(25),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  videoContainer: {
    position: 'relative',
  },
  videoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  videoPlayIconInMessage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -wp(3),
    marginTop: -wp(3),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(6),
    padding: wp(1),
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2.5),
    borderRadius: wp(3),
    backgroundColor: '#F7F7F7',
  },
  documentName: {
    flex: 1,
    marginHorizontal: wp(2),
    fontSize: hp(1.7),
    color: '#333333',
  },
  documentSize: {
    fontSize: hp(1.4),
    color: '#666666',
  },

  // Link previews
  linkPreviewInMessage: {
    width: wp(60),
    borderRadius: wp(3),
    overflow: 'hidden',
    marginTop: hp(0.8),
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  linkPreviewImageInMessage: {
    width: '100%',
    height: hp(15),
  },
  linkPreviewTextInMessage: {
    padding: wp(2.5),
  },
  linkPreviewTitleInMessage: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333333',
    marginBottom: hp(0.5),
  },
  linkPreviewDescriptionInMessage: {
    fontSize: hp(1.5),
    color: '#666666',
    marginBottom: hp(0.5),
  },
  linkPreviewUrlInMessage: {
    fontSize: hp(1.4),
    color: '#0084FF',
  },

  // Input area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    minHeight: hp(5),
    maxHeight: hp(12),
    borderRadius: wp(6),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(2),
    backgroundColor: '#F2F2F7',
    color: '#000000',
    marginHorizontal: wp(2),
  },
  mediaButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  sendButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0084FF',
  },

  // Media preview (before sending)
  mediaPreviewScroll: {
    maxHeight: hp(15),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  mediaPreviewScrollContent: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginRight: wp(2),
  },
  mediaPreviewImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  videoPreviewContainer: {
    position: 'relative',
  },
  videoPreview: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -wp(4),
    marginTop: -wp(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(6),
    padding: wp(1),
  },
  filePreviewContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: wp(2),
  },
  fileName: {
    fontSize: hp(1.4),
    marginTop: hp(0.5),
    textAlign: 'center',
    color: '#333333',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(5),
    padding: wp(0.5),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // Link preview (before sending)
  linkPreviewContainer: {
    marginHorizontal: wp(3),
    marginBottom: hp(1),
    borderRadius: wp(3),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  linkPreviewImage: {
    width: '100%',
    height: hp(15),
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
  },
  linkPreviewTextContainer: {
    padding: wp(2.5),
  },
  linkPreviewTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333333',
    marginBottom: hp(0.5),
  },
  linkPreviewDescription: {
    fontSize: hp(1.5),
    color: '#666666',
    marginBottom: hp(0.5),
  },
  linkPreviewUrl: {
    fontSize: hp(1.4),
    color: '#0084FF',
  },
  removeLinkButton: {
    position: 'absolute',
    top: wp(1.5),
    right: wp(1.5),
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: wp(5),
    padding: wp(1),
  },

  // Media selection modal
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    padding: wp(4),
    paddingBottom: hp(5),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: hp(2.5),
    fontWeight: '600',
    color: '#333333',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    alignItems: 'center',
    padding: wp(3),
    backgroundColor: '#F2F2F7',
    borderRadius: wp(3),
    width: wp(25),
  },
  mediaOptionText: {
    marginTop: hp(1),
    fontSize: hp(1.7),
    color: '#333333',
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    marginLeft: wp(12),
    borderRadius: wp(4),
    backgroundColor: '#FFFFFF',
    marginVertical: hp(1),
    width: wp(20),
  },
  typingDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#999999',
    marginHorizontal: wp(1),
  },
  // Reply action
  replyAction: {
    width: wp(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
    backgroundColor: '#0084FF', // Use primary color
  },

  // Reply preview
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginBottom: hp(1),
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#333333',
  },
  replyPreviewText: {
    fontSize: hp(1.5),
    color: '#666666',
    marginTop: hp(0.3),
  },
  closeReplyButton: {
    padding: wp(2),
  },
  repliedMessageContainer: {
    borderLeftWidth: wp(1),
    paddingLeft: wp(2),
    paddingVertical: hp(0.5),
    marginBottom: hp(0.8),
    borderRadius: wp(2),
  },
  repliedMessageSender: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  repliedMessageText: {
    fontSize: hp(1.5),
    marginTop: hp(0.3),
  },
  audioInfo: {
    flex: 1,
    marginLeft: wp(2),
  },
  audioDuration: {
    fontSize: hp(1.4),
    color: '#666',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
  },
  recordingDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: '#FFFFFF',
    marginRight: wp(2),
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
    marginRight: wp(3),
  },
  stopRecordingButton: {
    position: 'absolute',
    right: wp(3),
  },
  audioInfo: {
    flex: 1,
    marginLeft: wp(2),
  },
  audioDuration: {
    fontSize: hp(1.4),
    color: '#666',
    marginTop: hp(0.5),
  },
});


my code look rough and not cool so i have created a helper folder in my root dir and i also have component in my root directy so estructure this code let it look good and readable for others and make it nice too

write the complete codes and dont short it

my folder 
chatify/
   app/
      (protected)/
          (tabs)/
             chats/
                [chatId]/
                    index.js // which is chatScreen
             index.js
   assets/
  components/
   constants/
   contexts/
  helper/
   utils/
 config.js
...