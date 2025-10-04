import { NativeModules } from 'react-native';

type AdImpl = {
  initialize: () => Promise<void>;
  load: (adUnitId?: string) => void;
  show: (adUnitId?: string) => Promise<boolean>;
};

let impl: AdImpl | null = null;

async function ensureImpl(): Promise<AdImpl> {
  if (impl) return impl;
  try {
    const hasNative = !!(NativeModules as any)?.RNGoogleMobileAdsModule;
    if (!hasNative) throw new Error('no-native');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-google-mobile-ads');
    const mobileAds = mod.default;
    const { InterstitialAd, AdEventType, TestIds } = mod;
    let interstitial: any = null;
    impl = {
      initialize: async () => {
        try { await mobileAds().initialize(); } catch (_) {}
      },
      load: (adUnitId?: string) => {
        const unit = adUnitId || TestIds.INTERSTITIAL;
        interstitial = InterstitialAd.createForAdRequest(unit, { requestNonPersonalizedAdsOnly: true });
        interstitial.load();
      },
      show: async () => {
        return new Promise((resolve) => {
          try {
            if (!interstitial) {
              impl?.load();
            }
            const finish = () => { try { interstitial?.removeAllListeners?.(); } catch {} resolve(true); };
            interstitial?.addAdEventListener?.(AdEventType.CLOSED, finish);
            interstitial?.addAdEventListener?.(AdEventType.ERROR, () => resolve(false));
            if (interstitial?.loaded) interstitial.show();
            else interstitial?.addAdEventListener?.(AdEventType.LOADED, () => interstitial?.show());
          } catch (_) { resolve(false); }
        });
      }
    };
    return impl;
  } catch (_) {
    // フォールバック（ダミー）
    impl = {
      initialize: async () => {},
      load: () => {},
      show: async () => {
        return false;
      }
    };
    return impl;
  }
}

export const initAds = async () => { (await ensureImpl()).initialize(); };
export const loadInterstitial = async (adUnitId?: string) => { (await ensureImpl()).load(adUnitId); };
export const showInterstitial = async (adUnitId?: string): Promise<boolean> => (await ensureImpl()).show(adUnitId);

