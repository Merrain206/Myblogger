"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";

export interface TicketInfo {
  serial: string;
  gate: string;
  fromStation: string;
  fromPinyin: string;
  toStation: string;
  toPinyin: string;
  trainCode: string;
  dateTime: string;
  carriage: string;
  seatNumber: string;
  berthType: string;
  price: string;
  seatType: string;
  idNumber: string;
  passengerName: string;
  footerInfo: string;
  discountType: string;
  style: "blue" | "red";
  invoiceNo: string;
  electronicTicketNo: string;
  issueDate: string;
}

/** 票号 = 电子客票号第4-12位 */
function computeSerial(electronicTicketNo: string): string {
  if (electronicTicketNo.length >= 12) {
    return electronicTicketNo.slice(3, 12);
  }
  return "";
}

/** 底部售票信息 = 电子客票号前5位 + 发票号码最后5位 + 开票日期月日 + 电子客票号第6-12位 */
function computeFooterInfo(invoiceNo: string, electronicTicketNo: string, issueDate: string): string {
  if (electronicTicketNo.length >= 12 && invoiceNo.length >= 5 && issueDate.length >= 10) {
    const part1 = electronicTicketNo.slice(0, 5);
    const part2 = invoiceNo.slice(-5);
    const monthDay = issueDate.slice(5, 7) + issueDate.slice(8, 10);
    const part4 = electronicTicketNo.slice(5, 12);
    return part1 + part2 + monthDay + part4;
  }
  return "";
}

const BASE_WIDTH = 856;
const BASE_HEIGHT = 540;

const VALID_TYPES = [
  "student", "discount", "child", "elder", "military", "disabled",
  "group", "worker-group", "student-group", "",
];

function getDiscountTexts(discountType: string): string[] {
  const texts: string[] = [];
  const types = discountType ? [discountType] : [];
  types.forEach((type) => {
    switch (type) {
      case "student": texts.push("学", "惠"); break;
      case "discount": texts.push("惠"); break;
      case "child": texts.push("儿"); break;
      case "elder": texts.push("老"); break;
      case "military": texts.push("军"); break;
      case "disabled": texts.push("残"); break;
      case "group": texts.push("团"); break;
      case "worker-group": texts.push("工"); break;
      case "student-group": texts.push("学", "团"); break;
      default:
        if (type && !VALID_TYPES.includes(type)) texts.push(type);
    }
  });
  return texts;
}

function parseDateTime(dateTime: string) {
  return {
    year: dateTime.slice(0, 4),
    month: dateTime.slice(5, 7),
    day: dateTime.slice(8, 10),
    time: dateTime.slice(11),
  };
}

export default function TicketPreview({
  ticket,
  exporting,
  showGate,
  idPrefix,
  backRotated = false,
}: {
  ticket: TicketInfo;
  exporting: boolean;
  showGate: boolean;
  idPrefix?: string;
  backRotated?: boolean;
}) {
  const faceId = idPrefix ? `${idPrefix}-face` : "ticket-face";
  const backId = idPrefix ? `${idPrefix}-back` : "ticket-back";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [qrSvg, setQrSvg] = useState("");

  const updateScale = useCallback(() => {
    if (wrapperRef.current) {
      setScale(wrapperRef.current.clientWidth / BASE_WIDTH);
    }
  }, []);

  useEffect(() => {
    QRCode.toString("https://merrain.cn/tools/ticket", {
      type: "svg",
      margin: 0,
      width: 148,
      color: { light: "#00000000" },
    }).then(setQrSvg).catch(() => {});
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const dt = parseDateTime(ticket.dateTime);
  const discountBadges = getDiscountTexts(ticket.discountType);
  const isBlue = ticket.style === "blue";
  const bgSrc = isBlue ? "/bluebg.png" : "/redbg.png";

  const displaySerial = ticket.electronicTicketNo.length >= 12
    ? computeSerial(ticket.electronicTicketNo)
    : ticket.serial;
  const displayFooterInfo = ticket.electronicTicketNo.length >= 12 && ticket.invoiceNo.length >= 5 && ticket.issueDate.length >= 10
    ? computeFooterInfo(ticket.invoiceNo, ticket.electronicTicketNo, ticket.issueDate)
    : ticket.footerInfo;

  const showHeader = isBlue;

  const isDaiyingzuo = ticket.seatType === "硬卧代硬座";
  const seatLetter = isDaiyingzuo && /[ABCD]$/.test(ticket.seatNumber) ? ticket.seatNumber.slice(-1) : "";
  const seatNum = isDaiyingzuo && seatLetter ? ticket.seatNumber.slice(0, -1) : ticket.seatNumber;

  return (
    <div
      ref={wrapperRef}
      className="w-full"
      style={{ aspectRatio: `${BASE_WIDTH}/${BASE_HEIGHT * 2}` }}
    >
      <div
        className="flex flex-col origin-top-left"
        style={{
          width: BASE_WIDTH,
          transform: exporting ? "none" : `scale(${scale})`,
        }}
      >
        <div
          id={faceId}
          className="ticket-face relative z-10 flex flex-col overflow-hidden rounded-[14px] border border-[#b8cfe0]"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            padding: isBlue ? "5px 60px 0 50px" : "20px 60px 0 60px",
            fontFamily: "'SimSun','宋体','PingFang SC','Microsoft YaHei',serif",
            fontWeight: 600,
            color: "#291e1e",
            backgroundColor: isBlue ? "transparent" : "white",
          }}
        >
          {/* 背景图层: 用 img 标签替代 CSS background-image, html2canvas 对 img 渲染更可靠 */}
          <img
            src={bgSrc}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            style={{ objectFit: "cover" }}
          />
          {/* 条纹底纹 */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                rgba(180,200,220,0.3) 0px,
                rgba(180,200,220,0.3) 1px,
                transparent 1px,
                transparent 4px
              )`,
              backgroundSize: "4px 4px",
            }}
          />

          {/* ======== 顶部：票号 / 检票口 ======== */}
          <div
            className="relative z-10 flex items-center justify-between"
            style={{ fontSize: 36, letterSpacing: 1 }}
          >
            <div className="font-semibold text-[#e35757]">{displaySerial}</div>
            {showGate && <div>检票：{ticket.gate}</div>}
          </div>

          {/* ======== 主体内容区 ======== */}
          <div className="relative z-20 flex-1" style={{ isolation: "isolate" }}>
            {/* 第一行：发站 / 车次+箭头 / 到站 */}
            <div
              className="grid items-center px-[20px]"
              style={{
                gridTemplateColumns: "1fr auto 1fr",
                gap: 10,
                paddingLeft: 20,
                paddingRight: 20,
              }}
            >
              {/* 发站 */}
              <div className="flex flex-col items-center" style={{ marginLeft: -40 }}>
                <div className="flex items-center">
                  <span
                    className="station-name"
                    style={{
                      fontSize: 50,
                      fontFamily: "'SimHei','黑体','SimSun','PingFang SC',sans-serif",
                      fontWeight: 500,
                      maxWidth: 280,
                      minWidth: ticket.fromStation.length === 2 ? 145 : "auto",
                      textAlign: ticket.fromStation.length === 2 ? "justify" : "left",
                      textAlignLast: ticket.fromStation.length === 2 ? "justify" : "auto",
                      letterSpacing: ticket.fromStation.length === 3 ? 5 : "normal",
                    }}
                  >
                    {ticket.fromStation}
                  </span>
                  <span style={{ fontSize: 35, padding: "0 4px" }}>站</span>
                </div>
                <div style={{ fontSize: 26, marginLeft: 10, marginTop: -10 }}>
                  {ticket.fromPinyin}
                </div>
              </div>

              {/* 车次 + 箭头 */}
              <div className="flex flex-col items-center justify-center">
                <div style={{ fontSize: 50, lineHeight: 0.5, paddingBottom: 2, fontFamily: "'Mongolian Baiti', 'SimSun', serif", fontWeight: 400, letterSpacing: 2 }}>
                  {ticket.trainCode}
                </div>
                <div className="relative h-4 w-full" style={{ marginTop: 1, width: 145 }}>
                  <div className="absolute bottom-0 left-0 h-[2px] bg-[#291e1e]" style={{ width: 145 }} />
                  <div
                    className="absolute bottom-0 right-0 bg-[#291e1e]"
                    style={{
                      width: 21,
                      height: 2,
                      transform: "rotate(20deg)",
                      transformOrigin: "right bottom",
                    }}
                  />
                </div>
              </div>

              {/* 到站 */}
              <div className="flex flex-col items-center" style={{ marginRight: -40 }}>
                <div className="flex items-center">
                  <span
                    className="station-name"
                    style={{
                      fontSize: 50,
                      fontFamily: "'SimHei','黑体','SimSun','PingFang SC',sans-serif",
                      fontWeight: 500,
                      maxWidth: 280,
                      minWidth: ticket.toStation.length === 2 ? 145 : "auto",
                      textAlign: ticket.toStation.length === 2 ? "justify" : "left",
                      textAlignLast: ticket.toStation.length === 2 ? "justify" : "auto",
                      letterSpacing: ticket.toStation.length === 3 ? 5 : "normal",
                    }}
                  >
                    {ticket.toStation}
                  </span>
                  <span style={{ fontSize: 35, padding: "0 4px" }}>站</span>
                </div>
                <div style={{ fontSize: 26, marginLeft: 10, marginTop: -10 }}>
                  {ticket.toPinyin}
                </div>
              </div>
            </div>

            {/* 第二行：日期时间 / 车厢座位 */}
            <div
              className="flex justify-between mt-[-10px]"
              style={{ paddingRight: 100, fontSize: 35 }}
            >
              <div className="flex">
                <span className="inline-flex items-baseline justify-center px-[4px]" style={{ minWidth: 100 }}>
                  <span>{dt.year}</span>
                  <span style={{ fontSize: 24 }}>年</span>
                </span>
                <span className="inline-flex items-baseline justify-center px-[4px]" style={{ minWidth: 64 }}>
                  <span>{dt.month}</span>
                  <span style={{ fontSize: 24 }}>月</span>
                </span>
                <span className="inline-flex items-baseline justify-center px-4px]" style={{ minWidth: 64 }}>
                  <span>{dt.day}</span>
                  <span style={{ fontSize: 24 }}>日</span>
                </span>
                <span className="inline-flex items-baseline justify-center px-[5px]" style={{ minWidth: 118 }}>
                  <span>{dt.time}</span>
                  <span style={{ fontSize: 24 }}>开</span>
                </span>
              </div>
              <div style={["软卧", "硬卧", "动卧", "高级软卧", "一等卧", "二等卧"].includes(ticket.seatType) ? { display: "inline-block", transform: "translateX(35px)" } : undefined}>
                {ticket.seatType === "不对号入座" ? (
                  <span style={{ display: "inline-block", transform: "translateX(40px)" }}>{ticket.seatType}</span>
                ) : (
                  <>
                    {ticket.carriage}
                    <span style={{ fontSize: 24 }}>车</span>
                    {seatNum}
                    {ticket.seatNumber !== "无座" && (
                      <span style={{ fontSize: 24 }}>号</span>
                    )}
                    {seatLetter}
                    {ticket.berthType && (
                      <>
                        {ticket.berthType}
                        <span style={{ fontSize: 24 }}>铺</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 第三行：票价 / 优惠标识 / 座位类型 */}
            <div
              className="flex items-center justify-between mt-[-10px]"
              style={{ paddingRight: 100, fontSize: 35 }}
            >
              <div>
                <span style={{ fontWeight: 400 }}>￥</span>{ticket.price}
                <span style={{ fontSize: 24 }}>元</span>
              </div>
              <div className="flex gap-[6px]">
                {discountBadges.map((text, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center rounded-full border-[3px] border-[#291e1e] text-center leading-none"
                    style={{ width: 44, height: 44, fontSize: 26 }}
                  >
                    {text}
                  </span>
                ))}
              </div>
              {ticket.seatType !== "不对号入座" && (
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span style={ticket.seatType === "新空调硬座" || ticket.seatType === "硬卧代硬座" ? { display: "inline-block", transform: "translateX(60px)" } : ticket.seatType === "高级软卧" ? { display: "inline-block", transform: "translateX(40px)" } : undefined}>
                    {ticket.seatType}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[30px] text-[#666]">
              <br />
            </p>
            <p className="text-[30px] text-[#666] m-0 leading-none">仅供纪念使用</p>

            {/* ======== 底部区域：信息 + 二维码 ======== */}
            <div
              className="relative"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 170px",
                gap: 16,
              }}
            >
              <div className="relative z-10">
                <div style={{ fontSize: 35 }}>
                  {ticket.idNumber} {ticket.passengerName}
                </div>

                {/* 虚线框提示语 */}
                <div
                  className="absolute z-10 left-[25px] right-[25px] p-[2px] text-center"
                  style={{
                    bottom: 9,
                    fontSize: 24,
                    border: "2px dashed #291e1e",
                    borderRadius: 4,
                  }}
                >
                  {showHeader ? (
                    <>
                      <p>报销凭证 遗失不补</p>
                      <p>退票改签时须交回车站</p>
                    </>
                  ) : (
                    <>
                      <p>买票请到12306 发货请到95306</p>
                      <p>中国铁路祝您旅途愉快</p>
                    </>
                  )}
                </div>

                {!showHeader && (
                  <div
                    className="absolute z-10 flex items-center"
                    style={{ bottom: -40, width: 856, paddingLeft: 0, fontSize: 30 }}
                  >
                    {displayFooterInfo}  {ticket.fromStation}售
                  </div>
                )}
              </div>

              {/* 二维码 */}
              <div
                className="self-end justify-self-end"
                style={{ width: 148, height: 148, padding: 6 }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          </div>

          {/* ======== 底部出票信息 (仅蓝色) ======== */}
          {showHeader && (
            <div
              className="absolute bottom-0 left-0 z-10 flex h-[52px] items-center"
              style={{ width: 856, paddingLeft: 50, fontSize: 30 }}
            >
              {displayFooterInfo}  JM
            </div>
          )}
        </div>

        {/* 背面 */}
        {isBlue ? (
          <div
            id={backId}
            className="ticket-back"
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              borderRadius: 14,
              border: "1px solid #b8cfe0",
              backgroundColor: "#0a0a0b",
              color: "#6f8896",
              fontFamily: "'SimSun','宋体','PingFang SC','Microsoft YaHei',serif",
              padding: "28px 46px",
              fontSize: 23,
              lineHeight: 1.55,
              overflow: "hidden",
              transform: backRotated ? "rotate(180deg)" : undefined,
            }}
          >
            <h2 style={{ textAlign: "center", fontSize: 35, fontWeight: 600, margin: "0 0 12px 0", fontFamily: "'SimHei','黑体','PingFang SC',sans-serif" }}>
              报销凭证使用须知
            </h2>
            <p style={{ textIndent: "2em", margin: 0 }}>☆购票后如需报销凭证的，应在开车前或乘车日期之日起180日以内(含当日)，持购票时所使用的有效身份证件原件到车站售票窗口、自动售票机领取。</p>
            <p style={{ textIndent: "2em", margin: 0 }}>☆退票后如需退票费报销凭证，应在办理之日起180天以内(含当日)，持购票时所使用的有效身份证件原件到车站退票窗口领取。</p>
            <p style={{ textIndent: "2em", margin: 0 }}>☆报销凭证开具后请妥善保管，丢失后将无法办理补办申领手续。</p>
            <p style={{ textIndent: "2em", margin: 0 }}>☆已领取报销凭证的车票办理改签、退票或退款手续时，须交回报销凭证方可办理。</p>
            <p style={{ textIndent: "2em", margin: 0 }}>☆报销凭证不能作为乘车凭证使用。</p>
            <p style={{ textIndent: "2em", margin: 0 }}>☆未尽事宜见《国铁集团铁路旅客运输规程》等有关规定和车站公告。跨境旅客事宜见铁路跨境旅客相关运输组织规则和车站公告。</p>
          </div>
        ) : (
          <div
            id={backId}
            className="ticket-back"
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              borderRadius: 14,
              border: "1px solid #b8cfe0",
              backgroundColor: "#ffffff",
              color: "#080808",
              fontFamily: "'SimSun','宋体','PingFang SC','Microsoft YaHei',serif",
              padding: "40px 78px",
              fontSize: 19.5,
              lineHeight: 1.45,
              overflow: "visible",
              display: "flex",
              flexDirection: "column",
              transform: backRotated ? "rotate(180deg)" : undefined,
            }}
          >
            <p style={{ textIndent: "3em", margin: 0, flex: 1 }}>
              <span style={{ fontSize: 27, fontWeight: 600, fontFamily: "'SimHei','黑体','PingFang SC',sans-serif" }}>乘车须知：</span>
              ☆请妥善保管车票。☆请凭车票和本人有效身份证件原件乘车，如改签、变更到站或退票请提前办理。票、证、人不一致的，铁路部门有权拒绝进站乘车。直达票中途下车，未乘区间失效，通票中转需签证。☆免费携带品上限为成人20千克、儿童10千克、长宽高之和160厘米（动车组130厘米），超过上限请办理托运。不得携带可能威胁公共安全的禁止或限制运输物品、造成人身伤害的大件硬质物品、妨碍公共卫生及损坏污染车辆的物品。☆开车前提前停止检票，请提前到车站指定场所候车。☆对无票乘车、冒用身份信息购票及多次挂失车票有一票两用的，铁路部门保留限制购票等权利。☆遇运行图调整导致已购车票列车运行时刻变动的，铁路部门免费提供改签、变更到站及退票服务。☆遇灾害险情等特殊情况，须听从铁路工作人员指挥安排。☆12306.cn（含铁路12306手机客户端）是唯一官方网站，请勿通过其他网站技术手段抢票，以免遭受损失。☆未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。跨境旅客事宜详见铁路跨境旅客相关运输组织规则和车站公告。
            </p>
            <div style={{ height: 30, backgroundColor: "#080808", marginTop: 8, marginLeft: -78, marginRight: -78, flexShrink: 0 }} />
          </div>
        )}
      </div>
    </div>
  );
}
