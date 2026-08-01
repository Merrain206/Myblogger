import type { Exercise } from "../../types";

/** 梯度下降算法 */
export const gradientDescent: Exercise = {
  id: "c1-w2-gradient-descent",
  title: "梯度下降",
  course: "Course 1: 监督学习",
  week: "Week 2",
  description:
    "梯度下降是机器学习中最核心的优化算法。它通过反复计算代价函数的梯度，沿着最陡峭的方向逐步更新参数，最终收敛到代价函数的最小值。",
  cells: [
    {
      id: "c1w2gd-imports",
      label: "导入依赖",
      initialCode: `import numpy as np
import matplotlib.pyplot as plt

# 复用代价函数
def compute_cost(x, y, w, b):
    m = len(x)
    f_wb = w * x + b
    return (1 / (2 * m)) * np.sum((f_wb - y) ** 2)

# 生成数据
np.random.seed(42)
x = np.random.rand(100) * 10
y = 2.0 * x + 1.0 + np.random.randn(100) * 1.5
print(f"数据就绪, m={len(x)}")`,
      hint: "运行此 Cell 初始化环境和数据",
    },
    {
      id: "c1w2gd-compute-gradient",
      label: "计算梯度",
      initialCode: `def compute_gradient(x, y, w, b):
    """
    计算代价函数关于 w 和 b 的偏导数

    返回:
        dj_dw: ∂J/∂w
        dj_db: ∂J/∂b
    """
    m = len(x)
    f_wb = w * x + b
    error = f_wb - y

    dj_dw = (1 / m) * np.sum(error * x)
    dj_db = (1 / m) * np.sum(error)

    return dj_dw, dj_db

# 测试
dw, db = compute_gradient(x, y, 0, 0)
print(f"在 (w=0, b=0) 处的梯度: dj_dw={dw:.4f}, dj_db={db:.4f}")`,
      hint: "梯度指向代价函数增长最快的方向",
    },
    {
      id: "c1w2gd-descent",
      label: "执行梯度下降",
      initialCode: `def gradient_descent(x, y, w_init, b_init, alpha, iterations):
    """
    批量梯度下降算法

    参数:
        alpha: 学习率
        iterations: 迭代次数
    """
    w, b = w_init, b_init
    history = []

    for i in range(iterations):
        dj_dw, dj_db = compute_gradient(x, y, w, b)
        w -= alpha * dj_dw
        b -= alpha * dj_db
        cost = compute_cost(x, y, w, b)
        history.append((w, b, cost))

        if i % 200 == 0:
            print(f"迭代 {i:4d}: w={w:.4f}, b={b:.4f}, cost={cost:.4f}")

    return w, b, history

# 运行梯度下降
w_final, b_final, history = gradient_descent(
    x, y, w_init=0, b_init=0, alpha=0.01, iterations=1000
)

print(f"\\n最终参数: w={w_final:.4f}, b={b_final:.4f}")
print(f"(真实值: w=2.0, b=1.0)")`,
      hint: "调整 alpha 和 iterations 观察收敛效果",
    },
    {
      id: "c1w2gd-visualize",
      label: "可视化收敛过程",
      initialCode: `hist = np.array(history)

fig, axes = plt.subplots(1, 3, figsize=(14, 4))

# 代价下降曲线
axes[0].plot(hist[:, 2])
axes[0].set_xlabel('Iteration')
axes[0].set_ylabel('J(w,b)')
axes[0].set_title('Cost Convergence Curve')
axes[0].grid(True, alpha=0.3)

# w 的轨迹
axes[1].plot(hist[:, 0])
axes[1].axhline(y=2.0, color='r', linestyle='--', label='True w=2.0')
axes[1].set_xlabel('Iteration')
axes[1].set_ylabel('w')
axes[1].set_title('Convergence of w')
axes[1].legend()
axes[1].grid(True, alpha=0.3)

# b 的轨迹
axes[2].plot(hist[:, 1])
axes[2].axhline(y=1.0, color='r', linestyle='--', label='True b=1.0')
axes[2].set_xlabel('Iteration')
axes[2].set_ylabel('b')
axes[2].set_title('Convergence of b')
axes[2].legend()
axes[2].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()`,
      hint: "观察参数如何逐步逼近真实值",
    },
  ],
};
