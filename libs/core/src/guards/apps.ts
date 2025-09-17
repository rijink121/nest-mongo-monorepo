import { APPS_KEY } from '@core/decorators/apps';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

@Injectable()
export class AppsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('APP_NAME') private appName: string,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve the required apps from the metadata
    const requiredApps = this.reflector.getAllAndMerge<string[]>(APPS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no specific apps are required, allow access
    if (!requiredApps) {
      return true;
    }

    // Check if the current app is in the list of required apps
    const isValidApp = requiredApps.indexOf(this.appName) > -1;

    // If the app is not valid, throw a NotFoundException
    if (!isValidApp) {
      throw new NotFoundException('Not found');
    }

    // Allow access if the app is valid
    return true;
  }
}
