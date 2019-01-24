import {languageFromLocale, regionFromLocale} from '@shopify/i18n';
import {
  getDateDiff,
  isLessThanOneHourAgo,
  isLessThanOneMinuteAgo,
  isLessThanOneWeekAgo,
  isLessThanOneYearAgo,
  isToday,
  isYesterday,
  TimeUnit,
} from '@shopify/javascript-utilities/dates';
import {memoize, autobind} from '@shopify/javascript-utilities/decorators';
import {
  I18nDetails,
  PrimitiveReplacementDictionary,
  ComplexReplacementDictionary,
  TranslationDictionary,
  LanguageDirection,
} from './types';
import {
  dateStyle,
  DateStyle,
  DEFAULT_WEEK_START_DAY,
  WEEK_START_DAYS,
  RTL_LANGUAGES,
  Weekdays,
} from './constants';
import {MissingCurrencyCodeError, MissingCountryError} from './errors';
import {
  getCurrencySymbol,
  translate,
  TranslateOptions as RootTranslateOptions,
} from './utilities';

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  as?: 'number' | 'currency' | 'percent';
  precision?: number;
}

export interface TranslateOptions {
  scope: RootTranslateOptions<any>['scope'];
}

export default class I18n {
  readonly locale: string;
  readonly pseudolocalize: boolean | string;
  readonly defaultCountry?: string;
  readonly defaultCurrency?: string;
  readonly defaultTimezone?: string;

  get language() {
    return languageFromLocale(this.locale);
  }

  get region() {
    return regionFromLocale(this.locale);
  }

  /**
   * @deprecated Use I18n#region instead.
   */
  get countryCode() {
    return regionFromLocale(this.locale);
  }

  get languageDirection() {
    return RTL_LANGUAGES.includes(this.language)
      ? LanguageDirection.Rtl
      : LanguageDirection.Ltr;
  }

  get isRtlLanguage() {
    return this.languageDirection === LanguageDirection.Rtl;
  }

  get isLtrLanguage() {
    return this.languageDirection === LanguageDirection.Ltr;
  }

  constructor(
    public translations: TranslationDictionary[],
    {locale, currency, timezone, country, pseudolocalize = false}: I18nDetails,
  ) {
    this.locale = locale;
    this.defaultCountry = country;
    this.defaultCurrency = currency;
    this.defaultTimezone = timezone;
    this.pseudolocalize = pseudolocalize;
  }

  translate(
    id: string,
    options: TranslateOptions,
    replacements?: PrimitiveReplacementDictionary,
  ): string;
  translate(
    id: string,
    options: TranslateOptions,
    replacements?: ComplexReplacementDictionary,
  ): React.ReactElement<any>;
  translate(id: string, replacements?: PrimitiveReplacementDictionary): string;
  translate(
    id: string,
    replacements?: ComplexReplacementDictionary,
  ): React.ReactElement<any>;
  translate(
    id: string,
    optionsOrReplacements?:
      | TranslateOptions
      | PrimitiveReplacementDictionary
      | ComplexReplacementDictionary,
    replacements?:
      | PrimitiveReplacementDictionary
      | ComplexReplacementDictionary,
  ): any {
    const {pseudolocalize} = this;
    let normalizedOptions: RootTranslateOptions<
      PrimitiveReplacementDictionary | ComplexReplacementDictionary
    >;

    if (optionsOrReplacements == null) {
      normalizedOptions = {pseudotranslate: pseudolocalize};
    } else if (isTranslateOptions(optionsOrReplacements)) {
      normalizedOptions = {
        ...optionsOrReplacements,
        replacements,
        pseudotranslate: pseudolocalize,
      };
    } else {
      normalizedOptions = {
        replacements: optionsOrReplacements,
        pseudotranslate: pseudolocalize,
      };
    }

    return translate(id, normalizedOptions, this.translations, this.locale);
  }

  formatNumber(
    amount: number,
    {as, precision, ...options}: NumberFormatOptions = {},
  ) {
    const {locale, defaultCurrency: currency} = this;

    if (as === 'currency' && currency == null && options.currency == null) {
      throw new MissingCurrencyCodeError(
        `No currency code provided. formatNumber(amount, {as: 'currency'}) cannot be called without a currency code.`,
      );
    }

    return new Intl.NumberFormat(locale, {
      style: as,
      maximumFractionDigits: precision,
      currency,
      ...options,
    }).format(amount);
  }

  formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}) {
    return this.formatNumber(amount, {as: 'currency', ...options});
  }

  formatPercentage(amount: number, options: Intl.NumberFormatOptions = {}) {
    return this.formatNumber(amount, {as: 'percent', ...options});
  }

  formatDate(
    date: Date,
    options?: Intl.DateTimeFormatOptions & {style?: DateStyle},
  ): string {
    const {locale, defaultTimezone: timezone} = this;

    // Etc/GMT+12 is not supported in most browsers and there is no equivalent fallback
    if (
      options &&
      options.timeZone != null &&
      options.timeZone === 'Etc/GMT+12'
    ) {
      const adjustedDate = new Date(date.valueOf() - 12 * 60 * 60 * 1000);

      return this.formatDate(adjustedDate, {...options, timeZone: 'UTC'});
    }

    const {style = undefined, ...formatOptions} = options || {};

    if (style) {
      return style === DateStyle.Humanize
        ? this.humanizeDate(date, formatOptions)
        : this.formatDate(date, {...formatOptions, ...dateStyle[style]});
    }

    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      ...formatOptions,
    }).format(date);
  }

  weekStartDay(argCountry?: I18n['defaultCountry']): Weekdays {
    const country = argCountry || this.defaultCountry;

    if (!country) {
      throw new MissingCountryError(
        `No country code provided. weekStartDay() cannot be called without a country code.`,
      );
    }

    return WEEK_START_DAYS.get(country) || DEFAULT_WEEK_START_DAY;
  }

  @autobind
  getCurrencySymbol(currencyCode?: string) {
    const currency = currencyCode || this.defaultCurrency;
    if (currency == null) {
      throw new MissingCurrencyCodeError(
        `No currency code provided. formatCurrency cannot be called without a currency code.`,
      );
    }
    return this.getCurrencySymbolLocalized(this.locale, currency);
  }

  @memoize((currency: string, locale: string) => `${locale}${currency}`)
  getCurrencySymbolLocalized(locale: string, currency: string) {
    return getCurrencySymbol(locale, {currency});
  }

  private humanizeDate(date: Date, options?: Intl.DateTimeFormatOptions) {
    const time = this.formatDate(date, {
      ...options,
      style: DateStyle.Time,
    }).toLocaleLowerCase();

    if (isLessThanOneMinuteAgo(date)) {
      return this.translate('humanize.now');
    } else if (isLessThanOneHourAgo(date)) {
      const minutes = getDateDiff(TimeUnit.Minute, date);
      return this.translate('humanize.minutes', {
        count: minutes,
      });
    } else if (isToday(date)) {
      return time;
    } else if (isYesterday(date)) {
      return this.translate('humanize.yesterday', {time});
    } else if (isLessThanOneWeekAgo(date)) {
      return this.translate('humanize.weekday', {
        day: Weekdays[date.getDay()],
        time,
      });
    } else if (isLessThanOneYearAgo(date)) {
      const monthDay = this.formatDate(date, {
        ...options,
        month: 'short',
        day: 'numeric',
      });
      return this.translate('humanize.date', {
        date: monthDay,
        time,
      });
    } else {
      return this.formatDate(date, {
        ...options,
        style: DateStyle.Short,
      });
    }
  }
}

function isTranslateOptions(
  object:
    | TranslateOptions
    | PrimitiveReplacementDictionary
    | ComplexReplacementDictionary,
): object is TranslateOptions {
  return 'scope' in object;
}
