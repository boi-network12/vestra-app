// app/(protected)/_layout.js or _layout.tsx
import { Slot, Tabs } from 'expo-router';
import CustomTabs from '../../../components/Tabs/CustomTabs';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <Tabs 
      tabBar={(props) => <CustomTabs {...props} colors={colors}/>}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        }
      }}
    >
    </Tabs>
  );
}