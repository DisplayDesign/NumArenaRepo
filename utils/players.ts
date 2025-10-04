import { db } from '@/utils/firebase';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { PlayerData } from '@/types/game';

export type LeaderboardEntry = {
  id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  totalGames: number;
};

// プレイヤープロフィールをクラウドに同期（作成/上書き）
export async function upsertPlayerProfile(player: PlayerData): Promise<void> {
  const ref = doc(db as any, 'players', player.playerId);
  await setDoc(ref, {
    name: player.displayName,
    rating: player.rating,
    wins: player.wins,
    losses: player.losses,
    totalGames: player.totalGames,
    updatedAt: serverTimestamp()
  }, { merge: true } as any);
}

// リーダーボード取得（デフォルト: 全期間の上位N）
export async function fetchLeaderboard(topN: number = 50, timeframe: 'all' | 'weekly' | 'monthly' = 'all'): Promise<LeaderboardEntry[]> {
  // 現状は timeframe に関係なく rating 順の上位を返す
  // 期間フィルタは updatedAt を where で絞り込む形に拡張可能
  let q = query(collection(db as any, 'players'), orderBy('rating', 'desc') as any, limit(topN));

  // 期間フィルタ（将来拡張用）
  // if (timeframe !== 'all') { ... where('updatedAt', '>=', threshold) }

  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data: any = d.data();
    return {
      id: d.id,
      name: data.name || 'プレイヤー',
      rating: Number(data.rating) || 1200,
      wins: Number(data.wins) || 0,
      losses: Number(data.losses) || 0,
      totalGames: Number(data.totalGames) || 0
    } as LeaderboardEntry;
  });
}

