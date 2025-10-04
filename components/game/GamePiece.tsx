import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withSequence,
  useAnimatedStyle 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LIQUID_GLASS_COLORS, PLAYER_COLORS, ANIMATION_CONFIG, TEXT_OUTLINE_COLOR } from '@/constants/colors';

interface GamePieceProps {
  value: number | 'n';
  playerId: number;
  isNewPiece?: boolean;
  size?: number;
}

export const GamePiece: React.FC<GamePieceProps> = ({ 
  value, 
  playerId, 
  isNewPiece = false,
  size = 50
}) => {
  const isNeutralPiece = value === 'n';
  const playerColor = PLAYER_COLORS[playerId] || LIQUID_GLASS_COLORS.primary.coral;
  
  const scale = useSharedValue(isNewPiece ? 0 : 1);
  const rotation = useSharedValue(0);
  
  // 新しいコマの登場アニメーション
  useEffect(() => {
    if (isNewPiece) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      rotation.value = withSpring(360, { damping: 15 });
    }
  }, [isNewPiece, scale, rotation]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));
  
  const diameter = size;
  const radius = diameter / 2;

  return (
    <Animated.View style={[styles.pieceContainer, { width: diameter, height: diameter }, animatedStyle]}>
      {/* グロー効果 */}
      <View style={[
        styles.pieceGlow,
        { 
          backgroundColor: `${playerColor}40`,
          shadowColor: playerColor
        }
      ]} />
      
      {/* メインピース */}
      <LinearGradient
        colors={[`${playerColor}CC`, `${playerColor}99`] as const}
        style={[styles.piece, { width: diameter, height: diameter, borderRadius: radius }]}
      >
        <Text style={[
          styles.pieceText,
          { 
            color: '#fff',
            fontSize: value === 'n' ? Math.max(14, radius - 7) : Math.max(16, radius - 5)
          }
        ]}>
          {value}
        </Text>
      </LinearGradient>
      
      {/* リング効果 */}
      <View style={[
        styles.pieceRing,
        { borderColor: playerColor, borderRadius: radius + 2, top: -2, left: -2, right: -2, bottom: -2 }
      ]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pieceContainer: {
    position: 'relative',
    width: 50,
    height: 50
  },
  pieceGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 30,
    opacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10
  },
  piece: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  pieceText: {
    fontWeight: 'bold',
    textShadowColor: TEXT_OUTLINE_COLOR,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  pieceRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    borderWidth: 2,
    opacity: 0.7
  }
});