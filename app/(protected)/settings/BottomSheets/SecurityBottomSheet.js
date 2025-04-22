import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SecurityBottomSheet = ({ onClose, colors, user, login, updateProfile }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New states for change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleAuthenticate = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({
        email: user.email,
        password: password
      });
      setAuthenticated(true);
    } catch (err) {
      setError('Incorrect password. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      // First verify current password
      await login({
        email: user.email,
        password: currentPassword
      });
      
      // If verification succeeds, update password
      await updateProfile({
        password: newPassword
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError('Current password is incorrect');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]}>
            For security reasons, please enter your password to access security settings.
          </Text>

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: error ? colors.error : colors.border
              }
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
            autoFocus={true}
          />

          {error ? (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.7 : 1
              }
            ]}
            onPress={handleAuthenticate}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {loading ? 'Verifying...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showChangePassword) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowChangePassword(false)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.text,  }]}>Change Password</Text>
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: passwordError ? colors.error : colors.border
              }
            ]}
            placeholder="Current password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={true}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoFocus={true}
          />

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: passwordError ? colors.error : colors.border
              }
            ]}
            placeholder="New password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={true}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: passwordError ? colors.error : colors.border
              }
            ]}
            placeholder="Confirm new password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={true}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {passwordError ? (
            <Text style={[styles.error, { color: colors.error }]}>{passwordError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.7 : 1
              }
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {loading ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setShowChangePassword(true)}
        >
          <Text style={[styles.settingText, { color: colors.text, borderBottomColor: colors.border }]}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingText, { color: colors.text, borderBottomColor: colors.border }]}>Two-Factor Authentication</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Account Access</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingText, { color: colors.text, borderBottomColor: colors.border }]}>Connected Apps</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingText, { color: colors.text, borderBottomColor: colors.border }]}>Sessions</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: hp(2),
  },
  description: {
    fontSize: hp(1.8),
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: hp(1.8),
  },
  error: {
    fontSize: hp(1.6),
    marginBottom: 15,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: hp(1.8),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: hp(1.8),
    marginLeft: 5,
  },
});

export default SecurityBottomSheet;