import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { usePlayer } from '@/contexts/PlayerContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createRoom, joinRoom, watchRoom, autoMatch, cancelWaitingRoom, createRoomWithId, tryJoinWaiting } from '@/utils/online';
import { db } from '@/utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function MatchmakingScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { playerData } = usePlayer();
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [joinVisible, setJoinVisible] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [createInput, setCreateInput] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const unsubRef = useRef<() => void | null>(null);
  const navigatedRef = useRef(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // オンラインは画面表示直後に自動マッチ開始
  useEffect(() => {
    if (String(params.type) === 'local') return;
    if (!playerData) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    startRatedMatch();
  }, [params.type, playerData]);

  const startRatedMatch = async () => {
    if (!playerData) return;
    setLoading(true);
    setStatus('マッチングを開始しています…');
    const result = await autoMatch(playerData.playerId, playerData.rating);
    setRoomId(result.roomId);
    setSearching(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000) as any;
    if (result.role === 'p1') {
      // 即開始（相手の待機ルームに入れた）
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        setLoading(false);
        router.replace(`/game?mode=online&room=${result.roomId}&role=p1&rated=1`);
      }
      return;
    }
    // 自分がホストになった場合は開始を待つ
    setStatus('相手を待っています…');
    unsubRef.current = watchRoom(result.roomId, async (r) => {
      if (navigatedRef.current) return;
      const bothJoined = !!(r.players?.p0) && !!(r.players?.p1);
      if (r.status === 'playing' || bothJoined) {
        navigatedRef.current = true;
        if (unsubRef.current) unsubRef.current();
        setLoading(false);
        // 相手名を players コレクションから取得（存在しなければデフォルト）
        try {
          const oppId = r.players?.p1;
          let oppName = 'プレイヤー2';
          if (oppId) {
            const ds = await getDoc(doc(db as any, 'players', oppId));
            if (ds.exists()) oppName = (ds.data() as any).name || oppName;
          }
          router.replace(`/game?mode=online&room=${r.id}&role=p0&opponent=${encodeURIComponent(oppName)}&rated=1`);
        } catch (_) {
          router.replace(`/game?mode=online&room=${r.id}&role=p0&rated=1`);
        }
      }
    });
    setLoading(false);
    // セーフティ: 10秒後に再スキャンして合流を試みる
    setTimeout(async () => {
      if (!searching) return;
      if (!playerData) return;
      const j = await tryJoinWaiting(playerData.playerId);
      if (j) {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          if (unsubRef.current) unsubRef.current();
          setLoading(false);
      router.replace(`/game?mode=online&room=${j}&role=p1&rated=1`);
        }
      }
    }, 10000);
  };

  const startJoin = async () => {
    // モーダルを開いて入力させる
    setRoomInput('');
    setJoinVisible(true);
  };

  const stopSearch = async () => {
    if (roomId && playerData) {
      await cancelWaitingRoom(roomId, playerData.playerId);
    }
    setSearching(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
    };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} />
      <GlassContainer style={styles.card}>
        {!searching ? (
          <View>
            {String(params.type) === 'local' ? (
              <>
                <Text style={styles.title}>{t('matchmaking.title')}</Text>
                <Text style={styles.subtitle}>{status || t('matchmaking.enter_room_id')}</Text>
                <TouchableOpacity style={styles.button} onPress={() => { setCreateInput(''); setCreateVisible(true); }}>
                  <Text style={styles.buttonText}>{t('matchmaking.create_room')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#4ECDC4', marginTop: 12 }]} onPress={startJoin}>
                  <Text style={styles.buttonText}>{t('matchmaking.join_room')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>{t('home.play_online')}</Text>
                <Text style={styles.subtitle}>{status || t('matchmaking.searching')}</Text>
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" />
                </View>
              </>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.title}>{t('matchmaking.searching')}</Text>
            <Text style={styles.time}>{formatTime(elapsed)}</Text>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={stopSearch}>
              <Text style={styles.buttonText}>{t('matchmaking.cancel')}</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
          </View>
        )}
        {/* 参加用: ルームID入力モーダル */}
        <Modal visible={joinVisible} transparent animationType="fade" onRequestClose={() => setJoinVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('matchmaking.room_id')}</Text>
              <TextInput
                value={roomInput}
                onChangeText={setRoomInput}
                placeholder={t('matchmaking.enter_room_id')}
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.modalInput}
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => setJoinVisible(false)}>
                  <Text style={styles.buttonText}>{t('matchmaking.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#4ECDC4' }]}
                  onPress={async () => {
                    if (!playerData || !roomInput.trim()) return;
                    setLoading(true);
                    const res = await joinRoom(roomInput.trim(), playerData.playerId);
                    setJoinVisible(false);
                    if (res === 'ok') {
        router.replace(`/game?mode=online&room=${roomInput.trim()}&role=p1&rated=0`);
                    } else {
                      setLoading(false);
                      setStatus(res === 'full' ? t('matchmaking.room_in_use') : t('matchmaking.invalid_id'));
                    }
                  }}
                >
                  <Text style={styles.buttonText}>{t('matchmaking.join_room')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 作成用: カスタムID入力モーダル */}
        <Modal visible={createVisible} transparent animationType="fade" onRequestClose={() => setCreateVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('matchmaking.room_id')}</Text>
              <TextInput
                value={createInput}
                onChangeText={setCreateInput}
                placeholder={t('matchmaking.enter_room_id')}
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.modalInput}
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => setCreateVisible(false)}>
                  <Text style={styles.buttonText}>{t('matchmaking.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: LIQUID_GLASS_COLORS.primary.coral }]}
                  onPress={async () => {
                    if (!playerData || !createInput.trim()) return;
                    // 先に入力モーダルを閉じ、キーボードをしまってからローディング表示
                    setCreateVisible(false);
                    Keyboard.dismiss();
                    setLoading(true);
                    const id = createInput.trim();
                    const res = await createRoomWithId(id, playerData.playerId);
                    if (res === 'ok') {
                      setRoomId(id);
                      setSearching(true);
                      setElapsed(0);
                      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000) as any;
                      setStatus(`${t('matchmaking.searching')}｜${t('matchmaking.room_id')}: ${id}`);
                      if (unsubRef.current) unsubRef.current();
                      unsubRef.current = watchRoom(id, async (r) => {
                        if (r.status === 'playing') {
                          if (unsubRef.current) unsubRef.current();
                          try {
                            const oppId = r.players?.p1;
                            let oppName = 'プレイヤー2';
                            if (oppId) {
                              const ds = await getDoc(doc(db as any, 'players', oppId));
                              if (ds.exists()) oppName = (ds.data() as any).name || oppName;
                            }
                            router.replace(`/game?mode=online&room=${r.id}&role=p0&opponent=${encodeURIComponent(oppName)}&rated=0`);
                          } catch (_) {
                            router.replace(`/game?mode=online&room=${r.id}&role=p0&rated=0`);
                          }
                        }
                      });
                      setLoading(false);
                    } else if (res === 'in_use') {
                      setLoading(false);
                      setStatus(t('matchmaking.room_in_use'));
                    } else {
                      setLoading(false);
                      setStatus(t('matchmaking.invalid_id'));
                    }
                  }}
                >
                  <Text style={styles.buttonText}>{t('matchmaking.create_room')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* 通信中オーバーレイ */}
        <Modal visible={loading} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.loadingText}>通信中…</Text>
            </View>
          </View>
        </Modal>
      </GlassContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LIQUID_GLASS_COLORS.text.primary,
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 6,
    color: LIQUID_GLASS_COLORS.text.secondary
  },
  time: {
    marginTop: 8,
    fontSize: 16,
    color: LIQUID_GLASS_COLORS.text.primary
  },
  button: {
    marginTop: 16,
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  cancel: {
    backgroundColor: '#777'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
  ,modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(15, 41, 48, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 8
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff'
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingCard: {
    backgroundColor: 'rgba(15, 41, 48, 0.95)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 10
  }
});

