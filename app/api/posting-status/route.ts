import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPostingStatus } from "@/lib/postingRules";

// Always compute fresh status (no static caching)
export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const session = await auth();
		const userId = session?.user?.id;

		if (!userId) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		const status = getPostingStatus(userId);

		// Minimal fields required by the client hook plus some extras for potential UI
		return NextResponse.json({
			success: true,
			postsRemaining: status.postsRemaining,
			timeLeftInWindowSeconds: status.timeLeftInWindowSeconds ?? null,
			hasPostedInWindow: status.hasPostedInWindow,
			postsSinceLatestMoment: status.postsSinceLatestMoment,
			latestMomentStart: status.latestMomentStart,
			elapsedSeconds: status.elapsedSeconds,
			config: status.config,
		});
	} catch (err: any) {
		console.error("/api/posting-status error", err);
		return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
	}
}

