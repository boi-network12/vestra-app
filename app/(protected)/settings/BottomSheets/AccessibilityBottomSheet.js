import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';

const AccessibilityBottomSheet = ({ colors, toggleTheme, isDark }) => {
  const [isDarkMode, setIsDarkMode] = useState(isDark);
  

  // Sync with theme changes from outside
  useEffect(() => {
    setIsDarkMode(isDark);
  }, [isDark]);

  const handleToggleSwitch = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    toggleTheme();
  };

  return (
    <View className=''>
      <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.text }}>
        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </Text>

        <Switch
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleToggleSwitch}
            value={isDarkMode}
          />
      </View>
      <TouchableOpacity style={{  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 }}>
        <Text style={{ color: colors.text }}>Language</Text>
        <Text style={{ color: colors.subText }}>English</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text }}>Accessibility</Text>
        <Text style={{ color: colors.subText }}>Public</Text>
      </TouchableOpacity>
      
      {/* Add more accessibility settings here */}
      
    </View>
  );
};

export default AccessibilityBottomSheet;