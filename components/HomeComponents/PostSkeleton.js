// components/HomeComponents/PostSkeleton.js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const SkeletonBlock = ({ width, height, style, colors }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1, // Infinite repeat
      true // Reverse on each repeat
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        { width, height, backgroundColor: colors.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
};

const PostSkeleton = ({ colors }) => {
  return (
    <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <SkeletonBlock
          width={wp(10)}
          height={wp(10)}
          style={styles.avatar}
          colors={colors}
        />
        <View style={styles.headerTextContainer}>
          <SkeletonBlock
            width={wp(30)}
            height={hp(2)}
            style={styles.username}
            colors={colors}
          />
          <SkeletonBlock
            width={wp(20)}
            height={hp(1.5)}
            style={styles.location}
            colors={colors}
          />
        </View>
      </View>

      {/* Post Content */}
      <SkeletonBlock
        width={wp(80)}
        height={hp(4)}
        style={styles.content}
        colors={colors}
      />
      <SkeletonBlock
        width={wp(80)}
        height={hp(2)}
        style={styles.contentLine}
        colors={colors}
      />

      {/* Media Placeholder */}
      <SkeletonBlock
        width={wp(90)}
        height={hp(25)}
        style={styles.media}
        colors={colors}
      />

      {/* Interaction Bar */}
      <View style={styles.interactionBar}>
        <View style={styles.interactionButton}>
          <SkeletonBlock width={wp(8)} height={wp(5)} colors={colors} />
        </View>
        <View style={styles.interactionButton}>
          <SkeletonBlock width={wp(8)} height={wp(5)} colors={colors} />
        </View>
        <View style={styles.interactionButton}>
          <SkeletonBlock width={wp(8)} height={wp(5)} colors={colors} />
        </View>
        <View style={styles.interactionButton}>
          <SkeletonBlock width={wp(8)} height={wp(5)} colors={colors} />
        </View>
      </View>

      {/* View Count */}
      <SkeletonBlock
        width={wp(20)}
        height={hp(2)}
        style={styles.viewCount}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: wp(4),
    marginVertical: hp(1),
    marginHorizontal: wp(2.5),
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  avatar: {
    borderRadius: wp(5),
    marginRight: wp(2.5),
  },
  headerTextContainer: {
    flex: 1,
  },
  username: {
    marginBottom: hp(0.5),
  },
  location: {},
  content: {
    marginBottom: hp(0.5),
  },
  contentLine: {
    marginBottom: hp(1.5),
  },
  media: {
    borderRadius: 12,
    marginBottom: hp(1.5),
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2),
  },
  viewCount: {
    marginTop: hp(1),
  },
  skeletonBlock: {
    borderRadius: 8,
  },
});

export default PostSkeleton;