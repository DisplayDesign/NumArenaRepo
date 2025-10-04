import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings as SettingsIcon,
  User,
  Info,
  Trash2,
  Globe
} from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '@/i18n';

export default function SettingsScreen() {
  const { playerData, updateDisplayName, resetAllData } = usePlayer();
  const { t, i18n } = useTranslation();
  const [nameInput, setNameInput] = useState(playerData?.displayName || '');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setNameInput(playerData?.displayName || '');
  }, [playerData?.displayName]);

  useEffect(() => {
    // 言語状態を監視してcurrentLanguageを更新
    const handleLanguageChange = (lng: string) => {
      console.log('設定画面: 言語変更イベント受信:', lng);
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // 言語状態の変更を監視（依存配列にi18n.languageを追加）
  useEffect(() => {
    console.log('設定画面: 言語状態変更検知:', i18n.language);
    const newLanguage = i18n.language;
    setCurrentLanguage(newLanguage);
    console.log('設定画面: currentLanguage更新後:', newLanguage);
    console.log('設定画面: 翻訳テスト:', t('settings.title'));
    // 言語変更後に現在の言語で翻訳されているかを確認
    console.log('設定画面: 現在の言語で翻訳テスト:', t('settings.title'));
    console.log('設定画面: ホーム翻訳テスト:', t('home.title'));
  }, [i18n.language, t]);

  const handleResetData = () => {
    Alert.alert(
      t('settings.reset_confirm_title'),
      t('settings.reset_confirm_message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert(t('common.success'), t('settings.reset_success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.reset_error'));
            }
          }
        }
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      t('settings.about_app'),
      t('settings.about_description'),
      [{ text: t('common.ok') }]
    );
  };

  const handleLanguageChange = async (language: string) => {
    try {
      console.log('言語変更開始:', language);
      console.log('現在の言語:', i18n.language);
      await i18n.changeLanguage(language);
      console.log('i18n変更後:', i18n.language);
      await saveLanguage(language);
      setCurrentLanguage(language);
      console.log('言語変更完了:', language, '最終言語:', i18n.language);
      // 言語変更後に翻訳機能をテスト
      console.log('翻訳テスト:', t('settings.title'));
    } catch (error) {
      console.error('言語変更エラー:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <SettingsIcon size={32} color={LIQUID_GLASS_COLORS.primary.coral} />
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* プレイヤー情報 */}
        <GlassContainer style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.player_info')}</Text>
          
          <View style={styles.nameItem}>
            <View style={styles.nameTop}>
              <User size={20} color={LIQUID_GLASS_COLORS.text.primary} />
              <Text style={styles.settingLabel}>{t('settings.player_name')}</Text>
            </View>
            <View style={styles.nameRight}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={t('settings.player_name')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={[styles.nameInput, { flex: 1 }]}
                maxLength={20}
              />
              <TouchableOpacity
                onPress={async () => {
                  const trimmed = nameInput.trim();
                  if (!trimmed) {
                    Alert.alert(t('common.error'), t('settings.name_required'));
                    return;
                  }
                  try {
                    await updateDisplayName(trimmed);
                    Alert.alert(t('common.success'), t('settings.name_updated'));
                  } catch (e) {
                    Alert.alert(t('common.error'), t('settings.name_update_failed'));
                  }
                }}
                style={[styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>



          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.rating')}</Text>
            </View>
            <Text style={[styles.settingValue, { color: LIQUID_GLASS_COLORS.primary.coral }]}>
              {playerData?.rating || 1200}
            </Text>
          </View>
        </GlassContainer>

        {/* ゲーム設定セクションは削除 */}

        {/* データ管理 */}
        <GlassContainer style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.data_management')}</Text>


          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetData}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#FF6B6B" />
              <Text style={[styles.settingLabel, { color: '#FF6B6B' }]}>{t('settings.reset_data')}</Text>
            </View>
            <Text style={[styles.settingAction, { color: '#FF6B6B' }]}>{t('settings.delete')}</Text>
          </TouchableOpacity>
        </GlassContainer>

        {/* 言語設定 */}
        <GlassContainer style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Globe size={20} color={LIQUID_GLASS_COLORS.text.primary} />
              <Text style={styles.settingLabel}>{t('settings.language')}</Text>
            </View>
            <View style={styles.languageSelector}>
              <TouchableOpacity
                style={[styles.languageOption, currentLanguage === 'ja' && styles.languageOptionActive]}
                onPress={() => handleLanguageChange('ja')}
              >
                <Text style={[styles.languageOptionText, currentLanguage === 'ja' && styles.languageOptionTextActive]}>
                  日本語
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageOption, currentLanguage === 'en' && styles.languageOptionActive]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={[styles.languageOptionText, currentLanguage === 'en' && styles.languageOptionTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassContainer>

        {/* アプリ情報 */}
        <GlassContainer style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app_info')}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={showAbout}
          >
            <View style={styles.settingLeft}>
              <Info size={20} color={LIQUID_GLASS_COLORS.text.primary} />
              <Text style={styles.settingLabel}>{t('settings.about')}</Text>
            </View>
            <Text style={styles.settingAction}>{t('settings.display')}</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.version')}</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </GlassContainer>

        {/* 統計情報 */}
        <GlassContainer style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>{t('settings.stats')}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{playerData?.totalGames || 0}</Text>
              <Text style={styles.statLabel}>{t('settings.total_games')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{playerData?.wins || 0}</Text>
              <Text style={styles.statLabel}>{t('settings.wins')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{playerData?.losses || 0}</Text>
              <Text style={styles.statLabel}>{t('settings.losses')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {playerData?.totalGames ?
                  Math.round((playerData.wins / playerData.totalGames) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>{t('settings.win_rate')}</Text>
            </View>
          </View>
        </GlassContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE,
    marginTop: 8
  },
  section: {
    margin: 20,
    marginBottom: 0
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 16
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  settingLabel: {
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE
  },
  settingAction: {
    fontSize: 14,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.primary.turquoise,
    ...TEXT_OUTLINE_STYLE
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap'
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  languageOptionActive: {
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral,
    borderColor: 'rgba(255, 255, 255, 0.45)'
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE
  },
  languageOptionTextActive: {
    color: '#FFFFFF'
  },
  nameItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  nameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  nameRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  nameInput: {
    minWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: LIQUID_GLASS_COLORS.text.primary
  },
  saveButton: {
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.primary.coral,
    ...TEXT_OUTLINE_STYLE
  },
  statLabel: {
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE,
    marginTop: 4
  }
});