import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';

const PrivacyModal = ({ onClose }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [privacySettings, setPrivacySettings] = useState({
    showActivity: true,
    allowTags: true,
    sensitiveContent: false,
  });

  const toggleSwitch = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>
        Privacy Settings
      </Text>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={{ color: colors.text, marginBottom: 5 }}>Show your activity status</Text>
        <Switch
          value={privacySettings.showActivity}
          onValueChange={() => toggleSwitch('showActivity')}
        />
      </View>
      
      {/* Add more privacy settings here */}
      
      <TouchableOpacity
        onPress={onClose}
        style={{
          backgroundColor: colors.primary,
          padding: 15,
          borderRadius: 10,
          marginTop: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PrivacyModal;