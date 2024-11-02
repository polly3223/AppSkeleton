import { generateSessionToken, createSession, setSessionTokenCookie, getUserFromGoogleId, createUser } from "$lib/server/session";
import { google } from "$lib/server/oauth";
import { decodeIdToken } from "arctic";

import type { RequestEvent } from "@sveltejs/kit";
import type { OAuth2Tokens } from "arctic";

type GoogleClaims = {
	sub?: string;
	email?: string;
	name?: string;
	picture?: string;
	[key: string]: unknown;  // for other potential claims
}

function validateGoogleClaims(claims: GoogleClaims) {
	if (!claims.sub || typeof claims.sub !== 'string' ||
		!claims.email || typeof claims.email !== 'string' ||
		!claims.name || typeof claims.name !== 'string') {
		return null;
	}

	return {
		googleId: claims.sub,
		email: claims.email,
		name: claims.name,
		picture: claims.picture && typeof claims.picture === 'string'
			? claims.picture
			: "https://example.com/default-avatar.png"
	};
}

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("google_oauth_state");
	const codeVerifier = event.cookies.get("google_code_verifier");

	if (!code || !state || !storedState || !codeVerifier) {
		return new Response("Missing required parameters", { status: 400 });
	}

	if (state !== storedState) {
		return new Response("Invalid state", { status: 400 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		return new Response("Invalid authorization code", { status: 400 });
	}

	const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
	const profile = validateGoogleClaims(claims);
	if (!profile) {
		return new Response("Invalid profile data", { status: 400 });
	}

	const existingUser = await getUserFromGoogleId(profile.googleId);
	const user = existingUser || await createUser(
		profile.googleId,
		profile.email,
		profile.name,
		profile.picture
	);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user._id);
	setSessionTokenCookie(event, sessionToken, new Date(session.expiresAt));

	return new Response(null, {
		status: 302,
		headers: {
			Location: "/loggedIn"
		}
	});
}