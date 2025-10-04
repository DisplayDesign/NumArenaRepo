import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LIQUID_GLASS_COLORS, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Trophy, Minus, Home } from 'lucide-react-native';

interface GameResultOverlayProps {
  visible: boolean;
  winnerName: string | null;
  scores: { player1: number; player2: number };
}

export const GameResultOverlay: React.FC<GameResultOverlayProps> = ({
  visible,
  winnerName,
  scores
}) => {
  if (!visible) return null;

  const isDraw = !winnerName;

  return (
    <View style={styles.overlay}>
      <GlassContainer
        style={styles.card}
        gradientColors={[
          'rgba(255,255,255,0.12)',
          'rgba(255,255,255,0.05)'
        ]}
        borderRadius={22}
        blurIntensity={22}
      >
        <View style={styles.headerIconWrap}>
          {isDraw ? (
            <Minus size={28} color={LIQUID_GLASS_COLORS.text.primary} />
          ) : (
            <Trophy size={28} color={LIQUID_GLASS_COLORS.primary.peach} />
          )}
        </View>
        <Text style={[styles.title, TEXT_OUTLINE_STYLE]}>ゲーム終了</Text>
        <Text style={styles.subtitle}>
          {winnerName ? `${winnerName} の勝ち！` : 'ドロー！'}
        </Text>

        <Text style={styles.scoreSimple}>{`${scores.player1} - ${scores.player2}`}</Text>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={20} color="#fff" />
          <Text style={styles.homeButtonText}>ホームに戻る</Text>
        </TouchableOpacity>
      </GlassContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 22
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: LIQUID_GLASS_COLORS.text.primary,
    letterSpacing: 0.5
  },
  subtitle: {
    marginTop: 6,
    color: LIQUID_GLASS_COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center'
  },
  scoreSimple: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: '900',
    color: LIQUID_GLASS_COLORS.text.primary
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14
  },
  primary: {
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral
  },
  secondary: {
    backgroundColor: '#3E4A4C'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

