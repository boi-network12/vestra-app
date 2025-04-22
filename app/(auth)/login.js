import { useState } from 'react';
import { View, Text, TextInput, Platform, TouchableOpacity, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Fontisto, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../utils/theme';
import { heightPercentageToDP as hp, widthPercentageToDP as wp  } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';

export default function Login() {
  const { login, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const handleLogin = async () => {
    setLocalError(null);
    
    // Basic validation
    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    try {
      await login({ email, password });
      router.replace('/(protected)/(tabs)/feed');
    } catch (error) {
      setLocalError(error.message || 'Login failed. Please try again.');
    }
  };

  // Combine both authError and localError for display
  const displayError = authError || localError;

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
      
      {displayError && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorBg }]}>
          <Text style={[styles.errorText, { color: colors.errorText }]}>{displayError}</Text>
        </View>
      )}
      
      <Text style={[styles.welcomeText, { color: colors.subText }]}>Welcome back you've missed</Text> 

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
        onPress={handleLogin}
        disabled={loading}
        style={[styles.loginButton, { 
          backgroundColor: colors.primary,
          opacity: loading ? 0.7 : 1 
        }]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <View style={styles.socialLoginContainer}>
        <Text style={[styles.socialLoginText, { color: colors.subText }]}>
          Or login with
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

      <Link href="/register" style={[styles.registerLink, { color: colors.primary }]}>
        Don't have an account? Register
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
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  animation: {
    width: wp(40),
    height: hp(20),
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
    paddingHorizontal: 15,
    paddingVertical: hp(0.2),
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: hp(2),
  },
  loginButton: {
    width: '100%',
    height: hp(5.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  socialLoginContainer: {
    marginTop: hp(10),
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
  registerLink: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: hp(1.2),
    fontWeight: '500',
  },
});