// 五子棋排行榜数据模型
export interface ScoreEntry {
  id: string;
  playerName: string;
  mode: "pvp" | "pvai";
  difficulty: "easy" | "medium" | "hard" | null;
  result: "win" | "loss" | "draw";
  moves: number;
  date: string;
}

export interface LeaderboardFilter {
  mode?: "pvp" | "pvai";
  difficulty?: "easy" | "medium" | "hard";
}

export interface GameResult {
  mode: "pvp" | "pvai";
  difficulty: "easy" | "medium" | "hard" | null;
  result: "win" | "loss" | "draw";
  moves: number;
}
