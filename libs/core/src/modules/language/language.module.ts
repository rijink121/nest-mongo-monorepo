import { Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

/**
 * Module for configuring and providing i18n (internationalization) support.
 *
 * This module sets up the I18nModule with multiple language resolvers and a fallback language.
 * It loads translation files from the shared i18n directory and watches for changes.
 *
 * Supported resolvers:
 * - QueryResolver: Reads language from query params (e.g., ?lang=en)
 * - HeaderResolver: Reads language from custom header (e.g., x-lang)
 * - AcceptLanguageResolver: Uses browser Accept-Language header
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [LanguageModule],
 * })
 * export class AppModule {}
 * ```
 */

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en', // Default language if none is resolved
      loaderOptions: {
        path: join(process.cwd(), 'libs/shared/src/i18n'), // Path to translation files
        watch: true, // Watch for changes in translation files
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] }, // Query param resolver
        new HeaderResolver(['x-lang']), // Custom header resolver
        AcceptLanguageResolver, // Browser Accept-Language resolver
      ],
    }),
  ],
  exports: [I18nModule], // Export I18nModule for use in other modules
})
export class LanguageModule {}
