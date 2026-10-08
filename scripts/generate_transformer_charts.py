"""
生成《一文吃透 Transformer》博客文章的配图。

替代内联 SVG，用标准 Markdown ![](path) 引用，彻底避免 MDX 花括号解析问题。

图 1  Transformer 整体架构（示意）
图 2  Scaled Dot-Product Attention 计算流程（示意）
图 3  真实 BERT 注意力权重热力图（需 bert-base-uncased，缺失时自动跳过）
图 4  正弦位置编码（真实公式计算）
图 5  Self-Attention / RNN / CNN 复杂度与路径长度对比（真实公式计算）
图 6  Multi-Head 子空间分解（示意）
图 7  Transformer 九年演进时间线（对应正文 §7）
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle
import matplotlib.patches as patches
import numpy as np
import os

# === 中文字体配置 ===
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Noto Sans SC']
plt.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), 'public', 'images', 'blog')

# 通用配色（与 generate_blog_charts.py 保持一致）
C = {
    'bg': '#FAFAFA',
    'enc_bg': '#E3F2FD', 'enc_border': '#64B5F6',
    'dec_bg': '#FFF8E1', 'dec_border': '#FFB74D',
    'attn_bg': '#F3E5F5', 'attn_border': '#BA68C8',
    'ffn_bg': '#E8F5E9', 'ffn_border': '#66BB6A',
    'norm_bg': '#FCE4EC', 'norm_border': '#F48FB1',
    'emb_bg': '#ECEFF1', 'emb_border': '#B0BEC5',
    'out_bg': '#E0F2F1', 'out_border': '#4DB6AC',
    'text': '#263238', 'text_light': '#546E7A', 'text_muted': '#90A4AE',
    'arrow': '#78909C', 'divider': '#CFD8DC',
    'accent_blue': '#1976D2', 'accent_green': '#2E7D32',
    'accent_orange': '#E65100', 'accent_purple': '#6A1B9A',
    'accent_red': '#C62828',
}


def rounded_box(ax, x, y, w, h, bg, border, lw=1.3, pad=0.10, z=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle=f"round,pad={pad}", facecolor=bg,
                 edgecolor=border, linewidth=lw, zorder=z))


def arrow(ax, x1, y1, x2, y2, color=None, lw=1.4, z=1, style='->'):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
                 arrowstyle=style, mutation_scale=11,
                 facecolor=color or C['arrow'], edgecolor=color or C['arrow'],
                 linewidth=lw, zorder=z))


def residual_line(ax, x_box, x_out, y_from, y_to, color):
    """残差连接的标准直角折线：从子层输入绕到 Add & Norm 的输入。"""
    ax.plot([x_box, x_out, x_out, x_box], [y_from, y_from, y_to, y_to],
            color=color, linewidth=1.3, linestyle='--', zorder=3)
    ax.annotate('', xy=(x_box, y_to), xytext=(x_out, y_to),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.3), zorder=4)


def layer_box(ax, x, y, w, h, label, kind, fontsize=8.5):
    """画一个网络层盒子。kind 决定配色。"""
    palette = {
        'attn': (C['attn_bg'], C['attn_border']),
        'ffn': (C['ffn_bg'], C['ffn_border']),
        'norm': (C['norm_bg'], C['norm_border']),
        'emb': (C['emb_bg'], C['emb_border']),
        'out': (C['out_bg'], C['out_border']),
    }
    bg, border = palette[kind]
    rounded_box(ax, x, y, w, h, bg, border)
    ax.text(x + w / 2, y + h / 2, label, ha='center', va='center',
            fontsize=fontsize, color=C['text'], zorder=3)


def save(fig, name):
    path = os.path.join(OUTPUT_DIR, name)
    fig.savefig(path, dpi=150, bbox_inches='tight',
                facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f'  [OK] {name}')


def quantize(name, colors=256):
    """把已生成的 PNG 量化到调色板模式以压体积（博客约定要求图表 < 300KB）。

    用于热力图这类渐变多、PNG 偏大的图；256 色对本站图表视觉无损。
    """
    from PIL import Image
    path = os.path.join(OUTPUT_DIR, name)
    before = os.path.getsize(path)
    img = Image.open(path).convert('RGB')
    img.quantize(colors=colors, method=Image.MEDIANCUT,
                 dither=Image.NONE).save(path, optimize=True)
    print(f'  [OK] {name} 量化：{before // 1024}KB → {os.path.getsize(path) // 1024}KB')


# ============================================================
# 图 1: Transformer 整体架构
# ============================================================
def create_overview():
    fig, ax = plt.subplots(figsize=(13, 11))
    ax.set_xlim(0, 13); ax.set_ylim(0, 11.2); ax.axis('off')
    fig.patch.set_facecolor(C['bg'])

    # ---- 列坐标 ----
    EX0, EX1 = 0.85, 4.35          # Encoder 大框
    ex0, ex1 = 1.15, 4.05          # Encoder 层框
    DX0, DX1 = 8.65, 12.15         # Decoder 大框
    dx0, dx1 = 8.95, 11.85         # Decoder 层框
    EXC = (EX0 + EX1) / 2          # Encoder 中心 x = 2.6
    DXC = (DX0 + DX1) / 2          # Decoder 中心 x = 10.4

    LH = 0.60                      # 层高
    GAP = 0.20                     # 层间距
    INNER_BOTTOM = 3.25            # 大框内第一层的底部 y

    # ---- 底部输入 ----
    for cx, txt_label, txt_tokens in [
        (EXC, 'Inputs', '我  喜欢  学习'),
        (DXC, 'Outputs (shifted right)', '<sos>  I  like'),
    ]:
        ax.text(cx, 0.40, txt_label, ha='center', va='center',
                fontsize=10, color=C['text_light'], fontweight='bold')
        ax.text(cx, 0.78, txt_tokens, ha='center', va='center',
                fontsize=9, color=C['text_muted'])

    # ---- Embedding + Positional Encoding ----
    for cx, bx0, bx1, emb_label in [
        (EXC, ex0, ex1, 'Input Embedding'),
        (DXC, dx0, dx1, 'Output Embedding'),
    ]:
        arrow(ax, cx, 0.98, cx, 1.18)
        layer_box(ax, bx0, 1.18, bx1 - bx0, 0.52, emb_label, 'emb', 9)
        arrow(ax, cx, 1.70, cx, 1.90)

        # ⊕ 位置编码相加
        ax.add_patch(Circle((cx, 2.06), 0.17, facecolor='white',
                            edgecolor=C['emb_border'], linewidth=1.3, zorder=3))
        ax.text(cx, 2.06, '+', ha='center', va='center',
                fontsize=12, color=C['text_light'], zorder=4)
        ax.text(cx + 0.30, 2.06, 'Positional Encoding', ha='left', va='center',
                fontsize=7.8, color=C['text_muted'])
        arrow(ax, cx, 2.23, cx, 2.62)

    # ---- Encoder 大框 ----
    ax.add_patch(FancyBboxPatch((EX0, 2.75), EX1 - EX0, 4.00,
                 boxstyle="round,pad=0.08", facecolor=C['enc_bg'],
                 edgecolor=C['enc_border'], linewidth=1.8, alpha=0.45, zorder=0))
    ax.text(EX0 - 0.40, 3.05, 'N ×', ha='center', va='center', fontsize=11,
            color=C['accent_blue'], fontweight='bold')

    enc_layers = [
        ('Multi-Head Self-Attention', 'attn'),
        ('Add & Norm', 'norm'),
        ('Feed Forward', 'ffn'),
        ('Add & Norm', 'norm'),
    ]
    for i, (label, kind) in enumerate(enc_layers):
        y = INNER_BOTTOM + i * (LH + GAP)
        layer_box(ax, ex0, y, ex1 - ex0, LH, label, kind)
        if i > 0:
            arrow(ax, EXC, y - GAP, EXC, y)

    # 残差连接（绕过子层）
    for i in range(0, 4, 2):
        residual_line(ax, ex0 - 0.10, 0.92,
                      INNER_BOTTOM + i * (LH + GAP) + LH * 0.5,
                      INNER_BOTTOM + (i + 1) * (LH + GAP) + LH * 0.5,
                      C['accent_red'])

    ax.text(EXC - 0.22, 7.15, 'Encoder 输出', ha='right', va='center',
            fontsize=9, color=C['accent_blue'], fontweight='bold')

    # ---- Decoder 大框 ----
    ax.add_patch(FancyBboxPatch((DX0, 2.75), DX1 - DX0, 5.30,
                 boxstyle="round,pad=0.08", facecolor=C['dec_bg'],
                 edgecolor=C['dec_border'], linewidth=1.8, alpha=0.45, zorder=0))
    ax.text(DX0 - 0.48, 3.05, 'N ×', ha='center', va='center', fontsize=11,
            color=C['accent_orange'], fontweight='bold')

    dec_layers = [
        ('Masked Multi-Head Self-Attention', 'attn'),
        ('Add & Norm', 'norm'),
        ('Multi-Head Cross-Attention', 'attn'),
        ('Add & Norm', 'norm'),
        ('Feed Forward', 'ffn'),
        ('Add & Norm', 'norm'),
    ]
    for i, (label, kind) in enumerate(dec_layers):
        y = INNER_BOTTOM + i * (LH + GAP)
        layer_box(ax, dx0, y, dx1 - dx0, LH, label, kind, fontsize=8)
        if i > 0:
            arrow(ax, DXC, y - GAP, DXC, y)

    # Decoder 残差连接
    for i in range(0, 6, 2):
        residual_line(ax, dx0 - 0.10, 8.72,
                      INNER_BOTTOM + i * (LH + GAP) + LH * 0.5,
                      INNER_BOTTOM + (i + 1) * (LH + GAP) + LH * 0.5,
                      C['accent_red'])

    # ---- Encoder 输出 → Decoder 的 Cross-Attention ----
    cross_y = INNER_BOTTOM + 2 * (LH + GAP) + LH / 2   # 第 3 层中线
    arrow(ax, EXC, 6.85, EXC, 7.55, color=C['accent_blue'], lw=1.8)
    ax.plot([EXC, DX0 - 0.55], [7.55, 7.55],
            color=C['accent_blue'], linewidth=1.8, zorder=1)
    arrow(ax, DX0 - 0.55, 7.55, DX0 - 0.55, cross_y,
          color=C['accent_blue'], lw=1.8)
    arrow(ax, DX0 - 0.55, cross_y, dx0 - 0.02, cross_y,
          color=C['accent_blue'], lw=1.8)
    ax.text(DX0 - 0.72, 7.78, 'K, V', ha='right', va='center', fontsize=9,
            color=C['accent_blue'], fontweight='bold')

    # ---- Decoder 顶部输出层 ----
    top = INNER_BOTTOM + 5 * (LH + GAP) + LH
    arrow(ax, DXC, top, DXC, top + 0.25)
    layer_box(ax, dx0, top + 0.25, dx1 - dx0, 0.52, 'Linear', 'out', 9)
    arrow(ax, DXC, top + 0.77, DXC, top + 0.97)
    layer_box(ax, dx0, top + 0.97, dx1 - dx0, 0.52, 'Softmax', 'out', 9)
    arrow(ax, DXC, top + 1.49, DXC, top + 1.69)
    layer_box(ax, dx0, top + 1.69, dx1 - dx0, 0.52,
              'Output Probabilities', 'out', 9)

    # ---- 图例 ----
    ax.text(0.35, 10.75, '图例：', fontsize=9, color=C['text_light'],
            fontweight='bold', va='center')
    legend = [
        (1.15, 'self.attn_bg', C['attn_bg'], C['attn_border'], '注意力子层'),
        (3.05, 'self.ffn_bg', C['ffn_bg'], C['ffn_border'], '前馈子层'),
        (4.75, 'self.norm_bg', C['norm_bg'], C['norm_border'], '归一化 / 残差'),
        (6.75, 'self.emb_bg', C['emb_bg'], C['emb_border'], '嵌入 / 输出层'),
    ]
    for x, _, bg, border, label in legend:
        rounded_box(ax, x, 10.55, 0.32, 0.30, bg, border, lw=1.2, pad=0.05)
        ax.text(x + 0.45, 10.70, label, fontsize=8.5, color=C['text'],
                va='center')
    ax.add_patch(FancyArrowPatch((8.85, 10.55), (9.35, 10.55),
                 arrowstyle='->', mutation_scale=10, color=C['accent_red'],
                 linewidth=1.2, linestyle='--'))
    ax.text(9.45, 10.70, '残差连接', fontsize=8.5, color=C['text'], va='center')

    save(fig, 'transformer-overview.png')


# ============================================================
# 图 2: Scaled Dot-Product Attention 计算流程
# ============================================================
def create_scaled_dot_product():
    fig, ax = plt.subplots(figsize=(15, 7.2))
    ax.set_xlim(0, 15); ax.set_ylim(0, 7.2); ax.axis('off')
    fig.patch.set_facecolor(C['bg'])

    # ---- 主流程（横向）----
    ax.text(0.55, 3.95, 'X', ha='center', va='center', fontsize=13,
            color=C['text'], fontweight='bold')
    ax.text(0.55, 3.42, 'n × d_model', ha='center', va='center', fontsize=8,
            color=C['text_muted'])

    # 三个投影矩阵
    proj_y = [5.55, 3.95, 2.35]
    proj_names = ['W_Q', 'W_K', 'W_V']
    proj_colors = [(C['attn_bg'], C['attn_border']),
                   (C['ffn_bg'], C['ffn_border']),
                   (C['out_bg'], C['out_border'])]
    for (px, py, pname, pcol) in zip([1.35] * 3, proj_y, proj_names, proj_colors):
        rounded_box(ax, px - 0.32, py - 0.24, 0.64, 0.48, pcol[0], pcol[1])
        ax.text(px, py, pname, ha='center', va='center', fontsize=9.5,
                color=C['text'], zorder=3)

    for py in proj_y:
        ax.add_patch(FancyArrowPatch((0.80, 3.95), (1.03, py),
                     connectionstyle="arc3,rad=0.12", arrowstyle='->',
                     mutation_scale=10, color=C['arrow'], linewidth=1.3))

    # Q / K / V 张量
    qkv_y = [5.55, 3.95, 2.35]
    qkv_names = ['Q', 'K', 'V']
    qkv_shapes = ['n × d_k', 'n × d_k', 'n × d_v']
    qkv_colors = [(C['attn_bg'], C['attn_border']),
                  (C['ffn_bg'], C['ffn_border']),
                  (C['out_bg'], C['out_border'])]
    for (py, nm, sh, col) in zip(qkv_y, qkv_names, qkv_shapes, qkv_colors):
        arrow(ax, 1.67, py, 2.20, py, lw=1.3)
        rounded_box(ax, 2.20, py - 0.30, 0.62, 0.60, col[0], col[1], lw=1.5)
        ax.text(2.51, py + 0.06, nm, ha='center', va='center', fontsize=13,
                color=C['text'], fontweight='bold', zorder=3)
        ax.text(2.51, py - 0.17, sh, ha='center', va='center', fontsize=7,
                color=C['text_muted'], zorder=3)

    # Q 与 K 汇合到 MatMul
    ax.add_patch(FancyArrowPatch((2.82, 5.55), (3.75, 5.00),
                 connectionstyle="arc3,rad=-0.15", arrowstyle='->',
                 mutation_scale=10, color=C['arrow'], linewidth=1.3))
    arrow(ax, 2.82, 3.95, 3.75, 4.60, lw=1.3)

    steps = [
        ('MatMul\nQ · K^T', 4.25, 4.80, C['attn_bg'], C['attn_border']),
        ('Scale\n÷ √d_k', 5.85, 4.80, C['norm_bg'], C['norm_border']),
        ('Mask (opt.)', 7.45, 4.80, C['emb_bg'], C['emb_border']),
        ('Softmax', 9.05, 4.80, C['ffn_bg'], C['ffn_border']),
    ]
    for (label, cx, cy, bg, border) in steps:
        rounded_box(ax, cx - 0.62, cy - 0.42, 1.24, 0.84, bg, border, lw=1.5)
        ax.text(cx, cy, label, ha='center', va='center', fontsize=9,
                color=C['text'], zorder=3, linespacing=1.4)

    for x0, x1 in [(4.87, 5.23), (6.47, 6.83), (8.07, 8.43)]:
        arrow(ax, x0, 4.80, x1, 4.80, lw=1.4)

    # ---- V 从下方汇入最后的 MatMul ----
    ax.plot([2.51, 10.95], [2.35, 2.35], color=C['arrow'],
            linewidth=1.3, zorder=1)
    arrow(ax, 10.95, 2.35, 10.95, 4.10, lw=1.3)
    arrow(ax, 9.67, 4.80, 10.33, 4.80, lw=1.4)

    rounded_box(ax, 10.33, 4.38, 1.24, 0.84, C['out_bg'], C['out_border'], lw=1.5)
    ax.text(10.95, 4.80, 'MatMul\n· V', ha='center', va='center', fontsize=9,
            color=C['text'], zorder=3, linespacing=1.4)

    arrow(ax, 11.57, 4.80, 12.15, 4.80, lw=1.6, color=C['accent_purple'])
    rounded_box(ax, 12.15, 4.44, 0.75, 0.72, C['attn_bg'], C['attn_border'], lw=1.8)
    ax.text(12.52, 4.80, 'Z', ha='center', va='center', fontsize=14,
            color=C['text'], fontweight='bold', zorder=3)
    ax.text(12.52, 4.14, 'n × d_v', ha='center', va='center', fontsize=8,
            color=C['text_muted'])

    # ---- 关键形状标注 ----
    ax.text(4.25, 5.78, '注意力分数矩阵  n × n', ha='center', va='center',
            fontsize=8.5, color=C['accent_red'], fontweight='bold')
    ax.annotate('', xy=(4.25, 5.34), xytext=(4.25, 5.64),
                arrowprops=dict(arrowstyle='->', color=C['accent_red'], lw=1.2))
    ax.text(9.05, 5.78, '每行归一化到 1', ha='center', va='center',
            fontsize=8.5, color=C['accent_red'])
    ax.annotate('', xy=(9.05, 5.34), xytext=(9.05, 5.64),
                arrowprops=dict(arrowstyle='->', color=C['accent_red'], lw=1.2))

    # ---- 底部说明 ----
    ax.text(0.55, 1.35, '公式：', fontsize=10, color=C['text_light'],
            fontweight='bold', va='center')
    ax.text(1.25, 1.35,
            'Attention(Q, K, V) = softmax( Q · K^T / √d_k ) · V',
            fontsize=11.5, color=C['accent_purple'], va='center',
            fontweight='bold')
    ax.text(0.55, 0.72,
            '缩放因子 √d_k 的作用：当 d_k 增大时点积的方差随之增大，'
            '会让 softmax 进入梯度趋近于 0 的饱和区；除以 √d_k 把方差重新拉回 1 附近。',
            fontsize=9, color=C['text_light'], va='center')
    ax.text(0.55, 0.25,
            'Mask 仅在 Decoder 的自注意力中启用：把「未来位置」的分数置为 -∞，'
            '使 softmax 后权重为 0 —— 这是自回归生成不打乱顺序的关键。',
            fontsize=9, color=C['text_light'], va='center')

    save(fig, 'scaled-dot-product-attention.png')


# ============================================================
# 图 4: 正弦位置编码
# ============================================================
def create_positional_encoding():
    # 便于观察起见，这里把 d_model 缩小到 64（原论文 base 模型是 512）。
    # 完整 512 维时波长跨度达 4 个数量级，高维部分在有限位置上会因采样不足
    # 而完全混叠，看不出条纹结构。
    d_model = 64
    n_pos = 100
    pos = np.arange(n_pos)[:, None]
    dim = np.arange(d_model)[None, :]

    # PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
    # PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
    angle = pos / np.power(10000, (2 * (dim // 2)) / d_model)
    pe = np.where(dim % 2 == 0, np.sin(angle), np.cos(angle))

    fig = plt.figure(figsize=(14, 5.6))
    fig.patch.set_facecolor(C['bg'])
    gs = fig.add_gridspec(1, 2, width_ratios=[1, 1.12], wspace=0.24,
                          left=0.06, right=0.98, top=0.86, bottom=0.12)

    # ---- 左：PE 矩阵热力图 ----
    ax1 = fig.add_subplot(gs[0, 0])
    im = ax1.imshow(pe, aspect='auto', cmap='RdBu_r', vmin=-1, vmax=1,
                    origin='lower', interpolation='nearest')
    ax1.set_xlabel(f'维度索引 i  (0 → {d_model - 1})', fontsize=10)
    ax1.set_ylabel('位置 pos', fontsize=10)
    ax1.set_title('位置编码矩阵 PE (pos × dim)', fontsize=11.5,
                  color=C['text'], pad=10)
    cb = fig.colorbar(im, ax=ax1, fraction=0.046, pad=0.03)
    cb.set_label('取值', fontsize=9)
    cb.ax.tick_params(labelsize=8)
    ax1.tick_params(labelsize=9)

    # ---- 右：若干维度的波形 ----
    ax2 = fig.add_subplot(gs[0, 1])
    colors = ['#1976D2', '#2E7D32', '#E65100', '#6A1B9A', '#C62828']
    # 每隔 8 个维度取样，波长正好以 √10 ≈ 3.16 为公比递增
    for k, i in enumerate([0, 8, 16, 24, 32]):
        lam = 2 * np.pi * (10000 ** (i / d_model))
        ax2.plot(pos.ravel(), pe[:, i], linewidth=1.8,
                 color=colors[k], alpha=0.9,
                 label=f'dim {i}   波长 ≈ {lam:.1f}')
    ax2.set_xlabel('位置 pos', fontsize=10)
    ax2.set_ylabel('PE 取值', fontsize=10)
    ax2.set_title('不同维度的正弦波：波长随维度呈几何级数增长',
                  fontsize=11.5, color=C['text'], pad=10)
    ax2.legend(fontsize=8.5, loc='upper right', framealpha=0.9)
    ax2.grid(alpha=0.25, linestyle='--')
    ax2.tick_params(labelsize=9)
    ax2.set_xlim(0, n_pos - 1)

    fig.suptitle('正弦位置编码：PE(pos, 2i) = sin(pos / 10000^(2i/d))，'
                 'PE(pos, 2i+1) = cos(pos / 10000^(2i/d))',
                 fontsize=11, color=C['text_light'], y=0.97)

    fig.text(0.5, 0.008,
             '示意：为便于观察条纹结构，此处把 d_model 缩小为 64 展示（原论文 base 模型为 512）',
             ha='center', fontsize=9, color=C['text_muted'])

    save(fig, 'positional-encoding.png')
    quantize('positional-encoding.png')


# ============================================================
# 图 5: 复杂度与最大路径长度对比
# ============================================================
def create_complexity_comparison():
    d = 512
    k = 3
    n = np.arange(20, 2048, 4)

    sa = n ** 2 * d          # Self-Attention  O(n² · d)
    rnn = n * d ** 2         # Recurrent       O(n · d²)
    cnn = k * n * d ** 2     # Convolutional   O(k · n · d²)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5.4),
                             gridspec_kw={'width_ratios': [1.25, 1]})
    fig.patch.set_facecolor(C['bg'])

    # ---- 左：复杂度曲线 ----
    ax = axes[0]
    ax.plot(n, sa, linewidth=2.4, color='#6A1B9A',
            label='Self-Attention   O(n² · d)')
    ax.plot(n, rnn, linewidth=2.4, color='#2E7D32',
            label='Recurrent          O(n · d²)')
    ax.plot(n, cnn, linewidth=2.4, color='#E65100',
            label='Convolutional    O(k · n · d²)')
    ax.set_xscale('log'); ax.set_yscale('log')
    ax.set_xlabel('序列长度 n（对数刻度）', fontsize=10.5)
    ax.set_ylabel('每层计算量（对数刻度）', fontsize=10.5)
    ax.set_title('每层计算复杂度：交叉点在 n ≈ d = 512',
                 fontsize=11.5, color=C['text'], pad=10)
    ax.grid(alpha=0.25, linestyle='--', which='both')
    ax.legend(fontsize=9.5, loc='upper left', framealpha=0.92)
    ax.tick_params(labelsize=9)

    ax.axvline(d, color=C['accent_red'], linestyle=':', linewidth=1.6, alpha=0.8)
    ax.text(d * 1.12, sa[-1] * 0.45, 'n = d = 512', fontsize=9,
            color=C['accent_red'], va='center')
    ax.annotate('n < d：循环网络更省', xy=(150, rnn[32]), fontsize=9,
                color=C['accent_green'], ha='left', va='center',
                xytext=(45, 3.5e5),
                arrowprops=dict(arrowstyle='->', color=C['accent_green'], lw=1))
    ax.annotate('n > d：自注意力反超', xy=(1600, sa[-1] * 0.25), fontsize=9,
                color='#6A1B9A', ha='center',
                xytext=(700, sa[-1] * 0.006),
                arrowprops=dict(arrowstyle='->', color='#6A1B9A', lw=1))

    # ---- 右：最大路径长度 ----
    ax2 = axes[1]
    N = 100
    names = ['Self-Attention', 'Convolutional', 'Recurrent']
    vals = [1, np.log(N) / np.log(k), N]
    colors = ['#6A1B9A', '#E65100', '#2E7D32']
    ypos = np.arange(len(names))[::-1]
    ax2.barh(ypos, vals, color=colors, alpha=0.85, height=0.52)
    for yp, v in zip(ypos, vals):
        label = f'{v:.0f}' if abs(v - round(v)) < 0.05 else f'{v:.1f}'
        ax2.text(v * 1.25, yp, label, va='center', fontsize=10,
                 color=C['text'], fontweight='bold')
    ax2.set_yticks(ypos)
    ax2.set_yticklabels(names, fontsize=10.5)
    ax2.set_xscale('log')
    ax2.set_xlabel('前向 / 反向信号需要经过的最大路径长度（对数刻度）', fontsize=10)
    ax2.set_title(f'最大路径长度对比（n = {N}，卷积核 k = {k}）',
                  fontsize=11.5, color=C['text'], pad=10)
    ax2.set_xlim(0.7, N * 4)
    ax2.grid(alpha=0.25, linestyle='--', axis='x')
    ax2.tick_params(labelsize=9)

    fig.text(0.5, 0.004,
             '数据来源：《Attention Is All You Need》(arXiv:1706.03762) Table 1',
             ha='center', fontsize=8.5, color=C['text_muted'])

    fig.tight_layout()
    save(fig, 'attention-complexity-comparison.png')


# ============================================================
# 图 6: Multi-Head 子空间分解
# ============================================================
def create_multi_head():
    fig, ax = plt.subplots(figsize=(14, 7.4))
    ax.set_xlim(0, 14); ax.set_ylim(1.0, 7.6); ax.axis('off')
    fig.patch.set_facecolor(C['bg'])

    head_colors = ['#1976D2', '#2E7D32', '#E65100', '#6A1B9A',
                   '#C62828', '#00838F', '#5D4037', '#AD1457']
    head_labels = ['语法依存', '代词指代', '局部搭配', '语义角色',
                   '时态一致', '位置邻近', '词形变化', '领域实体']

    HX0, HX1 = 2.70, 6.50          # Head 框左右边界
    TOP, DY, HH = 6.60, 0.72, 0.50
    BUS_L, BUS_R = 2.15, 6.95      # 左右两条竖直总线的 x
    mid_y = TOP - (len(head_labels) - 1) * DY / 2

    # ---- 输入 X ----
    rounded_box(ax, 0.45, mid_y - 0.72, 1.10, 1.44,
                C['emb_bg'], C['emb_border'], lw=1.5)
    ax.text(1.00, mid_y + 0.22, 'X', ha='center', va='center', fontsize=13,
            color=C['text'], fontweight='bold', zorder=3)
    ax.text(1.00, mid_y - 0.30, 'n × 512', ha='center', va='center',
            fontsize=7.5, color=C['text_muted'], zorder=3)

    # X → 左侧总线
    arrow(ax, 1.58, mid_y, BUS_L, mid_y, lw=1.6)
    ax.text((1.58 + BUS_L) / 2, mid_y + 0.20, '切分', ha='center', va='bottom',
            fontsize=8.5, color=C['text_light'])

    ax.plot([BUS_L, BUS_L], [TOP, TOP - 7 * DY], color=C['arrow'],
            linewidth=1.4, zorder=1)

    # ---- 8 个头 ----
    for i, (lab, col) in enumerate(zip(head_labels, head_colors)):
        y = TOP - i * DY
        arrow(ax, BUS_L, y, HX0, y, lw=1.2, color=col)
        rounded_box(ax, HX0, y - HH / 2, HX1 - HX0, HH, col + '14', col, lw=1.4)
        ax.text(HX0 + 0.22, y, f'Head {i + 1}', ha='left', va='center',
                fontsize=9, color=C['text'], fontweight='bold', zorder=3)
        ax.text(HX0 + 1.35, y, 'd_k = 64', ha='left', va='center',
                fontsize=8.2, color=C['text_light'], zorder=3)
        ax.text(HX0 + 2.50, y, lab, ha='left', va='center',
                fontsize=8.2, color=col, zorder=3)
        arrow(ax, HX1, y, BUS_R, y, lw=1.2, color=col)

    ax.plot([BUS_R, BUS_R], [TOP, TOP - 7 * DY], color=C['arrow'],
            linewidth=1.4, zorder=1)

    # ---- Concat → W_O → Z ----
    arrow(ax, BUS_R, mid_y, 7.55, mid_y, lw=1.8, color=C['accent_purple'])
    ax.text((BUS_R + 7.55) / 2, mid_y + 0.20, 'Concat', ha='center',
            va='bottom', fontsize=9, color=C['text'], fontweight='bold')

    rounded_box(ax, 7.55, mid_y - 0.75, 1.30, 1.50,
                C['attn_bg'], C['attn_border'], lw=1.6)
    ax.text(8.20, mid_y + 0.22, 'W_O', ha='center', va='center', fontsize=11,
            color=C['text'], fontweight='bold', zorder=3)
    ax.text(8.20, mid_y - 0.28, '512 × 512', ha='center', va='center',
            fontsize=7.5, color=C['text_muted'], zorder=3)

    arrow(ax, 8.85, mid_y, 9.40, mid_y, lw=1.8, color=C['accent_purple'])
    rounded_box(ax, 9.40, mid_y - 0.72, 1.10, 1.44,
                C['attn_bg'], C['attn_border'], lw=1.6)
    ax.text(9.95, mid_y + 0.22, 'Z', ha='center', va='center', fontsize=13,
            color=C['text'], fontweight='bold', zorder=3)
    ax.text(9.95, mid_y - 0.30, 'n × 512', ha='center', va='center',
            fontsize=7.5, color=C['text_muted'], zorder=3)

    # ---- 右侧说明 ----
    notes = [
        ('为什么要多头？', C['accent_purple'], 11),
        ('单个注意力头只能输出一种「加权平均」模式，', C['text'], 9),
        ('把 512 维切成 8 个 64 维子空间并行做注意力，', C['text'], 9),
        ('模型就能同时关注不同类型的依赖关系。', C['text'], 9),
        ('', C['text'], 5),
        ('关键：多头不是把计算量翻 8 倍。', C['accent_red'], 9.5),
        ('每个头只处理 d_model / h 维，', C['text'], 9),
        ('8 个头合起来的总计算量与单头 d_model 维相当。', C['text'], 9),
        ('', C['text'], 5),
        ('h = 8、d_k = d_v = 64 是原论文 base 模型的配置，', C['text_muted'], 8.5),
        ('big 模型用 h = 16、d_k = d_v = 64。', C['text_muted'], 8.5),
    ]
    y = 6.75
    for text, color, size in notes:
        if text:
            ax.text(10.90, y, text, fontsize=size, color=color, va='center')
        y -= 0.40

    save(fig, 'multi-head-subspace.png')


# ============================================================
# 图 3: 真实 BERT 注意力权重热力图（可选，依赖模型）
# ============================================================
def create_attention_heatmap():
    try:
        import torch
        from transformers import AutoTokenizer, AutoModel
    except ImportError:
        print('  [SKIP] 未安装 torch / transformers，跳过注意力热力图')
        return

    model_name = 'bert-base-uncased'
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name, attn_implementation='eager')
        model.eval()
    except Exception as exc:                      # noqa: BLE001
        print(f'  [SKIP] 无法加载 {model_name}：{exc}')
        return

    sentence = "The animal did not cross the street because it was too tired"
    inputs = tokenizer(sentence, return_tensors='pt')
    tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])

    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)

    num_layers = len(outputs.attentions)
    animal_idx = tokens.index('animal')
    it_idx = tokens.index('it')

    # 在所有层 / 所有头中搜索「it 关注 animal 权重最大」的那一个。
    # 这个头通常就是负责代词指代消解的头，比固定取最后一层更有代表性。
    best = (0.0, 0, 0)                              # (权重, 层索引, 头索引)
    for li, layer_attn in enumerate(outputs.attentions):
        scores = layer_attn[0][:, it_idx, animal_idx]
        hi = int(torch.argmax(scores).item())
        w = float(scores[hi])
        if w > best[0]:
            best = (w, li, hi)

    weight, layer_idx, head_idx = best
    matrix = outputs.attentions[layer_idx][0][head_idx].numpy()
    print(f'  选中 第 {layer_idx + 1} 层 / Head {head_idx + 1}，'
          f'it → animal 权重 {weight:.3f}')

    # 去掉 [CLS] / [SEP] 便于阅读
    keep = [i for i, t in enumerate(tokens) if t not in ('[CLS]', '[SEP]')]
    matrix = matrix[np.ix_(keep, keep)]
    labels = [tokens[i] for i in keep]

    fig, ax = plt.subplots(figsize=(11, 9))
    fig.patch.set_facecolor(C['bg'])
    im = ax.imshow(matrix, cmap='Blues', vmin=0, vmax=matrix.max())
    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=60, ha='right', fontsize=10)
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlabel('Key（被关注的词）', fontsize=11)
    ax.set_ylabel('Query（正在处理的词）', fontsize=11)
    ax.set_title(f'BERT 第 {layer_idx + 1} 层（共 {num_layers} 层）'
                 f' / Head {head_idx + 1} 的注意力权重\n'
                 f'输入："{sentence}"',
                 fontsize=12, color=C['text'], pad=14)

    # 标注 it → animal 的指代关系
    it_pos = labels.index('it') if 'it' in labels else None
    an_pos = labels.index('animal') if 'animal' in labels else None
    if it_pos is not None and an_pos is not None:
        ax.add_patch(Rectangle((an_pos - 0.5, it_pos - 0.5), 1, 1,
                               fill=False, edgecolor=C['accent_red'],
                               linewidth=2.2, zorder=5))
        ax.annotate(f'it → animal\n权重 {matrix[it_pos, an_pos]:.2f}',
                    xy=(an_pos + 0.45, it_pos), xytext=(an_pos + 3.4, it_pos + 1.5),
                    fontsize=10.5, color=C['accent_red'], fontweight='bold',
                    ha='left', va='center', zorder=6,
                    arrowprops=dict(arrowstyle='->', color=C['accent_red'], lw=1.7))
        ax.text(0.5, -0.235,
                f'读法：找到 "it" 所在的那一行 —— 这一行有 {matrix[it_pos, an_pos]:.0%} 的注意力'
                f'落在了 "animal" 上，模型正是靠它把代词指回先行词。',
                transform=ax.transAxes, ha='center', va='center',
                fontsize=10.5, color=C['text_light'])

    cb = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.02)
    cb.set_label('softmax 后的注意力权重', fontsize=10)
    cb.ax.tick_params(labelsize=9)

    fig.tight_layout()
    save(fig, 'attention-heatmap.png')


def create_evolution_timeline():
    """图 7  Transformer 九年演进：四阶段时间线（对应正文 §7）。"""
    phases = [
        ('2018 — 2020', '拆解成三种形态',
         ['BERT · Encoder-only · MLM',
          'GPT / GPT-3 · Decoder-only',
          'T5 · Encoder-Decoder · Span 去噪'],
         '回应：Encoder / Decoder 分工是否冗余',
         C['enc_bg'], C['enc_border'], C['accent_blue']),
        ('2020 — 2023', '效率之战',
         ['稀疏 / 线性注意力（Longformer…）',
          'FlashAttention · IO 感知 · 快 3~5×',
          'GQA / MQA · 共享一组 K/V'],
         '回应：O(n²) 的账单到了要还的时候',
         C['dec_bg'], C['dec_border'], C['accent_orange']),
        ('2021 — 2024', '位置编码重写',
         ['RoPE · 旋转 · 只依赖相对距离',
          'ALiBi · 线性偏置 · 强外推',
          'YaRN / 插值 · 4K → 32K+'],
         '回应：正弦编码一旦外推就失效',
         C['attn_bg'], C['attn_border'], C['accent_purple']),
        ('2025 —', '架构被重新提问',
         ['ViT · 16×16 patch · 跨模态',
          'Transformer 能力上限之问',
          'Mobius · 知识池与推理解耦'],
         '回应：注意力负责推理，知识放哪里',
         C['ffn_bg'], C['ffn_border'], C['accent_green']),
    ]

    fig, ax = plt.subplots(figsize=(13.5, 7.3))
    fig.patch.set_facecolor(C['bg'])
    ax.set_facecolor(C['bg'])
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 95.5, 'Transformer 九年演进：2018 → 2026',
            ha='center', va='center', fontsize=18, fontweight='bold',
            color=C['text'])

    ax.plot([4, 96], [86.5, 86.5], color=C['divider'], lw=2.2, zorder=1)

    col_w, gap, x0 = 21.7, 1.4, 2.6
    for i, (years, title, items, resp, bg, bd, ac) in enumerate(phases):
        x = x0 + i * (col_w + gap)
        cx = x + col_w / 2

        # 时间轴节点 + 年份
        ax.plot([cx], [86.5], marker='o', markersize=9,
                markerfacecolor=bd, markeredgecolor='white',
                markeredgewidth=1.6, zorder=3)
        ax.text(cx, 89.9, years, ha='center', va='center',
                fontsize=11, fontweight='bold', color=ac)

        # 阶段大卡片
        card_y, card_h = 34.0, 40.0
        rounded_box(ax, x, card_y, col_w, card_h, bg, bd, lw=1.5, pad=0.5)

        ax.text(cx, card_y + card_h - 4.6, title, ha='center', va='center',
                fontsize=12, fontweight='bold', color=ac, zorder=3)

        # 技术条目
        ty = card_y + card_h - 13.0
        for it in items:
            rounded_box(ax, x + 1.6, ty - 2.45, col_w - 3.2, 4.9,
                        'white', bd, lw=1.0, pad=0.28, z=3)
            ax.text(x + 2.9, ty, it, ha='left', va='center',
                    fontsize=7.9, color=C['text'], zorder=4)
            ty -= 8.3

        # 底部"回应"行（虚线框）
        ax.add_patch(FancyBboxPatch((x, 21.0), col_w, 7.5,
                     boxstyle="round,pad=0.4", facecolor='white',
                     edgecolor=bd, linewidth=1.1, zorder=3, linestyle='--'))
        ax.text(cx, 24.75, resp, ha='center', va='center',
                fontsize=8.4, color=ac, zorder=4, style='italic')

    ax.text(50, 12.5,
            '每一阶段都在回答前一阶段暴露的短板 —— 更长、更快，'
            '以及知识到底该存在哪里',
            ha='center', va='center', fontsize=10, color=C['text_light'])

    save(fig, 'transformer-evolution-timeline.png')


if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print('生成 Transformer 文章配图：')
    create_overview()
    create_scaled_dot_product()
    create_positional_encoding()
    create_complexity_comparison()
    create_multi_head()
    create_attention_heatmap()
    create_evolution_timeline()
    print('完成。')
