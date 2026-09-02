import { type User } from "@clerk/backend";

/**
 * `username` is nullable in Clerk: an instance only guarantees one if the Username attribute is
 * enabled and required, so accounts created through email or OAuth often have none. `firstName`
 * is carried through as a display fallback for those accounts.
 */
export const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    imageUrl: user.imageUrl,
  };
};
