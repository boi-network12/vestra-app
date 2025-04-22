import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import React, { useState } from 'react';
import { Fontisto, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { heightPercentageToDP as hp, widthPercentageToDP as wp  } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';

export default function Register() {
  const { register, loading, error } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [step, setStep] = useState(1);

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Invalid email format');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    try {
      const result = await register({
          name,
          username,
          email,
          password
      });
      
      if (result?.requiresVerification) {
          setStep(2); // Move to verification step
      } else {
          router.replace('/(protected)/(tabs)/feed');
      }
  } catch (error) {
      Alert.alert('Registration Error', error.message || 'Registration failed. Please try again.');
  }
  };

  if (step === 2) {
    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.logoContainer}>
                <Fontisto
                    name='locked'
                    size={60}
                    color={colors.primary}
                />
            </View>
            
            <Text style={[styles.welcomeText, { color: colors.subText }]}>
                Verify Your Email
            </Text>
            
            <Text style={[styles.instructionText, { color: colors.subText }]}>
                We've sent a 6-digit verification code to {email}. Please enter it below:
            </Text>
            
            <View style={[styles.inputContainer, { 
                backgroundColor: colors.inputBg,
                borderColor: colors.border 
            }]}>
                <MaterialIcons 
                    name="verified-user" 
                    size={24} 
                    color={colors.icon} 
                    style={styles.icon} 
                />
                <TextInput
                    placeholder="Verification Code"
                    placeholderTextColor={colors.placeholder}
                    style={[styles.input, { color: colors.text }]}
                    selectionColor={colors.primary}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            </View>
            
            <TouchableOpacity
                style={[styles.registerButton, { 
                    backgroundColor: colors.primary,
                }]}
            >
                <Text style={styles.buttonText}>
                    Verify Email
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                onPress={() => setStep(1)}
                style={[styles.backButton, { borderColor: colors.primary }]}
            >
                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                    Back to Registration
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
  }


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.logoContainer}>
        <LottieView
          source={require('../../assets/animations/signup.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
     
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
          <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
        </View>
      )}
      
      <Text style={[styles.welcomeText, { color: colors.subText }]}>Create an account</Text>

      {/* Name Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.inputBg,
        borderColor: colors.border 
      }]}>
        <MaterialIcons 
          name="person-outline" 
          size={hp(2)} 
          color={colors.icon} 
          style={styles.icon} 
        />
        <TextInput
          placeholder="Full Name"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          style={[styles.input, { color: colors.text }]}
          selectionColor={colors.primary}
        />
      </View>

      {/* Username Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.inputBg,
        borderColor: colors.border 
      }]}>
        <MaterialIcons 
          name="account-circle" 
          size={hp(2)} 
          color={colors.icon} 
          style={styles.icon} 
        />
        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          value={username}
          onChangeText={setUsername}
          style={[styles.input, { color: colors.text }]}
          selectionColor={colors.primary}
          autoCapitalize="none"
        />
      </View>

      {/* Email Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.inputBg,
        borderColor: colors.border 
      }]}>
        <MaterialIcons 
          name="email" 
          size={hp(2)} 
          color={colors.icon} 
          style={styles.icon} 
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { color: colors.text }]}
          selectionColor={colors.primary}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password Input */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.inputBg,
        borderColor: colors.border 
      }]}>
        <MaterialIcons 
          name="lock-outline" 
          size={hp(2)} 
          color={colors.icon} 
          style={styles.icon} 
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={[styles.input, { color: colors.text }]}
          selectionColor={colors.primary}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={hp(2)} 
            color={colors.icon} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={[styles.registerButton, { 
          backgroundColor: colors.primary,
          opacity: loading ? 0.7 : 1 
        }]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <View style={styles.socialLoginContainer}>
        <Text style={[styles.socialLoginText, { color: colors.subText }]}>
          Or sign up with
        </Text>
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={[styles.socialButton, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <Fontisto name="google" size={hp(3)} color="#EA4335" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <Fontisto name="apple" size={hp(3)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <Fontisto name="facebook" size={hp(3)} color="#3b5998" />
          </TouchableOpacity>
        </View>
      </View>

      <Link href="/login" style={[styles.loginLink, { color: colors.primary }]}>
        Already have an account? Sign In
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    minHeight: '100%'
  },
  animation: {
    width: wp(40),
    height: hp(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: hp(2),
    paddingVertical: hp(0.2),
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: hp(1.5),
  },
  registerButton: {
    width: '100%',
    height: hp(5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  socialLoginContainer: {
    marginTop: 20,
    width: '100%',
  },
  socialLoginText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  loginLink: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: hp(1.2),
    fontWeight: '500',
  },
});