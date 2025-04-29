// app/(protected)/(tabs)/chat/[chatId].js
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
  Alert,
  BackHandler,
} from 'react-native';
import { ScrollView, GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useSocket } from '../../../../../contexts/SocketContext';
import { useBlock } from '../../../../../contexts/BlockContext';
import config from '../../../../../config';
import { getThemeColors } from '../../../../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { decryptMessage, encryptMessage } from '../../../../../utils/encryption';
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
import debounce from 'lodash/debounce'; 
import axios from 'axios';

export default function ChatScreen() {
  const { chatId, recipient: recipientString } = useLocalSearchParams();
  const recipient = recipientString ? JSON.parse(recipientString) : null;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket, isConnected } = useSocket();
  const { blockUser, unblockUser, checkBlockStatus, isBlockedByUser, fetchBlockedUsers } = useBlock();
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
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [followStatuses, setFollowStatuses] = useState({});
  const [isBlocked, setIsBlocked] = useState(false); 
  const [isBlockedByTargetUser, setIsBlockedByTargetUser] = useState(false);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);
  const seenMessageIds = useRef(new Set());
  const recordingDurationRef = useRef(0);
  const recordingIntervalRef = useRef(null);
  const recordingRef = useRef(null);


  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true; // Prevent default behavior
    });
    

    return () => backHandler.remove();
  }, [navigation]);


  // For URL Regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const fetchLinkPreview = useCallback(
    debounce(async (url) => {
      try {
        const response = await axios.post(
          `${config.API_URL}/messages/link-preview`,
          { url },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setLinkPreview(response.data);
      } catch (error) {
        console.error('Error fetching link preview:', error);
        setLinkPreview(null); // Clear preview on error
      }
    }, 500), // 500ms debounce delay
    [user.token]
  );

  if (!recipient || !recipient._id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: wp(4) }}>Error: Invalid recipient</Text>
      </SafeAreaView>
    );
  }

  // Check block status
  useEffect(() => {
    const checkBlockedStatus = async () => {
      try {
        const isUserBlocked = await checkBlockStatus(recipient._id);
        setIsBlocked(isUserBlocked);
        const blockedByUser = await isBlockedByUser(recipient._id);
        setIsBlockedByTargetUser(blockedByUser);
      } catch (error) {
        console.error('Error checking block status:', error.message);
        Alert.alert('Error', 'Failed to load block status. Please try again.');
      }
    };
    checkBlockedStatus();
  }, [recipient._id, checkBlockStatus, isBlockedByUser]);

  // Handle block/unblock action
  const handleBlockAction = async () => {
    const previousIsBlocked = isBlocked;
    setIsBlocked(!isBlocked); // Optimistic update
    try {
      if (previousIsBlocked) {
        await unblockUser(recipient._id);
        Alert.alert('Success', 'User has been unblocked');
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block ${recipient.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await blockUser(recipient._id);
                await fetchBlockedUsers();
                Alert.alert('Success', 'User has been blocked');
              },
            },
          ]
        );
      }
    } catch (error) {
      setIsBlocked(previousIsBlocked); // Revert on error
      Alert.alert('Error', `Failed to ${previousIsBlocked ? 'unblock' : 'block'} user`);
    }
  };

  // Socket setup for chat-specific events
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Join the chat room
    socket.emit('join-chat', chatId);

    // Handle new incoming messages
    socket.on('new-message', async encryptedMessage => {
      try {
        if (seenMessageIds.current.has(encryptedMessage._id)) {
          console.log('Duplicate message ignored:', encryptedMessage._id);
          return;
        }
        seenMessageIds.current.add(encryptedMessage._id);

        const decrypted = decryptMessage(encryptedMessage, user._id, encryptedMessage.sender);
        if (!decrypted) {
          console.error('Failed to decrypt message');
          return;
        }

        // Update messages state
        setMessages(prev => {
          if (prev.some(msg => msg._id === decrypted._id)) return prev;
          return [...prev, decrypted];
        });

        // Save to storage and update chats list
        await saveMessageToStorage(decrypted);
        await updateChatsList(decrypted);

        // Emit delivered status
        socket.emit('message-delivered', {
          messageId: decrypted._id,
          chatId: decrypted.chatId,
          recipientId: user._id,
        });

        // Scroll to the latest message
        flatListRef.current?.scrollToEnd({ animated: true });
      } catch (error) {
        console.error('Error processing new message:', error);
      }
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      seenMessageIds.current.delete(messageId);
      updateMessageInStorage(chatId, messageId, null); // Remove from storage
    });

    socket.on('message-edited', async ({ messageId, newText }) => {
      try {
        // Update messages state
        setMessages(prev =>
          prev.map(msg =>
            msg._id === messageId ? { ...msg, text: newText, edited: true } : msg
          )
        );
  
        // Update in storage
        await updateMessageInStorage(chatId, messageId, { text: newText, edited: true });
      } catch (error) {
        console.error('Error processing edited message:', error);
      }
    });

    // Typing handlers
    socket.on('typing', ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on('stop-typing', ({ senderId }) => {
      if (senderId === recipient._id) {
        setIsTyping(false);
      }
    });

    // Call-related listeners
    socket.on('incoming-call', ({ chatId: incomingChatId, callerId: incomingCallerId, callType }) => {
      if (incomingChatId === chatId) {
        setCallState('incoming');
        setCallType(callType);
        setCallerId(incomingCallerId);
        setIsIncoming(true);
      }
    });

    socket.on('call-accepted', ({ chatId: incomingChatId, acceptorId }) => {
      if (incomingChatId === chatId && acceptorId === recipient._id) {
        setCallState('active');
        setIsIncoming(false);
      }
    });

    socket.on('call-rejected', ({ chatId: incomingChatId }) => {
      if (incomingChatId === chatId) {
        setCallState(null);
        setCallType(null);
        setCallerId(null);
        setIsIncoming(false);
      }
    });

    socket.on('call-ended', ({ chatId: incomingChatId }) => {
      if (incomingChatId === chatId) {
        setCallState(null);
        setCallType(null);
        setCallerId(null);
        setIsIncoming(false);
      }
    });

    // Message status updates
    socket.on('message-delivered', ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
      updateMessageInStorage(chatId, messageId, { status: 'delivered' });
    });

    socket.on('message-read', ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
      updateMessageInStorage(chatId, messageId, { status: 'read' });
    });

    socket.on('message-error', ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status: 'failed' } : msg
        )
      );
      updateMessageInStorage(chatId, messageId, { status: 'failed' });
    });

    return () => {
      socket.off('typing');
      socket.off('stop-typing');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('message-delivered');
      socket.off('message-read');
      socket.off('message-error');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.emit('leave-chat', chatId);
    };
  }, [socket, user._id, chatId, recipient._id]);

  // Cleanup recording resources
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      clearInterval(recordingIntervalRef.current);
    };
  }, []);

  // Initialize chat
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
  }, [chatId, user._id, recipient._id]);

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

  // Handle edit message 
  const handleEditMessage = async (messageId, newText) => {
    try {
      const message = messages.find(msg => msg._id === messageId);
      if (!message) return;

      // Optimistic update
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, text: newText, edited: true } : msg
        )
      );

      // Update in local storage
      await updateMessageInStorage(chatId, messageId, { text: newText, edited: true });

      // Send edit request to server
      socket.emit('edit-message', {
        messageId,
        chatId,
        newText,
        senderId: user._id,
        recipientId: recipient._id,
      });
    } catch (error) {
      console.error('Failed to edit message:', error);
      Alert.alert('Error', 'Failed to edit message');
      // Revert optimistic update
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, text: message.text, edited: false } : msg
        )
      );
    }
  }

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

  // Delete message
  // In handleDeleteMessage (ChatScreen)
  const handleDeleteMessage = async messageId => {
    console.log('Attempting to delete message with ID:', messageId);
    try {
      
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      seenMessageIds.current.delete(messageId);
      const existingMessages = await AsyncStorage.getItem(`messages_${chatId}`);
      let updatedMessages = existingMessages ? JSON.parse(existingMessages) : [];
      updatedMessages = updatedMessages.filter(msg => msg._id !== messageId);
      await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error deleting message:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // Delete selected messages
  const handleDeleteSelectedMessages = async () => {
    try {
      // Delete messages on server
      // Update local state and storage
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
      Alert.alert('Error', 'Failed to delete selected messages');
    }
  };

  // Toggle message selection
  const toggleMessageSelection = messageId => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Format date separator
  const formatDateSeparator = date => {
    const today = new Date();
    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return messageDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Handle text input changes
  const handleTextChange = (text) => {
    setNewMessage(text);

    // Check for URLs in the input
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      const url = urls[0]; // Use the first URL found
      fetchLinkPreview(url);
    } else {
      setLinkPreview(null); // Clear preview if no URL
    }
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
            onEdit={handleEditMessage}
            colors={colors}
            messages={messages}
            followStatuses={followStatuses}
            setFollowStatuses={setFollowStatuses}
          />
        </>
      );
    },
    [user, recipient, isMultiSelect, selectedMessages, toggleMessageSelection, handleDeleteMessage, handleRetryMessage, handleEditMessage, colors, messages]
  );

  // Handle GIF selection
  const handleSelectGif = gif => {
    setSelectedMedia(prev => [
      ...prev,
      {
        id: `gif_${gif.id}`,
        uri: gif.uri,
        type: 'gif',
        name: gif.name || `gif_${gif.id}.gif`,
        size: gif.size || 0,
      },
    ]);
    setGifModalVisible(false);
  };

  // Get status bar height
  const getStatusBarHeight = () => {
    return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  };

  // Handle voice note
  const onVoiceNote = useCallback(() => {
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
  }, [isRecording]);

  // Initiate call
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

  // Accept call
  const acceptCall = () => {
    socket?.emit('accept-call', { chatId, callerId });
    setCallState('active');
    setIsIncoming(false);
  };

  // Reject call
  const rejectCall = () => {
    socket?.emit('reject-call', { chatId, callerId });
    setCallState(null);
    setCallType(null);
    setCallerId(null);
    setIsIncoming(false);
  };

  // End call
  const endCall = () => {
    socket?.emit('end-call', { chatId, recipientId: recipient._id });
    setCallState(null);
    setCallType(null);
    setCallerId(null);
    setIsIncoming(false);
  };

  // Render "You blocked this user" view
  const renderBlockedView = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    }}>
      <Text style={{
        fontSize: 18,
        color: colors.text,
        marginBottom: 20,
      }}>
        You blocked this user
      </Text>
      <TouchableOpacity
        onPress={handleBlockAction}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
        }}
      >
        <Text style={{
          color: colors.background,
          fontSize: 16,
          fontWeight: '600',
        }}>
          Unblock
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render "This user has blocked you" view
  const renderBlockedByUserView = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    }}>
      <Text style={{
        fontSize: 18,
        color: colors.text,
        marginBottom: 20,
        textAlign: 'center',
      }}>
        This user has blocked you. You cannot send messages.
      </Text>
      <TouchableOpacity
        onPress={() => checkBlockedStatus()}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
        }}
      >
        <Text style={{
          color: colors.background,
          fontSize: 16,
          fontWeight: '600',
        }}>
          Refresh
        </Text>
      </TouchableOpacity>
    </View>
  );

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
          handleBlockAction={handleBlockAction}
          isBlocked={isBlocked}
          isBlockedByTargetUser={isBlockedByTargetUser}
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
        {isBlocked ? (
          renderBlockedView()
        ) : isBlockedByTargetUser ? (
          renderBlockedByUserView()
        ) : (
          <>
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
              keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}
            >
              <TouchableOpacity
                style={[styles.mediaButton, { backgroundColor: colors.card }]}
                onPress={() => setMediaModalVisible(true)}
                disabled={isBlocked || isBlockedByTargetUser}
              >
                <Ionicons name="add" size={hp(3.5)} color={isBlocked || isBlockedByTargetUser ? colors.subText : colors.primary} />
              </TouchableOpacity>
              {!newMessage.trim() && !linkPreview && (
                <TouchableOpacity
                  style={[styles.mediaButton, { backgroundColor: colors.card }]}
                  onLongPress={() => handleSelectMedia('photo', setSelectedMedia)}
                  onPress={() => setGifModalVisible(true)}
                  disabled={isBlocked || isBlockedByTargetUser}
                >
                  <Ionicons name="image-outline" size={hp(3.5)} color={isBlocked || isBlockedByTargetUser ? colors.subText : colors.primary} />
                </TouchableOpacity>
              )}
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder={isBlocked || isBlockedByTargetUser ? 'Messaging disabled due to block' : 'Type a message...'}
                placeholderTextColor={colors.placeholder}
                value={newMessage}
                onChangeText={handleTextChange}
                multiline
                editable={!isBlocked && !isBlockedByTargetUser}
              />
              {newMessage.trim() || selectedMedia.length > 0 || linkPreview ? (
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: isBlocked || isBlockedByTargetUser ? colors.subText : colors.primary }]}
                  onPress={handleSendMessage}
                  disabled={uploading || isBlocked || isBlockedByTargetUser}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Ionicons name="send" size={hp(2)} color={colors.background} />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: isBlocked || isBlockedByTargetUser ? colors.subText : colors.primary }]}
                  onPress={onVoiceNote}
                  onLongPress={onVoiceNote}
                  disabled={isBlocked || isBlockedByTargetUser}
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
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}