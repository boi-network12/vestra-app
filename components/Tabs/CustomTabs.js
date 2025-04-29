import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter, useNavigationState } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useEffect, useRef } from 'react';

const CustomTabs = ({ state, colors, scrollY }) => {
  
  const activeRouteName = state.routes[state.index].name;

  const hiddenRoutes = ['chats/[chatId]', 'chats/Ai'];

  const shouldHideTabs = hiddenRoutes.some(
    (route) => activeRouteName === route || activeRouteName.startsWith(`${route}/`)
  );

  if (shouldHideTabs) {
    return null;
  }

  // Animation setup
  const router = useRouter();
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Handle scroll animation
  useEffect(() => {
    console.log('Setting up scrollY listener in CustomTabs');
    const listenerId = scrollY.addListener(({ value }) => {
      const diff = value - lastScrollY.current;

      if (Math.abs(diff) > 5) {
        if (diff > 0 && value > 30) {
          Animated.timing(translateY, {
            toValue: hp(7),
            duration: 10,
            useNativeDriver: true,
          }).start();
        } else if (diff < 0 && value >= 0) {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 10,
            useNativeDriver: true,
          }).start();
        }
        lastScrollY.current = value;
      }
    });

    return () => {
      console.log('Cleaning up scrollY listener in CustomTabs');
      scrollY.removeListener(listenerId);
    };
  }, [scrollY, translateY]);


  const tabs = [
    {
      name: 'feed',
      title: 'Feed',
      icon: 'newspaper-outline',
      activeIcon: 'newspaper',
    },
    {
      name: 'jobs',
      title: 'Jobs',
      icon: 'briefcase-outline',
      activeIcon: 'briefcase',
    },
    {
      name: 'chats',
      title: 'Chats',
      icon: 'mail-outline',
      activeIcon: 'mail',
    },
    {
      name: 'search',
      title: 'Search',
      icon: 'search-outline',
      activeIcon: 'search',
    },
    {
      name: 'users',
      title: 'Users',
      icon: 'people-outline',
      activeIcon: 'people',
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card, transform: [{ translateY }] },
      ]}
    >
      {tabs.map((tab) => {
        const isActive =
          activeRouteName === tab.name ||
          activeRouteName.startsWith(`${tab.name}/`);

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(`/${tab.name}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={hp(2.8)}
                color={isActive ? colors.primary : colors.subText}
              />
              {isActive && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingBottom: hp(2),
    // Glassmorphism effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(1),
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(2),
    borderRadius: hp(10),
    position: 'relative',
  },
  activeTabContent: {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: hp(0.5),
    borderRadius: 3,
    backgroundColor: '#1DA1F2',
  },
});

export default CustomTabs;