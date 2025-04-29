import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

const ShareModal = ({ 
  visible, 
  onClose, 
  colors, 
  onRepost, 
  onBookmark, 
  isBookmarked,
  onShareDirect,
  postUrl,
  onQuote
}) => {
  if (!visible) return null;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(postUrl);
      Alert.alert('Link copied to clipboard');
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const shareOptions = [
    {
      label: 'Copy link',
      icon: 'link-outline',
      onPress: handleCopyLink,
    },
    {
      label: isBookmarked ? 'Remove bookmark' : 'Bookmark',
      icon: isBookmarked ? 'bookmark' : 'bookmark-outline',
      onPress: onBookmark,
    },
    {
      label: 'Repost',
      icon: 'repeat-outline',
      onPress: onRepost,
    },
    {
      label: 'Quote',
      icon: 'chatbubble-outline',
      onPress: () => {
        onClose();
        onQuote(); 
      },
    },
    {
      label: 'Send via Direct Message',
      icon: 'paper-plane-outline',
      onPress: onShareDirect,
    },
  ];

  // These would be apps installed on the user's device in a real implementation
  const shareViaApps = [
    { name: 'WhatsApp', icon: 'logo-whatsapp', package: 'com.whatsapp' },
    { name: 'Instagram', icon: 'logo-instagram', package: 'com.instagram.android' },
    { name: 'Telegram', icon: 'paper-plane-outline', package: 'org.telegram.messenger' },
    { name: 'Messages', icon: 'chatbubble-outline', package: 'com.google.android.apps.messaging' },
  ];

  const handleAppShare = async (packageName) => {
    try {
      const url = `intent://send/${encodeURIComponent(postUrl)}#Intent;package=${packageName};scheme=https;end`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'App not installed');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open app');
    }
    onClose();
  };

  return (
    <View style={[styles.modalContainer, { backgroundColor: colors.modalBg }]}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Icon name="close" size={hp(2.5)} color={colors.subText} />
        </TouchableOpacity>

        {/* Share options */}
        <View style={styles.optionsContainer}>
          {shareOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Icon 
                  name={option.icon} 
                  size={hp(2.5)} 
                  color={colors.primary} 
                />
              </View>
              <Text style={[styles.optionText, { color: colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Share via apps */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>
          Share via
        </Text>
        <View style={styles.appsContainer}>
          {shareViaApps.map((app, index) => (
            <TouchableOpacity
              key={index}
              style={styles.appItem}
              onPress={() => handleAppShare(app.package)}
            >
              <View style={[styles.appIcon, { backgroundColor: colors.primary + '20' }]}>
                <Icon 
                  name={app.icon} 
                  size={hp(3)} 
                  color={colors.primary} 
                />
              </View>
              <Text style={[styles.appText, { color: colors.text }]}>
                {app.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: wp(5),
    paddingBottom: Platform.OS === 'ios' ? hp(7) : hp(9),
    maxHeight: hp(65),
  },
  closeButton: {
    position: 'absolute',
    top: hp(1.5),
    right: wp(5),
    zIndex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  optionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
  },
  optionIcon: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  optionText: {
    fontSize: wp(3.8),
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: hp(1.5),
  },
  sectionTitle: {
    fontSize: wp(3.8),
    fontWeight: '500',
    marginBottom: hp(1.5),
  },
  appsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appItem: {
    alignItems: 'center',
    width: '23%',
  },
  appIcon: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  appText: {
    fontSize: wp(3.2),
    textAlign: 'center',
  },
});

export default ShareModal;