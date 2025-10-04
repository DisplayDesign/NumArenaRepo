// 開発時はネイティブモジュールが存在しない可能性があるため、
// 動的に読み込み、失敗した場合はダミー実装にフォールバックする。

// Web/Metroでネイティブ専用モジュールを読み込まないための完全なダミー実装

type AdImpl = {
  initialize: () => Promise<void>;
  load: (adUnitId?: string) => void;
  show: (adUnitId?: string) => Promise<boolean>;
};

let impl: AdImpl | null = null;

async function ensureImpl(): Promise<AdImpl> {
  if (impl) return impl;
  impl = {
    initialize: async () => {},
    load: () => {},
    show: async () => false
  };
  return impl;
}

export const initAds = async () => { (await ensureImpl()).initialize(); };
export const loadInterstitial = async (adUnitId?: string) => { (await ensureImpl()).load(adUnitId); };
export const showInterstitial = async (adUnitId?: string): Promise<boolean> => (await ensureImpl()).show(adUnitId);

