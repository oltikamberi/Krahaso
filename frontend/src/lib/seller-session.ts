/**
 * httpOnly cookie holding the backend-issued seller token. Never readable from
 * browser JS. Kept in its own module so `proxy.ts` can import it without
 * pulling in server-only APIs.
 */
export const SELLER_COOKIE = "krahaso_seller_token";
