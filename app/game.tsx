import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Modal, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { LIQUID_GLASS_COLORS, APP_BG_GRADIENT, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerInventory } from '@/components/game/PlayerInventory';
import { PieceSelector } from '@/components/game/PieceSelector';
import { GamePiece } from '@/components/game/GamePiece';
import { useGame } from '@/contexts/GameContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { StorageManager } from '@/utils/storage';
import { showInterstitial, loadInterstitial } from '@/utils/ads';
import { Player, GameResult } from '@/types/game';
import { RatingSystem } from '@/utils/rating';
import { GameResultOverlay } from '@/components/game/GameResultOverlay';
import { chooseAiMove, AiLevel } from '@/utils/ai';
import { initializeGame as buildInitialGameState } from '@/utils/gameLogic';
import { watchRoom, sendState, watchMoves, sendMove, heartbeat } from '@/utils/online';
import { upsertPlayerProfile } from '@/utils/players';
import { useTranslation } from 'react-i18next';

export default function GameScreen() {
  const params = useLocalSearchParams<{ mode: string; role?: string; room?: string; rated?: string }>();
  const { gameState, makeMove, resetGame, startGame, passTurn, syncState } = useGame();
  const { playerData, updateRating, saveGameResult } = usePlayer();
  const { t } = useTranslation();
  
  const [showPieceSelector, setShowPieceSelector] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiLevel, setAiLevel] = useState<AiLevel>('advanced');
  const [aiStartConfirmed, setAiStartConfirmed] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const turnTimerRef = useRef<any>(null);
  const [turnLeft, setTurnLeft] = useState<number>(30);
  const latestStateRef = useRef<any>(null);
  const shouldPassRef = useRef<boolean>(false);
  const isApplyingRemoteRef = useRef<boolean>(false);
  const lastSentMoveTsRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<boolean>(false);
  
  // ゲーム初期化（オンライン以外）
  useEffect(() => {
    console.log('[GAME] mount, status=', gameState.gameStatus, 'mode=', params.mode, 'role=', params.role, 'room=', params.room);
    if (!gameStarted && String(params.mode) !== 'online') {
      if (String(params.mode) === 'ai' && !aiStartConfirmed) return;
      const player1: Player = {
        id: 0,
        name: playerData?.displayName || 'プレイヤー1',
        rating: playerData?.rating || 1200,
        pieces: [1, 2, 3, 4, 5, 6, 7, 8],
        nPieces: 0
      };
      const player2: Player = {
        id: 1,
        name: params.mode === 'ai' ? 'AI' : 'プレイヤー2',
        rating: params.mode === 'ai' ? 1200 : 1200,
        pieces: [1, 2, 3, 4, 5, 6, 7, 8],
        nPieces: 0
      };
      console.log('[GAME] startGame');
      startGame(player1, player2);
      setGameStarted(true);
    }
  }, [gameStarted, params.mode, playerData, startGame, aiStartConfirmed]);

  // オンライン: 初期状態クリア（マウント時のみ）
  useEffect(() => {
    if (String(params.mode) === 'online') {
      console.log('[GAME] clearing initial state for online mode');
      setShowResult(false);
      setShowPieceSelector(false);
      setSelectedCell(null);
      setGameStarted(false); // オンラインでは最初はfalse
    }
  }, [params.mode, params.room]);

  // 役割の解決（オンラインは URL の role のみを信頼して固定）
  const resolvedRole = useMemo<'p0' | 'p1' | 'unknown'>(() => {
    const m = String(params.mode || 'local');
    if (m !== 'online') return 'p0';
    const r = String(params.role || '');
    if (r === 'p0' || r === 'p1') return r as 'p0' | 'p1';
    return 'unknown';
  }, [params.mode, params.role]);

  // 現在のユーザーが指す順番かどうか
  const isUserTurn = useMemo(() => {
    const mode = String(params.mode || 'local');
    if (mode === 'ai') return gameState.currentPlayer === 0;
    if (mode === 'online') {
      if (resolvedRole === 'unknown') return false;
      const myId = resolvedRole === 'p1' ? 1 : 0;
      // オンラインゲームでは自分のIDと現在のプレイヤーが一致すれば自分の番
      return gameState.currentPlayer === myId && gameState.gameStatus === 'playing';
    }
    return true;
  }, [gameState.currentPlayer, gameState.gameStatus, params.mode, resolvedRole]);

  // デバッグ: resolvedRole と isUserTurn の変化を監視
  useEffect(() => {
    if (String(params.mode) === 'online') {
      console.log('[GAME] resolvedRole changed:', resolvedRole);
      console.log('[GAME] isUserTurn changed:', isUserTurn);
      console.log('[GAME] currentPlayer:', gameState.currentPlayer);
      console.log('[GAME] players:', gameState.players?.map(p => p?.name));
      console.log('[GAME] gameStatus:', gameState.gameStatus);
      console.log('[GAME] gameStarted:', gameStarted);
      console.log('[GAME] showResult:', showResult);
    }
  }, [resolvedRole, isUserTurn, gameState.currentPlayer, gameState.players, gameState.gameStatus, gameStarted, showResult, params.mode]);

  // ホストの初期化処理（統合版）
  useEffect(() => {
    if (String(params.mode) === 'online' && resolvedRole === 'p0' && !gameInitializedRef.current) {
      console.log('[GAME] host initialization starting');
      try {
        const p1: Player = { id: 0, name: playerData?.displayName || 'あなた', rating: playerData?.rating || 1200, pieces: [1,2,3,4,5,6,7,8], nPieces: 0 };
        const p2Name = 'プレイヤー2';
        const p2: Player = { id: 1, name: p2Name, rating: 1200, pieces: [1,2,3,4,5,6,7,8], nPieces: 0 };
        console.log('[GAME] creating initial game state with players:', p1.name, p2.name);

        // ゲーム状態を初期化して即時送信
        startGame(p1, p2);
        setGameStarted(true);
        gameInitializedRef.current = true;

        // すぐに状態を送信（確実に適用された後）
        setTimeout(() => {
          const currentState = latestStateRef.current || gameState;
          console.log('[GAME] current state before sending - board exists:', !!currentState.board, 'players length:', currentState.players?.length);
          const initialState = {
            ...currentState,
            currentPlayer: 0, // ホスト（p0）が先攻
            gameStatus: 'playing',
            moveHistory: []
          };
          console.log('[GAME] initial state before sending - board exists:', !!initialState.board, 'players length:', initialState.players?.length);
          syncState(initialState as any);
          latestStateRef.current = initialState;
          (latestStateRef.current as any)._lastSentState = JSON.stringify(initialState);
          sendState(String(params.room), initialState as any);
          console.log('[GAME] host initialization completed');
        }, 50);
      } catch (e) {
        console.error('[GAME] host initialization error:', e);
      }
    }
  }, [params.mode, resolvedRole, startGame, playerData, syncState, sendState, params.room]);

  // 表示用: どちらのインベントリがローカルユーザーか
  const mode = String(params.mode || 'local');
  const role = String(params.role || 'p0');
  // 表示/自分判定は resolvedRole を唯一の真実として用いる
  const isSelfP0 = mode === 'online' ? resolvedRole === 'p0' : true;
  const isSelfP1 = mode === 'online' ? resolvedRole === 'p1' : false;

  // 画面入場/ルーム切替時のローカル初期化（前試合の残骸を除去）
  useEffect(() => {
    setShowResult(false);
    setShowPieceSelector(false);
    setSelectedCell(null);
    setGameStarted(false);
    // オンラインはリモート state を待つため、ここでは resetGame を呼ばない
    // ローカル/AIのみ、前試合の残骸があれば初期化
    if (String(params.mode) !== 'online') {
      if (gameState.gameStatus !== 'waiting' || gameState.moveHistory.length > 0) {
        resetGame();
      }
    }
  }, [params.mode, params.room]);

  // バックボタンハンドリング
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [gameState.gameStatus]);
  
  // アプリがバックグラウンド/終了へ移行した場合のフォーフィット（オンライン対戦中のみ）
  useEffect(() => {
    const sub = () => {
      const mode = String(params.mode || 'local');
      if (mode !== 'online') return;
      if (gameState.gameStatus !== 'playing') return;
      // 自動的に敗北扱いにして終了処理
      try {
        // 強制終了はプレイヤー1（ローカル側）を敗北として処理
        (async () => {
          // 終了ステートに移行
          // 便宜上、現在のスコアを保持し、敗北として保存
          // レーティングは loss として更新
          const fakeState: any = { ...gameState, winner: 1, gameStatus: 'finished' };
          latestStateRef.current = fakeState;
          // handleGameEnd は gameState を参照するため、参照前に上書き
          // ただしここでは副作用最小化のため直接更新メソッドは呼ばず、評価用に一時的に扱う
          // 実レーティング更新（オンライン対戦時のみ）
          if (playerData && String(params.mode) === 'online' && gameState.players?.[1]) {
            const opponentRating = gameState.players[1].rating || 1200;
            const currentRating = playerData.rating || 1200;
            const loseRes = RatingSystem.updateRatings(opponentRating, currentRating);
            await updateRating(loseRes.loserRating, 'loss', loseRes.loserChange);
            await saveGameResult({
              gameId: `forfeit_${Date.now()}`,
              opponent: gameState.players[1]?.name || 'Unknown',
              result: 'loss',
              myScore: gameState.scores?.player1 || 0,
              opponentScore: gameState.scores?.player2 || 0,
              ratingChange: loseRes.loserChange,
              playedAt: new Date().toISOString()
            });
          }
        })();
      } finally {
      }
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') sub();
    });
    return () => subscription.remove();
  }, [params.mode, gameState.gameStatus, gameState.players, playerData]);

  // 旧 initializeGame は startGame に置き換え
  
  const handleCellPress = useCallback((row: number, col: number) => {
    console.log('[GAME] handleCellPress called:', { row, col, isUserTurn, resolvedRole, currentPlayer: gameState.currentPlayer });

    const cell = gameState.board[row][col];
    const occupied = cell !== null;
    // 最新ステートで判定（useMemoの遅延や描画ラグ対策）
    const live = (latestStateRef.current as any) || gameState;
    const liveStatus = live.gameStatus;
    const liveCurrent = live.currentPlayer;
    // URL の role を唯一の真実として使用
    const roleParam = String(params.role || 'p0') as 'p0' | 'p1';
    const myIdNow = roleParam === 'p1' ? 1 : 0;
    const isTurnNow = liveStatus === 'playing' && liveCurrent === myIdNow;

    console.log('[PRESS] cell', row, col, 'status=', liveStatus, 'occupied=', occupied);
    console.log('[PRESS] selector before:', showPieceSelector);
    console.log('[PRESS] turn check:', { currentPlayer: liveCurrent, isUserTurn: isTurnNow, mode: String(params.mode), role: String(params.role || '') });

    // シンプルな条件チェック
    if (liveStatus !== 'playing') {
      console.log('[GAME] cell press blocked - game not playing');
      return;
    }
    if (!isTurnNow) {
      console.log('[GAME] cell press blocked - not your turn');
      return;
    }
    // 自分のコマが置かれているセルはブロック。それ以外（空 or 相手コマ）は選択可。
    if (occupied && cell!.playerId === liveCurrent) {
      console.log('[GAME] cell press blocked - own piece');
      return;
    }

    console.log('[PRESS] open selector');
    setSelectedCell({ row, col });
    setShowPieceSelector(true);
    console.log('[GAME] showPieceSelector after setState:', true);
  }, [gameState.board, showPieceSelector, resolvedRole, params.mode, params.role, isUserTurn, gameState.currentPlayer, gameStarted]);
  
  const handlePieceSelect = useCallback((piece: number | 'n') => {
    console.log('[SELECT] piece', piece, 'at', selectedCell);

    // 最新の状態を取得（同期ラグ対策）
    const live = (latestStateRef.current as any) || gameState;
    const liveStatus = live.gameStatus;
    const liveCurrent = live.currentPlayer;

    console.log('[GAME] current player (live):', liveCurrent);
    console.log('[GAME] available pieces:', live.players[liveCurrent].pieces);
    console.log('[GAME] n pieces:', live.players[liveCurrent].nPieces);
    console.log('[GAME] game status (live):', liveStatus);
    console.log('[GAME] isUserTurn check:', isUserTurn);
    console.log('[GAME] resolvedRole:', resolvedRole);

    // 最新の状態で自分のターンかチェック
    const roleParam = String(params.role || 'p0') as 'p0' | 'p1';
    const myIdNow = roleParam === 'p1' ? 1 : 0;
    const isTurnNow = liveStatus === 'playing' && liveCurrent === myIdNow;

    if (!isTurnNow) {
      console.log('[GAME] not your turn (live check)');
      return;
    }
    if (!selectedCell) {
      console.log('[GAME] no selected cell');
      return;
    }
    
    // オンラインゲームの場合
    if (String(params.mode) === 'online' && params.room) {
      const roleParam = String(params.role || 'p0');

      // ホスト（p0）は通常通りmakeMoveを実行
      if (roleParam === 'p0') {
        const success = makeMove(selectedCell.row, selectedCell.col, piece);
        console.log('[GAME] makeMove result', success);

        if (success) {
          setShowPieceSelector(false);
          setSelectedCell(null);
        } else {
          // 無効手はモーダルを出さず無視（ラグ時の誤検出でユーザー体験が悪化するため）
        }
      } else {
        // ゲスト（p1）はリクエストのみ送信（ローカル状態更新はホストからの同期を待つ）
        if (pendingMoveRef.current) {
          console.log('[GAME] guest move pending - ignore');
          return;
        }
        console.log('[SEND] guest -> host', { row: selectedCell.row, col: selectedCell.col, piece });
        pendingMoveRef.current = true;
        sendMove(String(params.room), { row: selectedCell.row, col: selectedCell.col, piece, playerId: 1 });
        setShowPieceSelector(false);
        setSelectedCell(null);
      }
    } else {
      // ローカルゲームの場合
      const success = makeMove(selectedCell.row, selectedCell.col, piece);
      console.log('[GAME] makeMove result', success);

      if (success) {
        setShowPieceSelector(false);
        setSelectedCell(null);
      } else {
        // 無効手はモーダルを出さず無視（ラグ時の誤検出でユーザー体験が悪化するため）
      }
    }
  }, [selectedCell, gameState.currentPlayer, gameState.players, gameState.gameStatus, makeMove, isUserTurn, params.role, params.mode]);

  // AIの手番処理
  useEffect(() => {
    if (params.mode !== 'ai') return;
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentPlayer !== 1) return; // AIの番だけ
    const timer = setTimeout(() => {
      const mv = chooseAiMove(gameState.board, gameState.players as any, 1, aiLevel);
      if (mv) makeMove(mv.row, mv.col, mv.piece);
    }, 500);
    return () => clearTimeout(timer);
  }, [params.mode, gameState.currentPlayer, gameState.board, aiLevel]);

  // ターンタイマー（30秒で自動パス）
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    // AIの番は人間のタイマー不要
    if (params.mode === 'ai' && gameState.currentPlayer === 1) return;
    if (turnTimerRef.current) clearInterval(turnTimerRef.current as any);
    setTurnLeft(30);
    turnTimerRef.current = setInterval(() => {
      setTurnLeft(prev => {
        if (prev <= 1) {
          clearInterval(turnTimerRef.current as any);
          shouldPassRef.current = true;
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current as any);
    };
  }, [gameState.currentPlayer, gameState.gameStatus, params.mode]);

  // タイマー満了時のパスは描画後の別フェーズで実行し、レンダリング中のdispatchを回避
  useEffect(() => {
    if (shouldPassRef.current) {
      shouldPassRef.current = false;
      passTurn();
    }
  }, [turnLeft]);

  // 常に最新のゲームステートを参照できるよう保持
  useEffect(() => {
    latestStateRef.current = gameState;
  }, [gameState]);

  // 相手がコマを全く持っていない場合は即パス（連続手番）
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    const current = gameState.currentPlayer;
    const curP = gameState.players[current];
    const other = current === 0 ? 1 : 0;
    const has = (p: any) => (p?.pieces?.length || 0) + (p?.nPieces || 0) > 0;
    if (!has(curP) && has(gameState.players[other])) {
      passTurn();
    }
  }, [gameState.currentPlayer, gameState.players, gameState.gameStatus]);

  // --- オンライン: 状態同期（簡単方式） ---
  const onlineUnsubRef = useRef<null | (() => void)>(null);
  const gameInitializedRef = useRef<boolean>(false);
  const disconnectTimeoutRef = useRef<any>(null);
  const forceInitTimerRef = useRef<any>(null);

  // 変更判定（軽量版）: 前回状態と実質的に差分があるか
  const isStateMeaningfullyDifferent = (a: any, b: any): boolean => {
    if (!a || !b) return true;
    if (a.currentPlayer !== b.currentPlayer) return true;
    if (a.gameStatus !== b.gameStatus) return true;
    if (a.winner !== b.winner) return true;
    try {
      if (JSON.stringify(a.scores) !== JSON.stringify(b.scores)) return true;
    } catch {}
    const am = Array.isArray(a.moveHistory) ? a.moveHistory.length : 0;
    const bm = Array.isArray(b.moveHistory) ? b.moveHistory.length : 0;
    if (am !== bm) return true;
    const A = a.board, B = b.board;
    if (!A || !B || A.length !== B.length) return true;
    for (let r = 0; r < A.length; r++) {
      const ra = A[r], rb = B[r];
      if (!ra || !rb || ra.length !== rb.length) return true;
      for (let c = 0; c < ra.length; c++) {
        const ca = ra[c], cb = rb[c];
        if ((ca?.playerId) !== (cb?.playerId) || (ca?.value) !== (cb?.value)) return true;
      }
    }
    return false;
  };
  
  useEffect(() => {
    if (String(params.mode) !== 'online' || !params.room) return;

    // 受信購読（初回のみ登録）
    if (onlineUnsubRef.current) return;

    console.log('[GAME] registering watchRoom');
    onlineUnsubRef.current = watchRoom(String(params.room), (room) => {
      console.log('[WATCHROOM] received room update:', room.id, 'state exists:', !!room.state);
      if (room.state) {
        try {
          const parsed = typeof room.state === 'string' ? JSON.parse(room.state as any) : room.state;
          console.log('[WATCHROOM] parsed state:', parsed?.gameStatus, 'currentPlayer:', parsed?.currentPlayer);

          // 状態を同期（常に同期するように簡素化）
          isApplyingRemoteRef.current = true;
          syncState(parsed as any);
          latestStateRef.current = parsed as any;
          isApplyingRemoteRef.current = false;

          // リモート適用が来たら pending を解除（ゲスト側）
          pendingMoveRef.current = false;

          // リモート状態がplayingならゲーム開始状態に設定
          if (parsed?.gameStatus === 'playing') {
            setGameStarted(true);
            gameInitializedRef.current = true;
          }

          // 強制的にコンポーネントを再レンダリング
          setForceRender(prev => prev + 1);
        } catch (e) {
          console.error('[GAME] watchRoom error:', e);
        }
      }
    });

    return () => {
      if (onlineUnsubRef.current) {
        console.log('[GAME] unsubscribing watchRoom');
        onlineUnsubRef.current();
      }
    };
  }, [params.mode, params.room]);

  // オンライン: ハートビートのみ（切断検知は前述の watchRoom 内で処理）
  useEffect(() => {
    if (String(params.mode) !== 'online' || !params.room) return;
    const roomId = String(params.room);
    const roleNow: 'p0' | 'p1' = (resolvedRole === 'p0' || resolvedRole === 'p1')
      ? resolvedRole
      : (String(params.role || 'p0') as 'p0' | 'p1');
    const hb = setInterval(() => heartbeat(roomId, roleNow), 4000);
    return () => { clearInterval(hb); if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current); };
  }, [params.mode, params.room, resolvedRole]);

  // ホストは相手（p1）の手を "moves" チャンネルから受け取り、適用して state を送信
  const movesUnsubRef = useRef<null | (() => void)>(null);
  useEffect(() => {
    if (String(params.mode) !== 'online' || !params.room) return;
    if (resolvedRole !== 'p0') return; // ホストのみ監視（URLではなく解決済み役割を使用）
    if (movesUnsubRef.current) movesUnsubRef.current();
    movesUnsubRef.current = watchMoves(String(params.room), (mv) => {
      if (mv.playerId !== 1) return;

      // 受信適用中は処理しない
      if (isApplyingRemoteRef.current) return;

      const ok = makeMove(mv.row, mv.col, mv.piece);
      if (ok) {
        setTimeout(() => {
          const s = latestStateRef.current || gameState;
          // 同じ状態なら送信しない
          const currentStateStr = JSON.stringify(s);
          if ((latestStateRef.current as any)._lastSentState !== currentStateStr) {
            (latestStateRef.current as any)._lastSentState = currentStateStr;
            sendState(String(params.room!), s as any);
          }
          // ゲスト側の pending を解除させるシグナルとして remote state が配信される
        }, 50);
      }
    });
    return () => { if (movesUnsubRef.current) movesUnsubRef.current(); };
  }, [params.mode, params.room, resolvedRole, makeMove]);

  // 自分の手が確定した直後のみ状態送信（ホストのみ）。ゲストはリクエストのみ送信。
  useEffect(() => {
    if (String(params.mode) !== 'online' || !params.room) return;
    const last = gameState.moveHistory[gameState.moveHistory.length - 1];
    if (!last) return;
    const myId = resolvedRole === 'p1' ? 1 : 0;

    // ホスト（p0）のみが状態を送信する
    if (resolvedRole !== 'p0') return;

    // 受信適用中は送信しない
    if (isApplyingRemoteRef.current) return;
    // すでに同じ手（timestamp）を送信済みなら送らない
    if (lastSentMoveTsRef.current === last.timestamp) return;

    // 同じ状態なら送信しない（さらに厳密に）
    const currentStateStr = JSON.stringify(gameState);
    if ((latestStateRef.current as any)._lastSentState === currentStateStr) {
      return;
    }

    if (last.playerId === myId) {
      lastSentMoveTsRef.current = last.timestamp;
      (latestStateRef.current as any)._lastSentState = currentStateStr;
      sendState(String(params.room), gameState as any);
    }
  }, [gameState, gameStarted, params.mode, params.room, resolvedRole]);
  
  const handleGameEnd = async () => {
    try {
      const isWin = gameState.winner === 0; // プレイヤー1が勝利
      const isDraw = gameState.winner === null;
      
      // オンライン対戦以外ではレートを動かさない
  const isRated = String(params.mode) === 'online' && String(params.rated || '1') === '1';
      if (playerData && isRated) {
        // レーティング更新
        const opponentRating = gameState.players[1].rating;
        const currentRating = playerData.rating;
        
        let ratingResult:
          | ReturnType<typeof RatingSystem.updateRatingsForDraw>
          | ReturnType<typeof RatingSystem.updateRatings>;
        if (isDraw) {
          const draw = RatingSystem.updateRatingsForDraw(currentRating, opponentRating);
          ratingResult = draw;
          await updateRating(draw.player1Rating, 'draw', draw.player1Change);
        } else {
          if (isWin) {
            const winRes = RatingSystem.updateRatings(currentRating, opponentRating);
            ratingResult = winRes;
            await updateRating(winRes.winnerRating, 'win', winRes.winnerChange);
          } else {
            const loseRes = RatingSystem.updateRatings(opponentRating, currentRating);
            ratingResult = loseRes;
            await updateRating(loseRes.loserRating, 'loss', loseRes.loserChange);
          }
        }
        
        // ゲーム結果を保存
        const gameResult: GameResult = {
          gameId: `game_${Date.now()}`,
          opponent: gameState.players[1].name,
          result: isDraw ? 'draw' : (isWin ? 'win' : 'loss'),
          myScore: gameState.scores.player1,
          opponentScore: gameState.scores.player2,
          ratingChange: isDraw
            ? (ratingResult as ReturnType<typeof RatingSystem.updateRatingsForDraw>).player1Change
            : isWin
            ? (ratingResult as ReturnType<typeof RatingSystem.updateRatings>).winnerChange
            : (ratingResult as ReturnType<typeof RatingSystem.updateRatings>).loserChange,
          playedAt: new Date().toISOString()
        };
        
        await saveGameResult(gameResult);
      }
      
      // 結果表示
      const resultText = isDraw ? 'ドロー！' : 
        (isWin ? '勝利！' : '敗北...');
      const scoreText = `${gameState.scores.player1} - ${gameState.scores.player2}`;
      // 自分のプロフィールをランキングへ反映
      try {
        const latest = await StorageManager.getPlayerData();
        if (latest) await upsertPlayerProfile(latest);
      } catch (_) {}
    } catch (error) {
      console.error('ゲーム終了処理エラー:', error);
    }
  };
  
  const handleRestart = () => {
    // すべての状態を完全にリセット
    resetGame();
    setGameStarted(false);
    if (String(params.mode) === 'ai') setAiStartConfirmed(false);
    setShowResult(false);
    setShowPieceSelector(false);
    setSelectedCell(null);
    setTurnLeft(30);
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    shouldPassRef.current = false;
    pendingMoveRef.current = false;
    lastSentMoveTsRef.current = null;
    isApplyingRemoteRef.current = false;
    latestStateRef.current = null;
    gameInitializedRef.current = false;
  };

  // 勝敗/引き分けが確定したら結果モーダルを表示し、終了処理を実行
  useEffect(() => {
    if (gameState.gameStatus === 'finished' && !showResult) {
      // オンライン: 古い state の残骸で誤発火しないようチェック
      if (String(params.mode) === 'online') {
        // ゲームが開始されていない、または手が全くない場合は無視
        if (!gameStarted || gameState.moveHistory.length === 0) {
          return;
        }
      }
      // 成績反映・保存
      handleGameEnd();
      setShowResult(true);
    }
  }, [gameState.gameStatus, showResult, gameState.moveHistory.length, params.mode, gameStarted]);

  // 結果モーダル表示中に広告表示のみ（自動遷移は削除）
  useEffect(() => {
    if (showResult && gameState.gameStatus === 'finished') {
      const timer = setTimeout(async () => {
        const count = await StorageManager.incrementAdCounter();
        if (count % 2 === 0) {
          const shown = await showInterstitial();
          loadInterstitial();
        }
        // 自動遷移は削除 - ユーザーが手動でホームに戻るように変更
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResult, gameState.gameStatus]);
  
  const handleBackPress = () => {
    if (gameState.gameStatus === 'playing') {
      Alert.alert(
        'ゲームを終了',
        '進行中のゲームを終了しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel'
          },
          {
            text: '終了',
            onPress: () => router.back()
          }
        ]
      );
    } else if (showResult && gameState.gameStatus === 'finished') {
      // 結果表示中はホームに戻る
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };
  
  const currentPlayer = gameState.players?.[gameState.currentPlayer];
  const availablePieces = currentPlayer?.pieces || [];
  const nPieces = currentPlayer?.nPieces || 0;
  
  console.log('[GAME] render: gameStatus=', gameState.gameStatus, 'players length=', gameState.players?.length, 'gameStarted=', gameStarted, 'isUserTurn=', isUserTurn, 'resolvedRole=', resolvedRole);
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={APP_BG_GRADIENT} style={styles.background} pointerEvents="none" />
      {/* AI難易度選択モーダル（AIモード・開始前のみ） */}
      {String(params.mode) === 'ai' && !gameStarted && !aiStartConfirmed && (
        <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.aiModalOverlay}>
            <View style={styles.aiModalCard}>
              <Text style={styles.aiModalTitle}>AIの難易度を選択</Text>
              <View style={styles.aiOptionsRow}>
                {([
                  { k: 'beginner', label: '初心者' },
                  { k: 'advanced', label: '上級者' },
                  { k: 'oni', label: '鬼' }
                ] as const).map(opt => {
                  const active = aiLevel === opt.k;
                  return (
                    <TouchableOpacity
                      key={opt.k}
                      onPress={() => setAiLevel(opt.k as AiLevel)}
                      style={[styles.aiOption, active ? styles.aiOptionActive : null]}
                    >
                      <Text style={[styles.aiOptionText, active ? { fontWeight: '800' } : null]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.aiConfirm} onPress={() => setAiStartConfirmed(true)}>
                <Text style={styles.aiConfirmText}>対戦開始</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* コントロールボタン */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={20} color={LIQUID_GLASS_COLORS.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleRestart}>
          <RotateCcw size={20} color={LIQUID_GLASS_COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* ターンタイマー */}
      {gameState.gameStatus === 'playing' && (
        <View style={styles.timerWrap}>
          <View style={[styles.timerChip, turnLeft <= 10 ? styles.timerWarn : null]}>
            <Text style={styles.timerText}>
              {`${String(Math.floor(turnLeft / 60)).padStart(2, '0')}:${String(turnLeft % 60).padStart(2, '0')}`}
            </Text>
          </View>
        </View>
      )}
      
      {/* ゲーム領域 */}
      <View style={styles.gameAreaContent} pointerEvents="box-none">
        {/* AI難易度はモーダルで選択 */}
        {/* プレイヤー2のインベントリ */}
        {gameState.players?.[1] ? (
          <PlayerInventory
            playerId={1}
            pieces={gameState.players[1].pieces}
            nPieces={gameState.players[1].nPieces}
            playerName={gameState.players[1].name}
            isCurrentPlayer={gameState.currentPlayer === 1}
            isSelf={isSelfP1}
            pieceSize={32}
          />
        ) : (
          <View style={{ height: 50, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', opacity: 0.6 }}>プレイヤー2を待機中...</Text>
          </View>
        )}
        
        {/* オンライン: 役割未確定のときは警告バナー */}
        {String(params.mode) === 'online' && resolvedRole === 'unknown' && (
          <View style={{
            backgroundColor: 'rgba(255, 180, 0, 0.18)',
            borderColor: 'rgba(255,180,0,0.35)',
            borderWidth: 1,
            padding: 8,
            borderRadius: 10,
            marginBottom: 6,
            alignSelf: 'center'
          }}>
            <Text style={{ color: '#FFD277' }}>{t('matchmaking.waiting_for_opponent')}</Text>
          </View>
        )}

        {/* ゲーム盤 */}
        {(__DEV__ as any) && (
          <Text style={{ color: '#fff', opacity: 0.6, textAlign: 'center', marginBottom: 6 }}>
            {`turn=${gameState.currentPlayer} | isUserTurn=${String(isUserTurn)} | status=${gameState.gameStatus} | board=${String(!!gameState.board)}`}
          </Text>
        )}
        {gameState.board && gameState.board.length > 0 ? (
          <GameBoard
            key={`board-${forceRender}`} // 強制再レンダリング用
            board={gameState.board}
            onCellPress={handleCellPress}
            currentPlayer={gameState.currentPlayer}
            disabled={!isUserTurn}
          />
        ) : (
          <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16 }}>
            <Text style={{ color: '#fff', opacity: 0.6 }}>ゲームボードを読み込み中...</Text>
          </View>
        )}
        
        {/* プレイヤー1のインベントリ */}
        {gameState.players?.[0] ? (
          <PlayerInventory
            playerId={0}
            pieces={gameState.players[0].pieces}
            nPieces={gameState.players[0].nPieces}
            playerName={gameState.players[0].name}
            isCurrentPlayer={gameState.currentPlayer === 0}
            isSelf={isSelfP0}
            pieceSize={32}
          />
        ) : (
          <View style={{ height: 50, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', opacity: 0.6 }}>プレイヤー1を待機中...</Text>
          </View>
        )}
      </View>
      
      {/* コマ選択モーダル - 簡易テスト版 */}
      {showPieceSelector && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            minWidth: 200
          }}>
            <Text style={{ color: 'black', fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
              {t('game.select_piece')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {availablePieces.map(piece => (
                <TouchableOpacity key={piece} onPress={() => handlePieceSelect(piece)} style={{ margin: 6 }}>
                  <GamePiece value={piece} playerId={gameState.currentPlayer} size={40} />
                </TouchableOpacity>
              ))}
              {nPieces > 0 && (
                <TouchableOpacity onPress={() => handlePieceSelect('n')} style={{ margin: 6 }}>
                  <GamePiece value="n" playerId={gameState.currentPlayer} size={40} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#666',
                padding: 10,
                borderRadius: 5,
                marginTop: 15
              }}
              onPress={() => {
                console.log('[GAME] modal cancel');
                setShowPieceSelector(false);
                setSelectedCell(null);
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* デバッグ情報表示（無効化） */}

      <GameResultOverlay
        visible={showResult}
        winnerName={gameState.winner !== null && gameState.players?.[gameState.winner] ? gameState.players[gameState.winner].name : null}
        scores={gameState.scores}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  resetButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  timerWrap: {
    alignItems: 'center',
    marginTop: 6
  },
  timerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  timerWarn: {
    backgroundColor: 'rgba(255, 107, 107, 0.45)'
  },
  timerText: {
    color: '#fff',
    fontWeight: '700'
  },
  gameAreaContent: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-between'
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15, 41, 48, 0.97)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: LIQUID_GLASS_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12
  },
  aiOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  aiOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  aiOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.35)'
  },
  aiOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  aiConfirm: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral
  },
  aiConfirmText: {
    color: '#fff',
    fontWeight: '800'
  }
});