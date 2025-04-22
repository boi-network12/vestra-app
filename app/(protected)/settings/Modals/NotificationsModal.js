import React, { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert } from 'react-native';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

const NotificationsModal = ({ user, onClose, colors, updateProfile }) => {
  const [editableUser, setEditableUser] = useState({
    settings: {
      notifications: {
        email: user.settings?.notifications?.email ?? true,
        push: user.settings?.notifications?.push ?? true,
        friendRequests: user.settings?.notifications?.friendRequests ?? true,
        messages: user.settings?.notifications?.messages ?? true,
        mentions: user.settings?.notifications?.mentions ?? true
      },
      privacy: {
        profileVisibility: 'friends',
        searchVisibility: true,
        activityVisibility: 'friends',
        messageRequests: 'friends'
      }
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setEditableUser({
        ...user,
        settings: {
          notifications: {
            email: user.settings?.notifications?.email ?? true,
            push: user.settings?.notifications?.push ?? true,
            friendRequests: user.settings?.notifications?.friendRequests ?? true,
            messages: user.settings?.notifications?.messages ?? true,
            mentions: user.settings?.notifications?.mentions ?? true
          },
          privacy: {
            profileVisibility: user.settings?.privacy?.profileVisibility || 'friends',
            searchVisibility: user.settings?.privacy?.searchVisibility ?? true,
            activityVisibility: user.settings?.privacy?.activityVisibility || 'friends',
            messageRequests: user.settings?.privacy?.messageRequests || 'friends'
          }
        }
      });
    }
  }, [user]); // Make sure 'user' prop is properly passed and changes when needed

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      if (subChild) {
        setEditableUser(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setEditableUser(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setEditableUser(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateSettings = () => {
    const validProfileVisibility = ['public', 'friends', 'private'].includes(editableUser.settings.privacy.profileVisibility);
    const validMessageRequests = ['public', 'friends', 'none'].includes(editableUser.settings.privacy.messageRequests);
    return validProfileVisibility && validMessageRequests;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      Alert.alert('Error', 'Invalid settings. Please check your selections.');
      return;
    }

    try {
      await updateProfile(editableUser);
      setIsEditing(false);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const getVisibilityDescription = (type) => {
    switch (type) {
      case 'profileVisibility':
        return 'Who can see your profile information';
      case 'activityVisibility':
        return 'Who can see your activity and posts';
      case 'messageRequests':
        return 'Who can send you direct messages';
      default:
        return '';
    }
  };

  return (
    <View style={{ marginBottom: 30, paddingTop: hp(2) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ 
          fontSize: hp(2.5), 
          fontWeight: '600', 
          color: colors.text,
        }}>
          Privacy & Notifications
        </Text>
        
        {isEditing ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Settings Section */}
      <Text style={{ 
        fontSize: hp(2), 
        fontWeight: '500', 
        color: colors.text,
        marginBottom: 15 
      }}>
        Privacy Settings
      </Text>
      
      <View style={{ backgroundColor: colors.cardBackground, borderRadius: 10, padding: 15, marginBottom: 20 }}>
        {['profileVisibility', 'activityVisibility', 'messageRequests'].map((setting) => (
          <View key={setting} style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.text, marginBottom: 5, fontWeight: '500' }}>
              {setting === 'profileVisibility' && 'Profile Visibility'}
              {setting === 'activityVisibility' && 'Activity Visibility'}
              {setting === 'messageRequests' && 'Message Requests'}
            </Text>
            <Text style={{ color: colors.subText, marginBottom: 10, fontSize: hp(1.6) }}>
              {getVisibilityDescription(setting)}
            </Text>
            {isEditing ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {(setting === 'messageRequests' ? ['public', 'friends', 'none'] : ['public', 'friends', 'private']).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleInputChange(`settings.privacy.${setting}`, option)}
                    style={{
                      padding: 10,
                      borderRadius: 5,
                      backgroundColor: editableUser.settings?.privacy?.[setting] === option 
                        ? colors.primary 
                        : colors.background,
                      marginBottom: 10,
                      minWidth: '30%',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ 
                      color: editableUser.settings?.privacy?.[setting] === option 
                        ? colors.buttonText 
                        : colors.text,
                      textTransform: 'capitalize',
                      fontSize: hp(1.6)
                    }}>
                      {option === 'none' ? 'No one' : option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{
                padding: 10,
                borderRadius: 5,
                backgroundColor: colors.background,
              }}>
                <Text style={{ 
                  color: colors.text, 
                  textTransform: 'capitalize',
                  fontSize: hp(1.6)
                }}>
                  {editableUser.settings?.privacy?.[setting] === 'none' ? 
                    'No one' : 
                    editableUser.settings?.privacy?.[setting]}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>Show in Search Results</Text>
            <Text style={{ color: colors.subText, fontSize: hp(1.6) }}>
              {editableUser.settings?.privacy?.searchVisibility ? 
                'Your profile can be found in search' : 
                'Your profile is hidden from search'}
            </Text>
          </View>
          <Switch
            value={editableUser.settings?.privacy?.searchVisibility ?? true}
            onValueChange={(value) => handleInputChange('settings.privacy.searchVisibility', value)}
            disabled={!isEditing}
            thumbColor={editableUser.settings?.privacy?.searchVisibility ? colors.primary : colors.subText}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
          />
        </View>
      </View>

      {/* Notification Settings Section */}
      <Text style={{ 
        fontSize: hp(2), 
        fontWeight: '500', 
        color: colors.text,
        marginBottom: 15 
      }}>
        Notification Settings
      </Text>
      
      <View style={{ backgroundColor: colors.cardBackground, borderRadius: 10, padding: 15 }}>
        {[
          { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
          { key: 'push', label: 'Push Notifications', description: 'Receive push notifications on your device' },
          { key: 'friendRequests', label: 'Friend Requests', description: 'Notify me about friend requests' },
          { key: 'messages', label: 'Direct Messages', description: 'Notify me about new messages' },
          { key: 'mentions', label: 'Mentions', description: 'Notify me when I\'m mentioned' }
        ].map((item) => (
          <View key={item.key} style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: item.key === 'mentions' ? 0 : 15
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '500' }}>{item.label}</Text>
              <Text style={{ color: colors.subText, fontSize: hp(1.6) }}>
                {editableUser.settings?.notifications?.[item.key] ? 
                  item.description : 
                  `${item.label} are disabled`}
              </Text>
            </View>
            <Switch
              value={editableUser.settings?.notifications?.[item.key] ?? true}
              onValueChange={(value) => handleInputChange(`settings.notifications.${item.key}`, value)}
              disabled={!isEditing}
              thumbColor={editableUser.settings?.notifications?.[item.key] ? colors.primary : colors.subText}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default NotificationsModal;