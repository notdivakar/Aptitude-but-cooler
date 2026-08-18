export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/practice/:path*", "/mistakes/:path*", "/leaderboard/:path*", "/profile/:path*", "/admin/:path*"],
};
