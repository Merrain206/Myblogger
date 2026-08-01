import type { Exercise } from "../../types";

/** 异常检测 */
export const anomalyDetection: Exercise = {
  id: "c3-w2-anomaly",
  title: "异常检测",
  course: "Course 3: 无监督学习",
  week: "Week 2",
  description:
    "异常检测通过建模正常数据的概率分布来发现异常。高斯分布是最常用的模型：计算每个特征的均值和方差，然后用概率密度函数评估新样本。",
  cells: [
    {
      id: "c3w2ad-imports",
      label: "导入依赖与数据",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

# 生成正常数据（二维高斯）
np.random.seed(42)
m = 200
X_normal = np.random.randn(m, 2) * 1.5 + np.array([5, 5])

# 添加几个异常点
X_anomaly = np.array([[10, 10], [0, 0], [12, 1], [1, 11]])
X = np.vstack([X_normal, X_anomaly])

plt.figure(figsize=(6, 6))
plt.scatter(X_normal[:, 0], X_normal[:, 1], alpha=0.5, s=15, label='Normal')
plt.scatter(X_anomaly[:, 0], X_anomaly[:, 1], c='red', s=60, marker='x', label='Anomaly')
plt.xlabel('x1'); plt.ylabel('x2'); plt.legend()
plt.title('Dataset with Anomalies'); plt.grid(True, alpha=0.3)
plt.show()
print(f"样本数: {X.shape[0]} (正常: {m}, 异常: {len(X_anomaly)})")`,
    },
    {
      id: "c3w2ad-gaussian",
      label: "高斯分布建模",
      initialCode: `def estimate_gaussian(X):
    """估计高斯分布参数 μ 和 σ²"""
    mu = np.mean(X, axis=0)
    var = np.var(X, axis=0)  # σ²
    return mu, var

def multivariate_gaussian(X, mu, var):
    """计算多变量高斯概率密度 p(x)"""
    n = X.shape[1]
    # 对角协方差（各特征独立）
    det = np.prod(var)
    var_inv = 1 / var

    diff = X - mu
    exponent = -0.5 * np.sum(diff * var_inv * diff, axis=1)
    p = (1 / ((2 * np.pi) ** (n/2) * det ** 0.5)) * np.exp(exponent)
    return p

# 用正常数据估计参数
mu, var = estimate_gaussian(X_normal)
print(f"估计的均值 μ: {mu}")
print(f"估计的方差 σ²: {var}")

# 计算所有点的概率
p = multivariate_gaussian(X, mu, var)
print(f"\\n正常点概率范围: [{p[:m].min():.6f}, {p[:m].max():.6f}]")
print(f"异常点概率范围: [{p[m:].min():.6f}, {p[m:].max():.6f}]")`,
    },
    {
      id: "c3w2ad-threshold",
      label: "选择阈值与可视化",
      initialCode: `# 使用验证集选择最佳 ε（这里用百分位演示）
epsilon = np.percentile(p[:m], 2)  # 取正常数据第 2 百分位
predicted_anomaly = p < epsilon

tp = (predicted_anomaly[m:]).sum()  # 检出的异常
fp = (predicted_anomaly[:m]).sum()  # 误报的正常
print(f"阈值 ε = {epsilon:.8f}")
print(f"检出异常: {tp}/{len(X_anomaly)}, 误报: {fp}/{m}")

# 可视化
x1 = np.linspace(X[:, 0].min()-1, X[:, 0].max()+1, 200)
x2 = np.linspace(X[:, 1].min()-1, X[:, 1].max()+1, 200)
xx, yy = np.meshgrid(x1, x2)
grid = np.c_[xx.ravel(), yy.ravel()]
p_grid = multivariate_gaussian(grid, mu, var).reshape(xx.shape)

plt.figure(figsize=(7, 6))
plt.contourf(xx, yy, p_grid, levels=20, cmap='Blues', alpha=0.6)
plt.colorbar(label='p(x)')
plt.scatter(X_normal[:, 0], X_normal[:, 1], alpha=0.4, s=15, label='Normal')
plt.scatter(X_anomaly[:, 0], X_anomaly[:, 1], c='red', s=60, marker='x', label='Anomaly')
# 标出异常检测边界
plt.contour(xx, yy, p_grid, levels=[epsilon], colors='red', linewidths=2, linestyles='--')
plt.xlabel('x1'); plt.ylabel('x2'); plt.legend()
plt.title(f'Anomaly Detection (epsilon={epsilon:.6f})')
plt.grid(True, alpha=0.3); plt.show()`,
    },
  ],
};
