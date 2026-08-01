import type { Exercise } from "../../types";

/** K-Means 聚类 */
export const kmeansClustering: Exercise = {
  id: "c3-w1-kmeans",
  title: "K-Means 聚类",
  course: "Course 3: 无监督学习",
  week: "Week 1",
  description:
    "K-Means 是最流行的聚类算法。它反复执行两步：将每个点分配给最近的质心，然后更新质心为所分配点的均值。本练习实现在 2D 数据上的完整 K-Means 过程。",
  cells: [
    {
      id: "c3w1km-imports",
      label: "导入依赖与数据",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

# 生成 3 个簇的数据
np.random.seed(42)
m = 150
X1 = np.random.randn(50, 2) * 0.6 + np.array([2, 2])
X2 = np.random.randn(50, 2) * 0.6 + np.array([6, 6])
X3 = np.random.randn(50, 2) * 0.6 + np.array([2, 6])
X = np.vstack([X1, X2, X3])

plt.figure(figsize=(6, 6))
plt.scatter(X[:, 0], X[:, 1], alpha=0.7, edgecolors='k', linewidth=0.5)
plt.xlabel('x1'); plt.ylabel('x2')
plt.title(f'Raw Data (m={m})')
plt.grid(True, alpha=0.3)
plt.show()
print("环境就绪！")`,
    },
    {
      id: "c3w1km-algorithm",
      label: "实现 K-Means",
      initialCode: `def find_closest_centroids(X, centroids):
    """将每个点分配给最近的质心"""
    K = centroids.shape[0]
    distances = np.zeros((X.shape[0], K))
    for k in range(K):
        distances[:, k] = np.sum((X - centroids[k]) ** 2, axis=1)
    return np.argmin(distances, axis=1)

def compute_centroids(X, idx, K):
    """计算每个簇的新质心（均值）"""
    centroids = np.zeros((K, X.shape[1]))
    for k in range(K):
        points = X[idx == k]
        centroids[k] = points.mean(axis=0) if len(points) > 0 else X[np.random.randint(X.shape[0])]
    return centroids

def kmeans(X, K, max_iters=20):
    """完整 K-Means 算法"""
    m, n = X.shape
    # 随机初始化质心
    rng = np.random.default_rng(42)
    centroids = X[rng.choice(m, K, replace=False)]
    history = [centroids.copy()]

    for i in range(max_iters):
        idx = find_closest_centroids(X, centroids)
        centroids = compute_centroids(X, idx, K)
        history.append(centroids.copy())

    return centroids, idx, history

# 运行
K = 3
centroids, idx, history = kmeans(X, K)
print(f"最终质心:\\n{centroids}")
print(f"各簇样本数: {np.bincount(idx)}")`,
    },
    {
      id: "c3w1km-visualize",
      label: "可视化聚类过程",
      initialCode: `colors = ['blue', 'red', 'green']

# 最终聚类结果
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

for k in range(K):
    ax1.scatter(X[idx==k, 0], X[idx==k, 1], c=colors[k], alpha=0.7, s=20, label=f'簇 {k+1}')
ax1.scatter(centroids[:, 0], centroids[:, 1], c='black', marker='x', s=150, linewidths=3, label='Centroids')
ax1.set_title('K-Means Clustering Result'); ax1.legend(); ax1.grid(True, alpha=0.3)

# 质心移动轨迹
for k in range(K):
    traj = np.array([h[k] for h in history])
    ax2.plot(traj[:, 0], traj[:, 1], f'{colors[k]}o-', markersize=4, alpha=0.7, label=f'质心 {k+1}')
ax2.scatter(X[:, 0], X[:, 1], c='gray', alpha=0.2, s=10)
ax2.set_title('Centroid Movement Trace'); ax2.legend(); ax2.grid(True, alpha=0.3)

plt.tight_layout(); plt.show()`,
    },
  ],
};
