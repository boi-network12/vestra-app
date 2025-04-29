// app/(protected)/_layout.js or _layout.tsx
import { Slot, Tabs } from 'expo-router';
import CustomTabs from '../../../components/Tabs/CustomTabs';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { useRef } from 'react';
import { Animated } from 'react-native';
import { useScroll } from '../../../contexts/ScrollContext';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { scrollY } = useScroll();

  return (
    <Tabs 
      tabBar={(props) => <CustomTabs {...props} colors={colors} scrollY={scrollY}/>}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        }
      }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="users" />
    </Tabs>
  );
}