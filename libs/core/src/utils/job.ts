// JobResponse interface represents the structure of a response for a job operation.
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

// Job interface represents the structure of a job with various properties.
export interface Job<T = unknown> {
  /**
   * Source application initiating the job
   */
  app?: string;

  /**
   * Unique identifier for the job
   */
  uid?: string;

  /**
   * User or owner object on behalf of which this job is running
   */
  owner?: { id: string } & Record<string, unknown>;

  /**
   * Action being performed using this job
   */
  action?: string;

  /**
   * Files object used for upload
   */
  files?: Record<string, File[]>;

  /**
   * Additional parameters used in services
   */
  payload?: T;

  /**
   * Error object or string
   */
  error?: unknown;

  /**
   * Log to JobLogs while running as a microservice task
   * @default true
   */
  logging?: boolean;

  /**
   * Status of the job
   * @default Pending
   */
  status?: 'Pending' | 'Completed' | 'Errored';
}
