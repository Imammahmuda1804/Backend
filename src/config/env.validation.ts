type RawEnv = Record<string, string | undefined>;

type ValidatedEnv = Record<string, string | number | undefined>;

const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

// Mengubah nilai env port menjadi number dan menolak port yang tidak valid.
function parsePort(
  env: RawEnv,
  key: string,
  fallback: number,
  errors: string[],
): number {
  const rawValue = env[key];
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!isValidTcpPort(value)) return reportInvalidPort(key, fallback, errors);

  return value;
}

function isValidTcpPort(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

function reportInvalidPort(key: string, fallback: number, errors: string[]) {
  errors.push(`${key} must be a valid TCP port between 1 and 65535`);
  return fallback;
}

// Memastikan nilai env berbentuk URL saat nilainya tersedia.
function validateUrl(env: RawEnv, key: string, errors: string[]): void {
  const rawValue = env[key];
  if (!rawValue) return;

  try {
    new URL(rawValue);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

// Memastikan daftar CORS origin berisi URL valid.
function validateCommaSeparatedOrigins(
  env: RawEnv,
  key: string,
  errors: string[],
): void {
  const rawValue = env[key];
  if (!rawValue) return;

  for (const origin of splitCommaSeparatedValues(rawValue)) {
    validateOrigin(origin, key, errors);
  }
}

function splitCommaSeparatedValues(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateOrigin(origin: string, key: string, errors: string[]) {
  try {
    new URL(origin);
  } catch {
    errors.push(`${key} contains invalid origin: ${origin}`);
  }
}

// Memvalidasi env penting sebelum backend mulai berjalan.
export function validateEnv(env: RawEnv): ValidatedEnv {
  const errors: string[] = [];

  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      errors.push(`${key} is required`);
    }
  }

  validateUrl(env, 'FASTAPI_URL', errors);
  validateUrl(env, 'NLP_SERVICE_URL', errors);
  validateCommaSeparatedOrigins(env, 'CORS_ORIGINS', errors);

  const port = parsePort(env, 'PORT', 3000, errors);
  const redisPort = parsePort(env, 'REDIS_PORT', 6379, errors);

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    ...env,
    PORT: port,
    REDIS_PORT: redisPort,
  };
}
