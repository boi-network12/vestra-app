import { View, Text, SafeAreaView, StyleSheet, FlatList, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator, Platform, StatusBar as RNStatusBar, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../../../contexts/AuthContext'
import { useTheme } from '../../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import AiChatHeader from '../../../../../components/Headers/AiChatHeader';
import { useNavigation } from 'expo-router';
import MessageItem from '../../../../../components/Chat/MessageItem';
import config from '../../../../../config';
import axios from 'axios';
import { useScroll } from '../../../../../contexts/ScrollContext';

export default function Ai() {
  const { user, setUser } = useAuth();
  const { isDark } = useTheme();
  const { scrollY } = useScroll(); 
  const colors = getThemeColors(isDark);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef();
  const AI_CHAT_ID = `ai_chat_${user._id}`;
  const navigate = useNavigation()
   
    
  
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem(AI_CHAT_ID);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
      }
    } catch (error) {
      console.error('Error loading AI messages:', error);
    }
  }

  const saveMessages = async (updatedMessages) => {
    try {
      await AsyncStorage.setItem(AI_CHAT_ID, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error saving AI messages:', error);
    }
  };

  const clearChat = async () => {
    try {
      setMessages([]); 
      await AsyncStorage.removeItem(AI_CHAT_ID); 
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const fetchAIResponse = async (userMessage) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${config.API_URL}/messages/ai-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ 
          message: userMessage, 
          userName: user.name 
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return 'Error: Could not get a response from the AI.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      _id: Date.now().toString(),
      text: newMessage,
      sender: user._id,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    await saveMessages([...messages, userMessage]);

    // Fetch AI response
    const aiResponseText = await fetchAIResponse(newMessage);
    const aiMessage = {
      _id: (Date.now() + 1).toString(),
      text: aiResponseText,
      sender: 'ai',
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, aiMessage]);
    await saveMessages([...messages, userMessage, aiMessage]);

    if (aiResponseText.includes("I've updated your bio")) {
      try {
        // Fetch the updated user data
        const response = await axios.get(`${config.API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.data.success) {
          setUser(response.data.data); 
        }
      } catch (error) {
        console.error('Error fetching updated user data:', error);
      }
    }


    // Scroll to the latest message
    flatListRef.current?.scrollToEnd({ animated: true });
  }

  useEffect(() => {
    loadMessages();
  }, []);

  // Status bar height for Android
  const getStatusBarHeight = () => {
    return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  };

  const renderMessageItem = ({ item }) => {
    const isUserMessage = item.sender === user._id;

    return (
      <MessageItem
        item={item}
        user={user}
        recipient={{ _id: 'ai', name: 'V' }}
        colors={colors}
        isMultiSelect={false}
        selectedMessages={[]}
        toggleMessageSelection={() => {}}
        handleDeleteMessage={() => {}}
        handleRetryMessage={() => {}}
        onReply={() => {}}
        messages={messages}
        followStatuses={{}}
        setFollowStatuses={() => {}}
      />
    );
  };

  return (
    <SafeAreaView
       style={{ flex: 1, backgroundColor: colors.background, paddingTop: getStatusBarHeight() }}
    >

      <AiChatHeader
          colors={colors}
          user={user}
          title="Chat Ai"
          navigation={navigate}
          onClearChat={clearChat}
      />

      <View style={[styles.chatBackground, { backgroundColor: colors.background }]}>
        <View style={[styles.chatBackground, { backgroundColor: colors.background }]}>
        <AnimatedFlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={50} color={colors.subText} />
                <Text style={[styles.emptyText, { color: colors.subText }]}>Start chatting with Vestra Ai!</Text>
              </View>
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                {
                  useNativeDriver: true,
                }
              )}
            scrollEventThrottle={16}
          />
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { backgroundColor: colors.background }]}
      >
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons name="send" size={hp(2)} color={colors.background} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
      // Input area
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(2),
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
      chatBackground: {
        flex: 1,
      },
      emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: hp(50)
      }
})