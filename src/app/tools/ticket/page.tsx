"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import TicketPreview, { type TicketInfo } from "@/components/TicketPreview";


const DEFAULT_TICKET: TicketInfo = {
  serial: "283K104567",
  gate: "5A",
  fromStation: "上海虹桥",
  fromPinyin: "Shanghaihongqiao",
  toStation: "南京南",
  toPinyin: "Nanjingnan",
  trainCode: "G2025",
  dateTime: "2023-10-01 08:30",
  carriage: "07",
  seatNumber: "12F",
  berthType: "",
  price: "443.5",
  seatType: "一等座",
  idNumber: "3201021990****5678",
  passengerName: "张三",
  footerInfo: "65773311920607K104567",
  discountType: "",
  style: "blue",
  invoiceNo: "",
  electronicTicketNo: "",
  issueDate: "",
};

const SEAT_TYPES = [
  "一等座", "二等座", "商务座", "特等座",
  "无座", "硬座", "软座", "新空调硬座", "硬卧代硬座",
  "软卧", "硬卧", "动卧", "高级软卧", "一等卧", "二等卧",
];
const SLEEPER_TYPES = ["软卧", "硬卧", "动卧", "高级软卧", "一等卧", "二等卧"];
const DISCOUNT_OPTIONS = [
  { value: "", label: "无优惠" },
  { value: "student", label: "学生票（学+惠）" },
  { value: "child", label: "儿童票（儿）" },
  { value: "military", label: "残疾军人票（军）" },
  { value: "disabled", label: "残疾人票（残）" },
  { value: "elder", label: "老人优惠票（老）" },
  { value: "discount", label: "普通优惠票（惠）" },
  { value: "group", label: "团体票（团）" },
  { value: "worker-group", label: "务工团体票（工）" },
];

export default function TicketPage() {
  const [ticket, setTicket] = useState<TicketInfo>(DEFAULT_TICKET);
  const [exporting, setExporting] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [showBetaNotice, setShowBetaNotice] = useState(true);
  const [seatLetter, setSeatLetter] = useState("A");
  const ticketRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (field: keyof TicketInfo, value: string) =>
      setTicket((prev) => ({ ...prev, [field]: value })),
    []
  );

  // 当发票号码/电子客票号/开票日期变化时，自动计算票号和底部售票信息
  useEffect(() => {
    const { electronicTicketNo, invoiceNo, issueDate } = ticket;
    setTicket((prev) => {
      let next = { ...prev };
      if (electronicTicketNo.length >= 12) {
        const serial = electronicTicketNo.slice(3, 12);
        if (serial !== prev.serial) next = { ...next, serial };
        if (electronicTicketNo.length >= 12 && invoiceNo.length >= 5 && issueDate.length >= 10) {
          const part1 = electronicTicketNo.slice(0, 5);
          const part2 = invoiceNo.slice(-5);
          const monthDay = issueDate.slice(5, 7) + issueDate.slice(8, 10);
          const part4 = electronicTicketNo.slice(5, 12);
          const footerInfo = part1 + part2 + monthDay + part4;
          if (footerInfo !== prev.footerInfo) next = { ...next, footerInfo };
        }
      }
      return next;
    });
  }, [ticket.electronicTicketNo, ticket.invoiceNo, ticket.issueDate]);

  const handleParse = useCallback(async () => {
    const text = rawText.trim();
    if (!text) return;
    setParsing(true);
    setImportStatus("正在 AI 智能解析...");
    try {
      const res = await fetch("/api/tools/ticket/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `请求失败 (${res.status})`);
      }
      const { data: parsed } = await res.json();
      console.log("[车票解析] AI解析结果:", parsed);
      setTicket((prev) => ({ ...prev, ...parsed }));
      const fieldCount = Object.keys(parsed).filter(
        (k) => parsed[k] && parsed[k] !== ""
      ).length;
      setImportStatus(
        fieldCount > 0
          ? `解析完成，已填充 ${fieldCount} 个字段`
          : "未识别到有效字段，请检查文本内容"
      );
    } catch (err) {
      console.error("解析失败:", err);
      setImportStatus("解析失败：" + (err instanceof Error ? err.message : "请手动填写"));
    }
    setParsing(false);
  }, [rawText]);

  // ======== 下载 PDF ========
  const handleDownloadPDF = useCallback(async () => {
    setExporting(true);
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 100));
    const el = document.getElementById("ticket-face");
    if (!el) { setExporting(false); return; }
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [53.98, 85.6] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 85.6, 53.98);
      pdf.addPage();
      pdf.save(`火车票_${ticket.trainCode}_${ticket.passengerName}.pdf`);
    } catch (e) {
      console.error("PDF 生成失败:", e);
    }
    setExporting(false);
  }, [ticket]);

  const handlePrint = useCallback(() => window.print(), []);

  const isSleeper = SLEEPER_TYPES.includes(ticket.seatType);
  const isDaiyingzuo = ticket.seatType === "硬卧代硬座";

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 85.6mm 53.98mm landscape;
            margin: 0;
          }
          nav, footer, button, form, .no-print { display: none !important; }
          body { background: white !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ticket-back {
            display: block !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="no-print mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">车票生成器</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            粘贴 12306 电子发票原始文本，AI 智能识别并填充车票信息
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ======== 表单区 ======== */}
          <div className="no-print w-full lg:w-[420px] lg:shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              {/* 文本识别区 */}
              <div className="mb-5">
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setImportStatus("");
                  }}
                  placeholder="在这里输入待识别文本"
                  rows={6}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={handleParse}
                  disabled={parsing || !rawText.trim()}
                  className="mt-2 w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {parsing ? "解析中..." : "智能解析"}
                </button>
                {importStatus && (
                  <p className={`mt-2 text-center text-xs ${
                    importStatus.includes("失败") || importStatus.includes("未识别")
                      ? "text-red-500"
                      : "text-green-600 dark:text-green-400"
                  }`}>
                    {importStatus}
                  </p>
                )}
              </div>

              {/* 样式切换 */}
              <div className="mb-5 flex gap-2">
                <button
                  onClick={() => update("style", "blue")}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    ticket.style === "blue"
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  蓝色报销凭证
                </button>
                <button
                  onClick={() => update("style", "red")}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    ticket.style === "red"
                      ? "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  红色纪念票
                </button>
              </div>

              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">车票信息</h2>
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">

                {/* 出发/到达 */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">出发 / 到达</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="出发站">
                      <input className="input-sm" value={ticket.fromStation} onChange={(e) => update("fromStation", e.target.value)} />
                    </Field>
                    <Field label="出发站拼音">
                      <input className="input-sm" value={ticket.fromPinyin} onChange={(e) => update("fromPinyin", e.target.value)} />
                    </Field>
                    <Field label="到达站">
                      <input className="input-sm" value={ticket.toStation} onChange={(e) => update("toStation", e.target.value)} />
                    </Field>
                    <Field label="到达站拼音">
                      <input className="input-sm" value={ticket.toPinyin} onChange={(e) => update("toPinyin", e.target.value)} />
                    </Field>
                  </div>
                </div>

                {/* 车次/时间 */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">车次 / 时间</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="车次">
                      <input className="input-sm" value={ticket.trainCode} onChange={(e) => update("trainCode", e.target.value)} />
                    </Field>
                    <Field label="日期时间">
                      <input type="datetime-local" className="input-sm"
                        value={ticket.dateTime.replace(" ", "T")}
                        onChange={(e) => update("dateTime", e.target.value.replace("T", " "))}
                      />
                    </Field>
                    <Field label="票号">
                      <input className="input-sm" value={ticket.serial} onChange={(e) => update("serial", e.target.value)} />
                    </Field>
                    <Field label="检票口">
                      <input className="input-sm" value={ticket.gate} onChange={(e) => update("gate", e.target.value)} />
                    </Field>
                  </div>
                </div>

                {/* 座位/价格 */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">座位 / 价格</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="车厢号">
                      <input className="input-sm" value={ticket.carriage} onChange={(e) => update("carriage", e.target.value)} />
                    </Field>
                    <Field label={isSleeper ? "铺位号" : "座位号"}>
                      {isDaiyingzuo ? (
                        <div className="flex gap-1">
                          <input
                            className="input-sm flex-1"
                            value={(() => { const s = ticket.seatNumber; return s && /[ABCD]$/.test(s) ? s.slice(0, -1) : s; })()}
                            onChange={(e) => update("seatNumber", e.target.value + seatLetter)}
                          />
                          <select
                            className="input-sm w-[52px]"
                            value={seatLetter}
                            onChange={(e) => {
                              setSeatLetter(e.target.value);
                              const s = ticket.seatNumber;
                              const base = s && /[ABCD]$/.test(s) ? s.slice(0, -1) : s || "";
                              update("seatNumber", base + e.target.value);
                            }}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      ) : (
                        <input className="input-sm" value={ticket.seatNumber} onChange={(e) => update("seatNumber", e.target.value)} />
                      )}
                    </Field>
                    {isSleeper && (
                      <Field label="铺位类型">
                        <select className="input-sm" value={ticket.berthType} onChange={(e) => update("berthType", e.target.value)}>
                          <option value="">选择铺位</option>
                          <option value="上">上铺</option>
                          <option value="中">中铺</option>
                          <option value="下">下铺</option>
                        </select>
                      </Field>
                    )}
                    <Field label="席别">
                      <select className="input-sm" value={ticket.seatType} onChange={(e) => update("seatType", e.target.value)}>
                        {SEAT_TYPES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </Field>
                    <Field label="票价 (元)">
                      <input className="input-sm" value={ticket.price} onChange={(e) => update("price", e.target.value)} />
                    </Field>
                    <Field label="优惠类型">
                      <select className="input-sm" value={ticket.discountType} onChange={(e) => update("discountType", e.target.value)}>
                        {DISCOUNT_OPTIONS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                      </select>
                    </Field>
                  </div>
                </div>

                {/* 乘客/售票 */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">乘客 / 售票</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="乘客姓名">
                      <input className="input-sm" value={ticket.passengerName} onChange={(e) => update("passengerName", e.target.value)} />
                    </Field>
                    <Field label="身份证号">
                      <input className="input-sm" value={ticket.idNumber} onChange={(e) => update("idNumber", e.target.value)} />
                    </Field>
                    <div className="col-span-2">
                      <Field label="电子客票号">
                        <input className="input-sm" value={ticket.electronicTicketNo} onChange={(e) => update("electronicTicketNo", e.target.value)} placeholder="如 20750A6*********541562025" />
                      </Field>
                    </div>
                    <Field label="发票号码">
                      <input className="input-sm" value={ticket.invoiceNo} onChange={(e) => update("invoiceNo", e.target.value)} placeholder="如 26419**********19624" />
                    </Field>
                    <div className="col-span-2">
                      <Field label="开票日期">
                        <input type="date" className="input-sm" value={ticket.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="底部售票信息（自动计算）">
                        <input className="input-sm" value={ticket.footerInfo} onChange={(e) => update("footerInfo", e.target.value)} placeholder="自动拼接生成" />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* 导出按钮 */}
              <div className="mt-5 flex gap-3">
                <button onClick={handleDownloadPDF} className="flex-1 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600">
                  下载 PDF
                </button>
                <button onClick={handlePrint} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  直接打印
                </button>
              </div>
            </div>
          </div>

          {/* ======== 车票预览区 ======== */}
          <div className="flex-1" ref={ticketRef}>
            <div className="sticky top-24">
              <div className="no-print mb-3 flex items-center gap-3">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">预览</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.style === "blue"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {ticket.style === "blue" ? "报销凭证样式" : "纪念票样式"}
                </span>
              </div>
              <TicketPreview ticket={ticket} exporting={exporting} />
            </div>
          </div>
        </div>
      </div>

      {/* 实验性功能悬浮提醒 */}
      {showBetaNotice && (
        <div className="no-print fixed bottom-6 right-6 z-40 max-w-xs rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-lg shadow-amber-200/50 backdrop-blur-sm transition-opacity dark:border-amber-700 dark:bg-amber-900/90 dark:shadow-amber-700/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-800">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">实验性功能</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                此工具尚在试验阶段，AI 解析和票面效果可能不够完美，仅供娱乐参考。
              </p>
            </div>
            <button
              onClick={() => setShowBetaNotice(false)}
              className="shrink-0 rounded-lg p-1 text-amber-400 transition-colors hover:bg-amber-100 hover:text-amber-600 dark:text-amber-500 dark:hover:bg-amber-800 dark:hover:text-amber-300"
              aria-label="关闭提醒"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  );
}

