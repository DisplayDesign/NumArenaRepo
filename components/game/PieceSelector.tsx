import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GamePiece } from './GamePiece';

interface PieceSelectorProps {
  visible: boolean;
  availablePieces: number[];
  nPieces: number;
  playerId: number;
  onSelect: (piece: number | 'n') => void;
  onCancel: () => void;
}

export const PieceSelector: React.FC<PieceSelectorProps> = ({
  visible,
  availablePieces,
  nPieces,
  playerId,
  onSelect,
  onCancel
}) => {
  console.log('[PIECE_SELECTOR] render with visible:', visible);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.7)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <GlassContainer style={styles.selectorContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, TEXT_OUTLINE_STYLE]}>コマを選択</Text>
            <TouchableOpacity 
              onPress={onCancel}
              style={styles.closeButton}
            >
              <X color={LIQUID_GLASS_COLORS.text.primary} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            {availablePieces.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, TEXT_OUTLINE_STYLE]}>数字コマ</Text>
                <View style={styles.piecesGrid}>
                  {availablePieces.map(piece => (
                    <TouchableOpacity
                      key={piece}
                      style={styles.pieceButton}
                      onPress={() => {
                        console.log('[PIECE_SELECTOR] select piece:', piece);
                        onSelect(piece);
                      }}
                    >
                      <GamePiece value={piece} playerId={playerId} />
                      <Text style={[styles.pieceLabel, TEXT_OUTLINE_STYLE]}>{piece}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {nPieces > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, TEXT_OUTLINE_STYLE]}>nコマ ({nPieces}個)</Text>
                <View style={styles.piecesGrid}>
                  <TouchableOpacity
                    style={styles.pieceButton}
                    onPress={() => {
                      console.log('[PIECE_SELECTOR] select n piece');
                      onSelect('n');
                    }}
                  >
                    <GamePiece value="n" playerId={playerId} />
                    <Text style={[styles.pieceLabel, TEXT_OUTLINE_STYLE]}>n</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {availablePieces.length === 0 && nPieces === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, TEXT_OUTLINE_STYLE]}>利用可能なコマがありません</Text>
              </View>
            )}
          </ScrollView>
        </GlassContainer>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  selectorContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIQUID_GLASS_COLORS.glass.border
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary
  },
  closeButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 12
  },
  piecesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  pieceButton: {
    alignItems: 'center',
    margin: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  pieceLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: LIQUID_GLASS_COLORS.text.secondary
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.secondary,
    textAlign: 'center'
  }
});