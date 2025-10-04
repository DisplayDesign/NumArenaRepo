import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ColorValue } from 'react-native';
import type { ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Medal, Award } from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTranslation } from 'react-i18next';
import { fetchLeaderboard, upsertPlayerProfile, LeaderboardEntry } from '@/utils/players';

// Firestore から取得するためダミーデータは撤廃

export default function LeaderboardScreen() {
  const { playerData } = usePlayer();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // 自分の最新プロフィールを同期（ランキング反映のため）
        if (playerData) {
          await upsertPlayerProfile(playerData);
        }
        const data = await fetchLeaderboard(50, timeframe);
        if (mounted) setLeaderboard(data);
      } catch (e) {
        console.warn('Leaderboard fetch failed:', e);
        if (mounted) setLeaderboard([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [timeframe, playerData?.playerId]);

  // プレイヤーの現在の順位を計算
  const currentPlayerRank = leaderboard.findIndex(p => p.id === playerData?.playerId) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return LIQUID_GLASS_COLORS.text.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('leaderboard.title')}</Text>
          <Text style={styles.subtitle}>{t('leaderboard.subtitle')}</Text>
        </View>

        {/* タイムフレーム選択 */}
        <View style={styles.timeframeContainer}>
          <GlassContainer style={styles.segmentedControl}>
            <View style={styles.segmentedControlInner}>
              {[
                { key: 'all', label: t('leaderboard.all_time') },
                { key: 'weekly', label: t('leaderboard.weekly') },
                { key: 'monthly', label: t('leaderboard.monthly') }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentButton,
                    timeframe === option.key && styles.segmentButtonActive
                  ]}
                  onPress={() => setTimeframe(option.key as any)}
                >
                  <Text style={[
                    styles.segmentText,
                    timeframe === option.key && styles.segmentTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassContainer>
        </View>

        {/* トップ3表彰台 */}
        <View style={styles.podiumContainer}>
          <GlassContainer style={styles.podium}>
            <View style={styles.podiumInner}>
              {leaderboard.slice(0, 3).map((player, index) => (
                <PodiumCard
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  isCurrentPlayer={player.rating <= (playerData?.rating || 1200)}
                />
              ))}
            </View>
          </GlassContainer>
        </View>

        {/* ランキングリスト */}
        <GlassContainer style={styles.rankingList}>
          <Text style={styles.listTitle}>{t('leaderboard.title')}</Text>
          {loading && (
            <Text style={{ color: LIQUID_GLASS_COLORS.text.secondary }}>{t('leaderboard.loading')}</Text>
          )}
          {!loading && leaderboard.length === 0 && (
            <Text style={{ color: LIQUID_GLASS_COLORS.text.secondary }}>{t('leaderboard.no_data')}</Text>
          )}
          {!loading && leaderboard.map((player, index) => (
            <View key={player.id} style={styles.rankingItem}>
              <View style={styles.rankInfo}>
                <Text style={[
                  styles.rankNumber,
                  { color: getRankColor(index + 1) }
                ]}>
                  #{index + 1}
                </Text>
                {getRankIcon(index + 1)}
              </View>
              
              <View style={styles.playerInfoRanking}>
                <Text style={styles.playerNameRanking}>{player.name}</Text>
                <Text style={styles.playerStats}>
                  {player.wins}{t('leaderboard.wins_short')} {player.losses}{t('leaderboard.losses_short')}
                </Text>
              </View>
              
              <View style={styles.ratingInfo}>
                <Text style={styles.rating}>{player.rating}</Text>
                <Text style={styles.ratingLabel}>{t('home.rating')}</Text>
              </View>
            </View>
          ))}
        </GlassContainer>

        {/* 自分の順位（トップ10外の場合） */}
        {currentPlayerRank > 10 && playerData && !loading && (
          <GlassContainer style={styles.currentPlayerRank}>
            <Text style={styles.yourRankTitle}>{t('leaderboard.your_rank')}</Text>
            <View style={styles.rankingItem}>
              <View style={styles.rankInfo}>
                <Text style={styles.rankNumber}>#{currentPlayerRank}</Text>
              </View>
              
              <View style={styles.playerInfoRanking}>
                <Text style={styles.playerNameRanking}>{playerData.displayName}</Text>
                <Text style={styles.playerStats}>
                  {playerData.wins}{t('leaderboard.wins_short')} {playerData.losses}{t('leaderboard.losses_short')}
                </Text>
              </View>
              
              <View style={styles.ratingInfo}>
                <Text style={styles.rating}>{playerData.rating}</Text>
                <Text style={styles.ratingLabel}>{t('home.rating')}</Text>
              </View>
            </View>
          </GlassContainer>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface PodiumCardProps {
  player: any;
  rank: number;
  isCurrentPlayer: boolean;
}

const PODIUM_COLORS: Record<number, readonly [ColorValue, ColorValue]> = {
  1: ['#FFD700', '#FFA500'] as const,
  2: ['#C0C0C0', '#A0A0A0'] as const,
  3: ['#CD7F32', '#B8860B'] as const
};

const DEFAULT_PODIUM_COLOR: readonly [ColorValue, ColorValue] = ['#8E8E8E', '#696969'] as const;

const PodiumCard: React.FC<PodiumCardProps> = ({ player, rank, isCurrentPlayer }) => {
  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 100;
      case 2:
        return 80;
      case 3:
        return 60;
      default:
        return 50;
    }
  };

<<<<<<< Updated upstream
  const getPodiumColor = (rank: number): readonly [ColorValue, ColorValue] =>
    PODIUM_COLORS[rank] ?? DEFAULT_PODIUM_COLOR;
=======
<<<<<<< ours
  const getPodiumColor = (rank: number): readonly [ColorValue, ColorValue] => {
    switch (rank) {
      case 1:
        return ['#FFD700', '#FFA500'] as const;
      case 2:
        return ['#C0C0C0', '#A0A0A0'] as const;
      case 3:
        return ['#CD7F32', '#B8860B'] as const;
      default:
        return ['#8E8E8E', '#696969'] as const;
    }
=======
  const PODIUM_COLORS: Record<number, readonly [ColorValue, ColorValue]> = {
    1: ['#FFD700', '#FFA500'] as const,
    2: ['#C0C0C0', '#A0A0A0'] as const,
    3: ['#CD7F32', '#B8860B'] as const
  };

  const DEFAULT_PODIUM_COLOR: readonly [ColorValue, ColorValue] = ['#8E8E8E', '#696969'] as const;

  const getPodiumColor = (rank: number): readonly [ColorValue, ColorValue] => {
    return PODIUM_COLORS[rank] ?? DEFAULT_PODIUM_COLOR;
>>>>>>> theirs
  };
>>>>>>> Stashed changes

  return (
    <View style={[styles.podiumCard, { height: getPodiumHeight(rank) }]}>
      <LinearGradient
        colors={getPodiumColor(rank)}
        style={styles.podiumGradient}
      >
        <View style={styles.podiumContent}>
          <Text style={styles.podiumRank}>{rank}</Text>
          <Text style={styles.podiumName} numberOfLines={1}>{player.name}</Text>
          <Text style={styles.podiumRating}>{player.rating}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

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
    fontSize: 32,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    textAlign: 'center',
    ...TEXT_OUTLINE_STYLE
  },
  subtitle: {
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    ...TEXT_OUTLINE_STYLE
  },
  timeframeContainer: {
    marginHorizontal: 20,
    marginBottom: 20
  },
  segmentedControl: {
    padding: 4
  },
  segmentedControlInner: {
    flexDirection: 'row',
    backgroundColor: 'transparent'
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 12
  },
  segmentButtonActive: {
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.secondary
  },
  segmentTextActive: {
    color: '#FFFFFF'
  },
  podiumContainer: {
    marginHorizontal: 20,
    marginBottom: 30
  },
  podium: {
    padding: 20
  },
  podiumInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16
  },
  podiumCard: {
    width: 80,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  podiumGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  podiumContent: {
    alignItems: 'center'
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 4
  },
  podiumRating: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  rankingList: {
    margin: 20,
    marginBottom: 100
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 16
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    gap: 4
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  playerInfoRanking: {
    flex: 1,
    marginLeft: 12
  },
  playerNameRanking: {
    fontSize: 16,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE
  },
  playerStats: {
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE,
    marginTop: 2
  },
  ratingInfo: {
    alignItems: 'flex-end'
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.primary.coral,
    ...TEXT_OUTLINE_STYLE
  },
  ratingLabel: {
    fontSize: 10,
    color: LIQUID_GLASS_COLORS.text.secondary,
    ...TEXT_OUTLINE_STYLE
  },
  currentPlayerRank: {
    margin: 20,
    marginTop: 0,
    borderWidth: 2,
    borderColor: LIQUID_GLASS_COLORS.primary.peach
  },
  yourRankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    ...TEXT_OUTLINE_STYLE
  }
});