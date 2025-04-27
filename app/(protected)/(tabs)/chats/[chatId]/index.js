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
  ActivityIndicator,
} from 'react-native';
import { ScrollView, GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useTheme } from '../../../../../contexts/ThemeContext';
import config from '../../../../../config';
import { getThemeColors } from '../../../../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { decryptMessage, encryptMessage } from '../../../../../utils/encryption';
import { initializeSocket, setupMessageListeners } from '../../../../../helper/Chat/socketUtils';
import {
  loadMessagesFromStorage,
  saveMessageToStorage,
  updateChatsList,
  updateMessageInStorage,
} from '../../../../../helper/Chat/storageUtils';
import { sendMessage, uploadFiles } from '../../../../../helper/Chat/messageUtils';
import {
  handleSelectMedia,
  handleSelectDocument,
  handleVoiceNote,
} from '../../../../../helper/Chat/mediaUtils';
import ChatScreenHeader from '../../../../../components/Headers/ChatScreenHeader';
import MediaUploadModal from '../../../../../components/Chat/MediaUploadModal';
import MediaPreview from '../../../../../components/Chat/MediaPreview';
import LinkPreview from '../../../../../components/Chat/LinkPreview';
import TypingIndicator from '../../../../../components/Chat/TypingIndicator';
import MessageItem from '../../../../../components/Chat/MessageItem';
import ReplyPreview from '../../../../../components/Chat/ReplyPreview';
import RecordingIndicator from '../../../../../components/Chat/RecordingIndicator';
import styles from '../../../../../styles/Styles';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import GifModal from '../../../../../components/Chat/GifModal';
import CallScreen from '../../../../../components/Chat/CallScreen'; 
import IncomingCallModal from '../../../../../components/Chat/IncomingCallModal';

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
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);
  const seenMessageIds = useRef(new Set());
  const recordingDurationRef = useRef(0);
  const recordingIntervalRef = useRef(null);
  const recordingRef = useRef(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null); 
  const [callType, setCallType] = useState(null); 
  const [callerId, setCallerId] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [followStatuses, setFollowStatuses] = useState({});
  


  if (!recipient || !recipient._id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: wp(4) }}>Error: Invalid recipient</Text>
      </SafeAreaView>
    );
  }



  // Socket setup
  useEffect(() => {
    if (!user?._id) return;
    const socketInstance = initializeSocket(
      config.API_URL,
      user._id,
      chatId,
      setIsConnected,
      setSocket,
      setIsTyping,
      recipient._id,
      typingTimeoutRef
    );
    setSocket(socketInstance);

    const cleanup = setupMessageListeners(
      socketInstance,
      user._id,
      recipient._id,
      setMessages,
      saveMessageToStorage,
      updateChatsList,
      chatId,
      seenMessageIds
    );

    socketInstance.on('incoming-call', ({ chatId: incomingChatId, callerId: incomingCallerId, callType }) => {
      if (incomingChatId === chatId) {
        setCallState('incoming');
        setCallType(callType);
        setCallerId(incomingCallerId);
        setIsIncoming(true);
      }
    });

    socketInstance.on('call-accepted', ({ chatId: incomingChatId, acceptorId }) => {
      if (incomingChatId === chatId && acceptorId === recipient._id) {
        setCallState('active');
        setIsIncoming(false);
      }
    });

    socketInstance.on('call-rejected', ({ chatId: incomingChatId }) => {
      if (incomingChatId === chatId) {
        setCallState(null);
        setCallType(null);
        setCallerId(null);
        setIsIncoming(false);
      }
    });

    socketInstance.on('call-ended', ({ chatId: incomingChatId }) => {
      if (incomingChatId === chatId) {
        setCallState(null);
        setCallType(null);
        setCallerId(null);
        setIsIncoming(false);
      }
    });

    return () => {
      cleanup();
      socketInstance.off('incoming-call');
      socketInstance.off('call-accepted');
      socketInstance.off('call-rejected');
      socketInstance.off('call-ended');
      socketInstance.disconnect();
    };
  }, [user._id, chatId, recipient._id]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(err => console.error('Cleanup error:', err));
        recordingRef.current = null;
      }
      clearInterval(recordingIntervalRef.current);
    };
  }, []);

    useEffect(() => {
      const initializeChat = async () => {
        try {
          const response = await fetch(`${config.API_URL}/chats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              participantId: recipient._id,
            }),
          });
    
          if (!response.ok) throw new Error('Failed to initialize chat');
          const chat = await response.json();
    
          // Update local storage with the new chat
          await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify([chat]));
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };
    
      initializeChat();
    },[chatId, user._id, recipient._id]) 

  // Typing handling
  useEffect(() => {
    if (!socket || !newMessage.trim()) {
      socket?.emit('stop-typing', { chatId, senderId: user._id });
      return;
    }

    socket?.emit('typing', { chatId, senderId: user._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop-typing', { chatId, senderId: user._id });
    }, 2000);

    return () => clearTimeout(typingTimeoutRef.current);
  }, [newMessage, socket, chatId, user._id]);

  // Mark messages as read
  useEffect(() => {
    if (!socket || !user._id) return;
    socket.emit('mark-messages-read', { chatId, userId: user._id });
  }, [socket, chatId, user._id]);

  // Load messages
  useEffect(() => {
    loadMessagesFromStorage(chatId, user._id, recipient._id, setMessages);
    seenMessageIds.current.clear(); // Reset seen messages on load
  }, [chatId, user._id, recipient._id]);

  // Navigation setup
  useLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: false, swipeEnabled: false });
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedMedia.length === 0 && !linkPreview) return;

    const messageId = uuidv4();
    const files = selectedMedia.length > 0
      ? await uploadFiles(selectedMedia, user.token, setUploading, setSelectedMedia)
      : [];

    try {
      const messageData = {
        _id: messageId,
        text: newMessage,
        sender: user._id,
        recipient: recipient._id,
        chatId,
        files,
        linkPreview,
        replyTo: replyingTo?._id || null,
        status: 'sending',
        createdAt: new Date().toISOString(),
        encrypted: true,
      };

      // Encrypt message
      const encryptedMessage = encryptMessage(messageData, user._id, recipient._id);
      const decryptedMessage = decryptMessage(encryptedMessage, user._id, recipient._id);

      // Save to local storage
      await saveMessageToStorage(encryptedMessage);
      setMessages(prev => {
        if (seenMessageIds.current.has(messageId)) return prev;
        seenMessageIds.current.add(messageId);
        return [...prev, decryptedMessage];
      });

      // Clear inputs
      setNewMessage('');
      setLinkPreview(null);
      setReplyingTo(null);
      setSelectedMedia([]);

      // Send message
      const result = await sendMessage({
        messageData: encryptedMessage,
        socket,
        isConnected,
        chatId,
        recipientId: recipient._id,
        userId: user._id,
      });

      if (result.shouldReplace) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === result.tempId
              ? { ...msg, _id: result.serverId, status: 'sent' }
              : msg
          )
        );
        await updateMessageInStorage(chatId, result.tempId, {
          _id: result.serverId,
          status: 'sent',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  // Retry failed message
  const handleRetryMessage = async messageId => {
    const message = messages.find(msg => msg._id === messageId);
    if (!message) return;

    try {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'sending' } : msg
        )
      );

      const result = await sendMessage({
        messageData: message,
        socket,
        isConnected,
        chatId,
        recipientId: recipient._id,
        userId: user._id,
      });

      if (result.shouldReplace) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === result.tempId
              ? { ...msg, _id: result.serverId, status: 'sent' }
              : msg
          )
        );
        await updateMessageInStorage(chatId, result.tempId, {
          _id: result.serverId,
          status: 'sent',
        });
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const handleDeleteMessage = async messageId => {
    try {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      seenMessageIds.current.delete(messageId);
      const existingIDC = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingIDC ? JSON.parse(existingIDC) : [];
      updatedMessages = updatedMessages.filter(msg => msg._id !== messageId);
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    try {
      setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg._id)));
      selectedMessages.forEach(id => seenMessageIds.current.delete(id));
      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];
      updatedMessages = updatedMessages.filter(msg => !selectedMessages.includes(msg._id));
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
      setSelectedMessages([]);
      setIsMultiSelect(false);
    } catch (error) {
      console.error('Error deleting selected messages:', error);
    }
  };

  const toggleMessageSelection = messageId => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const formatDateSeparator = date => {
    const today = new Date();
    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return messageDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const renderMessageItem = useCallback(
    ({ item, index }) => {
      const showDateSeparator =
        index === 0 ||
        new Date(messages[index - 1].createdAt).toDateString() !== new Date(item.createdAt).toDateString();

      return (
        <>
          {showDateSeparator && (
            <View style={[styles.dateSeparator, { backgroundColor: colors.placeholder }]}>
              <Text style={[styles.dateSeparatorText, { color: colors.text }]}>
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
          )}
          <MessageItem
            item={item}
            user={user}
            setIsMultiSelect={setIsMultiSelect}
            recipient={recipient}
            isMultiSelect={isMultiSelect}
            selectedMessages={selectedMessages}
            toggleMessageSelection={toggleMessageSelection}
            handleDeleteMessage={handleDeleteMessage}
            handleRetryMessage={handleRetryMessage}
            onReply={setReplyingTo}
            colors={colors}
            messages={messages}
            followStatuses={followStatuses}
            setFollowStatuses={setFollowStatuses}
          />
        </>
      );
    },
    [user, recipient, isMultiSelect, selectedMessages, toggleMessageSelection, handleDeleteMessage, handleRetryMessage, colors, messages]
  );

  const handleSelectGif = (gif) => {
    setSelectedMedia(prev => [
      ...prev,
      {
        id: `gif_${gif.id}`,
        uri: gif.uri,
        type: 'gif', // Explicitly set type as 'gif'
        name: gif.name || `gif_${gif.id}.gif`, // Fallback to a generated name if gif.name is undefined
        size: gif.size || 0, // Size may not be available from GIPHY API
      },
    ]);
    setGifModalVisible(false); // Close the modal after selection
  };

  const getStatusBarHeight = () => {
    return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  };

  const onVoiceNote = () => {
    console.log('recordingRef:', recordingRef);
    if (!recordingRef) {
      console.error('recordingRef is undefined');
      return;
    }
    handleVoiceNote(
      isRecording,
      recordingRef, 
      setIsRecording,
      setRecordingStatus,
      setSelectedMedia,
      recordingDurationRef,
      recordingIntervalRef,
      setRecordingDuration
    );
  };

  const initiateCall = callType => {
    socket?.emit('initiate-call', {
      chatId,
      recipientId: recipient._id,
      callType,
    });
    setCallState('active');
    setCallType(callType);
    setCallerId(user._id);
    setIsIncoming(false);
  };

  const acceptCall = () => {
    socket?.emit('accept-call', { chatId, callerId });
    setCallState('active');
    setIsIncoming(false);
  };

  const rejectCall = () => {
    socket?.emit('reject-call', { chatId, callerId });
    setCallState(null);
    setCallType(null);
    setCallerId(null);
    setIsIncoming(false);
  };

  const endCall = () => {
    socket?.emit('end-call', { chatId, recipientId: recipient._id });
    setCallState(null);
    setCallType(null);
    setCallerId(null);
    setIsIncoming(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: getStatusBarHeight() }}>
        <ChatScreenHeader
          colors={colors}
          user={user}
          title={recipient.name}
          recipient={recipient}
          navigation={navigation}
          initiateCall={initiateCall}
        />
        <RecordingIndicator
          recordingStatus={recordingStatus}
          recordingDuration={recordingDuration}
          colors={colors}
          onStop={onVoiceNote}
        />
        {isMultiSelect && (
          <View style={[styles.multiSelectHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => { setIsMultiSelect(false); setSelectedMessages([]); }}>
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
            keyExtractor={item => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            {selectedMedia.map(media => (
              <MediaPreview
                key={media.id}
                media={media}
                onRemove={() => setSelectedMedia(prev => prev.filter(item => item.id !== media.id))}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}
        {linkPreview && (
          <LinkPreview
            preview={linkPreview}
            onRemove={() => {
              setLinkPreview(null);
              setNewMessage(newMessage.replace(/(https?:\/\/[^\s]+)/g, ''));
            }}
            colors={colors}
          />
        )}
        <ReplyPreview
          replyingTo={replyingTo}
          user={user}
          recipient={recipient}
          colors={colors}
          onClose={() => setReplyingTo(null)}
        />
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
              onLongPress={() => handleSelectMedia('photo', setSelectedMedia)}
              onPress={() => setGifModalVisible(true)} 
            >
              <Ionicons name="image-outline" size={hp(3.5)} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
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
                <Ionicons name="send" size={hp(2)} color={colors.background} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={onVoiceNote}
              onLongPress={onVoiceNote}
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
          onSelectMedia={type => handleSelectMedia(type, setSelectedMedia, setMediaModalVisible)}
          onSelectDocument={() => handleSelectDocument(setSelectedMedia, setMediaModalVisible)}
          colors={colors}
        />
        <GifModal
          visible={gifModalVisible}
          onClose={() => setGifModalVisible(false)}
          onSelectGif={handleSelectGif}
          colors={colors}
        />

        <IncomingCallModal
          visible={callState === 'incoming'}
          caller={recipient} 
          chatId={chatId}
          callType={callType}
          onAccept={acceptCall}
          onReject={rejectCall}
          colors={colors}
        />

        {callState === 'active' && (
          <CallScreen
            chatId={chatId}
            recipient={recipient}
            callType={callType}
            callerId={callerId}
            isIncoming={isIncoming}
            socket={socket}
            user={user}
            onEndCall={endCall}
            colors={colors}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}