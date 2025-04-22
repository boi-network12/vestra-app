import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Switch, Modal, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COUNTRIES } from '../../../../constants/countries';


const AccountModal = ({ colors, user, updateProfile, deleteAccount }) => {
  const [editableUser, setEditableUser] = useState({
    name: '',
    username: '',
    email: '',
    country: '',
    dateOfBirth: '',
    profilePicture: '',
    phoneNumber: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      setEditableUser({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        country: user.country || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        profilePicture: user.profilePicture || '',
        phoneNumber: user.phoneNumber || '',
      });
      if (user.dateOfBirth) {
        setTempDate(new Date(user.dateOfBirth));
      }
    }
  }, [user]);

  // Filter countries based on search query
  const filteredCountries = COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (countryName) => {
    handleInputChange('country', countryName);
    setCountryModalVisible(false);
    setSearchQuery('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      if (subChild) {
        // Handle nested nested fields (settings.notifications.email)
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
        // Handle nested fields (settings.notifications)
        setEditableUser(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      // Handle top-level fields
      setEditableUser(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange('dateOfBirth', formattedDate);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare the data to send
      const updateData = {
        ...editableUser
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount }
      ]
    );
  };

  return (
    <ScrollView 
      style={{ 
        flex: 1,
        paddingTop: hp(2),
        backgroundColor: colors.card,
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ 
          fontSize: hp(2.5), 
          fontWeight: '600', 
          color: colors.text,
        }}>
          Your Account
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
      
      {/* Basic Info Section */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ 
          fontSize: hp(2), 
          fontWeight: '500', 
          color: colors.text,
          marginBottom: 15 
        }}>
          Basic Information
        </Text>
        
        <View style={{ backgroundColor: colors.background, borderRadius: 10, padding: 15 }}>
          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Name</Text>
            {isEditing ? (
              <TextInput
                value={editableUser.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={{
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 8
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.subText}
              />
            ) : (
              <Text style={{ color: colors.text }}>{editableUser.name}</Text>
            )}
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Username</Text>
            {isEditing ? (
              <TextInput
                value={editableUser.username}
                onChangeText={(text) => handleInputChange('username', text)}
                style={{
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 8
                }}
                placeholder="Enter username"
                placeholderTextColor={colors.subText}
              />
            ) : (
              <Text style={{ color: colors.text }}>@{editableUser.username}</Text>
            )}
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Email</Text>
            {isEditing ? (
              <TextInput
                value={editableUser.email}
                onChangeText={(text) => handleInputChange('email', text)}
                style={{
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 8
                }}
                placeholder="Enter email"
                placeholderTextColor={colors.subText}
              />
            ) : (
              <Text style={{ color: colors.text }}>{editableUser.email}</Text>
            )}
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Phone Number </Text>
            {isEditing ? (
              <TextInput
                value={editableUser.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                style={{
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: 8
                }}
                placeholder="Enter your phone Number"
                placeholderTextColor={colors.subText}
              />
            ) : (
              <Text style={{ color: colors.text }}>{editableUser.phoneNumber}</Text>
            )}
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Country</Text>
            {isEditing ? (
              <>
              <TouchableOpacity
                onPress={() => setCountryModalVisible(true)}
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {editableUser.country || 'Select country'}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={18} 
                    color={colors.subText} 
                  />
              </TouchableOpacity>
  
              {/* Country Selection Modal */}
              <Modal
                visible={countryModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setCountryModalVisible(false)}
              >
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                  {/* Search Bar */}
                  <View style={{ padding: 15 }}>
                    <TextInput
                      placeholder="Search countries..."
                      placeholderTextColor={colors.subText}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 8,
                        padding: 12,
                        color: colors.text
                      }}
                    />
                  </View>
  
                  {/* Country List */}
                  <FlatList
                    data={filteredCountries}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleCountrySelect(item.name)}
                        style={{
                          padding: 15,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border
                        }}
                      >
                        <Text style={{ color: colors.text }}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.subText }}>No countries found</Text>
                      </View>
                    }
                  />
  
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setCountryModalVisible(false)}
                    style={{
                      padding: 15,
                      backgroundColor: colors.primary,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </>
            ) : (
              <Text style={{ color: colors.text }}>{editableUser.country || 'Not specified'}</Text>
            )}
          </View>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={{ color: colors.subText, marginBottom: 5 }}>Date of Birth</Text>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  onPress={() => setDatePickerVisible(true)}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingVertical: 8
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {editableUser.dateOfBirth || 'Select date'}
                  </Text>
                </TouchableOpacity>
                {datePickerVisible && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            ) : (
              <Text style={{ color: colors.text }}>
                {editableUser.dateOfBirth || 'Not specified'}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      
      {/* Danger Zone */}
      <View>
        <Text style={{ 
          fontSize: hp(2), 
          fontWeight: '500', 
          color: colors.subText,
          marginBottom: 15 
        }}>
          Danger Zone
        </Text>
        
        <View style={{ backgroundColor: colors.errorLight, borderRadius: 10, padding: 15 }}>
          <TouchableOpacity 
            onPress={confirmDelete}
            style={{
              padding: 15,
              borderRadius: 8,
              backgroundColor: colors.errorText,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Delete Account</Text>
          </TouchableOpacity>
          
          <Text style={{ 
            color: colors.errorText,
            marginTop: 10,
            fontSize: 12,
            textAlign: 'center'
          }}>
            This will permanently delete your account and all associated data.
          </Text>
        </View>
      </View>
      
      {/* Close Button */}
      
    </ScrollView>
  );
};

export default AccountModal;