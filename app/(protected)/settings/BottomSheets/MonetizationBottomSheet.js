import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';

const MonetizationBottomSheet = () => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
        Monetization Options
      </Text>
      <Text style={{ color: colors.subText, marginTop: 10 }}>
        Explore ways to earn money through our platform.
      </Text>
      
      {/* Add monetization options here */}
      
    </View>
  );
};

export default MonetizationBottomSheet;