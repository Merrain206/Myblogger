// 角色
export type Role =
  | "werewolf"
  | "whiteWolfKing"
  | "wolfBeauty"
  | "seer"
  | "witch"
  | "hunter"
  | "guard"
  | "cupid"
  | "idiot"
  | "villager";

// 游戏阶段
export type GamePhase =
  | "SETUP"
  | "NIGHT"
  | "DAY_ANNOUNCE"
  | "SHERIFF_VOTE"
  | "SHERIFF_RESULT"
  | "DAY_DISCUSS"
  | "DAY_VOTE"
  | "VOTE_RESULT"
  | "GAME_OVER";

// 游戏模式
export type GameMode = "human" | "god";

// 玩家
export interface Player {
  id: string;
  name: string;
  role: Role;
  isHuman: boolean;
  isAlive: boolean;
  canVote: boolean;       // 白痴揭示后不能投票
  isSheriff: boolean;      // 警长
}

// 夜晚行动记录
export interface NightAction {
  round: number;
  killTarget: string | null;
  seerCheckTarget: string | null;
  seerCheckResult: Role | null;
  antidoteUsed: boolean;
  poisonTarget: string | null;
  actualDeath: string | null;
  guardTarget: string | null;
  wolfBeautyCharmTarget: string | null;
  cupidLink1: string | null;
  cupidLink2: string | null;
}

// 对话消息
export interface ChatMessage {
  speakerId: string;
  speakerName: string;
  text: string;
  thinking?: string;
  round: number;
  phase: "discuss" | "vote" | "night" | "sheriff";
}

// 投票
export interface Vote {
  voterId: string;
  targetId: string;
}

// 游戏状态
export interface GameState {
  phase: GamePhase;
  round: number;
  players: Player[];
  nightActions: NightAction[];
  chatMessages: ChatMessage[];
  votes: Vote[];
  winner: "werewolves" | "villagers" | "lovers" | null;
  witchHasAntidote: boolean;
  witchHasPoison: boolean;
  countdownSeconds: number;
  cupidActed: boolean;                // 丘比特是否已连人
  whiteWolfKingExploded: boolean;     // 白狼王是否已自爆
  loverPairs: [string, string][];     // 情侣对
  pendingHunterId: string | null;     // 猎人死亡待开枪
  roundNeedSheriff: boolean;          // 本轮是否需要选警长
  expectedHumanAction: string | null; // 引擎等待的玩家操作类型
}

// AI 请求
export interface AIRequest {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

// AI 响应
export interface AIResponse {
  thinking: string;
  speech: string;
  action: AIDecision | null;
}

// AI 决策
export interface AIDecision {
  type: "kill" | "check" | "antidote" | "poison" | "vote" | "discuss" | "none"
    | "guard" | "charm" | "link" | "shoot" | "explode";
  targetId?: string;
  targetId2?: string;       // 丘比特连第二人
  useAntidote?: boolean;
  usePoison?: boolean;
  poisonTargetId?: string;
  voteTargetId?: string;
}
