import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initAds, loadInterstitial } from '@/utils/ads';
import { GameProvider } from '@/contexts/GameContext';
import { PlayerProvider, usePlayer } from '@/contexts/PlayerContext';
import i18n, { loadLanguage } from '@/i18n';

function AppContent() {
  const { isFirstLaunch, loading } = usePlayer();

  if (loading) {
    return null; // または Loading コンポーネント
  }

  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game" />
        <Stack.Screen name="interstitial" options={{ presentation: 'modal' }} />
        <Stack.Screen name="matchmaking" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GameProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  useEffect(() => {
    const initializeApp = async () => {
      console.log('アプリ初期化開始');
      console.log('現在の言語設定:', i18n.language);

      // 言語設定を最初に初期化（同期的に実行）
      await loadLanguage();
      console.log('言語設定初期化完了');
      console.log('言語設定適用後:', i18n.language);

      // 他の初期化処理を並行して実行
      await Promise.all([
        initAds(),
        loadInterstitial()
      ]);
      console.log('アプリ初期化完了');
      console.log('最終言語設定:', i18n.language);
      console.log('翻訳機能テスト:', i18n.t('home.title'));
      console.log('翻訳機能テスト (設定):', i18n.t('settings.title'));

      // 言語設定が正しく適用されているかを確認
      setTimeout(() => {
        console.log('遅延確認 - 言語設定:', i18n.language);
        console.log('遅延確認 - 翻訳テスト:', i18n.t('home.title'));
        console.log('遅延確認 - 設定翻訳テスト:', i18n.t('settings.title'));
        console.log('遅延確認 - マッチメイキング翻訳テスト:', i18n.t('matchmaking.title'));
        console.log('遅延確認 - ランキング翻訳テスト:', i18n.t('leaderboard.title'));
        console.log('遅延確認 - ゲーム翻訳テスト:', i18n.t('game.your_turn'));
        console.log('遅延確認 - 共通翻訳テスト:', i18n.t('common.ok'));
      }, 25000);
    };

    initializeApp();
  }, []);

  return (
    <PlayerProvider>
      <AppContent />
      <StatusBar style="light" />
    </PlayerProvider>
  );
}