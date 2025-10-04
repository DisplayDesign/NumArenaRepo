import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LIQUID_GLASS_COLORS, PLAYER_COLORS, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GamePiece } from './GamePiece';

interface PlayerInventoryProps {
  playerId: number;
  pieces: number[];
  nPieces: number;
  playerName: string;
  isCurrentPlayer: boolean;
  // ローカルユーザー自身のインベントリかどうか
  isSelf?: boolean;
  pieceSize?: number;
}

export const PlayerInventory: React.FC<PlayerInventoryProps> = ({
  playerId,
  pieces,
  nPieces,
  playerName,
  isCurrentPlayer,
  isSelf = false,
  pieceSize = 36
}) => {
  const playerColor = PLAYER_COLORS[playerId];
  
  return (
    <GlassContainer 
      style={isSelf && isCurrentPlayer ? [styles.inventoryContainer, styles.activeInventory] as any : (styles.inventoryContainer as any)}
      gradientColors={[
        `${playerColor}20`,
        `${playerColor}10`
      ]}
    >
      <View style={styles.playerInfo}>
        <View>
          <Text style={[
            styles.playerName,
            { color: playerColor }
          ]}>
            {playerName}
          </Text>
          {isSelf && isCurrentPlayer ? (
            <Text style={styles.turnIndicator}>あなたのターン</Text>
          ) : null}
        </View>
        {nPieces > 0 && (
          <View style={styles.nBadge}>
            <Text style={[styles.nBadgeText, TEXT_OUTLINE_STYLE]}>n × {nPieces}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.piecesContainer} accessibilityLabel={`player-${playerId}-inventory`}>
        <Text style={styles.sectionTitle}>数字コマ</Text>
        <View style={styles.piecesRow}>
          {pieces.map((piece, index) => (
            <View key={`${piece}-${index}`} style={styles.pieceWrapper}>
              <GamePiece value={piece} playerId={playerId} size={pieceSize} />
            </View>
          ))}
        </View>
        
        {/* nコマはヘッダー右のバッジ表示に変更 */}
      </View>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  inventoryContainer: {
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 10
  },
  activeInventory: {
    borderWidth: 2,
    borderColor: LIQUID_GLASS_COLORS.primary.peach,
    shadowColor: LIQUID_GLASS_COLORS.primary.peach,
    shadowOpacity: 0.3
  },
  playerInfo: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  turnIndicator: {
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    marginTop: 2
  },
  piecesContainer: {
    // コンテナスタイル
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.primary,
    ...TEXT_OUTLINE_STYLE,
    marginBottom: 8
  },
  piecesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  pieceWrapper: {
    margin: 2
  },
  moreText: {
    alignSelf: 'center',
    marginLeft: 8,
    fontSize: 12,
    color: LIQUID_GLASS_COLORS.text.secondary,
    fontWeight: '600'
  },
  nBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  nBadgeText: {
    color: LIQUID_GLASS_COLORS.text.primary,
    fontWeight: '700'
  }
});