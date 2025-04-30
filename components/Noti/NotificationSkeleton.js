import { View, Animated, Easing, FlatList, StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const NotificationSkeleton = ({ colors }) => {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={[1, 2, 3, 4]} // Simulate four notification items
        renderItem={() => (
          <View style={[styles.notificationItem, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <View style={styles.notificationContent}>
              <View style={styles.iconContainer}>
                <ShimmerPlaceholder style={{ width: hp(2.5), height: hp(2.5), borderRadius: hp(1.25) }} />
              </View>
              <View style={styles.contentContainer}>
                <ShimmerPlaceholder style={{ width: wp(60), height: hp(1.8), borderRadius: 4, marginBottom: hp(0.5) }} />
                <ShimmerPlaceholder style={{ width: wp(50), height: hp(1.6), borderRadius: 4, marginVertical: hp(0.3) }} />
                <ShimmerPlaceholder style={{ width: wp(30), height: hp(1.5), borderRadius: 4 }} />
              </View>
              <ShimmerPlaceholder style={[styles.unreadDot, { borderRadius: hp(0.5) }]} />
            </View>
            <View style={styles.deleteButton}>
              <ShimmerPlaceholder style={{ width: hp(2.5), height: hp(2.5), borderRadius: hp(1.25) }} />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.toString()}
        ListHeaderComponent={
          <View style={[styles.headerActions, { borderBottomColor: colors.border }]}>
            <ShimmerPlaceholder style={{ width: wp(30), height: hp(1.7), borderRadius: 4, marginLeft: wp(4) }} />
            <ShimmerPlaceholder style={{ width: wp(20), height: hp(1.7), borderRadius: 4, marginLeft: wp(4) }} />
          </View>
        }
      />
    </View>
  );
};


const styles = StyleSheet.create({
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      borderBottomWidth: 1,
    },
    previewText: {
      fontSize: hp(1.6),
      marginVertical: hp(0.3),
    },
    iconContainer: {
      marginRight: wp(4),
      width: hp(4),
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    notificationText: {
      fontSize: hp(1.8),
      marginBottom: hp(0.5),
    },
    timeText: {
      fontSize: hp(1.5),
    },
    unreadDot: {
      width: hp(1),
      height: hp(1),
      borderRadius: hp(0.5),
    },
    headerActions: {
      padding: hp(1.5),
      borderBottomWidth: 1,
      alignItems: 'flex-end',
    },
    actionText: {
      fontSize: hp(1.7),
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(10),
    },
    emptyText: {
      fontSize: hp(2.2),
      fontWeight: 'bold',
      marginTop: hp(2),
      marginBottom: hp(0.5),
    },
    emptySubText: {
      fontSize: hp(1.8),
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(10),
    },
    retryButton: {
      marginTop: hp(2),
      paddingVertical: hp(1),
      paddingHorizontal: wp(6),
      borderRadius: hp(1.5),
    },
  });

export default NotificationSkeleton;