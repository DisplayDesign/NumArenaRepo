import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerData, GameResult, RatingHistoryEntry } from '@/types/game';

const STORAGE_KEYS = {
  PLAYER_DATA: 'playerData',
  GAME_HISTORY: 'gameHistory',
  IS_FIRST_LAUNCH: 'isFirstLaunch',
  AD_COUNTER: 'adCounter'
};

export const StorageManager = {
  // プレイヤーデータの初期化
  async initializePlayer(): Promise<PlayerData> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
      
      if (!existingData) {
        const newPlayerData: PlayerData = {
          playerId: `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          displayName: `プレイヤー${Math.floor(Math.random() * 1000)}`,
          rating: 1200,
          wins: 0,
          losses: 0,
          totalGames: 0,
          gameHistory: [],
          createdAt: new Date().toISOString(),
          lastPlayed: new Date().toISOString(),
          winStreak: 0,
          ratingHistory: [{ rating: 1200, timestamp: new Date().toISOString(), change: 0 }]
        };
        
        await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(newPlayerData));
        return newPlayerData;
      }
      
      return JSON.parse(existingData);
    } catch (error) {
      console.error('プレイヤー初期化エラー:', error);
      throw error;
    }
  },

  // --- Interstitial ad counter ---
  async getAdCounter(): Promise<number> {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.AD_COUNTER);
      return v ? Number(v) || 0 : 0;
    } catch (_) {
      return 0;
    }
  },

  async incrementAdCounter(): Promise<number> {
    try {
      const cur = await this.getAdCounter();
      const next = cur + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.AD_COUNTER, String(next));
      return next;
    } catch (_) {
      return 0;
    }
  },
  
  // プレイヤーデータの取得
  async getPlayerData(): Promise<PlayerData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('プレイヤーデータ取得エラー:', error);
      return null;
    }
  },
  
  // プレイヤー名の更新
  async updateDisplayName(newName: string): Promise<PlayerData | null> {
    try {
      const playerData = await this.getPlayerData();
      if (!playerData) return null;
      
      playerData.displayName = newName;
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(playerData));
      return playerData;
    } catch (error) {
      console.error('プレイヤー名更新エラー:', error);
      return null;
    }
  },
  
  // レーティング更新
  async updateRating(newRating: number, gameResult: 'win' | 'loss' | 'draw', ratingChange: number): Promise<PlayerData | null> {
    try {
      const playerData = await this.getPlayerData();
      if (!playerData) return null;
      
      playerData.rating = newRating;
      playerData.totalGames += 1;
      playerData.lastPlayed = new Date().toISOString();
      
      if (gameResult === 'win') {
        playerData.wins += 1;
        playerData.winStreak = (playerData.winStreak || 0) + 1;
      } else if (gameResult === 'loss') {
        playerData.losses += 1;
        playerData.winStreak = 0;
      }
      
      // レーティング履歴を追加
      const historyEntry: RatingHistoryEntry = {
        rating: newRating,
        timestamp: new Date().toISOString(),
        change: ratingChange
      };
      playerData.ratingHistory.push(historyEntry);
      
      // 履歴は最新50件まで保持
      if (playerData.ratingHistory.length > 50) {
        playerData.ratingHistory = playerData.ratingHistory.slice(-50);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(playerData));
      return playerData;
    } catch (error) {
      console.error('レーティング更新エラー:', error);
      return null;
    }
  },
  
  // ゲーム結果の保存
  async saveGameResult(gameResult: GameResult): Promise<void> {
    try {
      const playerData = await this.getPlayerData();
      if (!playerData) return;
      
      playerData.gameHistory.unshift(gameResult);
      
      // 履歴は最新20件まで保持
      if (playerData.gameHistory.length > 20) {
        playerData.gameHistory = playerData.gameHistory.slice(0, 20);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(playerData));
    } catch (error) {
      console.error('ゲーム結果保存エラー:', error);
    }
  },
  
  // 初回起動フラグの確認
  async isFirstLaunch(): Promise<boolean> {
    try {
      const isFirst = await AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_LAUNCH);
      if (isFirst === null) {
        await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_LAUNCH, 'false');
        return true;
      }
      return false;
    } catch (error) {
      console.error('初回起動確認エラー:', error);
      return true;
    }
  },
  
  // データのクリア（デバッグ用）
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLAYER_DATA,
        STORAGE_KEYS.GAME_HISTORY,
        STORAGE_KEYS.IS_FIRST_LAUNCH
      ]);
    } catch (error) {
      console.error('データクリアエラー:', error);
    }
  },

  // ユーザーデータのリセット（新規開始）
  async resetPlayerData(): Promise<PlayerData> {
    try {
      await this.clearAllData();
      const fresh = await this.initializePlayer();
      return fresh;
    } catch (error) {
      console.error('プレイヤーデータリセットエラー:', error);
      throw error;
    }
  }
};