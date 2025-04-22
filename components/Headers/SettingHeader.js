import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SettingHeader({ onBackPress, title, colors }) {
    return (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={{ marginRight: 10 }}>
              <Ionicons name='arrow-back' size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text }}>{title}</Text>
        </View>
      );
}