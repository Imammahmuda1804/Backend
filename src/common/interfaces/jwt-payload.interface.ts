/**
 * JWT Payload interface
 * Struktur data yang di-encode ke dalam JWT token
 */
export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
