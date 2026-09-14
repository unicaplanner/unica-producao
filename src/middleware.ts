import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

// Libera a rota de login, a de logout, os assets do Next e o endpoint do
// cron (que tem sua propria autenticacao via CRON_SECRET, checada na rota).
const PUBLIC_PATHS = ["/login", "/api/login", "/api/cron"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
