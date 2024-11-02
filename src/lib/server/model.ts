export type User = {
    _id: string;
	email: string;
	googleId: string;
	name: string;
	picture: string;
}

export type Session = {
    _id: string;
    userId: string;
    expiresAt: number;
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };