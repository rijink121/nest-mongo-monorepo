import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { AppEnv } from '@shared/config';
import { appId, appName, appVersion } from '../app.config';

export default async () => {
  // Initialize environment configuration and AWS Secrets Manager if configured
  await env.initialize();

  // Validate application environment variables against the schema
  const validatedEnv = validateEnvConfig(AppEnv, {
    PORT: env.get('PORT', 3000),
    BASE_URL: env.get(
      'BASE_URL',
      `http://localhost:${env.get('PORT', 3000)}/`,
      true,
    ),
  });

  return {
    /**
     * @property {number} port
     * @default 3000
     */
    port: validatedEnv.PORT,
    /**
     * @property {string} baseURL - app base url or domain
     * @default http://localhost:{port}/
     */
    baseURL: validatedEnv.BASE_URL,
    /**
     * @property {string} appName - app name
     */
    appName,
    /**
     * @property {string} appId - app unique id
     */
    appId,
    /**
     * @property {string} appVersion - app version
     */
    appVersion,
  };
};
