import type { Exercise } from "../../types";

/** 决策树 */
export const decisionTree: Exercise = {
  id: "c2-w4-decision-tree",
  title: "决策树",
  course: "Course 2: 高级学习算法",
  week: "Week 4",
  description:
    "决策树通过递归地将数据划分为纯度更高的子集来做决策。每次分裂选择一个特征和阈值，使得信息增益最大。本练习带你实现信息熵计算和决策树的可视化推理。",
  cells: [
    {
      id: "c2w4dt-imports",
      label: "导入依赖",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

print("环境就绪！")`,
    },
    {
      id: "c2w4dt-entropy",
      label: "信息熵",
      initialCode: `def entropy(y):
    """计算标签的信息熵 H(S) = -Σ p_i * log2(p_i)"""
    # 各类别的概率
    _, counts = np.unique(y, return_counts=True)
    probs = counts / len(y)
    # 熵公式
    return -np.sum(probs * np.log2(probs + 1e-15))

# 演示
y_pure = np.array([0, 0, 0, 0, 0])          # 全为 0
y_mixed = np.array([0, 0, 0, 1, 1])         # 3:2
y_balanced = np.array([0, 0, 0, 1, 1, 1])   # 1:1

print(f"纯度最高: H = {entropy(y_pure):.4f}")    # 应该 = 0
print(f"混合 3:2: H = {entropy(y_mixed):.4f}")    # < 1
print(f"等比例: H = {entropy(y_balanced):.4f}")   # = 1.0 (最大)`,
    },
    {
      id: "c2w4dt-info-gain",
      label: "信息增益",
      initialCode: `def information_gain(X_col, y, threshold):
    """计算以 threshold 分裂 X_col 时的信息增益"""
    H_before = entropy(y)

    left_mask = X_col <= threshold
    right_mask = ~left_mask

    if left_mask.sum() == 0 or right_mask.sum() == 0:
        return 0  # 无效分裂

    H_left = entropy(y[left_mask])
    H_right = entropy(y[right_mask])

    # 加权平均后与分裂前的差值
    w_left = left_mask.sum() / len(y)
    w_right = right_mask.sum() / len(y)

    return H_before - (w_left * H_left + w_right * H_right)

# 生成演示数据
np.random.seed(42)
X_demo = np.random.rand(100) * 10
y_demo = (X_demo > 5).astype(int)

# 扫描不同阈值
thresholds = np.linspace(0, 10, 50)
gains = [information_gain(X_demo, y_demo, t) for t in thresholds]

plt.figure(figsize=(8, 4))
plt.plot(thresholds, gains, 'b-', linewidth=2)
plt.axvline(x=5, color='r', linestyle='--', label='Best threshold ~5')
plt.xlabel('Threshold'); plt.ylabel('Info Gain')
plt.title('Information Gain vs Threshold')
plt.legend(); plt.grid(True, alpha=0.3)
plt.show()

best_idx = np.argmax(gains)
print(f"最佳阈值: {thresholds[best_idx]:.2f}, 信息增益: {gains[best_idx]:.4f}")`,
    },
  ],
};
