export interface JobResponse<T = unknown> {
  /**
   * Error object or string
   */
  error?: unknown;
  /**
   * Error code
   */
  errorCode?: number;
  /**
   * Response data
   */
  data?: T;
  /**
   * Response success or error message
   */
  message?: string;
}

export interface Job<T = unknown> {
  /**
   * source app
   */
  app?: string;
  /**
   * job unique id
   */
  uid?: string;
  /**
   * user or owner object on behave this job is running
   */
  owner?: Record<string, unknown>;
  /**
   * action performing using this job
   */
  action?: string;
  /**
   * files object used for upload
   */
  files?: Record<string, File[]>;
  /**
   * additional parameters used in services
   */
  payload?: T | Record<string, unknown>;
  /**
   * Error object or string
   */
  error?: unknown;
  /**
   * Log to JobLogs while running as micro service task
   * @default true
   */
  logging?: boolean;
  /**
   * Status of the job
   *
   * @default Pending
   */
  status?: 'Pending' | 'Completed' | 'Errored';
}
