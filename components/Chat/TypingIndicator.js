import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { hp, wp } from '../../utils/responsive';

const TypingIndicator = ({ isTyping, colors }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const animationRefs = useRef([]);

  useEffect(() => {
    if (!isTyping) {
      // Clean up animations when not typing
      animationRefs.current.forEach(anim => anim?.stop());
      animationRefs.current = [];
      return;
    }

    const animate = (dot, delay = 0) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { 
            toValue: 1, 
            duration: 300, 
            useNativeDriver: true 
          }),
          Animated.timing(dot, { 
            toValue: 0, 
            duration: 300, 
            useNativeDriver: true 
          }),
        ])
      );
      
      const timeout = setTimeout(() => {
        anim.start();
        animationRefs.current.push(anim);
      }, delay);
      
      return () => clearTimeout(timeout);
    };

    animate(dot1);
    animate(dot2, 100);
    animate(dot3, 200);

    return () => {
      animationRefs.current.forEach(anim => anim?.stop());
      animationRefs.current = [];
    };
  }, [isTyping]); // Only depend on isTyping

  if (!isTyping) return null;

  return (
    <View style={[styles.typingContainer, { backgroundColor: colors.card }]}>
      <Animated.View
        style={[styles.typingDot, { backgroundColor: colors.subText, transform: [{ translateY: dot1 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { backgroundColor: colors.subText, transform: [{ translateY: dot2 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { backgroundColor: colors.subText, transform: [{ translateY: dot3 }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    marginLeft: wp(12),
    borderRadius: wp(4),
    marginVertical: hp(1),
    width: wp(20),
  },
  typingDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    marginHorizontal: wp(1),
  },
});

export default TypingIndicator;