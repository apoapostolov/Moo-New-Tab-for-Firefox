import { fetchWithTimeout, withLock } from 'utils/requests';

export const DISPLAY_HOLDINGS = 8;
export const REFRESH_MS = 60 * 60 * 1000;
const symbolPattern = /^[A-Z0-9][A-Z0-9.-]{0,19}$/;
export const providerKeys = {
  finnhub: 'portfolioFinnhubApiKey',
  twelvedata: 'portfolioTwelveDataApiKey',
};
export const CURRENCIES = [
  'USD',
  'EUR',
  'BGN',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
  'JPY',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'KRW',
  'BRL',
  'MXN',
  'ZAR',
  'TRY',
  'PLN',
  'CZK',
  'HUF',
  'RON',
  'SEK',
  'NOK',
  'DKK',
  'ISK',
  'ILS',
  'THB',
  'IDR',
  'MYR',
  'PHP',
];
export const readCurrency = () =>
  CURRENCIES.includes(localStorage.getItem('portfolioCurrency'))
    ? localStorage.getItem('portfolioCurrency')
    : 'USD';
export const holdingId = (item) => `${item.symbol}|${item.exchange || ''}`;

export function validHolding(item) {
  return Boolean(
    item &&
    typeof item.symbol === 'string' &&
    symbolPattern.test(item.symbol) &&
    (item.exchange == null || /^[A-Z0-9]{0,4}$/.test(item.exchange)) &&
    Number.isFinite(item.shares) &&
    item.shares > 0 &&
    (item.cost == null || (Number.isFinite(item.cost) && item.cost >= 0)),
  );
}

export function readHoldingsState() {
  try {
    const data = JSON.parse(localStorage.getItem('portfolioHoldings') || '[]');
    const valid =
      Array.isArray(data) &&
      data.every(validHolding) &&
      new Set(data.map(holdingId)).size === data.length;
    return { holdings: valid ? data : [], damaged: !valid };
  } catch {
    return { holdings: [], damaged: true };
  }
}
export const readHoldings = () => readHoldingsState().holdings;

export const topHoldings = (rows) =>
  [...rows]
    .sort((a, b) => b.value - a.value || holdingId(a).localeCompare(holdingId(b)))
    .slice(0, DISPLAY_HOLDINGS);

export function portfolioTotals(holdings, quotes, currency = 'USD', rates = { USD: 1 }) {
  const rows = holdings.map((holding) => {
    const quote =
      quotes[holdingId(holding)] || (!holding.exchange ? quotes[holding.symbol] : undefined);
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0 || !quote.currency) return null;
    const sourceRate = quote.currency === 'GBX' ? rates.GBP * 100 : rates[quote.currency];
    const conversion = quote.currency === currency ? 1 : rates[currency] / sourceRate;
    if (!Number.isFinite(conversion) || conversion <= 0) return null;
    const value = holding.shares * quote.price * conversion;
    const day =
      Number.isFinite(quote.previous) && quote.previous > 0
        ? holding.shares * (quote.price - quote.previous) * conversion
        : null;
    const profit =
      holding.cost == null ? null : (quote.price - holding.cost) * holding.shares * conversion;
    if (
      !Number.isFinite(value) ||
      (day != null && !Number.isFinite(day)) ||
      (profit != null && !Number.isFinite(profit))
    )
      return null;
    return { ...holding, ...quote, value, day, profit };
  });
  if (rows.some((row) => !row)) return { complete: false, rows: rows.filter(Boolean) };
  const value = rows.reduce((sum, row) => sum + row.value, 0);
  const day = rows.every((row) => row.day != null)
    ? rows.reduce((sum, row) => sum + row.day, 0)
    : null;
  const profit = rows.every((row) => row.profit != null)
    ? rows.reduce((sum, row) => sum + row.profit, 0)
    : null;
  if (
    !Number.isFinite(value) ||
    (day != null && !Number.isFinite(day)) ||
    (profit != null && !Number.isFinite(profit))
  )
    return { complete: false, rows };
  return {
    complete: true,
    rows,
    value,
    day,
    dayPercent: day != null && value - day > 0 ? (day / (value - day)) * 100 : null,
    profit,
  };
}

export function readRatesCache() {
  try {
    const cache = JSON.parse(localStorage.getItem('portfolioRatesCache') || 'null');
    return cache?.rates?.USD === 1 &&
      Object.values(cache.rates).every((n) => Number.isFinite(n) && n > 0)
      ? cache
      : null;
  } catch {
    return null;
  }
}

export async function loadRates() {
  const cache = readRatesCache();
  if (cache?.rates?.EUR) cache.rates.BGN = cache.rates.EUR * 1.95583;
  if (cache?.updated && Date.now() - cache.updated < 24 * 60 * 60 * 1000 && cache.rates?.USD === 1)
    return cache;
  try {
    const response = await fetchWithTimeout('https://api.frankfurter.dev/v1/latest?base=USD');
    if (!response.ok) throw new Error('Exchange rates unavailable');
    const data = await response.json();
    if (
      data.base !== 'USD' ||
      !data.date ||
      !data.rates ||
      !Object.values(data.rates).every((n) => Number.isFinite(n) && n > 0)
    )
      throw new Error('Invalid exchange rates');
    const rates = {
      rates: {
        ...data.rates,
        ...(data.rates.EUR ? { BGN: data.rates.EUR * 1.95583 } : {}),
        USD: 1,
      },
      date: data.date,
      updated: Date.now(),
    };
    localStorage.setItem('portfolioRatesCache', JSON.stringify(rates));
    return rates;
  } catch {
    return cache?.rates?.USD === 1 ? cache : null;
  }
}

const parseNumber = (value) =>
  value === null || value === undefined || value === '' ? null : Number(value);
const quoteCurrency = (value) =>
  value === 'GBp' || value === 'GBX' ? 'GBX' : String(value).toUpperCase();
async function fetchQuote(provider, holding, key) {
  const { symbol, exchange } = holding;
  let url;
  let headers;
  if (provider === 'finnhub') {
    if (exchange) throw new Error('Exchange selection is available with Twelve Data');
    // Finnhub's browser CORS response does not allow the custom token header.
    url = `https://finnhub.io/api/v1/quote?${new URLSearchParams({ symbol, token: key })}`;
  } else if (provider === 'twelvedata') {
    url = `https://api.twelvedata.com/quote?${new URLSearchParams({ symbol, ...(exchange ? { mic_code: exchange } : {}) })}`;
    headers = { Authorization: `apikey ${key}` };
  } else throw new Error('Unknown provider');
  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) throw new Error('Quote request failed');
  const data = await response.json();
  if (data.status === 'error' || data.code) throw new Error('Quote unavailable');
  if (provider === 'finnhub') {
    const price = parseNumber(data.c);
    if (!(price > 0)) throw new Error('Quote unavailable');
    const profileResponse = await fetchWithTimeout(
      `https://finnhub.io/api/v1/stock/profile2?${new URLSearchParams({ symbol, token: key })}`,
    );
    if (!profileResponse.ok) throw new Error('Currency unavailable');
    const profile = await profileResponse.json();
    if (!profile.currency) throw new Error('Currency unavailable');
    return {
      price,
      previous: parseNumber(data.pc),
      currency: quoteCurrency(profile.currency),
      timestamp: Number(data.t) * 1000 || null,
    };
  }
  const price = parseNumber(data.close);
  if (!(price > 0) || !data.currency || (exchange && data.mic_code !== exchange))
    throw new Error('Quote unavailable');
  return {
    price,
    previous: parseNumber(data.previous_close),
    currency: quoteCurrency(data.currency),
    timestamp: Number(data.last_quote_at || data.timestamp) * 1000 || null,
  };
}

const stamp = (holdings, provider) =>
  JSON.stringify([
    provider,
    holdings.map(({ symbol, exchange, shares, cost }) => [symbol, exchange || '', shares, cost]),
  ]);
export function readPortfolioCache(holdings, provider) {
  try {
    const cached = JSON.parse(localStorage.getItem('portfolioQuoteCache') || 'null');
    return cached?.stamp === stamp(holdings, provider) &&
      Number.isFinite(cached.updated) &&
      cached.quotes &&
      typeof cached.quotes === 'object' &&
      !Array.isArray(cached.quotes) &&
      Object.values(cached.quotes).every(
        (quote) =>
          quote &&
          Number.isFinite(quote.price) &&
          quote.price > 0 &&
          typeof quote.currency === 'string',
      )
      ? cached
      : null;
  } catch {
    return null;
  }
}

export async function loadPortfolio(holdings, provider, force = false) {
  if (!holdings.length) return { quotes: {}, updated: null, failed: [] };
  if (!providerKeys[provider]) throw new Error('Unknown provider');
  const key = localStorage.getItem(providerKeys[provider]);
  if (!key) throw new Error('missing-key');
  return withLock('moo-portfolio-quotes', async () => {
    const cached = readPortfolioCache(holdings, provider);
    const ttl = cached?.failed?.length ? 10 * 60 * 1000 : REFRESH_MS;
    if (!force && cached && Date.now() - cached.updated < ttl) return cached;
    const results = await Promise.allSettled(
      holdings.map((holding) => fetchQuote(provider, holding, key)),
    );
    const quotes = {};
    const failed = [];
    results.forEach((result, i) => {
      const id = holdingId(holdings[i]);
      if (result.status === 'fulfilled') quotes[id] = result.value;
      else {
        if (cached?.quotes?.[id]) quotes[id] = cached.quotes[id];
        failed.push(
          holdings[i].exchange
            ? `${holdings[i].symbol} (${holdings[i].exchange})`
            : holdings[i].symbol,
        );
      }
    });
    const current = stamp(readHoldings(), localStorage.getItem('portfolioProvider') || 'finnhub');
    if (
      current !== stamp(holdings, provider) ||
      localStorage.getItem(providerKeys[provider]) !== key
    )
      return null;
    const data = { stamp: current, updated: Date.now(), quotes, failed };
    try {
      localStorage.setItem('portfolioQuoteCache', JSON.stringify(data));
    } catch {
      /* Show quotes even if storage is full. */
    }
    return data;
  });
}
