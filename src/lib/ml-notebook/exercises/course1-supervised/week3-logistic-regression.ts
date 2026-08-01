import type { Exercise } from "../../types";

/** 逻辑回归 */
export const logisticRegression: Exercise = {
  id: "c1-w3-logistic-regression",
  title: "逻辑回归",
  course: "Course 1: 监督学习",
  week: "Week 3",
  description:
    "逻辑回归是分类问题的经典算法。它使用 sigmoid 函数将线性输出映射到 [0,1] 区间，然后用对数损失（交叉熵）作为代价函数。本练习带你实现二分类逻辑回归。",
  cells: [
    {
      id: "c1w3lr-imports",
      label: "导入依赖",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    """Sigmoid 激活函数"""
    return 1 / (1 + np.exp(-z))

# 可视化 sigmoid
z = np.linspace(-10, 10, 200)
plt.figure(figsize=(6, 4))
plt.plot(z, sigmoid(z), 'b-', linewidth=2)
plt.axhline(y=0.5, color='r', linestyle='--', alpha=0.5)
plt.axvline(x=0, color='r', linestyle='--', alpha=0.5)
plt.xlabel('z')
plt.ylabel('g(z)')
plt.title('Sigmoid Function')
plt.grid(True, alpha=0.3)
plt.show()
print("环境就绪！")`,
    },
    {
      id: "c1w3lr-data",
      label: "生成分类数据",
      initialCode: `np.random.seed(42)
m = 80

# 类别 0: 左下角
X0 = np.random.randn(m//2, 2) * 1.2 + np.array([2, 2])
y0 = np.zeros(m//2)

# 类别 1: 右上角
X1 = np.random.randn(m//2, 2) * 1.2 + np.array([6, 6])
y1 = np.ones(m//2)

X = np.vstack([X0, X1])
y = np.hstack([y0, y1])

# 打乱顺序
idx = np.random.permutation(m)
X, y = X[idx], y[idx]

plt.figure(figsize=(6, 6))
plt.scatter(X[y==0, 0], X[y==0, 1], c='blue', alpha=0.7, label='Class 0')
plt.scatter(X[y==1, 0], X[y==1, 1], c='red', alpha=0.7, label='Class 1')
plt.xlabel('x1')
plt.ylabel('x2')
plt.title('Binary Classification Data')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
print(f"X shape: {X.shape}, y 标签: {np.unique(y)}")`,
    },
    {
      id: "c1w3lr-cost",
      label: "逻辑回归代价函数",
      initialCode: `def compute_cost_logistic(X, y, w, b):
    """
    计算逻辑回归的对数损失 (交叉熵)
    """
    m = X.shape[0]
    z = np.dot(X, w) + b
    f_wb = sigmoid(z)

    # 为避免 log(0) 添加小的 epsilon
    eps = 1e-15
    cost = -(1/m) * np.sum(
        y * np.log(f_wb + eps) + (1 - y) * np.log(1 - f_wb + eps)
    )
    return cost

# 测试
w_test = np.zeros(2)
b_test = 0
print(f"初始代价: {compute_cost_logistic(X, y, w_test, b_test):.4f}")
print(f"(如果模型输出 0.5 均匀分布, cost ≈ 0.693)")`,
    },
    {
      id: "c1w3lr-gradient-descent",
      label: "梯度下降训练",
      initialCode: `def logistic_gradient_descent(X, y, w_init, b_init, alpha, iters):
    m = X.shape[0]
    w, b = w_init.copy(), b_init
    history = []

    for i in range(iters):
        z = np.dot(X, w) + b
        f_wb = sigmoid(z)
        error = f_wb - y

        dj_dw = (1/m) * np.dot(X.T, error)
        dj_db = (1/m) * np.sum(error)

        w -= alpha * dj_dw
        b -= alpha * dj_db

        if i % 500 == 0:
            cost = compute_cost_logistic(X, y, w, b)
            history.append(cost)
            print(f"迭代 {i:4d}: cost={cost:.4f}")

    return w, b, history

w_init = np.zeros(2)
b_init = 0.0
w_final, b_final, history = logistic_gradient_descent(
    X, y, w_init, b_init, alpha=0.1, iters=2000
)
print(f"\\n最终参数: w={w_final}, b={b_final:.4f}")`,
    },
    {
      id: "c1w3lr-decision-boundary",
      label: "可视化决策边界",
      initialCode: `def predict(X, w, b):
    return (sigmoid(np.dot(X, w) + b) >= 0.5).astype(int)

accuracy = np.mean(predict(X, w_final, b_final) == y) * 100
print(f"训练准确率: {accuracy:.1f}%")

# 画决策边界
x1_min, x1_max = X[:, 0].min() - 1, X[:, 0].max() + 1
xx, yy = np.meshgrid(np.linspace(x1_min, x1_max, 200),
                     np.linspace(X[:, 1].min() - 1, X[:, 1].max() + 1, 200))
grid = np.c_[xx.ravel(), yy.ravel()]
Z = sigmoid(np.dot(grid, w_final) + b_final).reshape(xx.shape)

plt.figure(figsize=(7, 6))
plt.contourf(xx, yy, Z, levels=[0, 0.5, 1], alpha=0.2, colors=['blue', 'red'])
plt.contour(xx, yy, Z, levels=[0.5], colors='k', linewidths=2)
plt.scatter(X[y==0, 0], X[y==0, 1], c='blue', alpha=0.7, label='Class 0')
plt.scatter(X[y==1, 0], X[y==1, 1], c='red', alpha=0.7, label='Class 1')
plt.xlabel('x1'); plt.ylabel('x2')
plt.title(f'Logistic Regression Decision Boundary (Acc={accuracy:.1f}%)')
plt.legend(); plt.grid(True, alpha=0.3)
plt.show()`,
    },
  ],
};
