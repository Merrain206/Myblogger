import type {
  GameState, GameMode, Player, ChatMessage, Vote,
  NightAction, AIResponse, Role,
} from "./types";
import {
  createPlayers, alivePlayers, aliveVillagers, aliveWolves,
  checkWinCondition, callAI, isWolfRole, isMixedLovers,
} from "./utils";
import { ROLE_INFO, WOLF_ROLES } from "./constants";
import {
  buildSystemPrompt, buildNightPrompt, buildDiscussPrompt,
  buildVotePrompt, buildSheriffPrompt, buildHunterShootPrompt,
} from "./prompts";

type StateListener = (state: GameState) => void;
type ThinkingListener = (playerId: string, text: string) => void;

const DISCUSS_TIMEOUT = 60;
const VOTE_TIMEOUT = 15;
const SHERIFF_TIMEOUT = 20;

export class GameEngine {
  private state: GameState;
  private mode: GameMode;
  private onStateChange: StateListener | null = null;
  private onThinking: ThinkingListener | null = null;
  private humanResolve: ((value: unknown) => void) | null = null;
  private aborted = false;
  private processing = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private deadline = 0;
  private playerCount: number;

  constructor(mode: GameMode, playerCount = 6) {
    this.mode = mode;
    this.playerCount = playerCount;
    const players = createPlayers(mode === "human", playerCount);
    this.state = {
      phase: "SETUP", round: 0, players,
      nightActions: [], chatMessages: [], votes: [],
      winner: null, witchHasAntidote: true, witchHasPoison: true,
      countdownSeconds: -1, cupidActed: false,
      whiteWolfKingExploded: false, loverPairs: [],
      pendingHunterId: null,
      roundNeedSheriff: playerCount > 8,
      expectedHumanAction: null,
    };
  }

  subscribe(onChange: StateListener, onThink: ThinkingListener) {
    this.onStateChange = onChange;
    this.onThinking = onThink;
  }

  getState(): GameState { return this.state; }
  getHumanPlayer(): Player | undefined { return this.state.players.find((p) => p.isHuman); }
  getMode(): GameMode { return this.mode; }

  abort() {
    this.aborted = true;
    this.stopCountdown();
    if (this.humanResolve) { this.humanResolve(null); this.humanResolve = null; }
  }

  // ── countdown ──

  private startCountdown(seconds: number) {
    if (this.mode !== "human") return;
    this.stopCountdown();
    this.deadline = Date.now() + seconds * 1000;
    this.state.countdownSeconds = seconds;
    this.emit();
    this.tickTimer = setInterval(() => {
      const remain = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
      this.state.countdownSeconds = remain;
      this.emit();
      if (remain <= 0) this.stopCountdown();
    }, 500);
  }

  private stopCountdown() {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    this.state.countdownSeconds = -1;
  }

  private isTimeout(): boolean { return Date.now() >= this.deadline; }

  // ── human input ──

  async submitHumanAction(action: {
    type?: string; targetId?: string; targetId2?: string;
    useAntidote?: boolean; usePoison?: boolean; poisonTargetId?: string;
    voteTargetId?: string; humanText?: string; explode?: boolean;
  }): Promise<void> {
    if (action.humanText && this.humanResolve === null) {
      const human = this.getHumanPlayer();
      if (human) {
        this.state.chatMessages.push({
          speakerId: human.id, speakerName: human.name,
          text: action.humanText, round: this.state.round, phase: "discuss",
        });
        this.emit();
      }
      return;
    }
    if (this.humanResolve) {
      this.humanResolve(action);
      this.humanResolve = null;
    }
  }

  // ── main loop ──

  async advance(): Promise<void> {
    if (this.aborted || this.state.winner || this.processing) return;
    this.processing = true;
    try {
      const phase = this.state.phase;
      switch (phase) {
        case "SETUP": await this.doSetup(); break;
        case "NIGHT": await this.doNight(); break;
        case "DAY_ANNOUNCE": this.doDayAnnounce(); break;
        case "SHERIFF_VOTE": await this.doSheriffVote(); break;
        case "SHERIFF_RESULT": this.doSheriffResult(); break;
        case "DAY_DISCUSS": await this.doDayDiscuss(); break;
        case "DAY_VOTE": await this.doDayVote(); break;
        case "VOTE_RESULT": this.doVoteResult(); break;
        case "GAME_OVER": break;
      }
    } finally {
      this.processing = false;
    }
  }

  /** God-mode: run until game over */
  async autoPlay(onTick?: () => void): Promise<void> {
    while (!this.aborted && (this.state.phase as string) !== "GAME_OVER") {
      await this.advance();
      if (this.aborted) break;
      if ((this.state.phase as string) !== "GAME_OVER") {
        await this.delay(1800);
      }
    }
  }

  // ============ phase handlers ============

  private async doSetup() {
    // round 0: cupid links, seer checks, guard/wb act, but no wolf kill
    this.state.phase = "NIGHT";
    this.emit();
  }

  private async doNight() {
    const round = this.state.round;
    const na: NightAction = {
      round, killTarget: null, seerCheckTarget: null, seerCheckResult: null,
      antidoteUsed: false, poisonTarget: null, actualDeath: null,
      guardTarget: null, wolfBeautyCharmTarget: null,
      cupidLink1: null, cupidLink2: null,
    };
    const hm = this.mode === "human";

    // 0. cupid (night 0 only)
    if (round === 0 && !this.state.cupidActed) {
      const cupid = this.state.players.find((p) => p.isAlive && p.role === "cupid");
      if (cupid) {
        if (hm && cupid.isHuman) {
          this.state.expectedHumanAction = "cupid"; this.emit();
          const a = await this.waitForHuman();
          this.state.expectedHumanAction = null;
          if (this.aborted) return;
          const x = a as any;
          na.cupidLink1 = x?.targetId || null;
          na.cupidLink2 = x?.targetId2 || null;
        } else {
          const resp = await this.askAI(cupid, buildNightPrompt(cupid, this.state));
          na.cupidLink1 = resp.action?.targetId || null;
          na.cupidLink2 = resp.action?.targetId2 || null;
        }
        if (na.cupidLink1 && na.cupidLink2 && na.cupidLink1 !== na.cupidLink2) {
          this.state.loverPairs.push([na.cupidLink1, na.cupidLink2]);
        }
        this.state.cupidActed = true;
        this.emit();
      }
    }

    // 1. guard
    const guard = this.state.players.find((p) => p.isAlive && p.role === "guard");
    if (guard) {
      const lastGuard = this.state.nightActions[this.state.nightActions.length - 1]?.guardTarget;
      if (hm && guard.isHuman) {
        this.state.expectedHumanAction = "guard"; this.emit();
        const a = await this.waitForHuman();
        this.state.expectedHumanAction = null;
        if (this.aborted) return;
        na.guardTarget = (a as any)?.targetId || null;
      } else {
        const ts = { ...this.state, nightActions: [...this.state.nightActions, { ...na }] };
        const resp = await this.askAI(guard, buildNightPrompt(guard, ts));
        na.guardTarget = resp.action?.targetId || null;
      }
      // Can't guard same person two nights in a row
      if (na.guardTarget && na.guardTarget === lastGuard) na.guardTarget = null;
    }

    // 2. wolf beauty charm
    const wb = this.state.players.find((p) => p.isAlive && p.role === "wolfBeauty");
    if (wb) {
      if (hm && wb.isHuman) {
        this.state.expectedHumanAction = "wbCharm"; this.emit();
        const a = await this.waitForHuman();
        this.state.expectedHumanAction = null;
        if (this.aborted) return;
        na.wolfBeautyCharmTarget = (a as any)?.targetId || null;
      } else {
        const ts = { ...this.state, nightActions: [...this.state.nightActions, { ...na }] };
        const resp = await this.askAI(wb, buildNightPrompt(wb, ts));
        na.wolfBeautyCharmTarget = resp.action?.targetId || null;
      }
    }

    // 3. wolf kill (skip night 0)
    if (round > 0) {
      const wolves = this.state.players.filter((p) => p.isAlive && isWolfRole(p.role));
      if (wolves.length > 0) {
        if (hm && wolves.some((w) => w.isHuman)) {
          this.state.expectedHumanAction = "wolfKill"; this.emit();
          const a = await this.waitForHuman();
          this.state.expectedHumanAction = null;
          if (this.aborted) return;
          na.killTarget = (a as any)?.targetId || null;
        } else {
          const otherWolves = wolves.filter((w) => w.id !== wolves[0].id);
          const resp = await this.askAI(wolves[0], buildNightPrompt(wolves[0], this.state, otherWolves));
          na.killTarget = resp.action?.targetId || null;
        }
      }
    }

    // 4. seer
    const seer = this.state.players.find((p) => p.isAlive && p.role === "seer");
    if (seer) {
      if (hm && seer.isHuman) {
        this.state.expectedHumanAction = "seer"; this.emit();
        const a = await this.waitForHuman();
        this.state.expectedHumanAction = null;
        if (this.aborted) return;
        na.seerCheckTarget = (a as any)?.targetId || null;
      } else {
        const ts = { ...this.state, nightActions: [...this.state.nightActions, { ...na }] };
        const resp = await this.askAI(seer, buildNightPrompt(seer, ts));
        na.seerCheckTarget = resp.action?.targetId || null;
      }
      if (na.seerCheckTarget) {
        const t = this.state.players.find((p) => p.id === na.seerCheckTarget);
        na.seerCheckResult = t?.role || null;
      }
    }

    // 5. witch
    const witch = this.state.players.find((p) => p.isAlive && p.role === "witch");
    if (witch && round > 0 && (this.state.witchHasAntidote || this.state.witchHasPoison)) {
      if (hm && witch.isHuman) {
        this.state.expectedHumanAction = "witch"; this.emit();
        const a = await this.waitForHuman();
        this.state.expectedHumanAction = null;
        if (this.aborted) return;
        const x = a as any;
        na.antidoteUsed = x?.useAntidote || false;
        na.poisonTarget = x?.usePoison ? x?.poisonTargetId : null;
      } else {
        const ts = { ...this.state, nightActions: [...this.state.nightActions, { ...na }] };
        const resp = await this.askAI(witch, buildNightPrompt(witch, ts));
        na.antidoteUsed = resp.action?.useAntidote || false;
        if (resp.action?.usePoison && resp.action?.poisonTargetId) na.poisonTarget = resp.action.poisonTargetId;
      }
      if (na.antidoteUsed) this.state.witchHasAntidote = false;
      if (na.poisonTarget) this.state.witchHasPoison = false;
    }

    // 6. resolve night deaths
    na.actualDeath = na.antidoteUsed ? null : na.killTarget;
    // guard + antidote conflict: if both protect same target, target dies
    if (na.guardTarget && na.antidoteUsed && na.guardTarget === na.killTarget) {
      na.actualDeath = na.killTarget;
    }
    // guard alone saves
    if (na.guardTarget && na.guardTarget === na.killTarget && !na.antidoteUsed) {
      na.actualDeath = null;
    }

    // Apply deaths
    if (na.actualDeath) {
      const d = this.state.players.find((p) => p.id === na.actualDeath);
      if (d) d.isAlive = false;
    }
    if (na.poisonTarget && na.poisonTarget !== na.actualDeath) {
      const d = this.state.players.find((p) => p.id === na.poisonTarget);
      if (d) d.isAlive = false;
    }

    this.state.nightActions.push(na);

    // 7. Death chain: hunter, lovers, wolf beauty
    await this.resolveDeathChain([na.actualDeath, na.poisonTarget].filter(Boolean) as string[]);

    this.state.phase = "DAY_ANNOUNCE";
    this.stopCountdown();
    this.emit();
    const w = checkWinCondition(this.state);
    if (w) { this.state.winner = w; this.state.phase = "GAME_OVER"; this.emit(); }
  }

  /** Resolve cascading deaths from hunter shoots, lovers, wolf beauty */
  private async resolveDeathChain(deathIds: string[]) {
    const processed = new Set<string>();
    const queue = [...deathIds];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (processed.has(id)) continue;
      processed.add(id);
      const player = this.state.players.find((p) => p.id === id);
      if (!player || player.isAlive) continue; // already alive (idiot, etc.)

      // Hunter shoots
      if (player.role === "hunter") {
        // Hunter can't shoot if poisoned (check last night action)
        const lastNa = this.state.nightActions[this.state.nightActions.length - 1];
        const wasPoisoned = lastNa?.poisonTarget === id;
        if (!wasPoisoned) {
          const target = await this.resolveHunterShoot(player);
          if (target) {
            const t = this.state.players.find((p) => p.id === target);
            if (t) { t.isAlive = false; queue.push(target); }
          }
        }
      }

      // Wolf Beauty: charmed player dies
      for (const na of this.state.nightActions) {
        if (na.wolfBeautyCharmTarget && this.state.players.find((p) => p.id === na.wolfBeautyCharmTarget)?.role === "wolfBeauty") {
          // The WB died, their charmed target dies
          // Find the WB's charm target from this round or last
        }
      }
      // Check if this dead player was the wolf beauty → charmed player dies
      if (player.role === "wolfBeauty") {
        for (const na of this.state.nightActions) {
          if (na.wolfBeautyCharmTarget && !processed.has(na.wolfBeautyCharmTarget)) {
            // Find the charm target for the round when this WB charmed
            // For simplicity, use the last night action's charm target
            const lastNa = this.state.nightActions[this.state.nightActions.length - 1];
            if (lastNa?.wolfBeautyCharmTarget) {
              const charmed = this.state.players.find((p) => p.id === lastNa.wolfBeautyCharmTarget);
              if (charmed && charmed.isAlive) {
                charmed.isAlive = false;
                queue.push(charmed.id);
              }
            }
          }
        }
      }

      // Lovers: partner dies
      for (const [a, b] of this.state.loverPairs) {
        if ((a === id || b === id) && !processed.has(a === id ? b : a)) {
          const partner = this.state.players.find((p) => p.id === (a === id ? b : a));
          if (partner && partner.isAlive) {
            partner.isAlive = false;
            queue.push(partner.id);
          }
        }
      }
    }
  }

  private async resolveHunterShoot(hunter: Player): Promise<string | null> {
    const hm = this.mode === "human";
    if (hm && hunter.isHuman) {
      this.state.pendingHunterId = hunter.id;
      this.state.expectedHumanAction = "hunter"; this.emit();
      const a = await this.waitForHuman();
      this.state.expectedHumanAction = null;
      this.state.pendingHunterId = null;
      if (this.aborted) return null;
      return (a as any)?.targetId || null;
    } else {
      const alive = alivePlayers(this.state).filter((p) => p.id !== hunter.id);
      if (alive.length === 0) return null;
      const resp = await this.askAI(hunter, buildHunterShootPrompt(hunter, this.state));
      const tid = resp.action?.targetId;
      return tid && alive.find((p) => p.id === tid) ? tid : alive[0].id;
    }
  }

  private doDayAnnounce() {
    this.state.phase = this.state.roundNeedSheriff ? "SHERIFF_VOTE" : "DAY_DISCUSS";
    this.state.votes = [];
    this.emit();
    const w = checkWinCondition(this.state);
    if (w) { this.state.winner = w; this.state.phase = "GAME_OVER"; this.emit(); }
  }

  // ── sheriff election ──

  private async doSheriffVote() {
    if (!this.state.roundNeedSheriff) {
      this.state.phase = "DAY_DISCUSS";
      this.emit();
      return;
    }
    const alive = alivePlayers(this.state);
    const candidates = alive.filter((p) => p.canVote);
    if (candidates.length <= 1) {
      if (candidates.length === 1) candidates[0].isSheriff = true;
      this.state.phase = "SHERIFF_RESULT";
      this.emit();
      return;
    }

    this.startCountdown(SHERIFF_TIMEOUT);

    // AI candidates briefly state why they should be sheriff
    for (const player of alive) {
      if (this.aborted || this.isTimeout()) break;
      if (player.isHuman) continue;
      if (!player.canVote) continue;
      const resp = await this.askAI(player, buildSheriffPrompt(player, this.state));
      this.state.chatMessages.push({
        speakerId: player.id, speakerName: player.name,
        text: resp.speech || "我竞选警长。", thinking: resp.thinking,
        round: this.state.round, phase: "sheriff",
      });
      this.emit();
      if (!this.isTimeout()) await this.delay(300);
    }

    // AI votes for sheriff
    for (const player of alive) {
      if (this.aborted) return;
      if (!player.canVote) continue;
      if (player.isHuman) continue;
      const resp = await this.askAI(player, buildSheriffPrompt(player, this.state, true));
      const vid = resp.action?.voteTargetId;
      const vt = alive.find((p) => p.id === vid && p.id !== player.id && p.canVote);
      this.state.votes.push({ voterId: player.id, targetId: vt ? vt.id : alive.find((p) => p.id !== player.id && p.canVote)!.id });
      this.emit();
      await this.delay(150);
    }

    // Human vote
    const human = this.getHumanPlayer();
    if (human?.isAlive && this.mode === "human" && human.canVote) {
      this.state.expectedHumanAction = "sheriff"; this.emit();
      const remain = Math.max(1, Math.ceil((this.deadline - Date.now()) / 1000));
      const action = await this.waitForHumanWithTimeout(remain);
      this.state.expectedHumanAction = null;
      if (this.aborted) return;
      const vid = (action as any)?.voteTargetId;
      if (vid) this.state.votes.push({ voterId: human.id, targetId: vid });
    }

    this.stopCountdown();
    this.state.phase = "SHERIFF_RESULT";
    this.emit();
  }

  private doSheriffResult() {
    const tally = new Map<string, number>();
    for (const v of this.state.votes) {
      tally.set(v.targetId, (tally.get(v.targetId) || 0) + 1);
    }
    let maxVotes = 0;
    let sheriff: string | null = null;
    for (const [id, count] of tally) {
      if (count > maxVotes) { maxVotes = count; sheriff = id; }
    }
    const tie = [...tally.values()].filter((c) => c === maxVotes).length > 1;
    if (sheriff && !tie) {
      const p = this.state.players.find((p) => p.id === sheriff);
      if (p) p.isSheriff = true;
    }
    this.state.roundNeedSheriff = false;
    this.state.votes = [];
    this.state.phase = "DAY_DISCUSS";
    this.emit();
    const w = checkWinCondition(this.state);
    if (w) { this.state.winner = w; this.state.phase = "GAME_OVER"; this.emit(); }
  }

  // ── day discussion ──

  private async doDayDiscuss() {
    const alive = alivePlayers(this.state).filter((p) => p.canVote || p.isAlive); // idiot can speak but not vote
    this.startCountdown(DISCUSS_TIMEOUT);

    for (const player of alive) {
      if (this.aborted || this.isTimeout()) break;
      if (player.isHuman) continue;
      const resp = await this.askAI(player, buildDiscussPrompt(player, this.state));
      if (this.isTimeout()) break;
      this.state.chatMessages.push({
        speakerId: player.id, speakerName: player.name,
        text: resp.speech || "...", thinking: resp.thinking,
        round: this.state.round, phase: "discuss",
      });
      this.emit();
      if (!this.isTimeout()) await this.delay(400);
    }

    this.stopCountdown();
    this.state.phase = "DAY_VOTE";
    this.emit();
  }

  // ── day vote ──

  private async doDayVote() {
    const alive = alivePlayers(this.state).filter((p) => p.canVote);
    const human = this.getHumanPlayer();
    const thisRound = this.state.round;
    const hm = this.mode === "human";

    this.startCountdown(VOTE_TIMEOUT);

    // AI votes
    for (const player of alive) {
      if (this.aborted) return;
      if (player.isHuman) continue;
      const resp = await this.askAI(player, buildVotePrompt(player, this.state));
      const vid = resp.action?.voteTargetId;
      const vt = alive.find((p) => p.id === vid && p.id !== player.id);
      this.state.votes.push({
        voterId: player.id,
        targetId: vt ? vt.id : alive.find((p) => p.id !== player.id)!.id,
      });
      if (resp.speech) {
        this.state.chatMessages.push({
          speakerId: player.id, speakerName: player.name,
          text: resp.speech, thinking: resp.thinking,
          round: thisRound, phase: "vote",
        });
      }
      this.emit();
      await this.delay(250);
    }

    // Human vote
    if (human?.isAlive && hm && human.canVote) {
      this.state.expectedHumanAction = "vote"; this.emit();
      const remain = Math.max(1, Math.ceil((this.deadline - Date.now()) / 1000));
      const action = await this.waitForHumanWithTimeout(remain);
      this.state.expectedHumanAction = null;
      if (this.aborted) return;
      const vid = (action as any)?.voteTargetId;
      if (vid) this.state.votes.push({ voterId: human.id, targetId: vid });
    }

    this.stopCountdown();
    this.state.phase = "VOTE_RESULT";
    this.emit();
  }

  private async doVoteResult() {
    const alive = alivePlayers(this.state);
    const tally = new Map<string, number>();
    for (const v of this.state.votes) {
      const weight = this.state.players.find((p) => p.id === v.voterId)?.isSheriff ? 2 : 1;
      tally.set(v.targetId, (tally.get(v.targetId) || 0) + weight);
    }
    let maxVotes = 0;
    let eliminated: string | null = null;
    for (const [id, count] of tally) { if (count > maxVotes) { maxVotes = count; eliminated = id; } }
    const tie = [...tally.values()].filter((c) => c === maxVotes).length > 1;

    if (eliminated && !tie) {
      const dead = this.state.players.find((p) => p.id === eliminated);
      if (dead) {
        // Idiot: reveal and survive
        if (dead.role === "idiot") {
          dead.canVote = false;
        } else {
          dead.isAlive = false;
          // Sheriff dies: pass badge or re-elect
          if (dead.isSheriff) {
            dead.isSheriff = false;
            this.state.roundNeedSheriff = true;
          }
        }
      }
    }

    // Death chain for the eliminated
    if (eliminated && !tie) {
      const dead = this.state.players.find((p) => p.id === eliminated);
      if (dead && !dead.isAlive) {
        await this.resolveDeathChain([eliminated]);
      }
    }

    this.state.round++;
    this.state.phase = "NIGHT";
    this.emit();
    const w = checkWinCondition(this.state);
    if (w) { this.state.winner = w; this.state.phase = "GAME_OVER"; this.emit(); }
  }

  // ============ helpers ============

  private async askAI(player: Player, userMessage: string): Promise<AIResponse> {
    const system = buildSystemPrompt(player, this.state);
    if (this.onThinking) this.onThinking(player.id, `${player.name} thinking...`);
    try {
      const resp = await callAI(system, userMessage);
      if (this.onThinking && resp.thinking) this.onThinking(player.id, resp.thinking);
      return resp;
    } catch (err) {
      console.error(`AI call failed for ${player.name}:`, err);
      return { thinking: "", speech: this.getDefaultSpeech(player), action: { type: "none" } };
    }
  }

  private getDefaultSpeech(player: Player): string {
    switch (player.role) {
      case "werewolf":
      case "whiteWolfKing":
      case "wolfBeauty":
        return "冷静分析一下，不要急着投票。";
      case "seer": return "我有线索但先不说。";
      case "witch": return "注意分析发言。";
      case "hunter": return "谁在带节奏？";
      case "guard": return "我在注意每个人的发言。";
      case "cupid": return "大家先说说自己的看法。";
      case "idiot": return "我有点混乱，大家怎么看？";
      case "villager": return "我在听。";
    }
  }

  private waitForHuman(): Promise<unknown> {
    return new Promise((resolve) => { this.humanResolve = resolve; });
  }

  private waitForHumanWithTimeout(seconds: number): Promise<unknown> {
    return new Promise((resolve) => {
      this.humanResolve = resolve;
      setTimeout(() => {
        if (this.humanResolve) { this.humanResolve(null); this.humanResolve = null; }
      }, seconds * 1000);
    });
  }

  private emit() {
    if (this.onStateChange) this.onStateChange({ ...this.state });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
