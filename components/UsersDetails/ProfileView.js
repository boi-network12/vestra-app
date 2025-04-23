import { StyleSheet, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { router } from 'expo-router';

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
        disabled: true
      };
    }
  
    if (currentFollowStatus === 'following') {
      return {
        text: 'Following',
        style: { 
          backgroundColor: colors.card, 
          borderWidth: 1, 
          borderColor: colors.border 
        },
        textColor: colors.text,
        disabled: false
      };
    }
  
    if (currentFollowStatus === 'follow_back') {
      return {
        text: 'Follow Back',
        style: { backgroundColor: colors.primary },
        textColor: '#FFFFFF',
        disabled: false
      };
    }
  
    // Default (not following)
    return {
      text: 'Follow',
      style: { backgroundColor: colors.primary },
      textColor: '#FFFFFF',
      disabled: false
    };
  };
  
  const buttonState = getFollowButtonState();
  
  //:
  const handleMessagePress = () => {
    if (!currentUser || !currentUser._id) {
      console.error('Current user is undefined or missing _id');
      return;
    }

    if (!user || !user._id) {
      console.error('Current user is undefined or missing _id');
      return;
    }

    console.log('Navigating to chat with:', user.name);
    
    const participants  = [user._id, currentUser._id].sort();
    const chatId = participants.join('_');

    router.navigate({
      pathname: `(protected)/(tabs)/chats/${chatId}`,
      params: {
        chatId,
        recipient: JSON.stringify(user)
      }
    })
  }  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          {user.profilePicture ? (
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.initials}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{Array.isArray(user.followers) ? user.followers.length : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{Array.isArray(user.following) ? user.following.length : 0}</Text>
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
                onPress={() => Linking.openURL(user.link.startsWith('http') ? user.link : `https://${user.link}`)}
            >
                {/* Website icon (you could replace this with actual favicon fetching later) */}
                <Image 
                source={{ uri: `https://www.google.com/s2/favicons?domain=${user.link.replace(/(^\w+:|^)\/\//, '')}` }}
                style={{ width: 16, height: 16 }}
                />
                <Text style={[styles.link, { color: colors.primary }]}>
                {user.link
                    .replace(/(^\w+:|^)\/\//, '') // Remove http/https
                    .split('/')[0] // Remove everything after domain
                    .replace('www.', '')} {/* Remove www if present */}
                </Text>
            </TouchableOpacity>
        ) : (
        <Text style={[styles.bioPlaceholder, { color: colors.subText }]}>No link yet</Text>
        )}
         
         <View style={styles.detailsContainer}>
           <View style={styles.detailItem}>
             <Ionicons name="location-outline" size={16} color={colors.subText} />
             <Text style={[styles.detailText, { color: colors.subText }]}>{user.country || "No Detail"}</Text>
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
               Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </Text>
           </View>
         </View>
       </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            buttonState.style,
            buttonState.disabled && { opacity: 0.6 }
          ]}
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
          <Text style={styles.actionButtonText}>
            <Ionicons name='chatbubble-outline' size={20} color={colors.subText} />
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton2, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}><Ionicons name='qr-code-outline' size={20} color={colors.subText} /></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 30,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  infoContainer: {
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 5,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  username: {
    fontSize: 16,
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    marginBottom: 10,
  },
  link: {
    fontSize: 12
  },
  bioPlaceholder: {
    fontSize: 16,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginTop: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  actionButton2: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '20%',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aboutText: {
    marginLeft: 15,
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 15,
    fontSize: 16,
  },
});

export default ProfileViewDetail;