import type { GameState, Player, Role } from "./types";
import { ROLE_INFO, WOLF_ROLES } from "./constants";

/** 构建各角色的 System Prompt */
export function buildSystemPrompt(player: Player, state: GameState): string {
  const roleInfo = ROLE_INFO[player.role];
  let base = `你正在玩一局${state.players.length}人狼人杀游戏。你的名字是${player.name}，你的角色是${roleInfo.icon} ${roleInfo.name}。

## 角色技能
${roleInfo.desc}

## 胜利条件
${getWinCondition(player, state)}

## 角色配置
${state.players.map((p) => `- ${ROLE_INFO[p.role].icon} ×1`).filter((v, i, a) => a.indexOf(v) === i).join("\n")}

## 重要规则
- 游戏中始终使用中文发言
- 你只能根据自己角色能获得的信息来推理，不要使用上帝视角
- 狼人之间互相知道身份，好人之间不知道彼此身份
- 发言风格自然，像一个真人玩家
- **发言限制**：白天讨论时每人每轮只能说一次话，最多3句话，每句话不超过100字。不要说多余的话。
- 必须严格按照要求的JSON格式回复，不要输出其他内容
- 你的回复会被程序解析，所以JSON必须合法可解析`;

  // Lovers info
  for (const [a, b] of state.loverPairs) {
    if (a === player.id || b === player.id) {
      const partner = state.players.find((p) => p.id === (a === player.id ? b : a));
      if (partner) {
        base += `\n\n## 💘 情侣\n你是情侣之一！你的伴侣是 ${partner.name}（${ROLE_INFO[partner.role].name}）。你与伴侣互相知道身份。如果伴侣死亡，你也会殉情。${isMixedLoversCheck(state) ? "由于你们分属不同阵营，你们组成第三方——必须存活到最后两人才能获胜。" : ""}`;
      }
    }
  }

  return base;
}

function getWinCondition(player: Player, state: GameState): string {
  // Check if this player is in a mixed lover pair
  for (const [a, b] of state.loverPairs) {
    if ((a === player.id || b === player.id) && isMixedLoversCheck(state)) {
      return "第三方阵营（情侣）获胜条件：场上除你与伴侣外全部出局。";
    }
  }
  if ((WOLF_ROLES as Role[]).includes(player.role)) {
    return "狼人阵营获胜条件：存活狼人数 >= 存活好人数。";
  }
  return "好人阵营获胜条件：消灭所有狼人。";
}

function isMixedLoversCheck(state: GameState): boolean {
  for (const [a, b] of state.loverPairs) {
    const pa = state.players.find((p) => p.id === a);
    const pb = state.players.find((p) => p.id === b);
    if (pa && pb) {
      const aWolf = (WOLF_ROLES as Role[]).includes(pa.role);
      const bWolf = (WOLF_ROLES as Role[]).includes(pb.role);
      if (aWolf !== bWolf) return true;
    }
  }
  return false;
}

/** 夜晚阶段用户消息 */
export function buildNightPrompt(
  player: Player,
  state: GameState,
  werewolfPartners?: Player[]
): string {
  const summary = buildNightSummary(player, state, werewolfPartners);
  let task = "";

  switch (player.role) {
    case "werewolf":
    case "whiteWolfKing": {
      const allPartners = werewolfPartners || [];
      task = `现在是夜晚，你是${ROLE_INFO[player.role].name}。${
        allPartners.length > 0
          ? `你的狼人同伴：${allPartners.map((p) => `${p.name}(${ROLE_INFO[p.role].name})`).join("、")}。你们需要协商决定今晚击杀的目标。`
          : ""
      }
请选择一个击杀目标。选择非狼人阵营的存活玩家。优先级：预言家 > 女巫 > 守卫 > 活跃的村民。`;
      break;
    }
    case "wolfBeauty":
      task = `现在是夜晚，你是狼美人。${
        werewolfPartners && werewolfPartners.length > 0
          ? `你的狼人同伴：${werewolfPartners.map((p) => `${p.name}(${ROLE_INFO[p.role].name})`).join("、")}。`
          : ""
      }
请选择一名玩家进行魅惑。该玩家若与你同死则一起出局。建议选择你怀疑的好人特殊角色。`;
      break;
    case "seer":
      task = `现在是夜晚，你是预言家。请选择一名玩家查验身份。优先查验你怀疑的对象。`;
      break;
    case "witch":
      task = buildWitchTask(player, state);
      break;
    case "guard":
      task = `现在是夜晚，你是守卫。${
        state.nightActions[state.nightActions.length - 1]?.guardTarget
          ? `上一晚你守护了 ${
              state.players.find((p) => p.id === state.nightActions[state.nightActions.length - 1].guardTarget)?.name
            }，今晚不能重复守护。`
          : ""
      }
请选择一名玩家守护（不能被狼人击杀）。不能连续两晚守护同一人。优先守护预言家或女巫。`;
      break;
    case "cupid":
      task = `现在是首夜，你是丘比特。请选择两名玩家成为情侣。建议连不同阵营的玩家增加趣味性。
请指定 targetId 和 targetId2 为两名玩家ID。
（如果是首夜之后的夜晚，请回复 {"action": {"type": "none"}}）`;
      break;
    case "hunter":
    case "idiot":
    case "villager":
      task = `现在是夜晚，你是${ROLE_INFO[player.role].name}，没有特殊行动。请根据已有信息思考局势。`;
      break;
  }

  return `${summary}\n\n${task}\n\n【重要】必须只回复JSON，不要有任何其他文字。JSON格式：\n{"thinking": "你的内心推理过程", "speech": "夜晚不需要发言请留空", "action": {"type": "kill|check|antidote|poison|guard|charm|link|none", "targetId": "目标玩家ID（如有）", "targetId2": "第二名目标ID（仅丘比特需要）", "useAntidote": true/false, "usePoison": true/false, "poisonTargetId": "毒杀目标ID（如有）"}}`;
}

function buildWitchTask(player: Player, state: GameState): string {
  const lastNa = state.nightActions[state.nightActions.length - 1];
  return `现在是夜晚，你是女巫。${
    lastNa?.killTarget
      ? `今晚狼人选杀的目标是 ${
          state.players.find((p) => p.id === lastNa.killTarget)?.name
        }。`
      : ""
  }
你有${state.witchHasAntidote ? "1瓶解药可用" : "已用完解药"}，${state.witchHasPoison ? "1瓶毒药可用" : "已用完毒药"}。
请决定是否使用解药救人，以及是否使用毒药。`;
}

/** 猎人死亡时开枪提示 */
export function buildHunterShootPrompt(
  player: Player,
  state: GameState
): string {
  const alive = state.players
    .filter((p) => p.isAlive && p.id !== player.id)
    .map((p) => `${p.name}(id:${p.id})`)
    .join("、");

  return `你（${player.name}，猎人）出局了！你可以开枪带走一名玩家。
存活玩家：${alive}

请选择你要带走的玩家ID。如果不确定，选最像狼人的。

【重要】必须只回复JSON：
{"thinking": "我怀疑的狼人", "speech": "", "action": {"type": "shoot", "targetId": "目标玩家ID"}}`;
}

/** 警长竞选发言/投票 */
export function buildSheriffPrompt(
  player: Player,
  state: GameState,
  isVote = false
): string {
  const alive = state.players
    .filter((p) => p.isAlive && p.canVote && p.id !== player.id)
    .map((p) => `${p.name}(id:${p.id})`)
    .join("、");

  if (isVote) {
    return `现在是警长竞选投票阶段。请从以下候选人中选择一人投票（不能投自己）：
${alive}

【重要】必须只回复JSON：
{"thinking": "投票理由", "speech": "我投XX", "action": {"type": "vote", "voteTargetId": "目标ID"}}`;
  }

  return `现在是警长竞选发言阶段。请用一句话说明为什么你应该成为警长。
【重要】必须只回复JSON：
{"thinking": "竞选理由", "speech": "我竞选警长，因为..."}`;
}

/** 白天讨论阶段用户消息 */
export function buildDiscussPrompt(
  player: Player,
  state: GameState
): string {
  const summary = buildDaySummary(player, state);
  let specialAction = "";

  // White Wolf King can self-destruct during discussion
  if (player.role === "whiteWolfKing" && player.isAlive && !state.whiteWolfKingExploded) {
    specialAction = `\n\n【特殊】你是白狼王！你可以在此阶段选择<b>自爆</b>带走一名玩家。如果选择自爆，action.type 设为 "explode"，targetId 设为目标。自爆后你与目标一同出局，直接进入黑夜。`;
  }

  return `${summary}

现在是白天讨论阶段。轮到你了，你是${player.name}（${ROLE_INFO[player.role].name}），请发言。${specialAction}

**发言规则（严格遵守）：**
- 这是本轮讨论中你唯一的一次发言机会，之后不能再补充
- 最多说3句话，每句话不超过100字
- 不要说无关的废话，直接表达你的观点

发言策略：
- 分析昨晚死亡情况并表达你的怀疑
- 如果你是预言家且查到了狼人，公布身份和查验结果
- 如果你是狼人，假装村民发言但不要过于激进
${player.role === "whiteWolfKing" ? "- 作为白狼王，你可以选择在发言时自爆（action.type: \"explode\"），否则正常发言（action.type: \"none\" 或不含action字段）" : ""}

【重要】必须只回复JSON：
{"thinking": "你的内心真实推理", "speech": "你的公开发言（最多3句话，每句不超过100字）"${player.role === "whiteWolfKing" ? ', "action": {"type": "explode", "targetId": "目标ID"} // 仅当选择自爆时' : ""}}`;
}

/** 白天投票阶段用户消息 */
export function buildVotePrompt(
  player: Player,
  state: GameState
): string {
  const summary = buildDaySummary(player, state);
  const alive = state.players
    .filter((p) => p.isAlive && p.canVote && p.id !== player.id)
    .map((p) => `${p.name}(id:${p.id})${p.isSheriff ? "(警长)" : ""}`)
    .join("、");

  return `${summary}

现在是投票阶段。请从以下存活玩家中选择你要投票淘汰的人（不能投自己）：
${alive}

投票策略：
- 投给你认为最像狼人的玩家
- 如果你是狼人，投给对狼人威胁最小的好人

【重要】必须只回复JSON：
{"thinking": "投票理由", "speech": "我投XX", "action": {"type": "vote", "voteTargetId": "目标ID"}}`;
}

// ─── summary builders ───

function buildNightSummary(
  player: Player,
  state: GameState,
  werewolfPartners?: Player[]
): string {
  const lines: string[] = [];
  lines.push(`第${state.round}轮 - 夜晚阶段`);

  lines.push("\n存活玩家：");
  for (const p of state.players.filter((p) => p.isAlive)) {
    const self = p.id === player.id ? "（你）" : "";
    const partner = werewolfPartners?.some((wp) => wp.id === p.id) ? "（狼同伴）" : "";
    const lover = state.loverPairs.some(([a, b]) => (a === player.id && b === p.id) || (b === player.id && a === p.id)) ? "（情侣）" : "";
    const sheriff = p.isSheriff ? "（警长）" : "";
    lines.push(`- ${p.name}(id:${p.id})${self}${partner}${lover}${sheriff}`);
  }

  lines.push("\n已死亡玩家：");
  const dead = state.players.filter((p) => !p.isAlive);
  if (dead.length === 0) lines.push("- 暂无");
  else for (const p of dead) lines.push(`- ${p.name}（${ROLE_INFO[p.role].name}）`);

  if (isWolf(player.role)) {
    lines.push("\n提示：你已知狼同伴身份，你们需要统一击杀目标。");
  }

  if (state.nightActions.length > 0) {
    lines.push("\n往夜记录：");
    for (const na of state.nightActions) {
      const deadName = na.actualDeath
        ? state.players.find((p) => p.id === na.actualDeath)?.name
        : "平安夜";
      lines.push(`- 第${na.round}夜：${deadName}死亡`);
    }
  }

  return lines.join("\n");
}

function buildDaySummary(player: Player, state: GameState): string {
  const lines: string[] = [];
  lines.push(`第${state.round}轮 - 白天阶段`);

  const lastNight = state.nightActions[state.nightActions.length - 1];
  if (lastNight) {
    if (lastNight.actualDeath) {
      const dead = state.players.find((p) => p.id === lastNight.actualDeath);
      lines.push(`\n昨晚死亡：${dead?.name}（${ROLE_INFO[dead?.role || "villager"].name}）`);
    } else if (lastNight.poisonTarget) {
      const dead = state.players.find((p) => p.id === lastNight.poisonTarget);
      lines.push(`\n昨晚死亡：${dead?.name}（${ROLE_INFO[dead?.role || "villager"].name}）`);
    } else {
      lines.push("\n昨晚是平安夜，无人死亡。");
    }
  }

  lines.push("\n当前存活玩家：");
  for (const p of state.players.filter((p) => p.isAlive)) {
    const self = p.id === player.id ? "（你）" : "";
    const lover = state.loverPairs.some(([a, b]) => (a === player.id && b === p.id) || (b === player.id && a === p.id)) ? "（情侣）" : "";
    const sheriff = p.isSheriff ? "（警长）" : "";
    const cantVote = !p.canVote ? "（不能投票）" : "";
    lines.push(`- ${p.name}(id:${p.id})${self}${lover}${sheriff}${cantVote}`);
  }

  // wolf partners
  if (isWolf(player.role)) {
    const partners = state.players.filter(
      (p) => isWolf(p.role) && p.id !== player.id
    );
    lines.push(`\n狼同伴：${partners.map((p) => `${p.name}(${p.id})`).join("、")}`);
  }

  // lover partner
  for (const [a, b] of state.loverPairs) {
    if (a === player.id || b === player.id) {
      const partner = state.players.find((p) => p.id === (a === player.id ? b : a));
      if (partner) lines.push(`\n你的情侣：${partner.name}（${ROLE_INFO[partner.role].name}）`);
    }
  }

  // previous vote
  if (state.votes.length > 0) {
    lines.push("\n上一轮投票结果：");
    const voteMap = new Map<string, string[]>();
    for (const v of state.votes) {
      const voter = state.players.find((p) => p.id === v.voterId);
      const target = state.players.find((p) => p.id === v.targetId);
      const key = target?.name || v.targetId;
      if (!voteMap.has(key)) voteMap.set(key, []);
      voteMap.get(key)!.push(voter?.name || v.voterId);
    }
    for (const [target, voters] of voteMap) {
      lines.push(`- ${target}：${voters.join("、")}（${voters.length}票）`);
    }
  }

  // recent chat
  if (state.chatMessages.length > 0) {
    lines.push("\n本轮发言：");
    const thisRound = state.chatMessages.filter((m) => m.round === state.round);
    for (const msg of thisRound) {
      lines.push(`- ${msg.speakerName}: ${msg.text}`);
    }
  }

  return lines.join("\n");
}

function isWolf(role: Role): boolean {
  return (WOLF_ROLES as Role[]).includes(role);
}
