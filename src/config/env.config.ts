import { ConfigModuleOptions } from '@nestjs/config';

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
};
