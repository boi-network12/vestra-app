import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import React from 'react';
import { router } from 'expo-router';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const ProfileViewDetail = ({ user, colors, handleFollowAction, currentFollowStatus, currentUser }) => {
  if (!user || !user._id) {
    console.error('ProfileViewDetail: Invalid user prop', user);
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Error: User data is missing</Text>
      </View>
    );
  }

  // Calculate age from dateOfBirth
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getFollowButtonState = () => {
    if (currentFollowStatus === 'blocked') {
      return {
        text: 'Blocked',
        style: { backgroundColor: colors.errorBg, borderColor: colors.errorText },
        textColor: colors.errorText,
        disabled: true,
      };
    }
    if (currentFollowStatus === 'following') {
      return {
        text: 'Following',
        style: {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        textColor: colors.text,
        disabled: false,
      };
    }
    if (currentFollowStatus === 'follow_back') {
      return {
        text: 'Follow Back',
        style: { backgroundColor: colors.primary },
        textColor: '#FFFFFF',
        disabled: false,
      };
    }
    return {
      text: 'Follow',
      style: { backgroundColor: colors.primary },
      textColor: '#FFFFFF',
      disabled: false,
    };
  };

  const buttonState = getFollowButtonState();

  const handleMessagePress = () => {
    if (!currentUser || !currentUser._id || !user || !user._id) {
      console.error('handleMessagePress: Invalid user or currentUser', { currentUser, user });
      return;
    }
    console.log('Navigating to chat with:', user.name);
    const participants = [user._id, currentUser._id].sort();
    const chatId = participants.join('_');
    router.navigate({
      pathname: `(protected)/(tabs)/chats/${chatId}`,
      params: {
        chatId,
        recipient: JSON.stringify(user),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.initials}>
                {user.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {Array.isArray(user.followers) ? user.followers.length : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {Array.isArray(user.following) ? user.following.length : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Following</Text>
          </View>
        </View>
      </View>

      {/* User Info */}
      <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          {user.verified && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={[styles.username, { color: colors.subText }]}>@{user.username}</Text>
        {user.bio ? (
          <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
        ) : (
          <Text style={[styles.bioPlaceholder, { color: colors.subText }]}>No bio yet</Text>
        )}
        {user.link ? (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() =>
              Linking.openURL(user.link.startsWith('http') ? user.link : `https://${user.link}`)
            }
          >
            <Image
              source={{
                uri: `https://www.google.com/s2/favicons?domain=${user.link.replace(
                  /(^\w+:|^)\/\//,
                  ''
                )}`,
              }}
              style={{ width: 16, height: 16 }}
            />
            <Text style={[styles.link, { color: colors.primary }]}>
              {user.link
                .replace(/(^\w+:|^)\/\//, '')
                .split('/')[0]
                .replace('www.', '')}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.bioPlaceholder, { color: colors.subText }]}>No link yet</Text>
        )}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={colors.subText} />
            <Text style={[styles.detailText, { color: colors.subText }]}>
              {user.country || 'No Detail'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="cake-variant-outline" size={16} color={colors.subText} />
            <Text style={[styles.detailText, { color: colors.subText }]}>
              {calculateAge(user.dateOfBirth)} years
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Feather name="calendar" size={16} color={colors.subText} />
            <Text style={[styles.detailText, { color: colors.subText }]}>
              Joined{' '}
              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, buttonState.style, buttonState.disabled && { opacity: 0.6 }]}
          onPress={handleFollowAction}
          disabled={buttonState.disabled}
        >
          <Text style={[styles.actionButtonText, { color: buttonState.textColor }]}>
            {buttonState.text}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton2, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
          onPress={handleMessagePress}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.subText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton2, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <Ionicons name="qr-code-outline" size={20} color={colors.subText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
  },
  headerContainer: {
    flexDirection: 'row',
    padding: hp(2.5),
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: hp(2.5),
  },
  avatar: {
    width: hp(11),
    height: hp(11),
    borderRadius: hp(5.5),
  },
  avatarPlaceholder: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: hp(3.5),
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: hp(2.8),
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: hp(1.7),
  },
  infoContainer: {
    padding: hp(2.6),
    marginHorizontal: hp(2),
    borderRadius: 15,
    marginTop: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: hp(3),
    fontWeight: 'bold',
    marginRight: hp(1),
  },
  verifiedIcon: {
    marginLeft: 0,
  },
  username: {
    fontSize: hp(1.8),
    marginBottom: hp(1),
  },
  bio: {
    fontSize: hp(1.7),
    marginBottom: hp(1),
  },
  link: {
    fontSize: hp(1.7),
  },
  bioPlaceholder: {
    fontSize: hp(1.7),
    marginBottom: 15,
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginTop: hp(1),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(0.8),
  },
  detailText: {
    marginLeft: 8,
    fontSize: hp(1.5),
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: hp(2),
    marginBottom: 15,
  },
  actionButton: {
    paddingVertical: hp(1),
    paddingHorizontal: hp(0),
    borderRadius: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: hp(22),
  },
  actionButton2: {
    paddingVertical: hp(1.3),
    paddingHorizontal: hp(0),
    borderRadius: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: hp(10),
  },
  actionButtonText: {
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});

export default ProfileViewDetail;