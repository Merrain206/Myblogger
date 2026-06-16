"""
生成博客文章中的 PNG 图表。
替代内联 SVG，用标准 Markdown ![](path) 引用，彻底避免 MDX 花括号解析问题。
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patches as patches
import numpy as np
import os

# === 中文字体配置 ===
plt.rcParams['font.sans-serif'] = ['Noto Sans SC', 'Microsoft YaHei', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), 'public', 'images', 'blog')

# 通用颜色方案
C = {
    'bg': '#FAFAFA',
    'offline_bg': '#E8F5E9', 'offline_border': '#66BB6A',
    'online_bg': '#E3F2FD', 'online_border': '#64B5F6',
    'llm_bg': '#FFF8E1', 'llm_border': '#FFB74D',
    'pink_bg': '#FCE4EC', 'pink_border': '#F48FB1',
    'purple_bg': '#F3E5F5', 'purple_border': '#BA68C8',
    'text': '#263238', 'text_light': '#546E7A', 'text_muted': '#90A4AE',
    'arrow': '#78909C', 'arrow_bold': '#546E7A',
    'accent_blue': '#1976D2', 'accent_green': '#2E7D32',
    'accent_orange': '#E65100', 'accent_red': '#C62828',
    'accent_purple': '#6A1B9A',
    'number_bg': '#1976D2',
    'divider': '#CFD8DC',
}


def rounded_box(ax, x, y, w, h, bg, border, lw=1.5, pad=0.15, z=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle=f"round,pad={pad}", facecolor=bg,
                 edgecolor=border, linewidth=lw, zorder=z))


def arrow(ax, x1, y1, x2, y2, color=None, lw=1.5):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
                 arrowstyle='->', mutation_scale=12,
                 facecolor=color or C['arrow'], edgecolor=color or C['arrow'],
                 linewidth=lw, zorder=1))


def num_circle(ax, x, y, n, r=0.28, bg=None):
    ax.add_patch(plt.Circle((x, y), r, facecolor=bg or C['number_bg'],
                 edgecolor='white', linewidth=1.5, zorder=3))
    ax.text(x, y, str(n), ha='center', va='center', fontsize=9,
            fontweight='bold', color='white', zorder=4)


# ============================================================
# 图 1: RAG 检索增强生成流程图
# ============================================================
def create_rag_flow():
    fig, ax = plt.subplots(figsize=(14, 6.2), dpi=150)
    ax.set_xlim(0, 14); ax.set_ylim(0, 6.2); ax.axis('off')
    ax.set_facecolor(C['bg'])
    ax.add_patch(patches.Rectangle((0.1, 0.1), 13.8, 6.0, linewidth=1,
                 edgecolor='#E0E0E0', facecolor='none', zorder=0))

    # 阶段标题
    ax.text(0.6, 5.8, '▎离线阶段（文档预处理）', fontsize=11, color=C['text_light'],
            fontweight='bold', va='center')
    ax.text(0.6, 3.08, '▎在线阶段（实时查询）', fontsize=11, color=C['text_light'],
            fontweight='bold', va='center')

    # 分隔线
    ax.axhline(y=3.55, xmin=0.05, xmax=0.98, color=C['divider'],
               linewidth=1, linestyle='--', zorder=0)
    ax.text(7.0, 3.78, '▼ 在线查询阶段 ▼', fontsize=9,
            color=C['text_muted'], ha='center', va='center')

    # 离线阶段盒子
    box_h, bw_s, bw_m = 1.0, 1.8, 2.2
    yo = 4.4  # y_offline
    yn = 2.2  # y_online

    # Box 1: 文档切割
    x = 0.8
    rounded_box(ax, x, yo, bw_s, box_h, C['offline_bg'], C['offline_border'])
    num_circle(ax, x + 0.25, yo + 0.75, 1)
    ax.text(x + 0.9, yo + 0.65, '文档切割', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 0.9, yo + 0.30, '按语义分 chunk', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 1→2
    arrow(ax, x + bw_s, yo + 0.5, x + bw_s + 0.6, yo + 0.5)

    # Box 2: Embedding
    x = 3.4
    rounded_box(ax, x, yo, bw_m, box_h, C['offline_bg'], C['offline_border'])
    num_circle(ax, x + 0.25, yo + 0.75, 2)
    ax.text(x + 1.1, yo + 0.65, 'Embedding', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 1.1, yo + 0.30, '文本 → 向量', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 2→3
    arrow(ax, x + bw_m, yo + 0.5, x + bw_m + 0.6, yo + 0.5)

    # Box 3: 向量数据库
    x = 6.2
    rounded_box(ax, x, yo, bw_m, box_h, C['offline_bg'], C['offline_border'])
    num_circle(ax, x + 0.25, yo + 0.75, 3)
    ax.text(x + 1.1, yo + 0.65, '向量数据库', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 1.1, yo + 0.30, '持久化存储', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # 就绪标记
    rx = x + bw_m + 0.4
    rounded_box(ax, rx, yo + 0.25, 1.2, 0.5, '#C8E6C9', C['offline_border'], 1, 0.1)
    ax.text(rx + 0.6, yo + 0.5, '就绪 ✓', fontsize=8,
            color=C['accent_green'], ha='center', va='center', fontweight='bold')

    # online boxes
    # Box 4: 用户提问
    x = 0.5
    rounded_box(ax, x, yn, 1.7, box_h, C['online_bg'], C['online_border'])
    num_circle(ax, x + 0.25, yn + 0.75, 4)
    ax.text(x + 0.85, yn + 0.65, '用户提问', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 0.85, yn + 0.30, '自然语言输入', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 4→5
    arrow(ax, x + 1.7, yn + 0.5, x + 1.7 + 0.6, yn + 0.5)

    # Box 5: Query Embed
    x = 2.8
    rounded_box(ax, x, yn, bw_s, box_h, C['online_bg'], C['online_border'])
    num_circle(ax, x + 0.25, yn + 0.75, 5)
    ax.text(x + 0.9, yn + 0.65, 'Query Embed', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 0.9, yn + 0.30, '问题向量化', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 5→6
    arrow(ax, x + bw_s, yn + 0.5, x + bw_s + 0.6, yn + 0.5)

    # Box 6: 向量检索
    x = 5.2
    rounded_box(ax, x, yn, bw_m, box_h, C['online_bg'], C['online_border'])
    num_circle(ax, x + 0.25, yn + 0.75, 6)
    ax.text(x + 1.1, yn + 0.65, '向量检索', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 1.1, yn + 0.30, 'ANN 查 Top-K', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 6→7 (bold)
    arrow(ax, x + bw_m, yn + 0.5, x + bw_m + 0.6, yn + 0.5, C['arrow_bold'], 2)

    # Box 7: LLM 生成
    x = 8.0
    rounded_box(ax, x, yn, bw_m, box_h, C['llm_bg'], C['llm_border'])
    num_circle(ax, x + 0.25, yn + 0.75, 7, bg=C['accent_orange'])
    ax.text(x + 1.1, yn + 0.65, 'LLM 生成', fontsize=10, fontweight='bold',
            color=C['text'], va='center', ha='center')
    ax.text(x + 1.1, yn + 0.30, 'Prompt + 片段', fontsize=8,
            color=C['text_light'], va='center', ha='center')

    # Arrow 7→答案
    arrow(ax, x + bw_m, yn + 0.5, x + bw_m + 0.6, yn + 0.5, C['arrow_bold'], 2)

    # 答案
    ax_x = x + bw_m + 0.8
    rounded_box(ax, ax_x, yn + 0.2, 1.0, 0.6, C['llm_bg'], C['llm_border'], 1.5, 0.1)
    ax.text(ax_x + 0.5, yn + 0.5, '答案', fontsize=11, fontweight='bold',
            color=C['text'], ha='center', va='center')

    # DB → 检索 虚线
    ax.annotate('', xy=(6.3, yn + 1.0),
                xytext=(7.3, yo),
                arrowprops=dict(arrowstyle='->', color=C['accent_green'],
                                lw=1.5, linestyle='dashed'), zorder=1)
    ax.text(6.9, 3.65, '向量 DB 读取', fontsize=8, color=C['accent_green'],
            ha='center', va='center')

    plt.tight_layout(pad=0.5)
    out = os.path.join(OUTPUT_DIR, 'rag-flow.png')
    fig.savefig(out, dpi=150, bbox_inches='tight', facecolor=C['bg'], edgecolor='none')
    plt.close(fig)
    print(f'[OK] {out}')


# ============================================================
# 图 2: 涌现能力 S 曲线图
# ============================================================
def create_emergence_curves():
    fig, ax = plt.subplots(figsize=(12, 6.5), dpi=150)
    ax.set_facecolor(C['bg'])
    fig.patch.set_facecolor(C['bg'])

    x = np.linspace(0, 1, 200)

    def sigmoid(xi, th, steep=15, mx=1.0):
        return mx / (1 + np.exp(-steep * (xi - th)))

    curves = [
        (0.22, '#1976D2', '翻译', 0.95),
        (0.40, '#388E3C', '角色扮演', 0.90),
        (0.55, '#E65100', '上下文学习', 0.85),
        (0.68, '#6A1B9A', '工具使用', 0.80),
        (0.80, '#C62828', '多步推理', 0.70),
    ]

    for th, color, label, mx in curves:
        y = np.array([sigmoid(xi, th, 15, mx) for xi in x])
        ax.plot(x, y, color=color, linewidth=2.5, label=label, zorder=3)
        idx = np.argmin(np.abs(x - th))
        ax.scatter([x[idx]], [y[idx]], color='#D32F2F', s=40, zorder=5,
                   edgecolors='white', linewidth=0.8)

    # 涌现临界点标注
    ax.annotate('涌现临界点', xy=(0.22, sigmoid(0.22, 0.22, 15, 0.95)),
                xytext=(0.06, 0.85), fontsize=9, color=C['accent_red'],
                arrowprops=dict(arrowstyle='->', color=C['accent_red'], lw=1.2), ha='center')

    # 临界区域高亮
    ax.axvspan(0.30, 0.45, alpha=0.08, color='#EF5350', zorder=0)
    ax.text(0.375, 0.02, '临界区', fontsize=9, color=C['accent_red'],
            ha='center', fontweight='bold', transform=ax.get_xaxis_transform())

    # 坐标轴
    ax.set_xlabel('模型规模（参数量）→', fontsize=11, color=C['text_light'], labelpad=8)
    ax.set_ylabel('能力强度', fontsize=11, color=C['text_light'], labelpad=8)
    ax.set_xticks([0.0, 0.25, 0.5, 0.75, 1.0])
    ax.set_xticklabels(['$10^8$', '$10^9$', '$10^{10}$', '$10^{11}$', '$10^{12}$'],
                       fontsize=9, color=C['text_muted'])
    ax.set_ylim(-0.05, 1.05)
    ax.set_yticks([0, 0.5, 1.0])
    ax.set_yticklabels(['0', '0.5', '1.0'], fontsize=9, color=C['text_muted'])

    # 美化
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(C['divider'])
    ax.spines['bottom'].set_color(C['divider'])
    ax.tick_params(colors=C['text_muted'])
    ax.grid(True, alpha=0.3, color=C['divider'], linewidth=0.5)

    legend = ax.legend(loc='lower right', fontsize=9, framealpha=0.9,
                       edgecolor=C['divider'], facecolor='white')
    legend.get_frame().set_linewidth(0.5)

    ax.set_title('大模型涌现能力：量变引起质变', fontsize=13, fontweight='bold',
                 color=C['text'], pad=12)

    plt.tight_layout(pad=0.5)
    out = os.path.join(OUTPUT_DIR, 'emergence-curves.png')
    fig.savefig(out, dpi=150, bbox_inches='tight', facecolor=C['bg'], edgecolor='none')
    plt.close(fig)
    print(f'[OK] {out}')


# ============================================================
# 图 3: 大模型调度中心架构图
# ============================================================
def create_llm_orchestration():
    fig, ax = plt.subplots(figsize=(14, 6.5), dpi=150)
    ax.set_xlim(0, 14); ax.set_ylim(0, 6.5); ax.axis('off')
    ax.set_facecolor(C['bg'])
    ax.add_patch(patches.Rectangle((0.1, 0.1), 13.8, 6.3, linewidth=1,
                 edgecolor='#E0E0E0', facecolor='none', zorder=0))

    # 中心：大模型
    cx, cy = 7.0, 3.25
    cw, ch = 4.0, 1.8
    rounded_box(ax, cx - cw/2, cy - ch/2, cw, ch, C['online_bg'],
                C['accent_blue'], 2.2, 0.3)
    ax.text(cx, cy + 0.4, '大模型', fontsize=14, fontweight='bold',
            color=C['accent_blue'], ha='center', va='center')
    ax.text(cx, cy - 0.05, '调度中心 / Agent 大脑', fontsize=10,
            color=C['text_light'], ha='center', va='center')
    ax.text(cx, cy - 0.45, '理解意图 · 规划步骤 · 编排工具', fontsize=9,
            color=C['text_muted'], ha='center', va='center')

    # 四个工具模块
    tw, th = 2.6, 1.1
    tools = [
        (1.2, 5.0, '[搜] 搜索工具', 'Web Search · 知识库检索', C['offline_bg'], C['offline_border']),
        (10.2, 5.0, '[算] 计算工具', '代码执行 · 数学运算', C['llm_bg'], C['llm_border']),
        (1.2, 1.0, '[库] 数据库工具', 'SQL · 向量检索', C['pink_bg'], C['pink_border']),
        (10.2, 1.0, '[连] 第三方 API', '天气 · 邮件 · 支付', C['purple_bg'], C['purple_border']),
    ]

    tcs = []
    for tx, ty, label, sub, bg, border in tools:
        rounded_box(ax, tx, ty, tw, th, bg, border, 1.3, 0.15)
        ax.text(tx + tw/2, ty + 0.65, label, fontsize=10, fontweight='bold',
                color=C['text'], ha='center', va='center')
        ax.text(tx + tw/2, ty + 0.25, sub, fontsize=8, color=C['text_light'],
                ha='center', va='center')
        tcs.append((tx + tw/2, ty + th/2))

    # 连线
    for tcx, tcy in tcs:
        ax.plot([tcx, cx], [tcy, cy], color=C['arrow'], linewidth=1.2,
                linestyle='--', zorder=0, alpha=0.7)
        mx, my = (tcx + cx)/2, (tcy + cy)/2
        ax.plot(mx, my, 'o', color=C['arrow'], markersize=3, zorder=1)

    # 左侧标注：Scaling Laws
    ax.text(0.3, 3.25, 'Scaling\nLaws\n保障', fontsize=10, fontweight='bold',
            color=C['accent_blue'], ha='center', va='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                      edgecolor=C['accent_blue'], linewidth=1.2, alpha=0.9))
    ax.plot([0.8, 0.8], [1.6, 4.8], color=C['accent_blue'], linewidth=1.2, zorder=0)

    # 右侧标注：Function Calling
    ax.text(13.7, 3.25, 'Function\nCalling\n扩展', fontsize=10, fontweight='bold',
            color=C['accent_green'], ha='center', va='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                      edgecolor=C['accent_green'], linewidth=1.2, alpha=0.9))
    ax.plot([13.2, 13.2], [1.6, 4.8], color=C['accent_green'], linewidth=1.2, zorder=0)

    # 底部注释
    ax.text(7.0, 0.35, '内部推理能力', fontsize=9, color=C['text_muted'],
            ha='center', va='center')
    ax.text(7.0, 0.15, '外部能力边界', fontsize=9, color=C['text_muted'],
            ha='center', va='center')

    plt.tight_layout(pad=0.5)
    out = os.path.join(OUTPUT_DIR, 'llm-orchestration.png')
    fig.savefig(out, dpi=150, bbox_inches='tight', facecolor=C['bg'], edgecolor='none')
    plt.close(fig)
    print(f'[OK] {out}')


if __name__ == '__main__':
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    create_rag_flow()
    create_emergence_curves()
    create_llm_orchestration()
    print('\nAll charts generated!')
