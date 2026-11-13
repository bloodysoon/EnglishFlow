// Supabase hashes passwords with bcrypt, which only uses the first 72 bytes.
// Kept free of Zod so client components can import it cheaply.
export const PASSWORD_MAX_LENGTH = 72;
