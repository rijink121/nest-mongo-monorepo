import { appId, appName, appVersion } from '../app.config';

export default () => ({
  /**
   * @property {number} port
   * @default 3000
   */
  port: parseInt(process.env.PORT || '3000', 10),
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
});
