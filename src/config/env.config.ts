import { ConfigModuleOptions } from '@nestjs/config';
import { validateEnv } from './env.validation';

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
  validate: validateEnv,
};
