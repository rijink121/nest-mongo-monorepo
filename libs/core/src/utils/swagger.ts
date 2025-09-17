import { OpenAPIObject } from '@nestjs/swagger';
import {
  OperationObject,
  PathItemObject,
  PathsObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// Extended operation object interface with optional 'x-apps' property
export interface ExtendedOperationObject extends OperationObject {
  'x-apps'?: string[];
}

// Function to filter API endpoints based on app name
export function appFilter(document: OpenAPIObject, APP_NAME: string) {
  // Filter out endpoints with specific extensions
  const filteredPaths: PathsObject = {};

  // Iterate over each path in the document
  Object.keys(document.paths).forEach((path) => {
    const pathItem = document.paths[path];
    const filteredMethods: PathItemObject = {};

    // Define HTTP methods to check
    const methods = ['get', 'post', 'put', 'delete', 'patch'];

    // Filter methods based on 'x-apps' metadata
    Object.keys(pathItem).forEach((method) => {
      if (methods.includes(method)) {
        const operation = pathItem[method] as ExtendedOperationObject;

        // Check if the operation should be included based on 'x-apps'
        if (!operation['x-apps'] || operation['x-apps'].includes(APP_NAME)) {
          filteredMethods[method] = operation;
        }
      } else {
        // Preserve other methods that are not in the defined list
        filteredMethods[method] = pathItem[method] as unknown;
      }
    });

    // Add filtered methods to the filtered paths if any exist
    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  });

  // Update document paths with filtered paths
  document.paths = filteredPaths;
  return document;
}
