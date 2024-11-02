import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";

const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get("session") ?? null;
	if (token === null) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);
	if (session !== null) {
		setSessionTokenCookie(event, token, new Date(session.expiresAt));
	} else {
		deleteSessionTokenCookie(event);
	}

    event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle = sequence(authHandle);