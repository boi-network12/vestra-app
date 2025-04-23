import { StyleSheet, View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import EditProfile from './EditProfile';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

const ProfileView = ({ user, colors, showPosts, toggleSection, updateProfile }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

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
      {!showPosts && 
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
                style={{ width: hp(2.2), height: hp(2.2), borderRadius: hp(0.5) }}
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
             <Text style={[styles.detailText, { color: colors.subText }]}>{user.country || 'Update your location'}</Text>
           </View>
           
           <View style={styles.detailItem}>
             <MaterialCommunityIcons name="cake-variant-outline" size={hp(2)} color={colors.subText} />
             <Text style={[styles.detailText, { color: colors.subText }]}>
               {calculateAge(user.dateOfBirth)} years
             </Text>
           </View>
           
           <View style={styles.detailItem}>
             <Feather name="calendar" size={hp(2)} color={colors.subText} />
             <Text style={[styles.detailText, { color: colors.subText }]}>
               Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </Text>
           </View>
         </View>
       </View>
      }

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton2, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
          onPress={toggleSection}
        >
          <Text style={[styles.actionButtonText, { color: colors.subText }]}>
            {showPosts ? "About" : "Posts"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton2, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}><Ionicons name='qr-code-outline' size={hp(2.8)} /></Text>
        </TouchableOpacity>
      </View>

      {/* Additional Sections */}
      {!showPosts && 
        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <View style={styles.aboutItem}>
            <Ionicons name="mail-outline" size={20} color={colors.subText} />
            <Text style={[styles.aboutText, { color: colors.text }]}>{user.email}</Text>
            </View>
            <View style={styles.aboutItem}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.subText} />
            <Text style={[styles.aboutText, { color: colors.text }]}> {user.phoneNumber || "Add your Number"}</Text>
            </View>
        </View>
      }
      <EditProfile
         isVisible={isModalVisible}
         onClose={() => setIsModalVisible(false)}
        user={user}
        colors={colors}
        updateProfile={updateProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    padding: hp(2),
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
    fontSize: hp(2.8),
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: hp(1.7),
  },
  infoContainer: {
    padding: hp(2.2),
    marginHorizontal: hp(2),
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

export default ProfileView;