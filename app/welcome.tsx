import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Gamepad2, User } from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const [playerName, setPlayerName] = useState('');
  const { updateDisplayName } = usePlayer();
  const { t } = useTranslation();
  
  const handleStartGame = async () => {
    if (!playerName.trim()) {
      Alert.alert(t('common.error'), t('welcome.name_required'));
      return;
    }
    
    if (playerName.length < 3 || playerName.length > 20) {
      Alert.alert(t('common.error'), t('welcome.name_length'));
      return;
    }
    
    try {
      await updateDisplayName(playerName.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('common.error'), t('welcome.name_update_failed'));
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />
      
      <GlassContainer style={styles.welcomeCard}>
        <View style={styles.iconContainer}>
          <Gamepad2 size={64} color={LIQUID_GLASS_COLORS.primary.coral} />
        </View>
        
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <User size={20} color={LIQUID_GLASS_COLORS.text.secondary} />
            <TextInput
              style={styles.nameInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder={t('welcome.input_placeholder')}
              placeholderTextColor={LIQUID_GLASS_COLORS.text.secondary}
              maxLength={20}
            />
          </View>
          <Text style={styles.inputHelp}>{t('welcome.input_help')}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartGame}
        >
          <LinearGradient
            colors={[LIQUID_GLASS_COLORS.primary.coral, LIQUID_GLASS_COLORS.primary.peach]}
            style={styles.buttonGradient}
          >
            <Text style={styles.startButtonText}>{t('welcome.start_button')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.rulesPreview}>
          <Text style={styles.rulesTitle}>{t('welcome.rules_title')}</Text>
          <View style={styles.rulesList}>
            <Text style={styles.rulesText}>• {t('welcome.rules_bullet.1')}</Text>
            <Text style={styles.rulesText}>• {t('welcome.rules_bullet.2')}</Text>
            <Text style={styles.rulesText}>• {t('welcome.rules_bullet.3')}</Text>
            <Text style={styles.rulesText}>• {t('welcome.rules_bullet.4')}</Text>
          </View>
        </View>
      </GlassContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 32
  },
  iconContainer: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE,
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE,
    textAlign: 'center',
    marginBottom: 32
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.primary,
    marginLeft: 12
  },
  inputHelp: {
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE,
    textAlign: 'center'
  },
  startButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    ...TEXT_OUTLINE_STYLE
  },
  rulesPreview: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE,
    marginBottom: 12,
    textAlign: 'center'
  },
  rulesList: {
    // リストコンテナ
  },
  rulesText: {
    fontSize: 14,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE,
    lineHeight: 20,
    marginBottom: 4
  }
});