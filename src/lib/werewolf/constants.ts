import type { Role } from "./types";

export const ROLE_INFO: Record<Role, { name: string; icon: string; desc: string; team: "werewolves" | "villagers" }> = {
  werewolf: {
    name: "狼人", icon: "🐺",
    desc: "每晚可以击杀一名玩家。白天伪装成村民，混淆视听。",
    team: "werewolves",
  },
  whiteWolfKing: {
    name: "白狼王", icon: "⚡",
    desc: "属于狼人阵营。白天讨论阶段可以自爆带走一名玩家，自爆后立即进入黑夜。",
    team: "werewolves",
  },
  wolfBeauty: {
    name: "狼美人", icon: "🌹",
    desc: "属于狼人阵营。每晚可魅惑一名玩家，若自己死亡则被魅惑者一同出局。",
    team: "werewolves",
  },
  seer: {
    name: "预言家", icon: "🔮",
    desc: "每晚可以查验一名玩家的身份。知道真相，但要谨慎暴露。",
    team: "villagers",
  },
  witch: {
    name: "女巫", icon: "🧙",
    desc: "拥有一瓶解药和一瓶毒药。解药可救活夜晚被杀的玩家，毒药可毒杀任意玩家。",
    team: "villagers",
  },
  hunter: {
    name: "猎人", icon: "🏹",
    desc: "出局时可以开枪带走一名玩家（被毒杀则不能开枪）。",
    team: "villagers",
  },
  guard: {
    name: "守卫", icon: "🛡️",
    desc: "每晚可以守护一名玩家（不能连续两晚守护同一人）。若被守护者同时被女巫救，则该玩家死亡。",
    team: "villagers",
  },
  cupid: {
    name: "丘比特", icon: "💘",
    desc: "首夜选择两名玩家成为情侣。情侣中一人死亡则另一人也殉情。若情侣为好人+狼人则组成第三方阵营。",
    team: "villagers",
  },
  idiot: {
    name: "白痴", icon: "🤪",
    desc: "被投票出局时亮明身份可免死，但此后不能投票。",
    team: "villagers",
  },
  villager: {
    name: "村民", icon: "👤",
    desc: "没有特殊技能，通过分析发言和投票找出狼人。",
    team: "villagers",
  },
};

// 玩家默认名称（16个）
export const PLAYER_NAMES = [
  "小沫", "阿杰", "思思", "大鹏", "琳琳", "老陈",
  "小北", "七爷", "糖果", "老王", "米粒", "阿豪",
  "小雨", "大飞", "丸子", "凯哥",
];

// 阶段中文描述
export const PHASE_LABELS: Record<string, string> = {
  SETUP: "准备中",
  NIGHT: "夜晚",
  DAY_ANNOUNCE: "天亮",
  SHERIFF_VOTE: "选警长",
  SHERIFF_RESULT: "警长结果",
  DAY_DISCUSS: "讨论",
  DAY_VOTE: "投票",
  VOTE_RESULT: "结果",
  GAME_OVER: "结束",
};

// 狼人阵营角色
export const WOLF_ROLES: Role[] = ["werewolf", "whiteWolfKing", "wolfBeauty"];

// 好人阵营角色（非狼非村民）
export const SPECIAL_GOOD_ROLES: Role[] = ["seer", "witch", "hunter", "guard", "cupid", "idiot"];

/** 根据人数智能分配角色 */
export function generateRoleDistribution(playerCount: number): Role[] {
  // 狼人阵营约占 1/3，最少2
  const targetWolves = Math.max(2, Math.floor(playerCount / 3));
  let wwk = 0, wb = 0, ordinary = 0;

  if (playerCount >= 9) wwk = 1;
  if (playerCount >= 12) wb = 1;
  ordinary = Math.min(3, targetWolves - wwk - wb);
  // 确保狼队至少2人
  if (ordinary + wwk + wb < 2) ordinary = 2 - wwk - wb;

  const wolfCount = ordinary + wwk + wb;

  // 好人特殊角色
  const seer = 1;
  const witch = 1;
  const hunter = playerCount >= 7 ? 1 : 0;
  const guard = playerCount >= 8 ? 1 : 0;
  const cupid = playerCount >= 9 ? 1 : 0;
  const idiot = playerCount >= 10 ? 1 : 0;

  const specialGood = seer + witch + hunter + guard + cupid + idiot;
  const villagers = Math.min(5, playerCount - wolfCount - specialGood);

  const roles: Role[] = [];
  for (let i = 0; i < ordinary; i++) roles.push("werewolf");
  for (let i = 0; i < wwk; i++) roles.push("whiteWolfKing");
  for (let i = 0; i < wb; i++) roles.push("wolfBeauty");
  for (let i = 0; i < seer; i++) roles.push("seer");
  for (let i = 0; i < witch; i++) roles.push("witch");
  for (let i = 0; i < hunter; i++) roles.push("hunter");
  for (let i = 0; i < guard; i++) roles.push("guard");
  for (let i = 0; i < cupid; i++) roles.push("cupid");
  for (let i = 0; i < idiot; i++) roles.push("idiot");
  for (let i = 0; i < villagers; i++) roles.push("villager");

  return roles;
}
