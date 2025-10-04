export const LIQUID_GLASS_COLORS = {
  // プライマリーカラー
  primary: {
    coral: '#FF6B6B',      // プレイヤー1
    turquoise: '#4ECDC4',  // プレイヤー2
    lavender: '#A8E6CF',   // アクセント1
    peach: '#FFD93D',      // アクセント2
    mint: '#95E1D3'        // アクセント3
  },
  
  // グラス効果用
  glass: {
    light: 'rgba(255, 255, 255, 0.25)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.3)'
  },
  
  // グラデーション
  gradients: {
    sunset: ['#D14B4B', '#D8B02A', '#2F8F88'],
    ocean: ['#0F4C5C', '#0B3C49', '#072A2D'],
    cosmic: ['#517E74', '#4B5C92', '#B05A7A'],
    neutral: ['rgba(150, 150, 150, 0.8)', 'rgba(100, 100, 100, 0.6)']
  },
  
  // テキストカラー
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.85)',
    light: '#FFFFFF',
    accent: '#FFFFFF'
  }
};

// 文字のアウトラインに使う濃色（背景色をさらに濃くした色）
export const TEXT_OUTLINE_COLOR = '#063a36';
export const TEXT_OUTLINE_STYLE = {
  textShadowColor: TEXT_OUTLINE_COLOR,
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2
};

// アプリ共通の背景グラデーション（ホーム画面に合わせて統一）
// LinearGradient の型要件 (readonly tuple) を満たすためタプルとして定義
export const APP_BG_GRADIENT = ['#0F4C5C', '#0B3C49', '#072A2D'] as const;

export const PLAYER_COLORS: Record<number, string> = {
  0: '#FF6B6B', // コーラルレッド
  1: '#4ECDC4'  // ターコイズ
};

export const ANIMATION_CONFIG = {
  // スプリングアニメーション
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1
  },
  
  // 持続時間
  duration: {
    fast: 200,
    medium: 400,
    slow: 600,
    piece: 800
  }
};