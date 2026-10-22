const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const target = new URL("/", baseUrl);

const rsc = await fetch(target, {
  headers: { RSC: "1", "Next-Router-Prefetch": "1" },
  cache: "no-store",
});
if (!rsc.ok || !rsc.headers.get("content-type")?.includes("text/x-component")) {
  throw new Error(`RSC 响应异常：${rsc.status} ${rsc.headers.get("content-type")}`);
}
await rsc.arrayBuffer();

const html = await fetch(target, { cache: "no-store" });
const contentType = html.headers.get("content-type") || "";
if (!html.ok || !contentType.includes("text/html") || contentType.includes("text/x-component")) {
  throw new Error(`普通请求被 RSC 响应污染：${html.status} ${contentType}`);
}
if (!html.headers.get("cache-control")?.includes("no-store")) {
  throw new Error("普通 HTML 未设置 no-store");
}

console.log("RSC/CDN 缓存隔离检查通过：普通请求仍返回 text/html 且 no-store。");
