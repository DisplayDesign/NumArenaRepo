import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  ja: {
    translation: {
      // ホーム画面
      'home.title': 'ホーム',
      'home.subtitle': '戦略的な数字対戦ゲーム',
      'home.play_ai': 'AI対戦',
      'home.play_ai_desc': 'コンピューター相手に練習',
      'home.play_local': 'ローカル対戦',
      'home.play_local_desc': 'IDを使って2人で対戦',
      'home.play_online': 'オンライン対戦',
      'home.play_online_desc': '世界中のプレイヤーと対戦',
      'home.practice': '練習',
      'home.settings': '設定',
      'home.leaderboard': 'ランキング',
      'home.rating': 'レーティング',
      'home.total_games': '総ゲーム数',
      'home.wins': '勝利数',
      'home.losses': '敗北数',
      'home.win_rate': '勝率',
      'home.next_target': '次の目標',
      'home.streak': '連勝',
      'home.total': '総',
      'home.rules': 'ルール説明',
      'home.rules_desc': '遊び方を見る',

      // Welcome 画面
      'welcome.title': 'ナンバーバトルへようこそ！',
      'welcome.subtitle': '戦略的な数字バトルゲーム',
      'welcome.input_placeholder': 'プレイヤー名を入力',
      'welcome.input_help': '3〜20文字で入力してください',
      'welcome.start_button': 'ゲームを始める',
      'welcome.rules_title': 'ゲームルール',
      'welcome.rules_bullet.1': '4×4のマスに1-8の数字コマを配置',
      'welcome.rules_bullet.2': '大きい数字が小さい数字に勝利',
      'welcome.rules_bullet.3': '負けたコマは「n」に変換',
      'welcome.rules_bullet.4': '最終的な数字の合計で勝敗決定',
      'welcome.name_required': 'プレイヤー名を入力してください',
      'welcome.name_length': 'プレイヤー名は3文字以上20文字以下で入力してください',
      'welcome.name_update_failed': 'プレイヤー名の設定に失敗しました',

      // ルールモーダル
      'rules.title': 'ルール説明',
      'rules.subtitle': 'ナンバーバトルの遊び方',
      'rules.win_condition.title': '勝利条件',
      'rules.win_condition.1': '縦・横・斜めいずれか1列を自分のコマで揃える',
      'rules.win_condition.2': '全マス埋まったら数字コマの合計が高い方が勝ち（nは0点）',
      'rules.pieces.title': 'コマについて',
      'rules.pieces.1': '数字コマ: 1〜8 の値を持つ。大きい方が強い',
      'rules.pieces.2': 'nコマ: 盤面に配置できるが得点は0。色は所持プレイヤー色',
      'rules.placement.title': '配置ルール',
      'rules.placement.1': '空マスに数字コマまたは n コマを1つ配置',
      'rules.placement.2': '相手のマスでも、自分の数字が相手より大きければ上書き可能',
      'rules.placement.3': '上書きされた相手は n コマを1つ獲得',
      'rules.placement.4': '自分のコマの上書きや、n での上書きは不可',

      // ゲーム画面
      'game.your_turn': 'あなたのターン',
      'game.opponent_turn': '相手のターン',
      'game.pieces': '数字コマ',
      'game.select_piece': 'コマを選択',
      'game.invalid_move': '無効な手',
      'game.game_end': 'ゲーム終了',
      'game.you_win': '勝利！',
      'game.you_lose': '敗北...',
      'game.draw': 'ドロー！',
      'game.play_again': 'もう一度',
      'game.back_to_menu': 'メニューに戻る',
      'game.back': '戻る',
      'game.reset': 'リセット',

      // マッチメイキング画面
      'matchmaking.title': '対戦相手を探す',
      'matchmaking.searching': 'マッチング中...',
      'matchmaking.waiting_for_opponent': '相手を待っています...',
      'matchmaking.room_id': 'ルームID',
      'matchmaking.enter_room_id': 'ルームIDを入力',
      'matchmaking.create_room': 'ルーム作成',
      'matchmaking.join_room': 'ルーム参加',
      'matchmaking.cancel': 'キャンセル',
      'matchmaking.room_in_use': 'そのIDの部屋は対戦中です。別のIDを使用してください',
      'matchmaking.invalid_id': 'IDが無効です',

      // 設定画面
      'settings.title': '設定',
      'settings.player_info': 'プレイヤー情報',
      'settings.player_name': 'プレイヤー名',
      'settings.rating': 'レーティング',
      'settings.data_management': 'データ管理',
      'settings.reset_data': 'データをリセット',
      'settings.app_info': 'アプリ情報',
      'settings.about': 'アプリについて',
      'settings.version': 'バージョン',
      'settings.stats': '統計情報',
      'settings.total_games': '総ゲーム数',
      'settings.wins': '勝利数',
      'settings.losses': '敗北数',
      'settings.win_rate': '勝率',
      'settings.save': '保存',
      'settings.delete': '削除',
      'settings.display': '表示',
      'settings.about_app': 'NumArena について',
      'settings.about_description': '戦略的な数字対戦ゲーム\n\nバージョン: 1.0.0\n開発者: NumArena Team\n\n4×4のボードで1-8の数字を使って戦う戦略ゲームです。数字の大小で勝負が決まり、負けたコマは「n」に変わります。',
      'settings.reset_confirm_title': 'データリセット',
      'settings.reset_confirm_message': 'すべてのプレイヤーデータとゲーム履歴が削除されます。この操作は取り消せません。',
      'settings.reset_success': 'データがリセットされました。',
      'settings.reset_error': 'データのリセットに失敗しました。',

      // ランキング画面
      'leaderboard.title': 'ランキング',
      'leaderboard.subtitle': '最強のプレイヤーたち',
      'leaderboard.all_time': '全期間',
      'leaderboard.weekly': '今週',
      'leaderboard.monthly': '今月',
      'leaderboard.your_rank': 'あなたの順位',
      'leaderboard.loading': '読み込み中...',
      'leaderboard.no_data': 'ランキングデータがありません',

      // 勝敗省略表記（ランキング用）
      'leaderboard.wins_short': '勝',
      'leaderboard.losses_short': '敗',

      // 共通
      'common.loading': '読み込み中...',
      'common.error': 'エラー',
      'common.confirm': '確認',
      'common.cancel': 'キャンセル',
      'common.ok': 'OK',
      'common.yes': 'はい',
      'common.no': 'いいえ',
      'common.close': '閉じる',
    }
  },
  en: {
    translation: {
      // Home Screen
      'home.title': 'Home',
      'home.subtitle': 'Strategic number battle game',
      'home.play_ai': 'Play vs AI',
      'home.play_ai_desc': 'Practice against computer',
      'home.play_local': 'Play with Friends',
      'home.play_local_desc': 'Battle with friends using ID',
      'home.play_online': 'Online Match',
      'home.play_online_desc': 'Battle with players worldwide',
      'home.practice': 'Practice',
      'home.settings': 'Settings',
      'home.leaderboard': 'Leaderboard',
      'home.rating': 'Rating',
      'home.total_games': 'Total Games',
      'home.wins': 'Wins',
      'home.losses': 'Losses',
      'home.win_rate': 'Win Rate',
      'home.next_target': 'Next Target',
      'home.streak': 'Streak',
      'home.total': 'Total',
      'home.rules': 'Rules',
      'home.rules_desc': 'How to play',

      // Welcome Screen
      'welcome.title': 'Welcome to NumArena!',
      'welcome.subtitle': 'Strategic number battle game',
      'welcome.input_placeholder': 'Enter player name',
      'welcome.input_help': 'Enter 3–20 characters',
      'welcome.start_button': 'Start Game',
      'welcome.rules_title': 'Game Rules',
      'welcome.rules_bullet.1': 'Place number pieces 1–8 on a 4×4 grid',
      'welcome.rules_bullet.2': 'Higher numbers beat lower numbers',
      'welcome.rules_bullet.3': 'Defeated pieces convert to "n"',
      'welcome.rules_bullet.4': 'Victory decided by the final sum of numbers',
      'welcome.name_required': 'Please enter a player name.',
      'welcome.name_length': 'Player name must be 3–20 characters.',
      'welcome.name_update_failed': 'Failed to set player name.',

      // Rules Modal
      'rules.title': 'Rules',
      'rules.subtitle': 'How to Play NumArena',
      'rules.win_condition.title': 'Win Conditions',
      'rules.win_condition.1': 'Align your pieces in a row, column, or diagonal to win',
      'rules.win_condition.2': 'If board fills, the higher total of number pieces wins (n is 0 points)',
      'rules.pieces.title': 'Pieces',
      'rules.pieces.1': 'Number pieces: values 1–8. Higher numbers are stronger',
      'rules.pieces.2': 'n piece: can be placed on the board but scores 0. Color matches owner',
      'rules.placement.title': 'Placement Rules',
      'rules.placement.1': 'Place one number piece or one n piece on an empty cell',
      'rules.placement.2': 'You may overwrite opponent cells if your number is higher',
      'rules.placement.3': 'Overwritten opponent gains one n piece',
      'rules.placement.4': 'You cannot overwrite your own piece, nor overwrite with n',

      // Game Screen
      'game.your_turn': 'Your Turn',
      'game.opponent_turn': 'Opponent\'s Turn',
      'game.pieces': 'Number Pieces',
      'game.select_piece': 'Select Piece',
      'game.invalid_move': 'Invalid Move',
      'game.game_end': 'Game End',
      'game.you_win': 'Victory!',
      'game.you_lose': 'Defeat...',
      'game.draw': 'Draw!',
      'game.play_again': 'Play Again',
      'game.back_to_menu': 'Back to Menu',
      'game.back': 'Back',
      'game.reset': 'Reset',

      // Matchmaking Screen
      'matchmaking.title': 'Find Opponent',
      'matchmaking.searching': 'Searching...',
      'matchmaking.waiting_for_opponent': 'Waiting for opponent...',
      'matchmaking.room_id': 'Room ID',
      'matchmaking.enter_room_id': 'Enter Room ID',
      'matchmaking.create_room': 'Create Room',
      'matchmaking.join_room': 'Join Room',
      'matchmaking.cancel': 'Cancel',
      'matchmaking.room_in_use': 'That room ID is currently in use. Please use a different ID.',
      'matchmaking.invalid_id': 'Invalid ID',

      // Settings Screen
      'settings.title': 'Settings',
      'settings.player_info': 'Player Info',
      'settings.player_name': 'Player Name',
      'settings.rating': 'Rating',
      'settings.data_management': 'Data Management',
      'settings.reset_data': 'Reset Data',
      'settings.app_info': 'App Info',
      'settings.about': 'About',
      'settings.version': 'Version',
      'settings.stats': 'Statistics',
      'settings.total_games': 'Total Games',
      'settings.wins': 'Wins',
      'settings.losses': 'Losses',
      'settings.win_rate': 'Win Rate',
      'settings.save': 'Save',
      'settings.delete': 'Delete',
      'settings.display': 'Display',
      'settings.language': 'Language',
      'settings.about_app': 'About NumArena',
      'settings.about_description': 'Strategic number battle game\n\nVersion: 1.0.0\nDeveloper: NumArena Team\n\nStrategic game where you battle using numbers 1-8 on a 4×4 board. The outcome is determined by number size, and defeated pieces turn into "n".',
      'settings.reset_confirm_title': 'Reset Data',
      'settings.reset_confirm_message': 'All player data and game history will be deleted. This action cannot be undone.',
      'settings.reset_success': 'Data has been reset.',
      'settings.reset_error': 'Failed to reset data.',
      'settings.name_required': 'Please enter a player name.',
      'settings.name_updated': 'Player name has been updated.',
      'settings.name_update_failed': 'Failed to update player name.',

      // Leaderboard Screen
      'leaderboard.title': 'Leaderboard',
      'leaderboard.subtitle': 'Strongest Players',
      'leaderboard.all_time': 'All Time',
      'leaderboard.weekly': 'Weekly',
      'leaderboard.monthly': 'Monthly',
      'leaderboard.your_rank': 'Your Rank',
      'leaderboard.loading': 'Loading...',
      'leaderboard.no_data': 'No leaderboard data available',

      // Short labels for wins/losses (leaderboard)
      'leaderboard.wins_short': 'W',
      'leaderboard.losses_short': 'L',

      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.confirm': 'Confirm',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.close': 'Close',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // デフォルト言語を日本語に設定
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// 言語変更イベントを監視
i18n.on('languageChanged', (lng) => {
  console.log('i18n言語変更イベント:', lng);
  console.log('現在の翻訳言語:', i18n.language);
  console.log('翻訳機能テスト:', i18n.t('home.title'));
  console.log('設定翻訳テスト:', i18n.t('settings.title'));
  console.log('マッチメイキング翻訳テスト:', i18n.t('matchmaking.title'));
  console.log('ランキング翻訳テスト:', i18n.t('leaderboard.title'));
  console.log('ゲーム翻訳テスト:', i18n.t('game.your_turn'));
  console.log('共通翻訳テスト:', i18n.t('common.ok'));
});

// 言語設定をAsyncStorageから読み込む関数
export const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    console.log('保存された言語設定:', savedLanguage);
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
      console.log('言語を変更:', savedLanguage);
      await i18n.changeLanguage(savedLanguage);
      console.log('言語変更後:', i18n.language);
    } else {
      console.log('デフォルト言語を使用:', i18n.language);
    }
  } catch (error) {
    console.error('言語設定の読み込みエラー:', error);
  }
};

// 言語設定を保存する関数
export const saveLanguage = async (language: string) => {
  try {
    console.log('言語設定を保存:', language);
    await AsyncStorage.setItem('language', language);
    console.log('言語設定保存完了');
    // 保存後に現在の言語状態を確認
    const currentLang = i18n.language;
    console.log('保存後の言語状態:', currentLang);
  } catch (error) {
    console.error('言語設定の保存エラー:', error);
  }
};

export default i18n;