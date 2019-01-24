import {clock} from '@shopify/jest-dom-mocks';

import './matchers';

import I18n from '../i18n';
import {LanguageDirection} from '../types';
import {DateStyle, Weekdays} from '../constants';

jest.mock('../utilities', () => ({
  translate: jest.fn(),
  getCurrencySymbol: jest.fn(),
}));

const translate: jest.Mock = require('../utilities').translate;
const getCurrencySymbol: jest.Mock = require('../utilities').getCurrencySymbol;

describe('I18n', () => {
  const defaultDetails = {locale: 'en-ca'};
  const defaultTranslations = [{hello: 'Hello, {name}!'}];

  beforeEach(() => {
    translate.mockReset();
    getCurrencySymbol.mockReset();
  });

  describe('#locale', () => {
    it('is exposed publicly', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('locale', locale);
    });
  });

  describe('#language', () => {
    it('is determined from the locale', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('language', 'fr');
    });
  });

  describe('#languageDirection', () => {
    it('is LanguageDirection.Ltr for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'languageDirection',
        LanguageDirection.Ltr,
      );
    });

    it('is LanguageDirection.Rtl for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'languageDirection',
        LanguageDirection.Rtl,
      );
    });
  });

  describe('#isLtrLanguage', () => {
    it('is true for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'isLtrLanguage',
        true,
      );
    });

    it('is false for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'isLtrLanguage',
        false,
      );
    });
  });

  describe('#isRtlLanguage', () => {
    it('is false for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'isRtlLanguage',
        false,
      );
    });

    it('is true for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'isRtlLanguage',
        true,
      );
    });
  });

  describe('#region', () => {
    it('is determined from the locale', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('region', 'CA');
    });

    it('is undefined when the locale does not have a country code', () => {
      const locale = 'fr';
      const i18n = new I18n(defaultTranslations, {locale});
      // eslint-disable-next-line no-undefined
      expect(i18n).toHaveProperty('region', undefined);
    });
  });

  describe('#countryCode', () => {
    it('is determined from the locale', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('countryCode', 'CA');
    });

    it('is undefined when the locale does not have a country code', () => {
      const locale = 'fr';
      const i18n = new I18n(defaultTranslations, {locale});
      // eslint-disable-next-line no-undefined
      expect(i18n).toHaveProperty('countryCode', undefined);
    });
  });

  describe('#defaultCurrency', () => {
    it('is exposed publicly', () => {
      const defaultCurrency = 'CAD';
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        currency: defaultCurrency,
      });
      expect(i18n).toHaveProperty('defaultCurrency', defaultCurrency);
    });
  });

  describe('#defaultTimezone', () => {
    it('is exposed publicly', () => {
      const defaultTimezone = 'EST';
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone: defaultTimezone,
      });
      expect(i18n).toHaveProperty('defaultTimezone', defaultTimezone);
    });
  });

  describe('#translate()', () => {
    it('calls the translate() utility with translations, key, locale, scope, pseudotranslate, and replacements', () => {
      const mockResult = 'translated string';
      const replacements = {name: 'Chris'};
      const scope = {scope: 'goodbye'};
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello', scope, replacements);

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {...scope, replacements, pseudotranslate: false},
        defaultTranslations,
        i18n.locale,
      );
    });

    it('calls the translate() utility when no scope is provided', () => {
      const mockResult = 'translated string';
      const replacements = {name: 'Chris'};
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello', replacements);

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {replacements, pseudotranslate: false},
        defaultTranslations,
        i18n.locale,
      );
    });

    it('calls the translate() utility when no replacements are provided', () => {
      const mockResult = 'translated string';
      const scope = {scope: 'goodbye'};
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello', scope);

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {...scope, pseudotranslate: false},
        defaultTranslations,
        i18n.locale,
      );
    });

    it('calls the translate() utility when no replacements or scope are provided', () => {
      const mockResult = 'translated string';
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello');

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {pseudotranslate: false},
        defaultTranslations,
        i18n.locale,
      );
    });

    it('calls the translate utility with pseudotranslation', () => {
      const mockResult = 'translated string';
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        pseudolocalize: true,
      });
      const result = i18n.translate('hello');

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {pseudotranslate: true},
        defaultTranslations,
        i18n.locale,
      );
    });
  });

  describe('#formatNumber()', () => {
    it('formats a number using Intl', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.NumberFormat(defaultDetails.locale).format(
        1000,
      );

      expect(i18n.formatNumber(1000)).toBe(expected);
    });

    it('uses the precision argument for maximumFractionDigits', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const precision = 2;
      const expected = new Intl.NumberFormat(defaultDetails.locale, {
        maximumFractionDigits: precision,
      }).format(0.12345);

      expect(i18n.formatNumber(0.12345, {precision})).toBe(expected);
    });

    it('passes additional options to the number formatter', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const options: Partial<Intl.NumberFormatOptions> = {
        currencyDisplay: 'code',
        minimumIntegerDigits: 1,
        maximumFractionDigits: 1,
      };

      const expected = new Intl.NumberFormat(
        defaultDetails.locale,
        options,
      ).format(0.12345);

      expect(i18n.formatNumber(0.12345, options)).toBe(expected);
    });

    describe('currency', () => {
      const currency = 'USD';

      it('throws an error when no currency code is given as the default or as an option', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        expect(() => i18n.formatNumber(1, {as: 'currency'})).toThrowError(
          'No currency code provided.',
        );
      });

      it('uses the Intl number formatter with the default currency', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency'})).toBe(expected);
      });

      it('uses a custom currency provided in options', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', currency})).toBe(expected);
      });

      it('passes additional options to the number formatter', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const options: Partial<Intl.NumberFormatOptions> = {
          currencyDisplay: 'code',
          minimumIntegerDigits: 1,
        };

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
          ...options,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', ...options})).toBe(
          expected,
        );
      });
    });

    describe('percent', () => {
      it('formats the number as a percentage', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'percent',
        }).format(50);
        expect(i18n.formatNumber(50, {as: 'percent'})).toBe(expected);
      });
    });
  });

  describe('#formatCurrency()', () => {
    const currency = 'USD';

    it('formats the number as a currency', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = Intl.NumberFormat(defaultDetails.locale, {
        style: 'currency',
        currency,
      }).format(1);

      expect(i18n.formatCurrency(1, {currency})).toBe(expected);
    });
  });

  describe('#formatPercentage()', () => {
    it('formats the number as a percentage', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = Intl.NumberFormat(defaultDetails.locale, {
        style: 'percent',
      }).format(50);
      expect(i18n.formatPercentage(50)).toBe(expected);
    });
  });

  describe('#formatDate()', () => {
    const timezone = 'Australia/Sydney';

    afterEach(() => {
      if (clock.isMocked()) {
        clock.restore();
      }
    });

    it('formats a date using Intl', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);
      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('passes additional options to the date formatter', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const options: Partial<Intl.DateTimeFormatOptions> = {
        era: 'narrow',
      };

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
        ...options,
      }).format(date);

      expect(i18n.formatDate(date, options)).toBe(expected);
    });

    it('formats a date using Intl when no timezone is given as the default or as an option', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.DateTimeFormat(
        defaultDetails.locale,
        {},
      ).format(date);
      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('uses the Intl number formatter with the default timezone', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('uses a custom timezone provided in options', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date, {timeZone: timezone})).toBe(expected);
    });

    it('uses UTC when given a date in the Etc/GMT+12 timezone', () => {
      const date = new Date('2018-01-01T12:34:56-12:00');
      const timeZone = 'Etc/GMT+12';

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: 'UTC',
      }).format(new Date('2018-01-01'));

      expect(i18n.formatDate(date, {timeZone})).toBe(expected);
    });

    it('formats a date using DateStyle.Long', () => {
      const date = new Date('2012-12-20T00:00:00-00:00');
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      expect(i18n.formatDate(date, {style: DateStyle.Long})).toBe(
        'Thursday, December 20, 2012',
      );
    });

    it('formats a date using DateStyle.Short', () => {
      const date = new Date('2012-12-20T00:00:00-00:00');
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      expect(i18n.formatDate(date, {style: DateStyle.Short})).toBe(
        'Dec 20, 2012',
      );
    });

    describe('with DateSTyle.Humanize', () => {
      it('formats a date', () => {
        const date = new Date('2012-12-20T00:00:00-00:00');
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        expect(i18n.formatDate(date, {style: DateStyle.Humanize})).toBe(
          'Dec 20, 2012',
        );
      });

      it('formats a date in a custom timezone', () => {
        const date = new Date('2012-12-20T00:00:00-00:00');
        const i18n = new I18n(defaultTranslations, defaultDetails);

        expect(
          i18n.formatDate(date, {
            style: DateStyle.Humanize,
            timeZone: timezone,
          }),
        ).toBe('Dec 20, 2012');
      });

      it('formats a date less than one minute ago', () => {
        const today = new Date('2012-12-20T00:00:00-00:00');
        const lessThanOneMinuteAgo = new Date(today.getTime());
        lessThanOneMinuteAgo.setSeconds(-5);
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        i18n.formatDate(lessThanOneMinuteAgo, {
          style: DateStyle.Humanize,
        });
        expect(translate).toHaveBeenCalledWith(
          'humanize.now',
          {pseudotranslate: false},
          defaultTranslations,
          i18n.locale,
        );
      });

      it('formats a date less than one hour ago', () => {
        const today = new Date('2012-12-20T00:00:00-00:00');
        const lessThanOneHourAgo = new Date(today.getTime());
        const minutesAgo = 5;
        lessThanOneHourAgo.setMinutes(-minutesAgo);
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        i18n.formatDate(lessThanOneHourAgo, {
          style: DateStyle.Humanize,
        });
        expect(translate).toHaveBeenCalledWith(
          'humanize.minutes',
          {pseudotranslate: false, replacements: {count: minutesAgo}},
          defaultTranslations,
          i18n.locale,
        );
      });

      it('formats a date from today', () => {
        const today = new Date('2012-12-20T23:00:00-00:00');
        const moreThanOneHourAgo = new Date(today.getTime());
        const hoursAgo = 5;
        moreThanOneHourAgo.setHours(today.getHours() - hoursAgo);
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        expect(
          i18n.formatDate(moreThanOneHourAgo, {style: DateStyle.Humanize}),
        ).toBe('5:00 am');
      });

      it('formats a date from yesterday', () => {
        const today = new Date('2012-12-20T00:00:00-00:00');
        const yesterday = new Date('2012-12-19T00:00:00-00:00');
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        i18n.formatDate(yesterday, {style: DateStyle.Humanize});
        expect(translate).toHaveBeenCalledWith(
          'humanize.yesterday',
          {pseudotranslate: false, replacements: {time: '11:00 am'}},
          defaultTranslations,
          i18n.locale,
        );
      });

      it('formats a date less than one week ago', () => {
        const today = new Date('2012-12-20T00:00:00-00:00');
        const lessThanOneWeekAgo = new Date(today.getTime());
        lessThanOneWeekAgo.setDate(today.getDate() - 5);
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        i18n.formatDate(lessThanOneWeekAgo, {
          style: DateStyle.Humanize,
        });
        expect(translate).toHaveBeenCalledWith(
          'humanize.weekday',
          {pseudotranslate: false, replacements: {time: '11:00 am'}},
          defaultTranslations,
          i18n.locale,
        );
      });

      it('formats a date less than one year ago', () => {
        const today = new Date('2012-12-20T00:00:00-00:00');
        const lessThanOneYearAgo = new Date(today.getTime());
        lessThanOneYearAgo.setMonth(today.getMonth() - 5);
        clock.mock(today);
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          timezone,
        });

        i18n.formatDate(lessThanOneYearAgo, {
          style: DateStyle.Humanize,
        });

        expect(translate).toHaveBeenCalledWith(
          'humanize.date',
          {
            pseudotranslate: false,
            replacements: {date: 'Jul 20', time: '9:00 am'},
          },
          defaultTranslations,
          i18n.locale,
        );
      });
    });

    it('formats a date using DateStyle.Time', () => {
      const date = new Date('2012-12-20T00:00:00-00:00');
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      expect(i18n.formatDate(date, {style: DateStyle.Time})).toBe('11:00 AM');
    });
  });

  describe('#weekStartDay()', () => {
    it('uses the defaultCountry to get the week start day', () => {
      const i18n = new I18n(defaultTranslations, {locale: 'en', country: 'FR'});

      expect(i18n.weekStartDay()).toBe(Weekdays.Monday);
    });

    it('uses the country passed in the params instead of the defaultCountry', () => {
      const i18n = new I18n(defaultTranslations, {locale: 'en', country: 'FR'});

      expect(i18n.weekStartDay('CA')).toBe(Weekdays.Sunday);
    });

    it('fallsback to Sunday if country is not in the list', () => {
      const i18n = new I18n(defaultTranslations, {locale: 'en', country: 'XX'});

      expect(i18n.weekStartDay()).toBe(Weekdays.Sunday);
    });

    it('throws an error if no country code is passed', () => {
      const i18n = new I18n(defaultTranslations, {locale: 'en'});

      expect(() => i18n.weekStartDay()).toThrowError(
        'No country code provided. weekStartDay() cannot be called without a country code.',
      );
    });
  });

  describe('#getCurrencySymbol()', () => {
    it('correctly returns the locale-specific currency symbol and its position', () => {
      const mockResult = {
        symbol: '€',
        prefixed: true,
      };
      getCurrencySymbol.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, {locale: 'en'});

      expect(i18n.getCurrencySymbol('eur')).toEqual(mockResult);
    });
  });
});
