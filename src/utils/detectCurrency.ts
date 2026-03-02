const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD", "Australia/Brisbane": "AUD",
  "Australia/Perth": "AUD", "Australia/Adelaide": "AUD", "Australia/Darwin": "AUD",
  "Australia/Hobart": "AUD",
  "America/New_York": "USD", "America/Chicago": "USD", "America/Denver": "USD",
  "America/Los_Angeles": "USD", "America/Phoenix": "USD", "America/Anchorage": "USD",
  "Pacific/Honolulu": "USD",
  "Europe/London": "GBP",
  "Europe/Paris": "EUR", "Europe/Berlin": "EUR", "Europe/Madrid": "EUR",
  "Europe/Rome": "EUR", "Europe/Amsterdam": "EUR", "Europe/Brussels": "EUR",
  "Europe/Vienna": "EUR", "Europe/Dublin": "EUR", "Europe/Lisbon": "EUR",
  "Europe/Helsinki": "EUR", "Europe/Warsaw": "EUR", "Europe/Prague": "EUR",
  "Europe/Budapest": "EUR", "Europe/Athens": "EUR", "Europe/Bucharest": "EUR",
  "Europe/Zurich": "CHF",
  "Asia/Tokyo": "JPY",
  "Asia/Shanghai": "CNY", "Asia/Chongqing": "CNY", "Asia/Hong_Kong": "HKD",
  "America/Toronto": "CAD", "America/Vancouver": "CAD", "America/Winnipeg": "CAD",
  "America/Halifax": "CAD",
  "Pacific/Auckland": "NZD",
  "Asia/Singapore": "SGD",
  "Asia/Kolkata": "INR",
  "Asia/Seoul": "KRW",
  "America/Sao_Paulo": "BRL", "America/Manaus": "BRL",
  "America/Mexico_City": "MXN",
  "Africa/Johannesburg": "ZAR",
  "Asia/Dubai": "AED",
  "Europe/Oslo": "NOK", "Europe/Stockholm": "SEK", "Europe/Copenhagen": "DKK",
};

const LOCALE_TO_CURRENCY: Record<string, string> = {
  "en-AU": "AUD", "en-US": "USD", "en-GB": "GBP", "en-CA": "CAD",
  "en-NZ": "NZD", "en-SG": "SGD", "en-ZA": "ZAR", "en-IE": "EUR",
  "de": "EUR", "de-DE": "EUR", "de-AT": "EUR", "de-CH": "CHF",
  "fr": "EUR", "fr-FR": "EUR", "fr-BE": "EUR", "fr-CH": "CHF",
  "fr-CA": "CAD", "es": "EUR", "es-ES": "EUR", "it": "EUR",
  "pt-BR": "BRL", "pt-PT": "EUR", "ja": "JPY", "zh": "CNY",
  "zh-CN": "CNY", "zh-TW": "TWD", "zh-HK": "HKD", "ko": "KRW",
  "ar-AE": "AED", "hi": "INR",
};

const FRANKFURTER_SUPPORTED = new Set([
  "AUD","BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
  "HKD","HUF","IDR","ILS","INR","ISK","JPY","KRW","MXN","MYR",
  "NOK","NZD","PHP","PLN","RON","SEK","SGD","THB","TRY","USD","ZAR"
]);

export function detectUserCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_CURRENCY[tz]) {
      const c = TIMEZONE_TO_CURRENCY[tz];
      if (FRANKFURTER_SUPPORTED.has(c)) return c;
    }
  } catch {}

  try {
    const locales = navigator.languages || [navigator.language];
    for (const locale of locales) {
      if (LOCALE_TO_CURRENCY[locale]) {
        const c = LOCALE_TO_CURRENCY[locale];
        if (FRANKFURTER_SUPPORTED.has(c)) return c;
      }
      const lang = locale.split("-")[0];
      if (LOCALE_TO_CURRENCY[lang]) {
        const c = LOCALE_TO_CURRENCY[lang];
        if (FRANKFURTER_SUPPORTED.has(c)) return c;
      }
    }
  } catch {}

  return "AUD";
}