import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigationState } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as Wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

const CustomTabs = ({ state, colors }) => {
  const router = useRouter();
  const activeRouteName = state.routes[state.index].name;

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
    <View style={[styles.container, { backgroundColor: colors.card }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingBottom: 20,
    // Glassmorphism effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    // Background blur (requires react-native-blur or similar for full effect)
    // For iOS:
    backdropFilter: 'blur(10px)',
    // For Android (alternative):
    // backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    paddingHorizontal: hp(2),
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