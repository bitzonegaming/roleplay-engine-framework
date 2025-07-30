import {
  Locale,
  LocaleApi,
  Localization,
  LocalizationApi,
} from '@bitzonegaming/roleplay-engine-sdk';

import { RPServerService } from '../../core/server-service';
import { OnServer } from '../../core/events/decorators';
import { SocketLocaleAdded } from '../../socket/events/socket-locale-added';
import { SocketLocaleEnabled } from '../../socket/events/socket-locale-enabled';
import { SocketLocaleDisabled } from '../../socket/events/socket-locale-disabled';
import { SocketLocalizationUpdated } from '../../socket/events/socket-localization-updated';

type LocalizationSection = Localization[string];

/**
 * Service for managing localization and multi-language support in the roleplay server.
 *
 * This service provides functionality for:
 * - Locale management (supported languages)
 * - Localization data retrieval and caching
 * - Multi-language text access by locale and section
 * - Real-time updates through socket events
 *
 * The service maintains local caches of both available locales and localization data
 * that are automatically synchronized with the roleplay engine. It provides flexible
 * access patterns for retrieving translated text by locale, section, or individual keys.
 *
 * @example
 * ```typescript
 * // Get all available locales
 * const locales = localizationService.getLocales();
 * console.log('Supported languages:', locales.map(l => l.name));
 *
 * // Get specific locale information
 * const enLocale = localizationService.getLocale('en');
 * if (enLocale?.enabled) {
 *   console.log('English is available');
 * }
 *
 * // Get localization for a specific locale
 * const enTexts = localizationService.getLocalization('en-US');
 * console.log('Welcome message:', enTexts?.ui?.welcome);
 *
 * // Get specific localization section
 * const uiTexts = localizationService.getLocalizationSection('en-US', 'errors');
 * console.log('All UI texts:', uiTexts);
 * ```
 */
export class LocalizationService extends RPServerService {
  /** Array of all available locales */
  private locales: Locale[] = [];
  /** Map of localization data indexed by locale code */
  private localization: Localization = {};

  /**
   * Initializes the localization service by loading locales and localization data.
   *
   * This method is called during server startup to populate the local caches
   * with all available locales and their corresponding localization data.
   *
   * @override
   * @returns Promise that resolves when initialization is complete
   */
  public async init() {
    this.logger.info('Initializing locales...');
    await this.refreshLocales();
    this.logger.info('Initializing localization...');
    await this.refreshLocalization();
    return super.init();
  }

  /**
   * Retrieves all localization data for a specific locale.
   *
   * Returns the complete localization bundle for the specified locale,
   * containing all translated text organized by sections.
   *
   * @param locale - The locale code (e.g., 'en-US', 'fr-FR')
   * @returns The localization bundle for the locale, undefined if not found
   *
   * @example
   * ```typescript
   * const enTexts = localizationService.getLocalization('en-US');
   * if (enTexts) {
   *   console.log('Locale names:', enTexts.locales);
   *   console.log('Error messages:', enTexts.errors);
   * }
   * ```
   */
  public getLocalization(locale: string) {
    return this.localization[locale];
  }

  /**
   * Retrieves a specific section of localization data for a locale.
   *
   * Returns only the specified section (e.g., 'locales', 'errors') from the
   * localization bundle, providing more focused access to translated text.
   *
   * @template K - The section key type
   * @param locale - The locale code (e.g., 'en-US', 'fr-FR')
   * @param section - The section name to retrieve
   * @returns The localization section data, undefined if not found
   *
   * @example
   * ```typescript
   * const uiTexts = localizationService.getLocalizationSection('en-US', 'ui');
   * if (uiTexts) {
   *   console.log('Welcome message:', uiTexts.welcome);
   * }
   *
   * const errorTexts = localizationService.getLocalizationSection('en-US', 'errors');
   * console.log('Not found error:', errorTexts?.notFound);
   * ```
   */
  public getLocalizationSection<K extends keyof LocalizationSection>(
    locale: string,
    section: K,
  ): LocalizationSection[K] | undefined {
    const bundle = this.localization[locale];
    return bundle ? bundle[section] : undefined;
  }

  /**
   * Retrieves all available locales.
   *
   * Returns the cached array of all supported locales with their metadata
   * including enabled status, display names, and locale codes.
   *
   * @returns Array of all available locales
   *
   * @example
   * ```typescript
   * const locales = localizationService.getLocales();
   * console.log('Supported languages:');
   * locales.forEach(locale => {
   *   console.log(`${locale.name} (${locale.code}) - ${locale.enabled ? 'Enabled' : 'Disabled'}`);
   * });
   * ```
   */
  public getLocales(): Locale[] {
    return this.locales;
  }

  /**
   * Retrieves a specific locale by its code.
   *
   * Returns the locale metadata for the specified locale code,
   * including its enabled status and display information.
   *
   * @param locale - The locale code to find (e.g., 'en-US', 'fr-FR')
   * @returns The locale data if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const enLocale = localizationService.getLocale('en-US');
   * if (enLocale?.enabled) {
   *   console.log(`${enLocale.name} is available`);
   * } else {
   *   console.log('English is not available');
   * }
   * ```
   */
  public getLocale(locale: string) {
    return this.locales.find((l) => l.code === locale);
  }

  private async refreshLocales() {
    this.locales = await this.getApi(LocaleApi).getLocales({ enabled: true, noCache: true });
  }

  private async refreshLocalization() {
    this.localization = await this.getApi(LocalizationApi).getLocalization({
      noCache: true,
    });
  }

  @OnServer('socketLocaleAdded')
  private onSocketLocaleAdded(payload: SocketLocaleAdded) {
    if (this.locales.some((p) => p.code === payload.locale.code)) {
      return;
    }

    this.locales.push({ ...payload.locale });
    this.eventEmitter.emit('localesUpdated', { locales: this.locales });
  }

  @OnServer('socketLocaleEnabled')
  private onSocketLocaleEnabled(payload: SocketLocaleEnabled) {
    const locales = this.locales.filter((l) => l.code !== payload.locale.code);
    locales.push({ ...payload.locale });
    this.locales = locales;
    this.eventEmitter.emit('localesUpdated', { locales: this.locales });
  }

  @OnServer('socketLocaleDisabled')
  private onSocketLocaleDisabled(payload: SocketLocaleDisabled) {
    const locales = this.locales.filter((l) => l.code !== payload.locale.code);
    locales.push({ ...payload.locale });
    this.locales = locales;
    this.eventEmitter.emit('localesUpdated', { locales: this.locales });
  }

  @OnServer('socketLocalizationUpdated')
  private async onSocketLocalizationUpdated(_payload: SocketLocalizationUpdated) {
    await this.refreshLocalization();
    this.eventEmitter.emit('localizationUpdated', { localization: this.localization });
  }
}
