// Struktur payload yang disimpan di JWT.
export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
