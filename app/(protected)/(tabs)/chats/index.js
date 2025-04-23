import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';
import ChatHeader from '../../../../components/Headers/ChatHeader';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { decryptMessage } from '../../../../utils/encryption';
import config from '../../../../config';

export default function Chats() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef(new Map());

  const loadChats = async () => {
    try {
      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      if (savedChats) {
        let parsedChats = JSON.parse(savedChats);
  
        // Deduplicate chats
        const uniqueChats = [];
        const seenChatIds = new Set();
        for (const chat of parsedChats) {
          if (!seenChatIds.has(chat.chatId) && chat.participants.every((p) => p._id)) {
            seenChatIds.add(chat.chatId);
            uniqueChats.push(chat);
          }
        }
  
        // Enrich participant data
        const enrichedChats = await Promise.all(
          uniqueChats.map(async (chat) => {
            const recipient = chat.participants.find((p) => p._id !== user._id);
            if (!recipient.profilePicture) {
              try {
                const response = await fetch(`${config.API_URL}/users/${recipient._id}`, {
                  headers: { Authorization: `Bearer ${user.token}` },
                });
                const fullRecipient = await response.json();
                chat.participants = [
                  chat.participants.find((p) => p._id === user._id),
                  fullRecipient,
                ];
              } catch (error) {
                console.error(`Error fetching user ${recipient._id}:`, error);
              }
            }
            return chat;
          })
        );
  
        setChats(enrichedChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [user._id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const startNewChat = async (recipient) => {
    if (!recipient || !recipient._id) {
      console.error('Invalid recipient: missing _id or undefined', recipient);
      return;
    }
    
    const participants = [user._id, recipient._id].sort();
    const chatId = participants.join('_');
  
    try {
      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      let chats = savedChats ? JSON.parse(savedChats) : [];
  
      // Check if chat already exists
      const existingChat = chats.find((chat) => chat.chatId === chatId);
      if (existingChat) {
        router.navigate({
          pathname: `(protected)/(tabs)/chats/${chatId}`,
          params: { chatId, recipient: JSON.stringify(recipient) },
        });
        return;
      }
  
      // Create new chat
      const newChat = {
        chatId,
        participants: [
          user,
          recipient
        ],
        lastMessage: '',
        updatedAt: new Date().toISOString(),
      };
  
      chats.unshift(newChat); 
      await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(chats));

      await fetch(`${config.API_URL}/chats`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          participants: [user._id, recipient._id]
        })
      })

      if (socket?.connected) {
        socket.emit('create-chat', {
          chatId,
          participants: [user, recipient],
          recipientId: recipient._id,
        });
      }
  
      // Navigate to new chat
      router.navigate({
        pathname: `(protected)/(tabs)/chats/${chatId}`,
        params: { chatId, recipient: JSON.stringify(recipient) },
      });
  
      // Refresh the chat list
      loadChats();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const closeAllSwipeables = () => {
    swipeableRefs.current.forEach(ref => {
      ref?.close();
    });
  };

  const handleDelete = async (chatId) => {
    try {
      const updatedChats = chats.filter(chat => chat.chatId !== chatId);
      setChats(updatedChats);
      await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const renderRightActions = (progress, dragX, chatId) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [0, 0, 0, 1],
    });

    return (
      <RectButton
        style={styles.rightAction}
        onPress={() => handleDelete(chatId)}
      >
        <Animated.Text
          style={[
            styles.actionText,
            {
              transform: [{ translateX: trans }],
              color: colors.text,
            },
          ]}
        >
          Delete
        </Animated.Text>
      </RectButton>
    );
  };

  const getStatusBarHeight = () => {
    return Platform.OS === 'android'
      ? RNStatusBar.currentHeight || 0
      : 0;
  }

  useEffect(() => {
    const chatIds = chats.map((chat) => chat.chatId);
    const uniqueChatIds = new Set(chatIds);
    if (chatIds.length !== uniqueChatIds.size) {
      console.warn('Duplicate chat IDs detected:', chatIds);
    }
  }, [chats]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: getStatusBarHeight(),
        backgroundColor: colors.background,
      }}
    >
      <ChatHeader colors={colors} user={user} navigation={navigation} />

      <FlatList
        data={chats}
        keyExtractor={(item, index) => `${item.chatId}_${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const recipient = item.participants.find((p) => p._id !== user._id);
          if (!recipient || !recipient._id) {
            console.warn('Invalid recipient for chat:', item);
            return null;
          }

          let lastMessageText = 'No messages yet';
          if (item.lastMessage) {
            try {
              lastMessageText = decryptMessage(item.lastMessage, user._id, recipient._id) || 'Encrypted message';
            } catch (error) {
              console.error('Failed to decrypt lastMessage:', error);
              lastMessageText = 'Error decrypting message';
            }
          }

          return (
            <Swipeable
              ref={(ref) => {
                if (ref) {
                  swipeableRefs.current.set(item.chatId, ref);
                } else {
                  swipeableRefs.current.delete(item.chatId);
                }
              }}
              onSwipeableWillOpen={closeAllSwipeables}
              renderRightActions={(progress, dragX) =>
                renderRightActions(progress, dragX, item.chatId)
              }
              rightThreshold={40}
            >
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: colors.background,
                }}
                onPress={() => startNewChat(recipient)}
              >
                <Image
                  source={
                    recipient.profilePicture
                      ? { uri: recipient.profilePicture }
                      : require('../../../../assets/images/HeroBg.png')
                  }
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 15,
                    borderWidth: item.unread ? 2 : 0,
                    borderColor: item.unread ? 'red' : 'transparent',
                  }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
                    {recipient.name || 'Unknown'}
                  </Text>
                  <Text style={{ color: item.unread ? 'red' : colors.subText }} numberOfLines={1}>
                    {item.lastMessage ? decryptMessage(item.lastMessage, user._id, recipient._id) : 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}
          >
            <Ionicons name="chatbubbles-outline" size={50} color={colors.subText} />
            <Text style={{ color: colors.subText, marginTop: 10 }}>No chats yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    backgroundColor: 'red',
    marginVertical: 5,
    borderRadius: 5,
  },
  actionText: {
    fontWeight: '600',
    padding: 20,
  },
});