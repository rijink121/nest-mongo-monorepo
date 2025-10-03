import { AppsGuard } from '@core/guards/apps';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

export const APPS_KEY = 'apps';

// Decorator to set apps metadata
export const SetApps = (...apps: string[]) => SetMetadata(APPS_KEY, apps);

// Main Apps decorator function
export function Apps(...apps: string[]) {
  return applyDecorators(
    SetMetadata(APPS_KEY, apps),
    ApiExtension('x-apps', apps),
    UseGuards(AppsGuard),
  );
}
