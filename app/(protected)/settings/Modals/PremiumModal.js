import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getThemeColors } from '../../../../utils/theme';

const PremiumModal = ({ onClose }) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
        Premium Features
      </Text>
      <Text style={{ color: colors.subText, marginVertical: 10 }}>
        Access exclusive content, ad-free experience, and more with Premium.
      </Text>
      
      {/* Add your premium features list here */}
      
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
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PremiumModal;