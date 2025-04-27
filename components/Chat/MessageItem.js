import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Video, Audio } from 'expo-av';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { hp, wp } from '../../utils/responsive';
import { MESSAGE_STATUS } from '../../constants/messageStatus';
import MediaPreview from '../preview/MediaPreview';
import { router } from 'expo-router';

const MessageItem = ({
  item,
  user,
  recipient,
  isMultiSelect,
  selectedMessages,
  toggleMessageSelection,
  handleDeleteMessage,
  onReply,
  colors,
  messages,
  setIsMultiSelect,
  followStatuses
}) => {
  const isCurrentUser = item.sender === user._id;
  const sender = isCurrentUser ? user : recipient;
  const isSelected = selectedMessages.includes(item._id);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef(null); 
  
  

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isSelected ? 0.7 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, fadeAnim]);

  const handleLongPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
    setIsMultiSelect(true);
    toggleMessageSelection(item._id);
  };

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[styles.replyAction, { transform: [{ translateX: trans }], backgroundColor: "transparent" }]}
      >
        <Ionicons name="arrow-undo-outline" size={hp(2)} color={colors.subText} />
      </Animated.View>
    );
  };

  const handleSwipeOpen = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
    onReply(item); // Trigger reply automatically
    if (swipeableRef.current) {
      swipeableRef.current.close(); // Close the swipeable
    }
  };

  const renderAvatar = (senderId, name, profilePicture) => {
    const isCurrentUser = senderId === user._id;
    const avatarText = name ? name.charAt(0).toUpperCase() : '';

    return (
      <TouchableOpacity
        style={[styles.avatarContainer, { backgroundColor: isCurrentUser ? colors.primary : colors.card }]}
        onPress={() => navigateToProfile(sender)}
      >
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarText, { color: isCurrentUser ? colors.background : colors.text }]}>
            {avatarText}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMediaPreview = (file, index) => {
    const isImage = file.type === 'image';
    const isVideo = file.type === 'video';
    const isAudio = file.type === 'audio';
    const isFile = file.type === 'file';

    if (isImage) {
      return (
        <Image source={{ uri: file.url }} style={styles.mediaInMessage} resizeMode="cover" />
      );
    }

    if (isVideo) {
      return (
        <TouchableOpacity
          style={styles.videoContainer}
          onPress={() => Linking.openURL(file.url)}
        >
          {file.thumbnail ? (
            <Image source={{ uri: file.thumbnail }} style={styles.mediaInMessage} resizeMode="cover" />
          ) : (
            <View style={[styles.mediaInMessage, styles.videoFallback, { backgroundColor: colors.card }]}>
              <Ionicons name="play" size={hp(5)} color={colors.text} />
            </View>
          )}
          <Ionicons name="play" size={hp(4)} color={colors.background} style={styles.videoPlayIconInMessage} />
        </TouchableOpacity>
      );
    }

    if (isAudio || isFile) {
      return (
        <TouchableOpacity
          style={[
            styles.documentContainer,
            isCurrentUser ? styles.currentUserDocument : styles.otherUserDocument,
            { backgroundColor: isCurrentUser ? colors.card : colors.background },
          ]}
          onPress={async () => {
            if (isAudio) {
              try {
                const soundObject = new Audio.Sound();
                await soundObject.loadAsync({ uri: file.url });
                await soundObject.playAsync();
              } catch (error) {
                Alert.alert('Error', 'Could not play audio message');
              }
            } else {
              Linking.openURL(file.url);
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
              style={[styles.documentName, { color: isCurrentUser ? colors.background : colors.text }]}
              numberOfLines={1}
            >
              {isAudio ? 'Voice Message' : file.name}
            </Text>
            {isAudio ? (
              <Text style={[styles.audioDuration, { color: isCurrentUser ? colors.subText : colors.subText }]}>
                {formatDuration(file.duration || 0)}
              </Text>
            ) : (
              <Text style={[styles.documentSize, { color: isCurrentUser ? colors.subText : colors.subText }]}>
                {formatFileSize(file.size)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const repliedToMessage = item.replyTo && messages?.find(msg => msg._id === item.replyTo);

  const navigateToProfile = (user) => {
    const status = followStatuses[user._id]?.status || 'not_following';
    const isFollowingYou = followStatuses[user._id]?.isFollowingYou || false;
  
    if (!user || !user._id) {
      console.error('navigateToProfile: Invalid user object', user);
      return;
    }
    
    let followStatus;
    if (status === 'blocked') {
      followStatus = 'blocked';
    } else if (status === 'following') {
      followStatus = 'following';
    } else if (isFollowingYou) {
      followStatus = 'follow_back';
    } else {
      followStatus = 'not_following';
    }
  
    router.navigate({
      pathname: 'users-profile',
      params: { 
        user: JSON.stringify(user),
        followStatus
      },
    });
  };


  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={!isMultiSelect}
      onSwipeableRightOpen={handleSwipeOpen}
    >
      <Pressable
        onLongPress={handleLongPress}
        onPress={() => isMultiSelect && toggleMessageSelection(item._id)}
        style={({ pressed }) => [
          styles.messageWrapper,
          isCurrentUser ? styles.currentUserWrapper : styles.otherUserWrapper,
          isSelected && { backgroundColor: colors.card },
          pressed && isMultiSelect && { opacity: 0.8 },
        ]}
        accessibilityLabel={isSelected ? 'Selected message' : 'Message, long press to select or swipe right to reply'}
        accessibilityHint={isMultiSelect ? 'Tap to select or deselect' : 'Long press to enter selection mode or swipe right to reply'}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {(isMultiSelect || isSelected) && (
            <View style={[styles.checkboxContainer, { left: isCurrentUser ? undefined : wp(2), right: isCurrentUser ? wp(2) : undefined }]}>
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={hp(2.5)}
                color={isSelected ? colors.primary : colors.subText}
              />
            </View>
          )}
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
                    backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                    borderLeftColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.repliedMessageSender, { color: isCurrentUser ? colors.background : colors.text }]}
                >
                  {repliedToMessage.sender === user._id ? user.name : recipient.name}
                </Text>
                <Text
                  style={[styles.repliedMessageText, { color: isCurrentUser ? colors.background : colors.subText }]}
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
                  isCurrentUser ? styles.currentUserLinkPreview : styles.otherUserLinkPreview,
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
                  <MediaPreview
                    key={index}
                    file={file}
                    colors={colors}
                    isCurrentUser={isCurrentUser}
                  />
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
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isCurrentUser && (
                <Ionicons
                  name={
                    item.status === MESSAGE_STATUS.FAILED
                      ? 'warning'
                      : item.status === MESSAGE_STATUS.DELIVERED
                      ? 'checkmark-done'
                      : item.status === MESSAGE_STATUS.READ
                      ? 'checkmark-done'
                      : 'checkmark'
                  }
                  size={hp(2)}
                  color={
                    item.status === MESSAGE_STATUS.FAILED
                      ? colors.errorText
                      : item.status === MESSAGE_STATUS.READ
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
};

const styles = StyleSheet.create({
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: hp(0.5),
    paddingHorizontal: wp(0.5),
  },
  currentUserWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  otherUserWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  selectedMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: wp(3),
  },
  checkboxContainer: {
    position: 'absolute',
    top: hp(1),
    zIndex: 10,
  },
  avatarContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(1.5),
    marginBottom: hp(1),
  },
  avatarImage: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
  },
  avatarText: {
    fontSize: hp(1.5),
    fontWeight: 'semibold',
  },
  messageContainer: {
    maxWidth: wp(65),
    borderRadius: wp(2),
    paddingHorizontal: wp(1),
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
    marginLeft: wp(30),
  },
  otherUserMessage: {
    borderBottomLeftRadius: wp(1),
    marginRight: wp(30),
  },
  messageText: {
    fontSize: hp(1.85),
    lineHeight: hp(2.6),
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: hp(0.3),
  },
  messageTime: {
    fontSize: hp(1.2),
    marginRight: wp(1),
  },
  replyAction: {
    width: wp(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
  },
  filesContainer: {
    marginTop: hp(0.8),
  },
  fileContainer: {
    marginBottom: hp(0.5),
  },
  mediaInMessage: {
    width: wp(60),
    height: hp(25),
    borderRadius: wp(1),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
  },
  documentName: {
    flex: 1,
    marginHorizontal: wp(2),
    fontSize: hp(1.7),
  },
  documentSize: {
    fontSize: hp(1.4),
  },
  linkPreviewInMessage: {
    width: wp(60),
    borderRadius: wp(3),
    overflow: 'hidden',
    marginTop: hp(0.8),
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
    marginBottom: hp(0.5),
  },
  linkPreviewDescriptionInMessage: {
    fontSize: hp(1.5),
    marginBottom: hp(0.5),
  },
  linkPreviewUrlInMessage: {
    fontSize: hp(1.4),
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
    marginTop: hp(0.5),
  },
});

export default MessageItem;