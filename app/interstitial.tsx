import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { APP_BG_GRADIENT, LIQUID_GLASS_COLORS } from '@/constants/colors';

export default function InterstitialScreen() {
  const [left, setLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => setLeft(v => v - 1), 1000);
    const done = setTimeout(() => router.replace('/(tabs)'), 5000);
    return () => { clearInterval(timer as any); clearTimeout(done); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />
      <View style={styles.card}>
        <Text style={styles.title}>広告</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
        <Text style={styles.subtitle}>{left} 秒後にホームへ戻ります</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 41, 48, 0.9)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  title: { color: LIQUID_GLASS_COLORS.text.primary, fontSize: 18, fontWeight: '800' },
  subtitle: { color: LIQUID_GLASS_COLORS.text.secondary, marginTop: 8 }
});

