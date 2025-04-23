import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar, Modal, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../../utils/theme';
import { io } from "socket.io-client";
import config from '../../../../../config';
import { decryptMessage, encryptMessage } from '../../../../../utils/encryption';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreenHeader from '../../../../../components/Headers/ChatScreenHeader';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Video } from 'expo-av';
import { ScrollView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import axios from 'axios';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Linking from 'expo-linking';

// Message status constants
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

// Media Upload Modal Component
const MediaUploadModal = ({ visible, onClose, onSelectMedia, onSelectDocument, colors }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Media</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.mediaOptions}>
          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => onSelectMedia('photo')}
          >
            <Ionicons name="image" size={30} color={colors.primary} />
            <Text style={[styles.mediaOptionText, { color: colors.text }]}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaOption}
            onPress={() => onSelectMedia('video')}
          >
            <Ionicons name="videocam" size={30} color={colors.primary} />
            <Text style={[styles.mediaOptionText, { color: colors.text }]}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaOption}
            onPress={onSelectDocument}
          >
            <Ionicons name="document" size={30} color={colors.primary} />
            <Text style={[styles.mediaOptionText, { color: colors.text }]}>Document</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Media Preview Component
const MediaPreview = ({ media, onRemove, colors }) => {
  const renderMedia = () => {
    if (media.type === 'image') {
      return (
        <Image
          source={{ uri: media.uri }}
          style={styles.mediaPreviewImage}
          resizeMode="cover"
        />
      );
    } else if (media.type === 'video') {
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
          <Ionicons
            name="play"
            size={40}
            color="white"
            style={styles.videoPlayIcon}
          />
        </View>
      );
    } else {
      return (
        <View style={[styles.filePreviewContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="document" size={40} color={colors.primary} />
          <Text
            style={[styles.fileName, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {media.name}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.mediaPreviewContainer}>
      {renderMedia()}
      <TouchableOpacity
        style={styles.removeMediaButton}
        onPress={() => onRemove(media.id)}
      >
        <Ionicons name="close-circle" size={24} color={colors.errorText} />
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
        <Image
          source={{ uri: preview.image }}
          style={styles.linkPreviewImage}
          resizeMode="cover"
        />
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
      <TouchableOpacity
        style={styles.removeLinkButton}
        onPress={onRemove}
      >
        <Ionicons name="close" size={20} color={colors.subText} />
      </TouchableOpacity>
    </View>
  );
};

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
  const flatListRef = useRef();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Extract URLs for link preview
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = newMessage.match(urlRegex);

    if (urls && urls.length > 0) {
      const fetchLinkPreview = async () => {
        try {
          const response = await axios.post(`${config.API_URL}/messages/link-preview`,
            { url: urls[0] },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
              }
            }
          );
          setLinkPreview(response.data);
        } catch (error) {
          console.error('Error fetching link preview:', error);
          setLinkPreview(null);
        }
      };
      fetchLinkPreview();
    } else {
      setLinkPreview(null);
    }
  }, [newMessage, user.token]);

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
          size: asset.fileSize || 0
        };

        if (type === 'video') {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(mediaItem.uri, {
              time: 1000,
            });
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

        setSelectedMedia(prev => [...prev, mediaItem]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
    }
  };

  // Handle document selection
  const handleSelectDocument = async () => {
    setMediaModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const fileItem = {
          id: Date.now().toString(),
          uri: result.uri,
          type: 'file',
          name: result.name,
          size: result.size || 0
        };
        setSelectedMedia(prev => [...prev, fileItem]);
      }
    } catch (error) {
      console.error('Error selecting document:', error);
    }
  };

  // Remove media
  const removeMedia = (id) => {
    setSelectedMedia(prev => prev.filter(item => item.id !== id));
  };

  // Remove link preview
  const removeLinkPreview = () => {
    setLinkPreview(null);
    setNewMessage(newMessage.replace(/(https?:\/\/[^\s]+)/g, ''));
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedMedia.length === 0) return [];

    setUploading(true);
    const formData = new FormData();

    selectedMedia.forEach((media, index) => {
      const fileType = media.type === 'image' ? 'image/jpeg' :
                       media.type === 'video' ? 'video/mp4' :
                       'application/octet-stream';

      const file = {
        uri: media.uri,
        name: media.name || `file_${index}`,
        type: fileType
      };
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${config.API_URL}/messages/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      });
      setUploading(false);
      setSelectedMedia([]);
      return response.data || [];
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploading(false);
      return [];
    }
  };

  // Validate recipient
  if (!recipient || !recipient._id) {
    console.error('Recipient is undefined or missing _id');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>Error: Invalid recipient</Text>
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
      reconnectionDelay: 1000
    });

    setSocket(socketInstance);

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

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, chatId]);

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

        setMessages(prev => {
          const exists = prev.some(
            msg =>
              msg._id === decrypted._id ||
              (msg.text === decrypted.text &&
               msg.sender === decrypted.sender &&
               Math.abs(new Date(msg.createdAt) - new Date(decrypted.createdAt)) < 1000)
          );
          if (exists) {
            return prev.map(msg =>
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
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.DELIVERED } : msg
      ));
    };

    const handleMessageFailed = ({ messageId }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
      ));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-delivered', handleMessageDelivered);
    socket.on('message-error', handleMessageFailed);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-delivered', handleMessageDelivered);
      socket.off('message-error', handleMessageFailed);
    };
  }, [socket, user?._id, recipient?._id]);

  // Load messages from storage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(`messages_${chatId}`);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);

          const decryptedMessages = await Promise.all(
            parsedMessages.map(async msg => {
              try {
                const decrypted = decryptMessage(msg, user._id, recipient._id);
                return decrypted || msg;
              } catch (decryptError) {
                console.error('Error decrypting message:', decryptError);
                return msg;
              }
            })
          );

          setMessages(decryptedMessages.filter(m => m));
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
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
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
        encrypted: true
      };

      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];

      if (!updatedMessages.some(msg => msg._id === encryptedMsg._id)) {
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

      const existingIndex = chats.findIndex(chat => chat.chatId === chatId);
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
      status: MESSAGE_STATUS.SENDING,
      createdAt: new Date().toISOString(),
      encrypted: true
    };

    try {
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      setLinkPreview(null);

      const encryptedMessage = encryptMessage(
        { text: newMessage },
        user._id,
        recipient._id
      );

      if (isConnected) {
        socket.emit('send-message', {
          chatId,
          encryptedMessage,
          recipientId: recipient._id,
          files,
          link: linkPreview?.url
        });
      } else {
        await AsyncStorage.setItem(`pending_${messageId}`, JSON.stringify({
          chatId,
          encryptedMessage,
          recipientId: recipient._id,
          files,
          link: linkPreview?.url
        }));
      }

      await saveMessageToStorage(messageData);
      await updateChatsList(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg =>
        msg._id === messageData._id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  // Handle playing video
  const handlePlayVideo = (url) => {
    Linking.openURL(url);
  };

  // Handle opening document
  const handleOpenDocument = (url) => {
    Linking.openURL(url);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render avatar
  const renderAvatar = (senderId, name, profilePicture) => {
    const isCurrentUser = senderId === user._id;
    const avatarText = name ? name.charAt(0).toUpperCase() : '';

    return (
      <View style={[styles.avatarContainer, { backgroundColor: isCurrentUser ? colors.primary : colors.card }]}>
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={[styles.avatarText, { color: isCurrentUser ? colors.background : colors.text }]}>
            {avatarText}
          </Text>
        )}
      </View>
    );
  };

  // Render message item
  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.sender === user._id;
    const sender = isCurrentUser ? user : recipient;

    return (
      <View style={[
        styles.messageWrapper,
        isCurrentUser ? styles.currentUserWrapper : styles.otherUserWrapper
      ]}>
        {renderAvatar(sender._id, sender.name, sender.profilePicture)}
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          { backgroundColor: isCurrentUser ? colors.primary : colors.card }
        ]}>
          {item.text && (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
              { color: isCurrentUser ? colors.background : colors.text }
            ]}>
              {item.text}
            </Text>
          )}

          {item.linkPreview && (
            <TouchableOpacity
              style={[
                styles.linkPreviewInMessage,
                isCurrentUser ? styles.currentUserLinkPreview : styles.otherUserLinkPreview,
                { backgroundColor: isCurrentUser ? colors.card : colors.background }
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
                <Text style={[styles.linkPreviewTitleInMessage, { color: colors.text }]} numberOfLines={1}>
                  {item.linkPreview.title || item.linkPreview.url}
                </Text>
                {item.linkPreview.description && (
                  <Text style={[styles.linkPreviewDescriptionInMessage, { color: colors.subText }]} numberOfLines={2}>
                    {item.linkPreview.description}
                  </Text>
                )}
                <Text style={[styles.linkPreviewUrlInMessage, { color: colors.primary }]} numberOfLines={1}>
                  {new URL(item.linkPreview.url).hostname}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {item.files && item.files.length > 0 && (
            <View style={styles.filesContainer}>
              {item.files.map((file, index) => (
                <View key={index} style={styles.fileContainer}>
                  {file.type === 'image' && (
                    <Image
                      source={{ uri: file.url }}
                      style={styles.mediaInMessage}
                      resizeMode="cover"
                    />
                  )}

                  {file.type === 'video' && (
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
                        <View style={[styles.mediaInMessage, styles.videoFallback, { backgroundColor: colors.card }]}>
                          <Ionicons name="play" size={40} color={colors.text} />
                        </View>
                      )}
                      <Ionicons
                        name="play"
                        size={30}
                        color={colors.background}
                        style={styles.videoPlayIconInMessage}
                      />
                    </TouchableOpacity>
                  )}

                  {(file.type === 'file' || file.type === 'audio') && (
                    <TouchableOpacity
                      style={[
                        styles.documentContainer,
                        isCurrentUser ? styles.currentUserDocument : styles.otherUserDocument,
                        { backgroundColor: isCurrentUser ? colors.card : colors.background }
                      ]}
                      onPress={() => handleOpenDocument(file.url)}
                    >
                      <Ionicons
                        name={file.type === 'audio' ? 'musical-notes' : 'document'}
                        size={30}
                        color={isCurrentUser ? colors.background : colors.primary}
                      />
                      <Text
                        style={[
                          styles.documentName,
                          { color: isCurrentUser ? colors.background : colors.text }
                        ]}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <Text
                        style={[
                          styles.documentSize,
                          { color: isCurrentUser ? colors.subText : colors.subText }
                        ]}
                      >
                        {formatFileSize(file.size)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              { color: isCurrentUser ? colors.subText : colors.subText }
            ]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            {isCurrentUser && (
              <Ionicons
                name={
                  item.status === 'failed' ? 'warning' :
                  item.status === 'delivered' ? 'checkmark-done' :
                  'checkmark'
                }
                size={14}
                color={
                  item.status === 'failed' ? colors.errorText :
                  isCurrentUser ? colors.subText : colors.subText
                }
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const getStatusBarHeight = () => {
    return Platform.OS === 'android'
      ? RNStatusBar.currentHeight || 0
      : 0;
  };

  // Render UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: getStatusBarHeight() }}>
      <ChatScreenHeader
        colors={colors}
        user={user}
        title={recipient.name}
        recipient={recipient}
        navigation={navigation}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {selectedMedia.length > 0 && (
        <ScrollView
          horizontal
          style={[styles.mediaPreviewScroll, { backgroundColor: colors.card, borderTopColor: colors.border }]}
          contentContainerStyle={styles.mediaPreviewScrollContent}
        >
          {selectedMedia.map(media => (
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
        <LinkPreview
          preview={linkPreview}
          onRemove={removeLinkPreview}
          colors={colors}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => setMediaModalVisible(true)}
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={uploading || (!newMessage.trim() && selectedMedia.length === 0 && !linkPreview)}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="send"
              size={24}
              color={
                (newMessage.trim() || selectedMedia.length > 0 || linkPreview) ?
                colors.primary : colors.subText
              }
            />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <MediaUploadModal
        visible={mediaModalVisible}
        onClose={() => setMediaModalVisible(false)}
        onSelectMedia={handleSelectMedia}
        onSelectDocument={handleSelectDocument}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  // Main container styles
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  // Message wrapper for avatar and message
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  currentUserWrapper: {
    flexDirection: 'row-reverse',
  },
  otherUserWrapper: {
    flexDirection: 'row',
  },

  // Avatar styles
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Message bubbles
  messageContainer: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: hp(1.5),
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserMessage: {
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  currentUserText: {},
  otherUserText: {},

  // Message footer (time + status)
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  currentUserTime: {},
  otherUserTime: {},

  // Media in messages
  filesContainer: {
    marginTop: 8,
  },
  fileContainer: {
    marginBottom: 2,
  },
  mediaInMessage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
  },
  videoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIconInMessage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -15,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  currentUserDocument: {},
  documentName: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
  },
  documentSize: {
    fontSize: 12,
  },

  // Link previews
  linkPreviewInMessage: {
    width: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  currentUserLinkPreview: {},
  otherUserLinkPreview: {},
  linkPreviewImageInMessage: {
    width: '100%',
    height: 100,
  },
  linkPreviewTextInMessage: {
    padding: 8,
  },
  linkPreviewTitleInMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  linkPreviewDescriptionInMessage: {
    fontSize: 12,
    marginBottom: 4,
  },
  linkPreviewUrlInMessage: {
    fontSize: 11,
  },

  // Input area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  mediaButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },

  // Media preview (before sending)
  mediaPreviewScroll: {
    maxHeight: 120,
    borderTopWidth: 1,
  },
  mediaPreviewScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginRight: 8,
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoPreviewContainer: {
    position: 'relative',
  },
  videoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  filePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fileName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  // Link preview (before sending)
  linkPreviewContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  linkPreviewImage: {
    width: 80,
    height: 80,
  },
  linkPreviewTextContainer: {
    flex: 1,
    padding: 10,
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  linkPreviewDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  linkPreviewUrl: {
    fontSize: 11,
  },
  removeLinkButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    padding: 2,
  },

  // Media selection modal
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    alignItems: 'center',
    padding: 16,
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 14,
  },
});
