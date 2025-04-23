import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { router } from 'expo-router';
import { getThemeColors } from '../../utils/theme';
import { StatusBar } from 'expo-status-bar';

const menuItems = [
  { label: 'Profile', icon: 'person-outline', action: () => router.push('/profile') },
  { label: 'Premium', icon: 'star-outline', action: () => router.push('/premium') },
  { label: 'Bookmarks', icon: 'bookmark-outline', action: () => router.push('/bookmarks') },
  { label: 'Jobs', icon: 'briefcase-outline', action: () => router.push('/jobs') },
  { label: 'Lists', icon: 'list-outline', action: () => router.push('/lists') },
  { label: 'Spaces', icon: 'mic-outline', action: () => router.push('/spaces') },
  { label: 'Monetization', icon: 'cash-outline', action: () => router.push('/monetization') },
  { label: 'Settings', icon: 'settings-outline', action: () => router.push('/settings') },
];

export default function CustomDrawerContent(props) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);


  const textColor = isDark ? 'text-white' : 'text-black';

  return (
    <View className={`flex-1 `}
      style={{
        backgroundColor: colors.background,
      }}
    >
      <StatusBar style='auto'/>
      {/* Profile Section */}
      <View className={`px-4 pt-16 pb-4 border-b relative}`}
         style={{
          borderBottomColor: colors.border
         }}
      >
        <Image
          source={{ uri: user?.profilePicture || 'https://i.pravatar.cc/150' }}
          className="w-16 h-16 rounded-full mb-2"
        />
        <Text className={`text-lg font-bold`} style={{ color: colors.text }}>{user?.name || 'Guest User'}</Text>
        <Text className={`text-sm `}
           style={{
            color: colors.subText}}
        >@{user?.username || 'guest_user'}</Text>
        <Text className={`text-sm mt-1`}
           style={{
            color: colors.subText
           }}
        > {Array.isArray(user.following) ? user.following.length : 0}  Following • {Array.isArray(user.followers) ? user.followers.length : 0} Followers</Text>

        <TouchableOpacity style={{
          position: 'absolute',
          right: 18,
          top: 30,
          padding: 8,
          borderRadius: 24,
          backgroundColor: colors.background,
        }}
         onPress={toggleTheme}
        >
          <Ionicons 
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              color={colors.text}
              size={24}
          />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }} showsVerticalScrollIndicator={false}>
        <View className="px-2 mt-2">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.action}
              className={`flex-row items-center py-3 px-1 rounded-lg ${isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}
            >
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text className={`text-base ml-4`}
                 style={{
                  color: colors.text
                }}
                  
              >{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Theme Toggle */}
          
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View className="px-4 pb-6 mt-auto">
        <TouchableOpacity
          onPress={logout}
          className={`flex-row items-center py-3 px-2 rounded-lg ${isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}
        >
          <Ionicons name="log-out-outline" size={22} color={isDark ? 'white' : 'black'} />
          <Text className={`text-base ml-4 ${textColor}`}>Logout</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}
