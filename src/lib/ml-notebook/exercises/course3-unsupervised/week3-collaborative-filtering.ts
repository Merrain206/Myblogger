import type { Exercise } from "../../types";

/** 协同过滤推荐系统 */
export const collaborativeFiltering: Exercise = {
  id: "c3-w3-collaborative-filtering",
  title: "协同过滤推荐",
  course: "Course 3: 无监督学习",
  week: "Week 3",
  description:
    "协同过滤是推荐系统的核心算法。它通过学习用户和物品的潜在特征向量，预测用户对未评分物品的偏好。本练习实现一个简化的矩阵分解推荐。",
  cells: [
    {
      id: "c3w3cf-imports",
      label: "导入依赖与数据",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

# 模拟: 5 个用户, 4 部电影, 评分 1-5 (0=未评分)
R = np.array([
    [5, 4, 0, 0],
    [0, 3, 4, 0],
    [4, 0, 0, 3],
    [0, 0, 5, 4],
    [3, 0, 0, 5],
], dtype=float)

n_users, n_items = R.shape
print(f"评分矩阵 ({n_users} 用户 × {n_items} 物品):")
print(R)
print(f"\\n稀疏度: {(R==0).sum() / R.size * 100:.0f}%")`,
    },
    {
      id: "c3w3cf-matrix-factorization",
      label: "矩阵分解",
      initialCode: `np.random.seed(42)
n_factors = 2  # 潜在因子维度

# 初始化用户和物品矩阵
U = np.random.randn(n_users, n_factors) * 0.1
V = np.random.randn(n_items, n_factors) * 0.1

def cost(R, U, V, reg=0.1):
    """带正则化的均方误差"""
    pred = np.dot(U, V.T)
    mask = R > 0
    error = pred[mask] - R[mask]
    return 0.5 * np.sum(error ** 2) + (reg/2) * (np.sum(U**2) + np.sum(V**2))

# 简单梯度下降
alpha, iters = 0.01, 3000
history = []
for _ in range(iters):
    pred = np.dot(U, V.T)
    error = np.where(R > 0, pred - R, 0)

    U_grad = np.dot(error, V) + 0.1 * U
    V_grad = np.dot(error.T, U) + 0.1 * V

    U -= alpha * U_grad
    V -= alpha * V_grad
    history.append(cost(R, U, V))

pred_full = np.dot(U, V.T)
print("预测评分矩阵:")
print(np.round(pred_full, 2))
print(f"\\n最终代价: {history[-1]:.4f}")`,
    },
    {
      id: "c3w3cf-results",
      label: "结果分析",
      initialCode: `print("=== 推荐结果 ===\\n")
for user in range(n_users):
    rated = np.where(R[user] > 0)[0]
    unrated = np.where(R[user] == 0)[0]
    if len(unrated) > 0:
        recommendations = unrated[np.argsort(-pred_full[user, unrated])]
        print(f"用户 {user+1}:")
        print(f"  已评分: {dict(zip(rated, R[user, rated].astype(int)))}")
        print(f"  推荐: 物品{recommendations[0]+1} (预测 {pred_full[user, recommendations[0]]:.1f})")
        print()

plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(history); plt.xlabel('Iteration'); plt.ylabel('Cost')
plt.title('Training Convergence'); plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.imshow(pred_full, cmap='YlOrRd', aspect='auto')
plt.colorbar(label='Rating'); plt.xticks(range(n_items), [f'M{i+1}' for i in range(n_items)])
plt.yticks(range(n_users), [f'用户{i+1}' for i in range(n_users)])
plt.title('Predicted Ratings Heatmap')
plt.tight_layout(); plt.show()`,
    },
  ],
};
