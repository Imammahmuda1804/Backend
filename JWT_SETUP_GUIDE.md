# JWT Setup Guide

## Apa itu JWT Secret?

JWT (JSON Web Token) secret adalah kunci rahasia yang digunakan untuk:
1. **Menandatangani token** - Memastikan token tidak diubah
2. **Memverifikasi token** - Memvalidasi keaslian token
3. **Keamanan** - Mencegah token palsu

---

## Cara Generate JWT Secret

### 1. **Menggunakan Node.js** (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Output contoh:
```
be1d5fd2f1b29b566039258d6271cc87d00b666995ae6ded017d96d25549618cad4d3cc7c2b75af1ee74c2d275596cd92e306d0e1e458f5eea715e572c1d5d8a
```

### 2. **Menggunakan OpenSSL**

```bash
openssl rand -hex 64
```

### 3. **Menggunakan PowerShell (Windows)**

```powershell
# Generate 64 karakter random
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 4. **Menggunakan Python**

```python
import secrets
print(secrets.token_hex(64))
```

---

## Setup di Project Ini

### File `.env` Sudah Dikonfigurasi

File `.env` Anda sudah diupdate dengan JWT secrets yang aman:

```env
JWT_SECRET=be1d5fd2f1b29b566039258d6271cc87d00b666995ae6ded017d96d25549618cad4d3cc7c2b75af1ee74c2d275596cd92e306d0e1e458f5eea715e572c1d5d8a
JWT_REFRESH_SECRET=b71dc030b3624d4aa318cf427a8b34f3dcb3b74745817a3acf7d441e699b58599ec5753f04e349f6934e91195d0d811a2396668a9145a0979517b3d07cd33e51
```

### Konfigurasi JWT

| Variable | Nilai | Keterangan |
|----------|-------|------------|
| `JWT_SECRET` | 128 karakter hex | Secret untuk access token |
| `JWT_REFRESH_SECRET` | 128 karakter hex | Secret untuk refresh token |
| `JWT_EXPIRATION` | `15m` | Access token berlaku 15 menit |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token berlaku 7 hari |

---

## Cara Kerja JWT di Project Ini

### 1. **Login Flow**

```
User Login
    ↓
POST /api/auth/login
    ↓
Validate credentials
    ↓
Generate tokens:
  - access_token (15 menit)
  - refresh_token (7 hari)
    ↓
Return tokens to client
```

### 2. **Access Protected Endpoint**

```
Client Request
    ↓
Header: Authorization: Bearer <access_token>
    ↓
JwtAuthGuard validates token
    ↓
Extract user info (id, email, role)
    ↓
Allow access if valid
```

### 3. **Refresh Token Flow**

```
Access token expired
    ↓
POST /api/auth/refresh
Body: { refresh_token: "..." }
    ↓
Validate refresh token
    ↓
Generate new token pair
    ↓
Return new tokens
```

---

## Security Best Practices

### ✅ DO's

1. **Generate Strong Secrets**
   - Minimal 64 bytes (128 karakter hex)
   - Gunakan cryptographically secure random generator
   - Berbeda untuk access dan refresh token

2. **Keep Secrets Safe**
   - Jangan commit ke Git (sudah ada di `.gitignore`)
   - Simpan di environment variables
   - Gunakan secret management di production (AWS Secrets Manager, Azure Key Vault, dll)

3. **Token Expiration**
   - Access token: Short-lived (15 menit - 1 jam)
   - Refresh token: Long-lived (7 hari - 30 hari)

4. **Rotate Secrets**
   - Ganti secrets secara berkala di production
   - Gunakan secrets berbeda untuk dev/staging/production

### ❌ DON'Ts

1. **Jangan gunakan secrets yang lemah**
   ```
   ❌ JWT_SECRET=secret
   ❌ JWT_SECRET=12345678
   ❌ JWT_SECRET=myapp
   ```

2. **Jangan hardcode di code**
   ```typescript
   ❌ const secret = 'my-secret-key';
   ✅ const secret = process.env.JWT_SECRET;
   ```

3. **Jangan share secrets**
   - Jangan kirim via email/chat
   - Jangan commit ke repository
   - Jangan log di console

4. **Jangan gunakan secret yang sama**
   - Access token dan refresh token harus berbeda
   - Development dan production harus berbeda

---

## Troubleshooting

### Error: "JWT_SECRET is not defined"

**Solusi:**
1. Pastikan file `.env` ada di root project
2. Pastikan variable `JWT_SECRET` ada di `.env`
3. Restart aplikasi setelah mengubah `.env`

### Error: "Invalid token"

**Kemungkinan penyebab:**
1. Token expired (access token 15 menit)
2. JWT secret berubah (token lama tidak valid)
3. Token format salah (harus: `Bearer <token>`)

**Solusi:**
- Gunakan refresh token untuk mendapatkan token baru
- Login ulang jika refresh token juga expired

### Error: "Unauthorized"

**Kemungkinan penyebab:**
1. Tidak ada token di header
2. Token format salah
3. Token expired

**Solusi:**
```bash
# Format yang benar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing JWT

### 1. **Register User**

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### 2. **Login**

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

### 3. **Access Protected Endpoint**

```bash
GET http://localhost:3000/api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Refresh Token**

```bash
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Production Deployment

### Environment Variables

Untuk production, gunakan secrets yang berbeda:

```bash
# Generate new secrets for production
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### Secret Management Services

**AWS:**
```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name wisata-jwt-secret \
  --secret-string "your-secret-here"
```

**Azure:**
```bash
# Store in Azure Key Vault
az keyvault secret set \
  --vault-name wisata-vault \
  --name jwt-secret \
  --value "your-secret-here"
```

**Google Cloud:**
```bash
# Store in Secret Manager
gcloud secrets create jwt-secret \
  --data-file=- <<< "your-secret-here"
```

---

## JWT Payload Structure

### Access Token Payload

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "USER",
  "iat": 1620000000,
  "exp": 1620000900
}
```

### Refresh Token Payload

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "USER",
  "iat": 1620000000,
  "exp": 1620604800
}
```

---

## Code Reference

### JWT Strategy Configuration

File: `src/modules/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Token Generation

File: `src/modules/auth/auth.service.ts`

```typescript
async generateTokens(user: User) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = this.jwtService.sign(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = this.jwtService.sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });

  return { accessToken, refreshToken };
}
```

---

## FAQ

### Q: Berapa panjang JWT secret yang aman?

**A:** Minimal 256 bits (32 bytes / 64 karakter hex). Project ini menggunakan 512 bits (64 bytes / 128 karakter hex) untuk keamanan maksimal.

### Q: Apakah JWT secret harus sama di semua server?

**A:** Ya, jika Anda menggunakan load balancer dengan multiple instances, semua server harus menggunakan JWT secret yang sama agar token valid di semua instance.

### Q: Bagaimana cara mengganti JWT secret di production?

**A:**
1. Generate secret baru
2. Update environment variable
3. Restart aplikasi
4. **Note:** Semua token lama akan invalid, user harus login ulang

### Q: Apakah JWT secret bisa di-decrypt?

**A:** Tidak. JWT menggunakan HMAC (Hash-based Message Authentication Code), bukan encryption. Secret digunakan untuk signing, bukan encryption.

### Q: Bagaimana cara menyimpan token di client?

**A:**
- **Web:** localStorage atau httpOnly cookie (lebih aman)
- **Mobile:** Secure storage (Keychain di iOS, Keystore di Android)
- **Jangan:** Simpan di localStorage jika ada XSS vulnerability

---

## Resources

- [JWT.io](https://jwt.io/) - JWT debugger
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Last Updated:** 2026-05-08  
**Status:** ✅ Configured and Ready
