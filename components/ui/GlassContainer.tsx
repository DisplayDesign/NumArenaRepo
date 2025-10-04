import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp, ColorValue } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LIQUID_GLASS_COLORS } from '@/constants/colors';

type GradientTuple = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface GlassContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blurIntensity?: number;
  gradientColors?: GradientTuple;
  borderRadius?: number;
}

const DEFAULT_GRADIENT = [
  'rgba(255, 255, 255, 0.1)',
  'rgba(255, 255, 255, 0.05)'
] as const;

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  blurIntensity = 15,
<<<<<<< Updated upstream
  gradientColors = DEFAULT_GRADIENT,
=======
<<<<<<< ours
  gradientColors = ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as const,
=======
  gradientColors,
>>>>>>> theirs
>>>>>>> Stashed changes
  borderRadius = 20
}) => {
  const resolvedGradientColors = gradientColors ?? DEFAULT_GRADIENT;

  return (
    <View style={[styles.container, style, { borderRadius }]}>
      <LinearGradient
<<<<<<< Updated upstream
        colors={gradientColors ?? DEFAULT_GRADIENT}
=======
        colors={resolvedGradientColors}
>>>>>>> Stashed changes
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      <BlurView
        intensity={blurIntensity}
        style={[styles.blurContainer, { borderRadius }]}
      >
        <View style={[styles.content, { borderRadius }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: LIQUID_GLASS_COLORS.glass.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  blurContainer: {
    overflow: 'hidden'
  },
  content: {
    padding: 16
  }
});