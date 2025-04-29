import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  FlatList,
  TouchableOpacity,
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
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useScroll } from '../../../../contexts/ScrollContext';

export default function Chats() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef(new Map());
  const { scrollY } = useScroll(); 
  

  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);


  const loadChats = async () => {
    try {
      setRefreshing(true);
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };

      console.log('Fetching chats for user:', user._id);

      // Try to get chats from API
      try {
        const response = await fetch(`${config.API_URL}/chats?_=${Date.now()}`, { headers, cache: "no-store" });
        if (response.status === 404) {
          console.warn('Chats endpoint not found, falling back to local storage');
          throw new Error('API not available');
        }
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const apiChats = await response.json();


        if (apiChats?.length > 0) {
          // Deduplicate API chats
          const uniqueChats = deduplicateChats(apiChats);
          await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(uniqueChats));
          setChats(uniqueChats);
          setFilteredChats(uniqueChats)
          return;
        }
      } catch (apiError) {
        console.log('Using local chats due to API error:', apiError.message);
      }

      // Fallback to local storage
      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      if (savedChats) {
        let parsedChats = JSON.parse(savedChats);
        parsedChats = parsedChats.filter(
          chat =>
            chat?.participants?.length === 2 &&
            chat.participants.some(p => p._id === user._id)
        );
        const uniqueChats = deduplicateChats(parsedChats);
        setChats(uniqueChats);
        setFilteredChats(uniqueChats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle search query changes
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredChats(chats); // Reset to all chats if query is empty
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = chats.filter((chat) => {
        const recipient = chat.participants?.find((p) => p._id !== user._id);
        return recipient?.name?.toLowerCase().includes(lowerQuery);
      });
      setFilteredChats(filtered);
    }
  };

  // Deduplicate chats by chatId
  const deduplicateChats = chats => {
    const seenChatIds = new Set();
    return chats.filter(chat => {
      if (!chat.chatId || seenChatIds.has(chat.chatId)) return false;
      seenChatIds.add(chat.chatId);
      return true;
    });
  };
  

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadChats);
    loadChats();
    return unsubscribe;
  }, [user._id]);

  const onRefresh = () => loadChats();

  const startNewChat = async recipient => {
    console.log('Creating new chat with recipient:', recipient);

    if (!recipient?._id) {
      console.error('Invalid recipient:', recipient);
      return;
    }

    const participants = [user._id, recipient._id].sort();
    const chatId = participants.join('_');

    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => chat.chatId === chatId);
      if (existingChat) {
        return router.push({
          pathname: `(protected)/(tabs)/chats/${chatId}`,
          params: { chatId, recipient: JSON.stringify(recipient) },
        });
      }

      // Create new chat object
      const newChat = {
        chatId,
        participants: [user, recipient],
        lastMessage: '',
        updatedAt: new Date().toISOString(),
      };

      
      // Update local state (avoid duplicates)
      setChats(prev => {
        if (prev.some(chat => chat.chatId === chatId)) return prev;
        return [newChat, ...prev];
      });

      // Save to AsyncStorage
      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      let updatedChats = savedChats ? JSON.parse(savedChats) : [];
      if (!updatedChats.some(chat => chat.chatId === chatId)) {
        updatedChats.unshift(newChat);
        await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(updatedChats));
      }

      // Create chat on server
      const response = await fetch(`${config.API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          participantId: recipient._id, // Changed to match backend
        }),
      });

      if (!response.ok) throw new Error(`Failed to create chat: ${response.status}`);

      // Navigate to chat
      router.push({
        pathname: `(protected)/(tabs)/chats/${chatId}`,
        params: { chatId, recipient: JSON.stringify(recipient) },
      });
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const closeAllSwipeables = () => {
    swipeableRefs.current.forEach(ref => ref?.close());
  };

  const handleDelete = async chatId => {
    try {
      // Update local state
      setChats(prev => prev.filter(chat => chat.chatId !== chatId));

      // Update AsyncStorage
      const savedChats = await AsyncStorage.getItem(`chats_${user._id}`);
      if (savedChats) {
        const updatedChats = JSON.parse(savedChats).filter(chat => chat.chatId !== chatId);
        await AsyncStorage.setItem(`chats_${user._id}`, JSON.stringify(updatedChats));
      }

      // Delete from server
      await fetch(`${config.API_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
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
        style={[styles.rightAction, { backgroundColor: colors.error }]}
        onPress={() => handleDelete(chatId)}
      >
        <Animated.Text
          style={[styles.actionText, { transform: [{ translateX: trans }], color: colors.text }]}
        >
          <Ionicons name="trash" size={hp(2)} color={colors.errorText} />
        </Animated.Text>
      </RectButton>
    );
  };

  const getStatusBarHeight = () => {
    return Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0;
  };

  const renderChatItem = ({ item }) => {
    const recipient = item.participants?.find(p => p._id !== user._id);
    if (!recipient) return null;


    let lastMessageText = 'No messages yet';
    if (item.lastMessage) {
      try {
        lastMessageText = decryptMessage(item.lastMessage, user._id, recipient._id) || 'Encrypted message';
      } catch (error) {
        console.error('Decryption error:', error);
        lastMessageText = 'Message';
      }
    }

    return (
      <Swipeable
        ref={ref => {
          if (ref) swipeableRefs.current.set(item.chatId, ref);
          else swipeableRefs.current.delete(item.chatId);
        }}
        onSwipeableWillOpen={closeAllSwipeables}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.chatId)}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={[styles.chatItem, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
          onPress={() => startNewChat(recipient)}
        >
          {recipient.profilePicture ? (
            <Image
              source={{ uri: recipient.profilePicture }}
              style={[styles.avatar, { borderWidth: item.unread ? 2 : 0, borderColor: item.unread ? colors.primary : 'transparent' }]}
            />
          ) : (
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: colors.primary, borderWidth: item.unread ? 2 : 0, borderColor: item.unread ? colors.primary : 'transparent' }]}
            >
              <Text style={styles.initials}>
                {recipient.name ? recipient.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <View style={styles.chatContent}>
            <Text style={[styles.recipientName, { color: colors.text }]}>
              {recipient.name || 'Unknown'}
            </Text>
            <Text
              style={[styles.lastMessage, { color: item.unread ? colors.primary : colors.subText }]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.subText }]}>
            {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };


  const renderAiChat = () => {
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        onPress={() => router.navigate('(protected)/(tabs)/chats/Ai')}
      >
        <View
          style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.initials}>AI</Text>
        </View>
        <View style={styles.chatContent}>
          <Text style={[styles.recipientName, { color: colors.text }]}>Vestra AI</Text>
          <Text style={[styles.lastMessage, { color: colors.subText }]}>Chat with AI</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: getStatusBarHeight() }]}>
      
      <ChatHeader
        colors={colors}
        navigation={navigation}
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
      />
      
      <AnimatedFlatList
        data={filteredChats} 
        keyExtractor={(item) => item.chatId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={renderChatItem}
        ListHeaderComponent={searchQuery ? null : renderAiChat} 
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={50} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyListContent : null}
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: true,
            }
          )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  avatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(5.5),
    marginRight: hp(1.4),
  },
  avatarPlaceholder: {
    width: hp(5),
    height: hp(5),
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hp(1.4),
  },
  initials: {
    fontSize: hp(2),
    fontWeight: 'bold',
    color: 'white',
  },
  chatContent: { flex: 1 },
  recipientName: {
    fontSize: hp(2),
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: hp(1.5),
    marginTop: hp(0.1),
  },
  time: {
    fontSize: hp(1.3),
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginVertical: 5,
    borderRadius: 5,
  },
  actionText: {
    fontWeight: '600',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
});