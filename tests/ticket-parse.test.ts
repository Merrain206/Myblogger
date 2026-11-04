import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("车票解析提示词保留关键业务规则", async () => {
  const source = await readFile("src/app/api/tools/ticket/parse/route.ts", "utf8");
  const requiredRules = [
    "乘车日期优先取实际乘车日期，不是开票日期",
    "开票日期是发票开具日期，与乘车日期不同",
    "票号取电子客票号第4至12位",
    "车厢和座位可能连写",
    "seatNumber填“无座”，seatType填“二等座”",
    "复合词，必须完整保留",
  ];

  for (const rule of requiredRules) {
    assert.equal(source.includes(rule), true, `缺少车票解析规则：${rule}`);
  }
});
