import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import SettingsHeader from '../../../components/Headers/SettingHeader';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemeColors } from '../../../utils/theme';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Import all modals
import AccountModal from './Modals/AccountModal';
import SecurityModal from './BottomSheets/SecurityBottomSheet';
import PremiumModal from './Modals/PremiumModal';
import MonetizationModal from './BottomSheets/MonetizationBottomSheet';
import NotificationsModal from './Modals/NotificationsModal';
import AccessibilityModal from './BottomSheets/AccessibilityBottomSheet';


const settingsList = [
  {
    title: 'Your account',
    description: 'See information about your account...',
    component: 'AccountModal',
  },
  {
    title: 'Security and account access',
    description: 'Manage your account\'s security...',
    component: 'SecurityModal',
  },
  {
    title: 'Premium',
    description: 'See what\'s included in Premium...',
    component: 'PremiumModal',
  },
  {
    title: 'Monetization',
    description: 'See how you can make money...',
    component: 'MonetizationModal',
  },
  {
    title: 'Notifications, Privacy and safety',
    description: 'Select the kinds of notifications...',
    component: 'NotificationsModal',
  },
  {
    title: 'Accessibility, display and languages',
    description: 'Manage how X content is displayed...',
    component: 'AccessibilityModal',
  },
];

export default function Settings() {
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const { user, login, updateProfile, deleteAccount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);
  const [modalVisible, setModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      swipeEnabled: false,
    });
  }, [navigation]);

  const filteredSettings = settingsList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSettingPress = (item) => {
    setSelectedSetting(item);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    switch (selectedSetting?.component) {
      case 'AccountModal':
        return <AccountModal 
                 onClose={() => setModalVisible(false)} 
                 colors={colors} 
                 user={user} 
                 updateProfile={updateProfile} 
                 deleteAccount={deleteAccount}
               />;
      case 'SecurityModal':
        return <SecurityModal 
                  onClose={() => 
                  setModalVisible(false)} 
                  colors={colors} user={user} 
                  login={login}
                  updateProfile={updateProfile} />;
      case 'PremiumModal':
        return <PremiumModal 
                   onClose={() => 
                    setModalVisible(false)} 
                    colors={colors} 
                />;
      case 'MonetizationModal':
        return <MonetizationModal 
                  onClose={() => 
                  setModalVisible(false)} 
                  colors={colors} 
                />;
      case 'PrivacyModal':
        return <PrivacyModal 
                 onClose={() => 
                 setModalVisible(false)} 
                 colors={colors} 
                />;
      case 'NotificationsModal':
        return <NotificationsModal 
                 onClose={() => 
                 setModalVisible(false)} 
                 colors={colors} 
                 user={user}
                 updateProfile={updateProfile} 
                />;
      case 'AccessibilityModal':
        return <AccessibilityModal 
                  onClose={() => 
                  setModalVisible(false)} 
                  colors={colors} 
                  toggleTheme={toggleTheme} 
                  isDark={isDark} 
                />;
      default:
        return (
          <View>
            <Text style={{ color: colors.text }}>{selectedSetting?.title}</Text>
            <Text style={{ color: colors.subText }}>{selectedSetting?.description}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar style="auto" />

      <SettingsHeader
        title="Settings"
        onBackPress={() => navigation.goBack()}
        colors={colors}
      />

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            backgroundColor: colors.card,
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Search settings"
            placeholderTextColor="#999"
            selectionColor={'#444'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              marginLeft: 10,
              flex: 1,
              color: colors.text,
              paddingVertical: 4,
            }}
          />
        </View>

        {/* Settings list */}
        {filteredSettings.length > 0 ? (
          filteredSettings.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSettingPress(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ marginRight: 12 }}>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500', 
                  color: colors.text }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.subText,
                    marginTop: 4,
                  }}
                >
                  {item.description.substring(0, 60)}...
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
            No settings match your search.
          </Text>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.card,
          }}>
            {/* Updated Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={{ padding: 5 }}
              >
                <Ionicons 
                  name='arrow-back' 
                  size={hp(2.5)} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              <Text style={{ 
                fontSize: hp(2),
                fontWeight: '600', 
                color: colors.text,
                marginLeft: 15
              }}>
                {selectedSetting?.title}
              </Text>
            </View>
            
            <ScrollView 
              style={{ flex: 1, paddingHorizontal: 20 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}