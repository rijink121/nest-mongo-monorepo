import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import {
  OperationObject,
  PathItemObject,
  PathsObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Global window interface extension for Swagger UI.
 * Provides access to Swagger UI's preauthorization functionality.
 */
declare global {
  interface Window {
    ui: {
      /** Preauthorizes an API key in Swagger UI */
      preauthorizeApiKey: (key: string, value: string) => void;
    };
  }
}

/**
 * Extended operation object interface with optional 'x-apps' property.
 * This allows filtering of API endpoints based on application names.
 *
 * @property x-apps - Array of application names that can access this endpoint
 */
export interface ExtendedOperationObject extends OperationObject {
  'x-apps'?: string[];
}

/**
 * Interface representing a Swagger UI response object.
 * Used for intercepting and processing API responses in Swagger UI.
 */
interface SwaggerResponse {
  /** Whether the request was successful */
  ok: boolean;
  /** The request URL */
  url: string;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response text */
  text: string;
  /** Response data (generic) */
  data?: unknown;
  /** Response body with structured data */
  body?: {
    data?: Record<string, unknown>;
  };
  /** Original request configuration */
  config?: unknown;
}

/**
 * Filters API endpoints in Swagger documentation based on application name.
 *
 * This function processes the OpenAPI document and filters out endpoints that
 * are not meant for the specified application. It uses the custom 'x-apps'
 * property to determine which endpoints should be included.
 *
 * @param document - The OpenAPI document to filter
 * @param APP_NAME - The name of the application to filter for
 * @returns The filtered OpenAPI document with only relevant endpoints
 *
 * @example
 * ```typescript
 * const filteredDoc = appFilter(document, 'admin');
 * // Only endpoints without 'x-apps' or with 'admin' in 'x-apps' will be included
 * ```
 */
export function appFilter(document: OpenAPIObject, APP_NAME: string) {
  const filteredPaths: PathsObject = {};

  // HTTP methods that support OpenAPI operations
  const methods = ['get', 'post', 'put', 'delete', 'patch'];

  // Iterate over each path in the document
  Object.keys(document.paths).forEach((path) => {
    const pathItem = document.paths[path];
    const filteredMethods: PathItemObject = {};

    // Filter methods based on 'x-apps' metadata
    Object.keys(pathItem).forEach((method) => {
      if (methods.includes(method)) {
        const operation = pathItem[method] as ExtendedOperationObject;

        // Include operation if no 'x-apps' restriction or APP_NAME is in the list
        if (!operation['x-apps'] || operation['x-apps'].includes(APP_NAME)) {
          filteredMethods[method] = operation;
        }
      } else {
        // Preserve non-HTTP method properties (like parameters, servers, etc.)
        filteredMethods[method] = pathItem[method] as unknown;
      }
    });

    // Add path to filtered paths only if it has at least one method
    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  });

  // Update document with filtered paths
  document.paths = filteredPaths;

  return document;
}

/**
 * Creates a Swagger/OpenAPI configuration for the application.
 *
 * This function generates a standardized Swagger document configuration
 * with authentication support and application-specific metadata.
 *
 * @param appName - The name of the application
 * @param appVersion - The version of the application
 * @returns OpenAPI document configuration
 *
 * @example
 * ```typescript
 * const config = getSwaggerConfig('My API', '1.0.0');
 * const document = SwaggerModule.createDocument(app, config);
 * ```
 */
export const getSwaggerConfig = (appName: string, appVersion: string) =>
  new DocumentBuilder()
    .setTitle(appName)
    .setDescription(`${appName} API description`)
    .setVersion(`v${appVersion}`)
    .addBearerAuth()
    .addGlobalParameters({
      name: 'x-lang',
      in: 'header',
      required: false,
      schema: { type: 'string', example: 'en' },
      description: 'Language code (e.g., en, fr, es)',
    })
    .build();

/**
 * Creates Swagger UI custom options with automatic authentication.
 *
 * This function configures Swagger UI to automatically:
 * - Intercept authentication responses from `/auth/local` endpoint
 * - Save the JWT token to localStorage
 * - Pre-authorize the token in Swagger UI
 * - Restore saved tokens on page load
 *
 * This provides a seamless authentication experience in Swagger UI where
 * users don't need to manually copy-paste tokens after logging in.
 *
 * @returns Swagger custom options configuration
 *
 * @example
 * ```typescript
 * SwaggerModule.setup('api', app, document, getSwaggerUIOptions());
 * ```
 */
export const getSwaggerUIOptions = (): SwaggerCustomOptions => ({
  swaggerOptions: {
    /**
     * Intercepts API responses to capture authentication tokens.
     * When a successful login occurs, the token is automatically saved
     * and pre-authorized for subsequent requests.
     */
    responseInterceptor: (res: SwaggerResponse) => {
      const url = res.url || '';

      // Check if this is a login response with a token
      if (url.includes('/auth/local') && res?.body?.data?.token) {
        const token = res.body.data['token'] as string;

        // Save token to localStorage for persistence
        localStorage.setItem('swagger-token', token);

        // Automatically authorize the token in Swagger UI
        window.ui.preauthorizeApiKey('bearer', token);
      }

      return res;
    },

    /**
     * Runs when Swagger UI finishes loading.
     * Restores any previously saved authentication token.
     */
    onComplete: () => {
      const savedToken = localStorage.getItem('swagger-token');

      if (savedToken) {
        // Restore the saved token to Swagger UI
        window.ui.preauthorizeApiKey('bearer', savedToken);
      }
    },
  },
});
