import { auth } from "@/auth";
import { getPostingStatus } from "@/lib/postingRules";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const status = getPostingStatus(userId);
  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
