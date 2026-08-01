/**
 * 练习注册表 —— 所有 ML 练习的统一入口
 */
import type { Exercise } from "../types";

// Course 1
import { costFunction } from "./course1-supervised/week2-cost-function";
import { gradientDescent } from "./course1-supervised/week2-gradient-descent";
import { logisticRegression } from "./course1-supervised/week3-logistic-regression";

// Course 2
import { neuralNetworkForward } from "./course2-advanced/week1-neural-networks";
import { backpropagation } from "./course2-advanced/week2-backpropagation";
import { decisionTree } from "./course2-advanced/week4-decision-trees";

// Course 3
import { kmeansClustering } from "./course3-unsupervised/week1-kmeans";
import { anomalyDetection } from "./course3-unsupervised/week2-anomaly";
import { collaborativeFiltering } from "./course3-unsupervised/week3-collaborative-filtering";

/** 所有练习（按课程和 Week 排序） */
const allExercises: Exercise[] = [
  // Course 1
  costFunction,
  gradientDescent,
  logisticRegression,

  // Course 2
  neuralNetworkForward,
  backpropagation,
  decisionTree,

  // Course 3
  kmeansClustering,
  anomalyDetection,
  collaborativeFiltering,
];

export function getAllExercises(): Exercise[] {
  return allExercises;
}

export function getExerciseById(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}
