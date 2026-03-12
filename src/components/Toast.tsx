import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  type?: 'success' | 'error';
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, onHide, type = 'success', duration = 2500 }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, stiffness: 200, damping: 20, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bg = type === 'success' ? '#1DB954' : '#FF4757';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, transform: [{ translateY }], opacity }]}>
      <Text style={styles.icon}>{type === 'success' ? '✓' : '✕'}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: { fontSize: 18, fontWeight: '700', color: '#FFF', marginRight: 10 },
  message: { fontSize: 15, fontWeight: '600', color: '#FFF', flex: 1 },
});
