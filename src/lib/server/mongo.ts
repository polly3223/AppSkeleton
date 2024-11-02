import { SECRET_DB_NAME, SECRET_MONGO_CONNECTION } from '$env/static/private';
import { MongoClient } from 'mongodb';
import type { User, Session } from './model';

const client = new MongoClient(SECRET_MONGO_CONNECTION, {});
const db = client.db(SECRET_DB_NAME, { ignoreUndefined: true });

export const users = db.collection<User>('users');
export const sessions = db.collection<Session>('sessions');

