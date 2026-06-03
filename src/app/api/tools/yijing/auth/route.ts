import { NextResponse } from "next/server";
import { createAuthToken, validatePassword, verifyToken } from "@/lib/auth/route-auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!validatePassword(password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }
    const token = createAuthToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  const token = auth.slice(7);
  const valid = verifyToken(token);
  if (!valid) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  return NextResponse.json({ valid: true });
}
