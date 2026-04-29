import type { Role, Player, GameState, AIResponse } from "./types";
import { PLAYER_NAMES, generateRoleDistribution, WOLF_ROLES } from "./constants";

/** Fisher-Yates 洗牌 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 创建初始玩家列表 */
export function createPlayers(humanMode: boolean, playerCount = 6): Player[] {
  const roles = shuffle(generateRoleDistribution(playerCount));
  const names = shuffle([...PLAYER_NAMES]).slice(0, playerCount);
  return names.map((name, i) => ({
    id: `p${i}`,
    name,
    role: roles[i],
    isHuman: humanMode && i === 0,
    isAlive: true,
    canVote: true,
    isSheriff: false,
  }));
}

/** 获取存活玩家 */
export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive);
}

/** 是否为狼人阵营 */
export function isWolfRole(role: Role): boolean {
  return (WOLF_ROLES as Role[]).includes(role);
}

/** 获取存活的狼人阵营玩家 */
export function aliveWolves(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive && isWolfRole(p.role));
}

/** 获取存活的好人（非狼人） */
export function aliveVillagers(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive && !isWolfRole(p.role));
}

/** 检查情侣是否为第三方阵营（一好一狼） */
export function isMixedLovers(state: GameState): boolean {
  for (const [a, b] of state.loverPairs) {
    const pa = state.players.find((p) => p.id === a);
    const pb = state.players.find((p) => p.id === b);
    if (pa && pb) {
      const aWolf = isWolfRole(pa.role);
      const bWolf = isWolfRole(pb.role);
      if (aWolf !== bWolf) return true;
    }
  }
  return false;
}

/** 检查情侣是否存活 */
function loversAlive(state: GameState): boolean {
  for (const [a, b] of state.loverPairs) {
    const pa = state.players.find((p) => p.id === a);
    const pb = state.players.find((p) => p.id === b);
    if (pa?.isAlive && pb?.isAlive) return true;
  }
  return false;
}

/** 检查胜负条件 */
export function checkWinCondition(state: GameState): "werewolves" | "villagers" | "lovers" | null {
  const wolves = aliveWolves(state).length;
  const vills = aliveVillagers(state).length;

  // 情侣第三方获胜：仅剩情侣两人存活（一好一狼）
  if (state.loverPairs.length > 0 && isMixedLovers(state)) {
    const totalAlive = wolves + vills;
    if (totalAlive <= 2 && loversAlive(state)) {
      return "lovers";
    }
  }

  if (wolves === 0) return "villagers";
  if (wolves >= vills) return "werewolves";
  return null;
}

/** 获取角色的所属阵营（用于结算展示） */
export function getTeam(role: Role): "werewolves" | "villagers" {
  return isWolfRole(role) ? "werewolves" : "villagers";
}

/** 调用 AI API */
export async function callAI(
  system: string,
  userMessage: string
): Promise<AIResponse> {
  const res = await fetch("/api/werewolf/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      messages: [{ role: "user" as const, content: userMessage }],
    }),
  });
  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`);
  }
  return res.json();
}
