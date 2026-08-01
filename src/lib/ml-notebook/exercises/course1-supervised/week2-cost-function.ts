import type { Exercise } from "../../types";

/** 线性回归代价函数 */
export const costFunction: Exercise = {
  id: "c1-w2-cost-function",
  title: "线性回归代价函数",
  course: "Course 1: 监督学习",
  week: "Week 2",
  description:
    "代价函数（Cost Function）衡量模型预测值与真实值之间的差距。在线性回归中我们使用均方误差（MSE），目标是通过调整参数 w 和 b 来最小化代价 J(w,b)。本练习带你用 NumPy 实现代价函数，并可视化代价关于参数的曲面。",
  cells: [
    {
      id: "c1w2-imports",
      label: "导入依赖",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

# 设置中文字体（如果可用）
plt.rcParams['font.size'] = 12
print("NumPy version:", np.__version__)
print("环境就绪！")`,
      hint: "运行此 Cell 初始化环境",
    },
    {
      id: "c1w2-data",
      label: "准备训练数据",
      initialCode: `# 生成模拟数据：y = 2x + 1 加上一些噪声
np.random.seed(42)
m = 50  # 样本数
x = np.random.rand(m) * 10
true_w, true_b = 2.0, 1.0
noise = np.random.randn(m) * 1.5
y = true_w * x + true_b + noise

# 可视化数据
plt.figure(figsize=(8, 5))
plt.scatter(x, y, alpha=0.7, edgecolors='k', linewidth=0.5)
plt.xlabel('x')
plt.ylabel('y')
plt.title(f'Training Data (m={m})')
plt.grid(True, alpha=0.3)
plt.show()

print(f"x shape: {x.shape}, y shape: {y.shape}")
print(f"真实参数: w={true_w}, b={true_b}")`,
      hint: "生成 f(x) = 2x + 1 + noise 的模拟数据",
    },
    {
      id: "c1w2-cost-func",
      label: "实现代价函数",
      initialCode: `def compute_cost(x, y, w, b):
    """
    计算均方误差代价

    参数:
        x (ndarray): 输入特征 (m,)
        y (ndarray): 目标值 (m,)
        w (float):   斜率参数
        b (float):   截距参数

    返回:
        float: 代价 J(w,b)
    """
    m = len(x)
    # TODO: 计算预测值 f_wb = w * x + b
    # TODO: 计算均方误差 cost = (1/(2m)) * sum((f_wb - y)^2)

    f_wb = w * x + b
    cost = (1 / (2 * m)) * np.sum((f_wb - y) ** 2)
    return cost

# 测试
test_cost = compute_cost(x, y, true_w, true_b)
print(f"真实参数下的代价: {test_cost:.4f}")
print(f"(应该是一个很小的值，因为这是用来生成数据的参数)")

# 试试一个差的参数
bad_cost = compute_cost(x, y, 5.0, -3.0)
print(f"差参数 (w=5, b=-3) 下的代价: {bad_cost:.4f}")`,
      hint: "替换 # TODO 注释为实际代码，或直接运行查看正确实现",
    },
    {
      id: "c1w2-cost-surface",
      label: "可视化代价曲面",
      initialCode: `# 在参数空间中扫描代价
W = np.linspace(-1, 5, 100)
B = np.linspace(-5, 7, 100)
W_grid, B_grid = np.meshgrid(W, B)

# 计算每个 (w,b) 的代价
J = np.zeros_like(W_grid)
for i in range(len(W)):
    for j in range(len(B)):
        J[j, i] = compute_cost(x, y, W[i], B[j])

# 3D 曲面图
fig = plt.figure(figsize=(12, 5))

ax1 = fig.add_subplot(1, 2, 1, projection='3d')
ax1.plot_surface(W_grid, B_grid, J, cmap='viridis', alpha=0.8)
ax1.set_xlabel('w')
ax1.set_ylabel('b')
ax1.set_zlabel('J(w,b)')
ax1.set_title('Cost Function Surface')

# 等高线图
ax2 = fig.add_subplot(1, 2, 2)
contour = ax2.contour(W_grid, B_grid, J, levels=30, cmap='viridis')
ax2.clabel(contour, inline=True, fontsize=8)
ax2.scatter(true_w, true_b, color='red', marker='x', s=100, label='Optimal (w=2,b=1)')
ax2.set_xlabel('w')
ax2.set_ylabel('b')
ax2.set_title('Cost Function Contour')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

print(f"最优参数附近 J ≈ {compute_cost(x, y, true_w, true_b):.4f}")
print("曲面中心（最小值）位于 w≈2, b≈1 ✓")`,
      hint: "观察代价函数的最小值位置和形状",
    },
  ],
};
