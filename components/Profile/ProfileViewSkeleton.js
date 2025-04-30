import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const ProfileViewSkeleton = ({ colors }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.6, 0.2],
  });

  const ShimmerPlaceholder = ({ style }) => (
    <View style={[style, { backgroundColor: colors.skeleton || '#e0e0e0', overflow: 'hidden', borderRadius: 8 }]}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: colors.skeletonHighlight || '#f0f0f0',
          opacity: shimmerOpacity,
        }}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          <ShimmerPlaceholder style={[styles.avatar, { borderRadius: hp(5.5) }]} />
        </View>
        <View style={styles.statsContainer}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.statItem}>
              <ShimmerPlaceholder style={{ width: wp(15), height: hp(2.8), borderRadius: 4 }} />
              <ShimmerPlaceholder style={{ width: wp(10), height: hp(1.7), marginTop: hp(0.5), borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* User Info */}
      <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
        <View style={styles.nameContainer}>
          <ShimmerPlaceholder style={{ width: wp(40), height: hp(3), borderRadius: 4 }} />
        </View>
        <ShimmerPlaceholder style={[styles.username, { width: wp(30), height: hp(1.8), borderRadius: 4 }]} />
        <ShimmerPlaceholder style={[styles.bio, { width: wp(80), height: hp(4), marginBottom: hp(1), borderRadius: 6 }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShimmerPlaceholder style={{ width: hp(2.2), height: hp(2.2), borderRadius: hp(0.5) }} />
          <ShimmerPlaceholder style={{ width: wp(25), height: hp(1.7), borderRadius: 4 }} />
        </View>
        <View style={styles.detailsContainer}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.detailItem}>
              <ShimmerPlaceholder style={{ width: hp(2), height: hp(2), borderRadius: 4 }} />
              <ShimmerPlaceholder style={{ width: wp(35), height: hp(1.5), marginLeft: 8, borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <ShimmerPlaceholder style={[styles.actionButton, { width: hp(22), height: hp(5), borderRadius: hp(10) }]} />
        <ShimmerPlaceholder style={[styles.actionButton2, { width: hp(10), height: hp(5), borderRadius: hp(10) }]} />
        <ShimmerPlaceholder style={[styles.actionButton2, { width: hp(10), height: hp(5), borderRadius: hp(10) }]} />
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <ShimmerPlaceholder style={[styles.sectionTitle, { width: wp(30), height: hp(2.5), borderRadius: 4 }]} />
        {[...Array(2)].map((_, index) => (
          <View key={index} style={styles.aboutItem}>
            <ShimmerPlaceholder style={{ width: 20, height: 20, borderRadius: 4 }} />
            <ShimmerPlaceholder style={{ width: wp(50), height: hp(1.8), marginLeft: 15, borderRadius: 4 }} />
          </View>
        ))}
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
      fontSize: hp(1.2)
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
      color: 'white',
      fontWeight: '500',
      fontSize: hp(1.8),
    },
    section: {
      padding: hp(1.8),
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
      fontSize: hp(1.8),
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

export default ProfileViewSkeleton;