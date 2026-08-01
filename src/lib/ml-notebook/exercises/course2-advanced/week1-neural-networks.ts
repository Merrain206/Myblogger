import type { Exercise } from "../../types";

/** NumPy 手写神经网络前向传播 */
export const neuralNetworkForward: Exercise = {
  id: "c2-w1-neural-networks",
  title: "神经网络前向传播",
  course: "Course 2: 高级学习算法",
  week: "Week 1",
  description:
    "神经网络由多个神经元层组成。每个神经元执行线性变换 + 非线性激活。本练习用 NumPy 实现一个 3 层神经网络的前向传播，理解从输入到预测的数据流。",
  cells: [
    {
      id: "c2w1nn-imports",
      label: "导入依赖",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def relu(z):
    return np.maximum(0, z)

# 可视化激活函数
z = np.linspace(-5, 5, 200)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
ax1.plot(z, sigmoid(z)); ax1.set_title('Sigmoid'); ax1.grid(True, alpha=0.3)
ax2.plot(z, relu(z)); ax2.set_title('ReLU'); ax2.grid(True, alpha=0.3)
plt.show()
print("环境就绪！")`,
    },
    {
      id: "c2w1nn-dense",
      label: "实现全连接层",
      initialCode: `def dense_layer(A_prev, W, b, activation='relu'):
    """
    全连接层的前向传播

    参数:
        A_prev: 上一层激活值 (n_prev, m)
        W:      权重矩阵 (n_curr, n_prev)
        b:      偏置向量 (n_curr, 1)
        activation: 'relu' | 'sigmoid' | 'linear'

    返回:
        A: 本层激活值
        Z: 线性输出（供反向传播使用）
    """
    Z = np.dot(W, A_prev) + b

    if activation == 'relu':
        A = relu(Z)
    elif activation == 'sigmoid':
        A = sigmoid(Z)
    else:
        A = Z  # linear

    return A, Z

print("全连接层函数已就绪 ✓")`,
    },
    {
      id: "c2w1nn-forward",
      label: "三层网络前向传播",
      initialCode: `np.random.seed(42)

# 网络架构: 输入(2) → 隐层1(4,ReLU) → 隐层2(3,ReLU) → 输出(1,Sigmoid)
np.random.seed(42)

# 初始化参数（小随机值）
W1 = np.random.randn(4, 2) * 0.5
b1 = np.zeros((4, 1))
W2 = np.random.randn(3, 4) * 0.5
b2 = np.zeros((3, 1))
W3 = np.random.randn(1, 3) * 0.5
b3 = np.zeros((1, 1))

def forward_pass(X, params):
    W1, b1, W2, b2, W3, b3 = params
    A0 = X.T  # (2, m)

    A1, Z1 = dense_layer(A0, W1, b1, 'relu')     # 隐层1
    A2, Z2 = dense_layer(A1, W2, b2, 'relu')     # 隐层2
    A3, Z3 = dense_layer(A2, W3, b3, 'sigmoid')  # 输出层

    return A3, (Z1, Z2, Z3)

# 测试数据
X_test = np.array([[1.0, 2.0], [3.0, 4.0], [-1.0, -2.0]])
m_test = X_test.shape[0]
print(f"输入: {m_test} 个样本, 各 {X_test.shape[1]} 个特征")

params = (W1, b1, W2, b2, W3, b3)
predictions, _ = forward_pass(X_test, params)
print(f"\\n预测输出:\\n{predictions.T}")
print(f"\\n输入 [1, 2] → 预测 {predictions[0, 0]:.4f}")
print(f"输入 [-1, -2] → 预测 {predictions[0, 2]:.4f}")`,
      hint: "观察不同输入得到的预测值差异",
    },
    {
      id: "c2w1nn-shapes",
      label: "理解张量形状",
      initialCode: `print("=== 张量形状追踪 ===\\n")
print(f"W1: {W1.shape}, b1: {b1.shape}  # 输入层→隐层1")
print(f"W2: {W2.shape}, b2: {b2.shape}  # 隐层1→隐层2")
print(f"W3: {W3.shape}, b3: {b3.shape}  # 隐层2→输出层")

# 各层参数数量
total_params = (W1.size + b1.size + W2.size + b2.size + W3.size + b3.size)
print(f"\\n总参数量: {total_params}")
print(f"(2×4 + 4 + 4×3 + 3 + 3×1 + 1 = {2*4+4 + 4*3+3 + 3*1+1})")`,
    },
  ],
};
