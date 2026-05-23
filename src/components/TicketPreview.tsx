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
}: {
  ticket: TicketInfo;
  exporting: boolean;
}) {
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
  const bgImage = isBlue ? "url('/bluebg.png')" : "url('/redbg.png')";
  const bgColor = isBlue ? "transparent" : "white";

  const showHeader = isBlue;

  return (
    <div
      ref={wrapperRef}
      className="w-full"
      style={{ aspectRatio: `${BASE_WIDTH}/${BASE_HEIGHT}` }}
    >
      <div
        className="relative origin-top-left"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: exporting ? "none" : `scale(${scale})`,
          backgroundImage: bgImage,
          backgroundColor: bgColor,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "contain",
        }}
      >
        {/* 条纹底纹 */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
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

        <div
          id="ticket-face"
          className="ticket-face relative z-10 flex h-full w-full flex-col overflow-hidden rounded-[14px] border border-[#b8cfe0]"
          style={{
            padding: isBlue ? "5px 60px 0 50px" : "50px 60px 0 60px",
            fontFamily: "'SimSun','宋体','PingFang SC','Microsoft YaHei',serif",
            fontWeight: 600,
            color: "#291e1e",
          }}
        >
          {/* ======== 顶部：票号 / 检票口 (仅蓝色) ======== */}
          {showHeader && (
            <div
              className="flex items-center justify-between"
              style={{ fontSize: 35, letterSpacing: 0.3 }}
            >
              <div className="font-semibold text-[#e35757]">{ticket.serial}</div>
              <div>检票：{ticket.gate}</div>
            </div>
          )}

          {/* ======== 主体内容区 ======== */}
          <div className="flex-1">
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
              <div className="flex flex-col items-center">
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
                <div style={{ fontSize: 50, lineHeight: 1, paddingBottom: 4 }}>
                  {ticket.trainCode}
                </div>
                <div className="relative mt-[6px] h-3 w-full">
                  <div className="h-[4px] w-full bg-[#291e1e]" />
                  <div
                    className="absolute -top-[7px] right-0 h-4 w-4"
                    style={{
                      borderTop: "4px solid #291e1e",
                      borderRight: "4px solid #291e1e",
                      transform: "rotate(45deg)",
                    }}
                  />
                </div>
              </div>

              {/* 到站 */}
              <div className="flex flex-col items-center">
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
              <div>
                {dt.year}
                <span style={{ fontSize: 24 }}>年</span>
                {dt.month}
                <span style={{ fontSize: 24 }}>月</span>
                {dt.day}
                <span style={{ fontSize: 24 }}>日</span>
                {dt.time}
                <span style={{ fontSize: 24 }}>开</span>
              </div>
              <div>
                {ticket.carriage}
                <span style={{ fontSize: 24 }}>车</span>
                {ticket.seatNumber}
                <span style={{ fontSize: 24 }}>号</span>
                {ticket.berthType && (
                  <>
                    {ticket.berthType}
                    <span style={{ fontSize: 24 }}>铺</span>
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
                ￥{ticket.price}
                <span style={{ fontSize: 24 }}>元</span>
              </div>
              <div className="flex gap-[6px]">
                {discountBadges.map((text, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center rounded-full border-[3px] border-[#291e1e] text-center leading-none"
                    style={{ width: 36, height: 36, fontSize: 24 }}
                  >
                    {text}
                  </span>
                ))}
              </div>
              <div className="flex items-center" style={{ gap: 12 }}>
                {ticket.seatType}
              </div>
            </div>

            <p className="text-[30px] text-[#666]">
              <br />
            </p>
            <p className="text-[30px] text-[#666]">仅供纪念使用</p>

            {/* ======== 底部区域：信息 + 二维码 ======== */}
            <div
              className="relative mt-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 170px",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 35 }}>
                  {ticket.idNumber} {ticket.passengerName}
                </div>

                {/* 虚线框提示语 */}
                <div
                  className="mx-[28px] p-[2px] text-center"
                  style={{
                    fontSize: 24,
                    marginTop: -6,
                    backgroundImage: `
                      repeating-linear-gradient(to right, #291e1e, #291e1e 15px, transparent 15px, transparent 23px),
                      repeating-linear-gradient(to bottom, #291e1e, #291e1e 15px, transparent 15px, transparent 23px),
                      repeating-linear-gradient(to right, #291e1e, #291e1e 15px, transparent 15px, transparent 23px),
                      repeating-linear-gradient(to bottom, #291e1e, #291e1e 15px, transparent 15px, transparent 23px)
                    `,
                    backgroundSize: "100% 2px, 2px 100%, 100% 2px, 2px 100%",
                    backgroundPosition: "top left, top right, bottom left, top left",
                    backgroundRepeat: "no-repeat",
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
                    style={{ fontSize: 30, marginLeft: -40, height: 52 }}
                  >
                    {ticket.footerInfo}
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
              className="absolute bottom-0 left-0 flex h-[52px] items-center"
              style={{ width: 856, paddingLeft: 50, fontSize: 30 }}
            >
              {ticket.footerInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
