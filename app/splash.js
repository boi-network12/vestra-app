import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

export default function SplashScreen({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(onFinish, 1000); // Finish after 1 second
      });
    });
  }, []);

  return (
    <View style={styles.container}>
        <StatusBar style='auto'/>
      <Animated.Image
        source={require('../assets/images/splash-ico.png')} // replace with your own logo
        style={[styles.logo, { opacity: logoOpacity }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
        vestra
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: hp(20),
    height: hp(20),
  },
  text: {
    marginTop: hp(20),
    fontSize: hp(1.8),
    color: '#FFFFFF',
    fontWeight: 'semibold',
  },
});
