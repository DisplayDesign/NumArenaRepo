import { db } from './firebase';
import { collection, addDoc, doc, onSnapshot, getDoc, updateDoc, serverTimestamp, query, where, limit, getDocs, runTransaction, deleteDoc, setDoc, orderBy } from 'firebase/firestore';

export type OnlineRoom = {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: any;
  updatedAt: any;
  seed: number;
  players: { p0?: string; p1?: string };
  state?: any;
  ratingHost?: number;
  ratingBucket?: number;
  lastSeenMs?: { p0?: number; p1?: number };
};

export async function createRoom(playerId: string, rating?: number): Promise<OnlineRoom> {
  const ref = await addDoc(collection(db, 'rooms'), {
    status: 'waiting',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    seed: Math.floor(Math.random() * 1e9),
    players: { p0: playerId },
    lastSeenMs: { p0: Date.now() },
    ratingHost: rating ?? null,
    ratingBucket: rating != null ? Math.round(rating / 100) : null
  });
  const snap = await getDoc(ref);
  return { id: ref.id, ...(snap.data() as any) } as OnlineRoom;
}

export async function joinRoom(roomId: string, playerId: string): Promise<'ok'|'full'|'not_found'> {
  const r = await getDoc(doc(db, 'rooms', roomId));
  if (!r.exists()) return 'not_found';
  const data = r.data() as any;
  if (data.players?.p1) return 'full';
  await updateDoc(doc(db, 'rooms', roomId), {
    'players.p1': playerId,
    status: 'playing',
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now(),
    'lastSeenMs.p1': Date.now()
  });
  return 'ok';
}

export function watchRoom(roomId: string, cb: (room: OnlineRoom) => void) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    if (!snap.exists()) return;
    cb({ id: roomId, ...(snap.data() as any) } as OnlineRoom);
  });
}

export async function sendState(roomId: string, state: any) {
  // Firestoreは入れ子の配列（boardのような2次元配列）を直接は扱えないため
  // 文字列として保存し、受信側で復元する
  const serialized = typeof state === 'string' ? state : JSON.stringify(state);
  // 同一内容のスパム送信を抑止
  if (__lastSent[roomId]?.s === serialized) {
    return;
  }
  __lastSent[roomId] = { s: serialized, ts: Date.now() };
  console.log('[SENDSTATE] attempting to send state to room:', roomId, 'status:', state?.gameStatus);
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      state: serialized,
      updatedAt: serverTimestamp()
    });
    console.log('[SENDSTATE] successfully sent state to room:', roomId);
  } catch (e) {
    console.error('[SENDSTATE] failed to send state to room:', roomId, e);
  }
}

// 送信履歴（モジュールスコープ）
const __lastSent: Record<string, { s: string; ts: number }> = {};

// --- move event channel (シンプルな同期用) ---
export type OnlineMove = { row: number; col: number; piece: number | 'n'; playerId: number };

export async function sendMove(roomId: string, move: OnlineMove) {
  await addDoc(collection(db, 'rooms', roomId, 'moves'), {
    ...move,
    createdAt: serverTimestamp()
  });
}

export function watchMoves(roomId: string, onAdd: (move: OnlineMove) => void) {
  const q = query(collection(db, 'rooms', roomId, 'moves'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    snap.docChanges().forEach((ch) => {
      if (ch.type === 'added') {
        const d = ch.doc.data() as any;
        onAdd({ row: d.row, col: d.col, piece: d.piece, playerId: d.playerId });
      }
    });
  });
}

// --- Presence / Heartbeat ---
export async function heartbeat(roomId: string, role: 'p0' | 'p1') {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      [`lastSeen.${role}`]: serverTimestamp(),
      [`lastSeenMs.${role}`]: Date.now(),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    } as any);
  } catch (_) {
    // noop
  }
}

// --- Auto Matchmaking ---
export async function autoMatch(playerId: string, rating: number): Promise<{ roomId: string; role: 'p0' | 'p1' }> {
  // 1) 既存の待機ルームに参加を試みる（自分以外）
  const tryJoinOnce = async (): Promise<string | null> => {
    const q1 = query(collection(db, 'rooms'), where('status', '==', 'waiting'), limit(25));
    const snap = await getDocs(q1);
    const candidates = snap.docs.filter((d) => {
      const data = d.data() as any;
      return data.status === 'waiting' && !(data.players && data.players.p1) && data.players?.p0 !== playerId;
    }).sort((a, b) => ((a.data() as any).createdAtMs ?? 9e15) - ((b.data() as any).createdAtMs ?? 9e15));
    for (const docSnap of candidates) {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'rooms', docSnap.id);
          const current = await tx.get(ref);
          if (!current.exists()) throw new Error('not_found');
          const data = current.data() as any;
          if (data.status !== 'waiting' || (data.players && data.players.p1)) {
            throw new Error('already_taken');
          }
          tx.update(ref, {
            'players.p1': playerId,
            status: 'playing',
            updatedAt: serverTimestamp(),
            updatedAtMs: Date.now()
          });
        });
        return docSnap.id;
      } catch (_) {
        continue;
      }
    }
    return null;
  };

  const joined = await tryJoinOnce();
  if (joined) return { roomId: joined, role: 'p1' };

  // 2) 見つからなければ自分の待機ルームを作成
  const myRoom = await createRoom(playerId, rating);

  // 3) 同時作成レース対策: 短時間リトライで他人の待機ルームを再チェック
  for (let i = 0; i < 6; i++) { // 約1.8秒
    await new Promise((r) => setTimeout(r, 300));
    const j = await tryJoinOnce();
    if (j) {
      // 他人の部屋に入れたので自分の待機部屋は削除
      try { await deleteDoc(doc(db, 'rooms', myRoom.id)); } catch (_) {}
      return { roomId: j, role: 'p1' };
    }
  }

  // 4) 結局見つからなければ自分の部屋で待機
  return { roomId: myRoom.id, role: 'p0' };
}

// 外部から再試行用: 自分以外の待機ルームに参加を試みる
export async function tryJoinWaiting(playerId: string): Promise<string | null> {
  const q1 = query(collection(db, 'rooms'), orderBy('createdAt', 'asc'), limit(10));
  const snap = await getDocs(q1);
  const candidates = snap.docs.filter((d) => {
    const data = d.data() as any;
    return data.status === 'waiting' && !(data.players && data.players.p1) && data.players?.p0 !== playerId;
  });
  for (const docSnap of candidates) {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'rooms', docSnap.id);
        const current = await tx.get(ref);
        if (!current.exists()) throw new Error('not_found');
        const data = current.data() as any;
        if (data.status !== 'waiting' || (data.players && data.players.p1)) {
          throw new Error('already_taken');
        }
        tx.update(ref, {
          'players.p1': playerId,
          status: 'playing',
          updatedAt: serverTimestamp()
        });
      });
      return docSnap.id;
    } catch (_) {
      continue;
    }
  }
  return null;
}

export async function cancelWaitingRoom(roomId: string, playerId: string): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'rooms', roomId);
      const current = await tx.get(ref);
      if (!current.exists()) return;
      const data = current.data() as any;
      if (data.status === 'waiting' && data.players && data.players.p0 === playerId && !data.players.p1) {
        tx.delete(ref);
      }
    });
  } catch (_) {
    // noop
  }
}

// --- Local (manual ID) ---
export async function createRoomWithId(roomId: string, playerId: string): Promise<'ok'|'in_use'|'invalid'> {
  const id = (roomId || '').normalize('NFKC').trim();
  if (!id) return 'invalid';
  try {
    const ref = doc(db, 'rooms', id);
    let allowRecycle = false;
    // トランザクションで上書き or 使用中判定
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          status: 'waiting',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
          seed: Math.floor(Math.random() * 1e9),
          players: { p0: playerId },
          lastSeenMs: { p0: Date.now() }
        } as any);
        return;
      }
      const data = snap.data() as any;
      // 稼働中の部屋は再利用不可
      if (data.status === 'playing') {
        throw new Error('in_use');
      }
      // 古い/終了済み/待機中の部屋は上書きして再利用
      allowRecycle = true;
      tx.set(ref, {
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        seed: Math.floor(Math.random() * 1e9),
        players: { p0: playerId },
        lastSeenMs: { p0: Date.now() }
      } as any, { merge: false } as any);
    });
    // moves サブコレクションを掃除（ベストエフォート）
    try {
      const movesSnap = await getDocs(collection(db, 'rooms', id, 'moves'));
      await Promise.all(movesSnap.docs.map(d => deleteDoc(d.ref)));
    } catch (_) {}
    return 'ok';
  } catch (e: any) {
    if (String(e?.message).includes('in_use')) return 'in_use';
    console.warn('[online] createRoomWithId error', e);
    return 'invalid';
  }
}

