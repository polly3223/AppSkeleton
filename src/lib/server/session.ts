import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { Session, SessionValidationResult, User } from './model.js';
import { sessions, users } from './mongo.js';
import type { RequestEvent } from '@sveltejs/kit';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const FIFTEEN_DAYS_IN_MS = DAY_IN_MS * 15;
const THIRTY_DAYS_IN_MS = DAY_IN_MS * 30;

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userId: string): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		_id: sessionId,
		userId,
		expiresAt: Date.now() + THIRTY_DAYS_IN_MS
	};
	const result = await sessions.insertOne(session);
	if (!result.acknowledged) {
		throw new Error("Failed to create session");
	}
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = await sessions.findOne({ _id: sessionId });

	if (!session) {
		return { session: null, user: null };
	}

	// Check if session is expired
	if (Date.now() >= session.expiresAt) {
		await sessions.deleteOne({ _id: session._id });
		return { session: null, user: null };
	}

	// Check if we need to extend the session (if less than 15 days remaining)
	if (Date.now() >= session.expiresAt - FIFTEEN_DAYS_IN_MS) {
		const newExpiresAt = Date.now() + THIRTY_DAYS_IN_MS;
		await sessions.updateOne({ _id: sessionId }, { $set: { expiresAt: newExpiresAt } });
		session.expiresAt = newExpiresAt;
	}

	const user = await users.findOne({ _id: session.userId });
	if (!user) {
		return { session: null, user: null };
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	const result = await sessions.deleteOne({ _id: sessionId });
	if (!result.acknowledged) {
		throw new Error("Failed to invalidate session");
	}
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		maxAge: 0
	});
}

export async function createUser(googleId: string, email: string, name: string, picture: string): Promise<User> {
	const user: User = {
		_id: crypto.randomUUID(), // Generate a unique ID
		googleId,
		email,
		name,
		picture
	};

	const result = await users.insertOne(user);
	if (!result.acknowledged) {
		throw new Error("Failed to create user");
	}

	return user;
}

export async function getUserFromGoogleId(googleId: string): Promise<User | null> {
	const user = await users.findOne({ googleId });
	return user;
}