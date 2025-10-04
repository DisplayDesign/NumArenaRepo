import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
// removed: background gradient
import { GamePiece as GamePieceType } from '@/types/game';
import { LIQUID_GLASS_COLORS, ANIMATION_CONFIG } from '@/constants/colors';
import { GamePiece } from './GamePiece';

interface GameBoardProps {
  board: (GamePieceType | null)[][];
  onCellPress: (row: number, col: number) => void;
  currentPlayer?: number;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellPress,
  currentPlayer = 0,
  disabled = false
}) => {
  const { width: screenWidth } = useWindowDimensions();
  // 盤面の横幅を端末幅に合わせて調整（余白を最小限にして少し拡大）
  const boardWidth = useMemo(() => Math.min(screenWidth - 24, 300), [screenWidth]);
  const gap = 2; // マス間のスペース

  // セルサイズを安定して管理（初期0を避ける）
  const initialCellSize = useMemo(() => {
    const w = boardWidth;
    return w > 0 ? Math.floor((w - gap * 3) / 4) : 64;
  }, [boardWidth]);
  const [cellSize, setCellSize] = useState(initialCellSize);

  const onGridLayout = useCallback((e: any) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    console.log('[BOARD] grid layout:', w);
    const newSize = Math.floor((w - gap * 3) / 4);
    if (newSize > 0 && newSize !== cellSize) {
      setCellSize(newSize);
    }
  }, [cellSize]);

  const pieceSize = Math.max(10, cellSize - 4);

  // 初回描画時のみログ出力（デバッグ用）
  React.useEffect(() => {
    console.log('[BOARD] initial render:', { boardWidth, cellSize, pieceSize, disabled });
  }, []);

  return (
    <View style={[styles.boardContainer, { width: boardWidth, height: boardWidth, alignSelf: 'center' }]} pointerEvents="box-none">
      <View
        onLayout={onGridLayout}
        style={[
          styles.board,
          { padding: gap }
        ]}
      >
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.row, { gap }] }>
              {row.map((cell, colIndex) => (
                <GameCell
                  key={`${rowIndex}-${colIndex}`}
                  row={rowIndex}
                  col={colIndex}
                  cell={cell}
                  onPress={() => {
                    console.log(`[GAME] cell press called: ${rowIndex}, ${colIndex}`);
                    onCellPress(rowIndex, colIndex);
                  }}
                  disabled={disabled}
                  cellSize={cellSize}
                  pieceSize={pieceSize}
                />
              ))}
            </View>
          ))}
        </View>
    </View>
  );
};

interface GameCellProps {
  row: number;
  col: number;
  cell: GamePieceType | null;
  onPress: () => void;
  disabled: boolean;
  cellSize: number;
  pieceSize: number;
}

const GameCellBase: React.FC<GameCellProps> = ({ row, col, cell, onPress, disabled, cellSize, pieceSize }) => {
  console.log(`[CELL] render ${row},${col}: size=${cellSize}, disabled=${disabled}`);

  const handlePress = () => {
    console.log(`[TAP] cell press ${row},${col}`);
    console.log(`[CELL] press ${row},${col}: calling onPress, disabled=${disabled}, TouchableOpacity enabled=${!disabled}, cellSize=${cellSize}`);
    if (!disabled) {
      console.log(`[CELL] press ${row},${col}: executing onPress`);
      onPress();
    } else {
      console.log(`[CELL] press ${row},${col}: blocked by disabled`);
    }
  };

  const handlePressIn = () => {
    console.log(`[TAP] cell pressIn ${row},${col}`);
  };

  const handlePressOut = () => {
    console.log(`[TAP] cell pressOut ${row},${col}`);
  };

  return (
    <View style={[styles.cellContainer, { width: cellSize, height: cellSize }]}>
      <TouchableOpacity
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderRadius: Math.floor(cellSize / 4),
            position: 'relative',
            zIndex: 1
          },
          cell && styles.occupiedCell
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {cell && (
          <GamePiece
            value={cell.value}
            playerId={cell.playerId}
            isNewPiece={false}
            size={pieceSize}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

// 実質的な変更がない限り再レンダしない
const GameCell = React.memo(GameCellBase, (prev, next) => {
  if (prev.row !== next.row || prev.col !== next.col) return false;
  if (prev.cellSize !== next.cellSize || prev.pieceSize !== next.pieceSize) return false;
  if (prev.disabled !== next.disabled) return false;
  const a = prev.cell, b = next.cell;
  const sameCell = (a?.playerId === b?.playerId) && (a?.value === b?.value);
  return sameCell;
});

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative'
  },
  board: {
    flexDirection: 'column',
    gap: 2
  },
  row: {
    flexDirection: 'row',
    gap: 2
  },
  cellContainer: {
    margin: 0
  },
  cell: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)'
  },
  occupiedCell: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)'
  },
  cellGlass: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  }
});