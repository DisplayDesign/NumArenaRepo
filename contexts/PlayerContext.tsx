import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerData, GameResult } from '@/types/game';
import { StorageManager } from '@/utils/storage';

interface PlayerContextType {
  playerData: PlayerData | null;
  isFirstLaunch: boolean;
  loading: boolean;
  updateDisplayName: (name: string) => Promise<void>;
  updateRating: (newRating: number, gameResult: 'win' | 'loss' | 'draw', ratingChange: number) => Promise<void>;
  saveGameResult: (result: GameResult) => Promise<void>;
  refreshPlayerData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    initializePlayerData();
  }, []);
  
  const initializePlayerData = async () => {
    try {
      setLoading(true);
      
      // 初回起動チェック
      const isFirst = await StorageManager.isFirstLaunch();
      setIsFirstLaunch(isFirst);
      
      // プレイヤーデータ初期化
      const data = await StorageManager.initializePlayer();
      setPlayerData(data);
    } catch (error) {
      console.error('プレイヤーデータ初期化エラー:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateDisplayName = async (name: string) => {
    try {
      const updatedData = await StorageManager.updateDisplayName(name);
      if (updatedData) {
        setPlayerData(updatedData);
      }
    } catch (error) {
      console.error('プレイヤー名更新エラー:', error);
      throw error;
    }
  };
  
  const updateRating = async (newRating: number, gameResult: 'win' | 'loss' | 'draw', ratingChange: number) => {
    try {
      const updatedData = await StorageManager.updateRating(newRating, gameResult, ratingChange);
      if (updatedData) {
        setPlayerData(updatedData);
      }
    } catch (error) {
      console.error('レーティング更新エラー:', error);
      throw error;
    }
  };
  
  const saveGameResult = async (result: GameResult) => {
    try {
      await StorageManager.saveGameResult(result);
      await refreshPlayerData();
    } catch (error) {
      console.error('ゲーム結果保存エラー:', error);
      throw error;
    }
  };
  
  const refreshPlayerData = async () => {
    try {
      const data = await StorageManager.getPlayerData();
      if (data) {
        setPlayerData(data);
      }
    } catch (error) {
      console.error('プレイヤーデータ更新エラー:', error);
    }
  };

  const resetAllData = async () => {
    try {
      setLoading(true);
      const fresh = await StorageManager.resetPlayerData();
      setPlayerData(fresh);
      setIsFirstLaunch(true);
    } catch (error) {
      console.error('データリセットエラー:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PlayerContext.Provider value={{
      playerData,
      isFirstLaunch,
      loading,
      updateDisplayName,
      updateRating,
      saveGameResult,
      refreshPlayerData,
      resetAllData
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};