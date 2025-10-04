import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Users, Globe, Cpu, Info } from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { RulesModal } from '@/components/ui/RulesModal';

export default function HomeScreen() {
  const { playerData } = usePlayer();
  const { t } = useTranslation();
  const rating = playerData?.rating || 1200;
  const wins = playerData?.wins || 0;
  const losses = playerData?.losses || 0;
  const total = playerData?.totalGames || 0;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const streak = playerData?.winStreak || 0;

  const getTier = (r: number) => {
    // 9999以上は固定
    if (r >= 9999) return { label: '神々の座', color: '#FF6B6B' };
    // 100刻みのバケットに丸め
    const bucket = Math.max(1200, Math.min(9900, Math.floor(r / 100) * 100));
    const LABEL_BY_BUCKET: Record<number, string> = {
      // 入門帯 1200-1500
      1200: 'ノーマル',
      1300: 'ブロンズ・ナイト',
      1400: 'ブロンズ・ウォリアー',
      1500: 'ブロンズ・チャンピオン',
      // 中級帯 1600-1900
      1600: 'シルバー・ナイト',
      1700: 'シルバー・ウォリアー',
      1800: 'シルバー・チャンピオン',
      1900: 'ゴールド・ナイト',
      // 上級帯 2000-2900
      2000: 'ゴールド・ウォリアー',
      2100: 'エメラルド・ガーディアン',
      2200: 'エメラルド・ロード',
      2300: 'サファイア・ガーディアン',
      2400: 'サファイア・ロード',
      2500: 'ルビー・ガーディアン',
      2600: 'ルビー・ロード',
      2700: 'ダイヤモンド・ガーディアン',
      2800: 'ダイヤモンド・ロード',
      2900: 'プラチナ・チャンピオン',
      // 英雄帯 3000-3900
      3000: '英雄',
      3100: '勇者',
      3200: '王者',
      3300: '皇帝',
      3400: '伝説',
      3500: '覇王',
      3600: '神話',
      3700: '無双',
      3800: '創世',
      3900: '永劫',
      // 神話・幻想帯 4000-5900
      4000: '炎神', 4100: '水神', 4200: '風神', 4300: '雷神', 4400: '大地神',
      4500: '太陽神', 4600: '月神', 4700: '星神', 4800: '銀河神', 4900: '宇宙神',
      5000: '創造神', 5100: '破壊神', 5200: '運命神', 5300: '時間神', 5400: '空間神',
      5500: '守護神', 5600: '至高神', 5700: '絶対神', 5800: '超越神', 5900: '極神',
      // 天体・宇宙帯 6000-7900
      6000: '星辰', 6100: '星雲', 6200: '銀河', 6300: '宇宙', 6400: 'ブラックホール',
      6500: 'ワームホール', 6600: 'クエーサー', 6700: 'パルサー', 6800: 'ビッグバン', 6900: 'マルチバース',
      7000: '永遠', 7100: '無限', 7200: '混沌', 7300: '原初', 7400: '根源',
      7500: '真理', 7600: '宿命', 7700: '無上', 7800: '不滅', 7900: '不死',
      // 究極帯 8000-9900
      8000: '覇王帝', 8100: '天帝', 8200: '魔帝', 8300: '龍帝', 8400: '神帝',
      8500: '聖帝', 8600: '虚無帝', 8700: '無限帝', 8800: '超越帝', 8900: '絶対帝',
      9000: '宇宙王', 9100: '創世王', 9200: '終焉王', 9300: '無限王', 9400: '根源王',
      9500: '至高王', 9600: '永劫王', 9700: '無上王', 9800: '不滅王', 9900: '無限神',
    };
    const label = LABEL_BY_BUCKET[bucket] || 'ノーマル';
    // バンド別カラー
    const color = r < 1600
      ? '#D4A373' // 入門帯 ブロンズ
      : r < 2000
      ? '#BBD2E1' // 中級帯 シルバー寄り
      : r < 3000
      ? '#FFD166' // 上級帯 ゴールド寄り
      : r < 4000
      ? '#A3E7F0' // 英雄帯 アクア
      : r < 6000
      ? '#A78BFA' // 神話・幻想帯 パープル
      : r < 8000
      ? '#64D3FF' // 天体・宇宙帯 ブルー
      : '#FF6B6B'; // 究極帯 レッド
    return { label, color };
  };
  const tier = getTier(rating);
  const nextTarget = Math.ceil(rating / 100) * 100;
  const progress = Math.min(1, Math.max(0, (rating % 100) / 100));

  const navigateToGame = (gameMode: string) => {
    console.log('[NAVIGATE] to game with mode:', gameMode);
    router.push(`/game?mode=${gameMode}`);
  };

  const [rulesVisible, setRulesVisible] = useState(false);
  const showRules = () => setRulesVisible(true);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ヘッダー（レーティング強化表示） */}
        <View style={styles.header}>
          <GlassContainer style={[styles.playerCard, { paddingVertical: 16 }]}>
            <View style={styles.rateRow}>
              <View style={[styles.tierBadge, { backgroundColor: tier.color + '33', borderColor: tier.color }]}>
                <Text style={styles.tierText}>{tier.label}</Text>
              </View>
              <Text style={styles.rateLabel}>{t('home.rating')}</Text>
            </View>
            <Text style={styles.rateValue}>{rating}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{t('home.next_target')} {nextTarget}</Text>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statChip}><Text style={styles.statChipText}>{t('home.win_rate')} {winRate}%</Text></View>
              <View style={styles.statChip}><Text style={styles.statChipText}>{t('home.streak')} {streak}</Text></View>
              <View style={styles.statChip}><Text style={styles.statChipText}>{t('home.total')} {total}</Text></View>
            </View>
          </GlassContainer>
        </View>

        {/* ゲームタイトル */}
        <View style={styles.titleSection}>
          <Text style={styles.gameTitle}>NumArena</Text>
          <Text style={styles.gameSubtitle}>{t('home.subtitle')}</Text>
        </View>

        {/* メインメニュー */}
        <View style={styles.menuContainer}>
          <GameModeCard
            title={t('home.play_local')}
            subtitle={t('home.play_local_desc')}
            icon={<Users size={32} color="#FFFFFF" />}
            onPress={() => router.push('/matchmaking?type=local')}
            gradient={['#FF6B6B', '#FF8E8E'] as const}
          />

          <GameModeCard
            title={t('home.play_ai')}
            subtitle={t('home.play_ai_desc')}
            icon={<Cpu size={32} color="#FFFFFF" />}
            onPress={() => navigateToGame('ai')}
            gradient={['#4ECDC4', '#95E1D3'] as const}
          />

          <GameModeCard
            title={t('home.play_online')}
            subtitle={t('home.play_online_desc')}
            icon={<Globe size={32} color="#FFFFFF" />}
            onPress={() => router.push('/matchmaking')}
            gradient={['#A8E6CF', '#C7CEEA'] as const}
          />

          <GameModeCard
            title={t('home.rules')}
            subtitle={t('home.rules_desc')}
            icon={<Info size={32} color="#FFFFFF" />}
            onPress={showRules}
            gradient={['#FFD93D', '#FFE66D'] as const}
          />
        </View>

        {/* クイック統計 */}
        <View style={styles.quickStats}>
          <StatCard
            label={t('home.wins')}
            value={playerData?.wins || 0}
            gradient={["rgba(255,107,107,0.25)", "rgba(255,107,107,0.08)"] as const}
            accent="#FF6B6B"
          />
          <StatCard
            label={t('home.losses')}
            value={playerData?.losses || 0}
            gradient={["rgba(180,190,200,0.25)", "rgba(180,190,200,0.08)"] as const}
            accent="#A7B1C2"
          />
          <StatCard
            label={t('home.total_games')}
            value={playerData?.totalGames || 0}
            gradient={["rgba(78,205,196,0.25)", "rgba(78,205,196,0.08)"] as const}
            accent="#4ECDC4"
          />
        </View>
        <RulesModal visible={rulesVisible} onClose={() => setRulesVisible(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}

type GradientPair = readonly [ColorValue, ColorValue];

interface GameModeCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  gradient: GradientPair;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  gradient
}) => (
  <TouchableOpacity onPress={onPress} style={styles.gameModeCard}>
    <LinearGradient colors={gradient} style={styles.cardGradient}>
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          {icon}
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

interface StatCardProps {
  label: string;
  value: number;
  gradient: GradientPair;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, gradient, accent }) => (
  <GlassContainer style={[styles.statCard]} gradientColors={gradient} borderRadius={18}>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </GlassContainer>
);

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
    marginHorizontal: 20,
    marginBottom: 20
  },
  playerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  tierText: {
    color: '#fff',
    fontWeight: '700'
  },
  rateLabel: {
    fontSize: 14,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE
  },
  rateValue: {
    fontSize: 36,
    fontWeight: '800',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginTop: 4,
    ...TEXT_OUTLINE_STYLE
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  progressText: {
    color: LIQUID_GLASS_COLORS.text.secondary,
    fontSize: 12,
    ...TEXT_OUTLINE_STYLE
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12
  },
  statChipText: {
    color: LIQUID_GLASS_COLORS.text.primary,
    fontWeight: '700',
    fontSize: 12,
    ...TEXT_OUTLINE_STYLE
  },
  playerInfo: {
    flex: 0
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE
  },
  playerRating: {
    fontSize: 18,
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    textAlign: 'center',
    ...TEXT_OUTLINE_STYLE
  },
  gameSubtitle: {
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    ...TEXT_OUTLINE_STYLE
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 30
  },
  gameModeCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  cardGradient: {
    padding: 20
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIcon: {
    marginRight: 16
  },
  cardText: {
    flex: 1
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    ...TEXT_OUTLINE_STYLE
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    ...TEXT_OUTLINE_STYLE
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 40
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    ...TEXT_OUTLINE_STYLE
  },
  statLabel: {
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    marginTop: 2,
    ...TEXT_OUTLINE_STYLE
  }
});