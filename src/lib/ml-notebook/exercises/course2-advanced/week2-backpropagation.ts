import type { Exercise } from "../../types";

/** 反向传播算法 */
export const backpropagation: Exercise = {
  id: "c2-w2-backpropagation",
  title: "反向传播算法",
  course: "Course 2: 高级学习算法",
  week: "Week 2",
  description:
    "反向传播是训练神经网络的核心算法。它利用链式法则逐层计算梯度，从而更新网络参数。本练习带你手动推导并实现一个简单网络的反向传播。",
  cells: [
    {
      id: "c2w2bp-imports",
      label: "导入依赖与数据准备",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def relu(z):
    return np.maximum(0, z)

# 生成 XOR 数据（非线性可分）
np.random.seed(42)
m = 100
X = np.random.randn(m, 2) * 0.8
# XOR 标签: 两个输入符号相同为 1，不同为 0
y = ((X[:, 0] * X[:, 1]) > 0).astype(float).reshape(-1, 1)

plt.figure(figsize=(5, 5))
plt.scatter(X[y[:,0]==0, 0], X[y[:,0]==0, 1], c='blue', alpha=0.7, label='Class 0')
plt.scatter(X[y[:,0]==1, 0], X[y[:,0]==1, 1], c='red', alpha=0.7, label='Class 1')
plt.xlabel('x1'); plt.ylabel('x2')
plt.title('XOR-like Classification Data')
plt.legend(); plt.grid(True, alpha=0.3)
plt.show()
print(f"X shape: {X.shape}, y shape: {y.shape}")`,
    },
    {
      id: "c2w2bp-compute-loss",
      label: "交叉熵损失函数",
      initialCode: `def binary_cross_entropy(y_pred, y_true):
    """二分类交叉熵"""
    eps = 1e-15
    m = y_true.shape[0]
    loss = -(1/m) * np.sum(
        y_true * np.log(y_pred + eps) +
        (1 - y_true) * np.log(1 - y_pred + eps)
    )
    return loss

# 测试
y_test_pred = np.array([[0.9], [0.1], [0.8], [0.2]])
y_test_true = np.array([[1.0], [0.0], [1.0], [0.0]])
print(f"CE Loss: {binary_cross_entropy(y_test_pred, y_test_true):.4f}")`,
    },
    {
      id: "c2w2bp-training",
      label: "训练两层网络",
      initialCode: `# 网络: 输入(2) → 隐层(8,ReLU) → 输出(1,Sigmoid)
np.random.seed(42)

n_input, n_hidden, n_output = 2, 8, 1
W1 = np.random.randn(n_hidden, n_input) * 0.3
b1 = np.zeros((n_hidden, 1))
W2 = np.random.randn(n_output, n_hidden) * 0.3
b2 = np.zeros((n_output, 1))

alpha = 0.1  # 学习率
losses = []

for epoch in range(5000):
    # ---- 前向传播 ----
    Z1 = np.dot(W1, X.T) + b1       # (8, m)
    A1 = relu(Z1)                    # (8, m)
    Z2 = np.dot(W2, A1) + b2        # (1, m)
    A2 = sigmoid(Z2)                 # (1, m)

    loss = binary_cross_entropy(A2.T, y)
    losses.append(loss)

    # ---- 反向传播 ----
    m_batch = m
    dZ2 = (A2 - y.T) / m_batch                    # (1, m)
    dW2 = np.dot(dZ2, A1.T)                       # (1, 8)
    db2 = np.sum(dZ2, axis=1, keepdims=True)      # (1, 1)

    dA1 = np.dot(W2.T, dZ2)                       # (8, m)
    dZ1 = dA1 * (Z1 > 0).astype(float)            # ReLU 梯度
    dW1 = np.dot(dZ1, X)                          # (8, 2)
    db1 = np.sum(dZ1, axis=1, keepdims=True)      # (8, 1)

    # ---- 更新参数 ----
    W1 -= alpha * dW1; b1 -= alpha * db1
    W2 -= alpha * dW2; b2 -= alpha * db2

    if epoch % 1000 == 0:
        acc = np.mean(((A2.T > 0.5).astype(float) == y).astype(float)) * 100
        print(f"Epoch {epoch:4d}: loss={loss:.4f}, acc={acc:.1f}%")

# 最终结果
final_pred = (sigmoid(np.dot(W2, relu(np.dot(W1, X.T) + b1)) + b2).T > 0.5).astype(float)
final_acc = np.mean(final_pred == y) * 100
print(f"\\n最终准确率: {final_acc:.1f}%")`,
    },
    {
      id: "c2w2bp-loss-plot",
      label: "损失曲线与决策边界",
      initialCode: `fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# 损失曲线
ax1.plot(losses)
ax1.set_xlabel('Epoch'); ax1.set_ylabel('Loss')
ax1.set_title('Training Loss Curve'); ax1.grid(True, alpha=0.3)

# 决策边界
x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 200),
                     np.linspace(y_min, y_max, 200))
grid = np.c_[xx.ravel(), yy.ravel()]
Z = sigmoid(np.dot(W2, relu(np.dot(W1, grid.T) + b1)) + b2).reshape(xx.shape)

ax2.contourf(xx, yy, Z, levels=[0, 0.5, 1], alpha=0.2, colors=['blue', 'red'])
ax2.contour(xx, yy, Z, levels=[0.5], colors='k', linewidths=2)
ax2.scatter(X[y[:,0]==0, 0], X[y[:,0]==0, 1], c='blue', alpha=0.7, s=15)
ax2.scatter(X[y[:,0]==1, 0], X[y[:,0]==1, 1], c='red', alpha=0.7, s=15)
ax2.set_title(f'Decision Boundary (Acc={final_acc:.1f}%)')
ax2.set_xlabel('x1'); ax2.set_ylabel('x2')

plt.tight_layout(); plt.show()`,
    },
  ],
};
