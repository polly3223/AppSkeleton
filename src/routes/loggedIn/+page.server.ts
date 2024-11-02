import { fail, redirect } from "@sveltejs/kit";
import { invalidateSession, deleteSessionTokenCookie } from "$lib/server/session";
import type { Actions } from "./$types";

export const actions: Actions = {
    default: async (event) => {
        if (event.locals.session === null) {
            return fail(401);
        }
        await invalidateSession(event.locals.session._id);
        deleteSessionTokenCookie(event);
        throw redirect(302, "/login");
    }
};
