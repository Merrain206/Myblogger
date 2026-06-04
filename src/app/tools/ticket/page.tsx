"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  "无座", "不对号入座", "硬座", "软座", "新空调硬座", "硬卧代硬座",
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
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [showBetaNotice, setShowBetaNotice] = useState(true);
  const [showGate, setShowGate] = useState(true);
  const [seatLetter, setSeatLetter] = useState("A");
  const ticketRef = useRef<HTMLDivElement>(null);
  const [batchTickets, setBatchTickets] = useState<{ ticket: TicketInfo; backRotated: boolean }[]>([]);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [isSinglePrinting, setIsSinglePrinting] = useState(false);
  const [backRotated, setBackRotated] = useState(false);

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

  const handlePrint = useCallback(async () => {
    setIsSinglePrinting(true);

    // 等待打印专用 DOM 渲染完成
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 400));

    const cleanup = () => setIsSinglePrinting(false);
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  }, [ticket]);

  // ======== 批量导出 ========
  const addToBatch = useCallback(() => {
    setBatchTickets((prev) => [...prev, { ticket: { ...ticket }, backRotated }]);
  }, [ticket, backRotated]);

  const removeFromBatch = useCallback((index: number) => {
    setBatchTickets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearBatch = useCallback(() => setBatchTickets([]), []);

  const handleBatchPrint = useCallback(async () => {
    if (batchTickets.length === 0) return;
    setIsBatchPrinting(true);

    // 等待打印专用 DOM 渲染完成
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 500));

    const cleanup = () => setIsBatchPrinting(false);
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  }, [batchTickets]);

  const isSleeper = SLEEPER_TYPES.includes(ticket.seatType);
  const isDaiyingzuo = ticket.seatType === "硬卧代硬座";
  const isNotSeated = ticket.seatType === "不对号入座";

  const printPageSize = (isBatchPrinting || isSinglePrinting)
    ? "A4 portrait"
    : "85.6mm 53.98mm landscape";

  const printPageMargin = (isBatchPrinting || isSinglePrinting) ? "3mm" : "0";

  return (
    <>
      <style>{`@page { size: ${printPageSize}; margin: ${printPageMargin}; }`}</style>
      <style jsx global>{`
        .input-sm { width: 103%; }

        /* 打印专用元素：屏幕隐藏 */
        .print-only { display: none; }

        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          nav, footer, button, form, .no-print { display: none !important; }
          body { background: white !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-only { display: block !important; }

          /* A4 竖版页面 */
          .print-a4-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            overflow: hidden;
            page-break-after: always;
          }
          .print-a4-page:last-child { page-break-after: avoid; }

          /* 批量：四角各一槽位，物理尺寸 */
          .print-ticket-slot {
            position: absolute;
            width: 85.6mm;
            height: 107.96mm;
            overflow: hidden;
            contain: strict;
          }
          .print-ticket-slot > div {
            width: 856px !important;
            transform: scale(0.378) !important;
            transform-origin: 0 0 !important;
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

              {/* 检票口开关 */}
              <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">显示检票口</span>
                <button
                  onClick={() => setShowGate((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${showGate ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showGate ? "left-4 translate-x-0.5" : "left-0.5"}`} />
                </button>
              </div>

              {/* 背面旋转开关 */}
              <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">背面旋转 180°</span>
                <button
                  onClick={() => setBackRotated((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${backRotated ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${backRotated ? "left-4 translate-x-0.5" : "left-0.5"}`} />
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
                    {!isNotSeated && (
                      <Field label="车厢号">
                        <input className="input-sm" value={ticket.carriage} onChange={(e) => update("carriage", e.target.value)} />
                      </Field>
                    )}
                    {!isNotSeated && (
                      <Field label={isSleeper ? "铺位号" : "座位号"}>
                        {isDaiyingzuo ? (
                          <div className="flex gap-1">
                            <input
                              className="input-sm"
                              style={{ width: 80 }}
                              value={(() => { const s = ticket.seatNumber; return s && /[ABCD]$/.test(s) ? s.slice(0, -1) : s; })()}
                              onChange={(e) => update("seatNumber", e.target.value + seatLetter)}
                            />
                            <select
                              className="input-sm !w-[52px]"
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
                          <input className="input-sm" style={{ width: 80 }} value={ticket.seatNumber} onChange={(e) => update("seatNumber", e.target.value)} />
                        )}
                      </Field>
                    )}
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
                    <Field label="席别" className={isNotSeated ? "col-span-2" : undefined}>
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
                        <input className="input-sm" style={{ width: 280 }} value={ticket.electronicTicketNo} onChange={(e) => update("electronicTicketNo", e.target.value)} placeholder="如 20750A6*********541562025" />
                      </Field>
                    </div>
                    <Field label="发票号码">
                      <input className="input-sm" style={{ width: 280 }} value={ticket.invoiceNo} onChange={(e) => update("invoiceNo", e.target.value)} placeholder="如 26419**********19624" />
                    </Field>
                    <div className="col-span-2">
                      <Field label="开票日期">
                        <input type="date" style={{ width: 150 }} className="input-sm" value={ticket.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
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

              {/* 打印按钮 */}
              <div className="mt-5">
                <button onClick={handlePrint} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  直接打印
                </button>
              </div>

              {/* 批量导出 */}
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  onClick={addToBatch}
                  disabled={batchTickets.length >= 4}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                >
                  {batchTickets.length >= 4 ? "已满（最多 4 张）" : "+ 加入批量列表"}
                </button>

                {batchTickets.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        批量列表 ({batchTickets.length} 张)
                      </span>
                      <button
                        onClick={clearBatch}
                        className="text-xs text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                      >
                        清空列表
                      </button>
                    </div>

                    <div className="max-h-[240px] space-y-1.5 overflow-y-auto">
                      {batchTickets.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50"
                        >
                          <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{item.ticket.fromStation}</span>
                            <span className="mx-1 text-slate-400">→</span>
                            <span className="font-medium">{item.ticket.toStation}</span>
                            <span className="ml-2 text-slate-500">{item.ticket.trainCode}</span>
                            <span className="ml-2 text-slate-500">{item.ticket.dateTime.slice(0, 10)}</span>
                            <span className="ml-2 text-slate-500">{item.ticket.passengerName}</span>
                            <span className="ml-2 text-slate-500">{item.ticket.seatType}</span>
                            <span className="ml-1 text-slate-500">¥{item.ticket.price}</span>
                            {item.backRotated && (
                              <span className="ml-2 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">背面已旋转</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromBatch(i)}
                            className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleBatchPrint}
                      disabled={isBatchPrinting}
                      className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      批量打印 ({batchTickets.length} 张)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======== 车票预览区 ======== */}
          <div className="flex-1 no-print" ref={ticketRef}>
            <div className="sticky top-24">
              {(isSinglePrinting || isBatchPrinting) && (
                <div className="no-print mb-3 rounded-lg bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  {isSinglePrinting
                    ? "正在准备打印，请在弹出的打印对话框中确认..."
                    : `正在准备批量打印 ${batchTickets.length} 张车票，请在弹出的打印对话框中确认...`}
                </div>
              )}
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
              <TicketPreview ticket={ticket} exporting={false} showGate={showGate} backRotated={backRotated} />
            </div>
          </div>
        </div>
      </div>

      {/* 单张打印专用 DOM：屏幕隐藏，打印时可见，位置与批量第一张一致 */}
      {isSinglePrinting && (
        <div className="print-only">
          <div className="print-a4-page">
            <div className="print-ticket-slot" style={{ top: "8mm", left: "14mm" }}>
              <div style={{ width: 856 }}>
                <TicketPreview ticket={ticket} exporting={true} showGate={showGate} idPrefix="single-print" backRotated={backRotated} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量打印专用 DOM：A4 竖版，四角各一张车票正反面 */}
      {isBatchPrinting && (
        <div className="print-only">
          {Array.from({ length: Math.ceil(batchTickets.length / 4) }).map((_, pageIdx) => (
            <div key={pageIdx} className="print-a4-page">
              {[0, 1, 2, 3].map((slot) => {
                const ticketIdx = pageIdx * 4 + slot;
                if (ticketIdx >= batchTickets.length) return null;
                const item = batchTickets[ticketIdx];
                // 固定四角定位：上排 top=8mm，下排 top=8+107.96+20=135.96mm
                const POSITIONS: React.CSSProperties[] = [
                  { top: "8mm", left: "14mm" },
                  { top: "8mm", right: "14mm" },
                  { top: "135.96mm", left: "14mm" },
                  { top: "135.96mm", right: "14mm" },
                ];
                return (
                  <div key={slot} className="print-ticket-slot" style={POSITIONS[slot]}>
                    <div style={{ width: 856 }}>
                      <TicketPreview ticket={item.ticket} exporting={true} showGate={showGate} idPrefix={`batch-print-${ticketIdx}`} backRotated={item.backRotated} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

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
                此工具尚在试验阶段，AI 解析和票面效果可能不够完美，仅供娱乐参考；严禁用于非法用途，请遵守相关法律法规。
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block${className ? " " + className : ""}`}>
      <span className="mb-0.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  );
}

