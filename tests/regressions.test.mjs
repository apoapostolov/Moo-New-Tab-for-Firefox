import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, beforeEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'fake-indexeddb/auto';
import { createServer } from 'vite';
import EventBus from '../src/utils/eventbus.js';
import videoCheck from '../src/features/background/api/videoCheck.js';
import { calendarDate } from '../src/utils/date/index.js';
import { parseNatural } from '../src/features/google/natural.js';
import { isValidUrl } from '../src/utils/links/isValidUrl.js';
import * as backgrounds from '../src/utils/customBackgroundDB.js';

class Storage {
  getItem(key) {
    return Object.hasOwn(this, key) ? this[key] : null;
  }
  setItem(key, value) {
    this[key] = String(value);
  }
  removeItem(key) {
    delete this[key];
  }
  clear() {
    for (const key of Object.keys(this)) delete this[key];
  }
}
globalThis.localStorage = new Storage();
globalThis.document = new EventTarget();
const server = await createServer({
  server: { middlewareMode: true, hmr: false, open: false },
  logLevel: 'silent',
});
const translations = await server.ssrLoadModule('/src/lib/translations.js');
await translations.selectLanguage('en_GB');
const calendar = await server.ssrLoadModule('/src/features/google/services/calendar.js');
const { moveSettings } = await server.ssrLoadModule('/src/utils/settings/move.js');
const { importSettings } = await server.ssrLoadModule('/src/utils/settings/import.js');
const { normaliseUrl, mergeItems, loadItems } = await server.ssrLoadModule(
  '/src/features/rss/feedStore.js',
);
const { resolveFeedUrl } = await server.ssrLoadModule('/src/features/rss/parseFeed.js');
const { getWeather } = await server.ssrLoadModule('/src/features/weather/api/getWeather.js');
const { getAccessToken } = await server.ssrLoadModule('/src/features/google/auth.js');
after(async () => {
  await server.close();
});
beforeEach(() => {
  EventBus.removeAllListeners();
  localStorage.clear();
});

test('event subscriptions release the registered wrapper and retained callback', () => {
  const seen = [];
  const callback = (value) => seen.push(value);
  EventBus.on('refresh', callback);
  EventBus.emit('refresh', 'first');
  EventBus.off('refresh', callback);
  EventBus.emit('refresh', 'second');
  assert.deepEqual(seen, ['first']);
  assert.deepEqual(EventBus.eventNames(), []);
});

test('once unsubscribes before a recursive emit and can be cancelled by its callback', () => {
  let calls = 0;
  EventBus.once('once', () => {
    calls++;
    EventBus.emit('once');
  });
  EventBus.emit('once');
  const cancelled = () => calls++;
  EventBus.once('cancel', cancelled);
  EventBus.off('cancel', cancelled);
  EventBus.emit('cancel');
  assert.equal(calls, 1);
});

test('capture subscriptions and removeAllListeners release every listener', () => {
  let calls = 0;
  const callback = () => calls++;
  EventBus.prepend('capture', callback);
  EventBus.prependOnce('capture-once', callback);
  EventBus.removeAllListeners();
  EventBus.emit('capture');
  EventBus.emit('capture-once');
  assert.equal(calls, 0);
});

test('repeated subscribe/unsubscribe cycles stay bounded', () => {
  for (let i = 0; i < 500; i++) {
    const callback = () => {};
    EventBus.on('refresh', callback);
    EventBus.off('refresh', callback);
  }
  assert.deepEqual(EventBus.getListeners('refresh'), []);
});

test('first-run migration works with empty storage and preserves existing choices', () => {
  moveSettings();
  assert.equal(localStorage.getItem('firstRun'), 'true');
  localStorage.setItem('theme', 'dark');
  moveSettings();
  assert.equal(localStorage.getItem('theme'), 'dark');
});

test('fresh profiles open with English, time, search and basic weather on the left', async () => {
  const widgets = await server.ssrLoadModule('/src/utils/widgets.js');
  moveSettings();
  assert.equal(localStorage.getItem('language'), 'en_GB');
  assert.equal(localStorage.getItem('timeType'), 'digital');
  assert.equal(localStorage.getItem('aiAskService'), 'googleSearch');
  assert.equal(localStorage.getItem('weatherType'), '1');
  assert.equal(widgets.readPlacement().weather, 'left');
  assert.deepEqual(
    widgets.WIDGETS.filter(({ id }) => widgets.isWidgetEnabled(id)).map(({ id }) => id),
    ['time', 'weather', 'aiask'],
  );
  assert.equal(localStorage.getItem('backgroundType'), 'api_unsplash');
  assert.equal(localStorage.getItem('backgroundAPI'), 'unsplash');
  assert.equal(localStorage.getItem('location'), '');
  assert.equal(localStorage.getItem('currentWeather'), null);
  assert.equal(localStorage.getItem('currentBackground'), null);
  assert.equal(localStorage.getItem('statsData'), '{}');
});

test('startup retires wizard flags without changing an existing profile', () => {
  const saved = {
    language: 'bg',
    theme: 'dark',
    time: 'false',
    backgroundType: 'api_live',
    location: 'Rome',
    widgetPlacement: '{"weather":"right"}',
    scratchNotesData: '[{"id":"saved","text":"Keep this","x":1,"y":1}]',
  };
  for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
  for (const key of ['showWelcome', 'welcomePreview', 'welcomeTab', 'welcomeImage'])
    localStorage.setItem(key, 'true');
  moveSettings();
  for (const [key, value] of Object.entries(saved)) assert.equal(localStorage.getItem(key), value);
  for (const key of ['showWelcome', 'welcomePreview', 'welcomeTab', 'welcomeImage'])
    assert.equal(localStorage.getItem(key), null);
});

test('both reset scopes restore the ready-to-use preset without a setup screen', async () => {
  const { resetProfile } = await server.ssrLoadModule('/src/utils/settings/profile.js');
  const widgets = await server.ssrLoadModule('/src/utils/widgets.js');
  for (const erase of [false, true]) {
    localStorage.setItem('language', 'bg');
    localStorage.setItem('weatherType', '4');
    localStorage.setItem('widgetPlacement', '{"weather":"right"}');
    localStorage.setItem('showWelcome', 'true');
    localStorage.setItem('welcomePreview', 'true');
    await resetProfile(erase);
    assert.equal(localStorage.getItem('language'), 'en_GB');
    assert.equal(localStorage.getItem('weatherType'), '1');
    assert.equal(widgets.readPlacement().weather, 'left');
    assert.equal(localStorage.getItem('backgroundAPI'), 'unsplash');
    assert.equal(localStorage.getItem('showWelcome'), null);
    assert.equal(localStorage.getItem('welcomePreview'), null);
    assert.deepEqual(
      widgets.WIDGETS.filter(({ id }) => widgets.isWidgetEnabled(id)).map(({ id }) => id),
      ['time', 'weather', 'aiask'],
    );
  }
});

test('settings import rejects arrays, null and nested objects before writing', async () => {
  localStorage.setItem('theme', 'dark');
  for (const input of ['[]', 'null', '{"theme":"light","quicklinks":{}}']) {
    await assert.rejects(() => importSettings(input));
    assert.equal(localStorage.getItem('theme'), 'dark');
  }
});

test('date-only API values stay on their named local day', () => {
  for (const text of ['2026-10-26', '2026-10-26T00:00:00.000Z']) {
    const date = calendarDate(text);
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 9);
    assert.equal(date.getDate(), 26);
    assert.equal(date.getHours(), 0);
  }
});

test('all-day event ends are exclusive in API requests and inclusive in the form', () => {
  assert.deepEqual(calendar.eventBounds({ start: '2026-10-26', end: '2026-10-26', allDay: true }), {
    start: { date: '2026-10-26' },
    end: { date: '2026-10-27' },
  });
  assert.deepEqual(
    calendar.eventBounds({ start: '2026-12-31', end: '2026-12-31', allDay: true }).end,
    { date: '2027-01-01' },
  );
  assert.equal(calendar.toAllDayEndInput('2026-10-27').slice(0, 10), '2026-10-26');
  assert.equal(calendar.toLocalInput('2026-10-26').slice(0, 10), '2026-10-26');
});

test('natural dates prefer day after tomorrow over tomorrow and recognise @places', () => {
  const now = new Date(2026, 9, 26, 12);
  const result = parseNatural('Lunch the day after tomorrow at noon', { now });
  assert.equal(result.date.getDate(), 28);
  assert.equal(result.title, 'Lunch');
  assert.equal(parseNatural('Meeting @office tomorrow', { now }).location, 'office');
});

test('web links reject disguised javascript schemes and accept local and international hosts', () => {
  assert.equal(isValidUrl('javascript:alert("https://example.com")'), false);
  assert.equal(isValidUrl('data:text/html,https://example.com'), false);
  assert.equal(isValidUrl('https://пример.бг/news'), true);
  assert.equal(isValidUrl('http://localhost:3000'), true);
});

test('offline feed reads do not request the network', async () => {
  localStorage.setItem('offlineMode', 'true');
  localStorage.setItem('rssFeeds', JSON.stringify([{ url: 'https://example.com/feed' }]));
  const previous = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('Network must stay idle');
  };
  try {
    assert.deepEqual((await loadItems()).items, []);
  } finally {
    globalThis.fetch = previous;
  }
});

test('simultaneous expired Google tokens share one refresh request', async () => {
  const auth = { refreshToken: 'fixture', accessToken: 'old', expiresAt: 0 };
  globalThis.browser = {
    storage: {
      local: {
        get: async () => ({ googleAuth: auth }),
        set: async (data) => Object.assign(auth, data.googleAuth),
      },
    },
  };
  localStorage.setItem('googleClientId', 'fixture');
  localStorage.setItem('googleClientSecret', 'fixture');
  const previous = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true, json: async () => ({ access_token: 'new', expires_in: 3600 }) };
  };
  try {
    assert.deepEqual(await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()]), [
      'new',
      'new',
      'new',
    ]);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = previous;
    delete globalThis.browser;
  }
});

test('sign-out during refresh cannot save a replacement token', async () => {
  const { refresh, disconnect } = await server.ssrLoadModule('/src/features/google/auth.js');
  let auth = { refreshToken: 'fixture', accessToken: 'old', expiresAt: 0 };
  let saves = 0;
  let release;
  let started;
  const began = new Promise((resolve) => {
    started = resolve;
  });
  const previous = globalThis.fetch;
  globalThis.browser = {
    storage: {
      local: {
        get: async () => ({ googleAuth: auth }),
        set: async (value) => {
          saves++;
          auth = value.googleAuth;
        },
        remove: async () => {
          auth = null;
        },
      },
    },
  };
  globalThis.fetch = async (url) => {
    if (url.includes('/revoke')) return { ok: true };
    started();
    await new Promise((resolve) => {
      release = resolve;
    });
    return { ok: true, json: async () => ({ access_token: 'late', expires_in: 3600 }) };
  };
  try {
    const refreshing = refresh();
    const rejection = assert.rejects(refreshing);
    await began;
    const signingOut = disconnect();
    release();
    await Promise.all([rejection, signingOut]);
    assert.equal(auth, null);
    assert.equal(saves, 0);
  } finally {
    globalThis.fetch = previous;
    delete globalThis.browser;
  }
});

test('obsolete request owners and offline requests cannot commit', async () => {
  const { requestOwner, fetchWithTimeout, withLock } =
    await server.ssrLoadModule('/src/utils/requests.js');
  const owner = requestOwner();
  const first = owner.start();
  const second = owner.start();
  assert.equal(first.signal.aborted, true);
  assert.equal(first.current(), false);
  assert.equal(second.current(), true);
  owner.cancel();
  assert.equal(second.current(), false);
  localStorage.setItem('offlineMode', 'true');
  await assert.rejects(fetchWithTimeout('https://example.com'), /offline/);
  const result = [];
  await Promise.all([
    withLock('fixture', async () => {
      result.push(1);
      await Promise.resolve();
      result.push(2);
    }),
    withLock('fixture', () => result.push(3)),
  ]);
  assert.deepEqual(result, [1, 2, 3]);
});

test('background writes commit before resolving and preserve partial metadata', async () => {
  await backgrounds.clearAllBackgrounds();
  const id = await backgrounds.addBackground({
    url: 'data:image/png;base64,AA==',
    name: 'Fixture',
    folder: 'Trips',
    blurHash: 'kept',
  });
  await backgrounds.updateBackgroundMetadata(id, { dimensions: { width: 40, height: 20 } });
  const [row] = await backgrounds.getAllBackgroundsWithMetadata();
  assert.equal(row.folder, 'Trips');
  assert.equal(row.blurHash, 'kept');
  assert.deepEqual(row.dimensions, { width: 40, height: 20 });
  await backgrounds.deleteMultipleBackgrounds([0, 0, 50]);
  assert.equal(await backgrounds.getBackgroundCount(), 0);
});

test('image migration is atomic, handles a JSON URL string and does not resurrect deletions', async () => {
  await backgrounds.clearAllBackgrounds();
  localStorage.setItem('customBackground', JSON.stringify('https://example.com/one.jpg'));
  assert.equal(await backgrounds.migrateFromLocalStorage(), true);
  assert.deepEqual(await backgrounds.getAllBackgrounds(), ['https://example.com/one.jpg']);
  await backgrounds.clearAllBackgrounds();
  assert.equal(await backgrounds.migrateFromLocalStorage(), false);
  assert.equal(await backgrounds.getBackgroundCount(), 0);
});

test('scratch migration preserves all pictures, prevents resurrection and includes them in backups', async () => {
  const image = {
    id: 'fixture-picture',
    src: 'data:image/png;base64,AA==',
    x: 1,
    y: 1,
    width: 100,
    ratio: 1,
  };
  await backgrounds.patchScratchAssets({
    removed: (await backgrounds.readScratchAssets()).map((image) => image.id),
  });
  localStorage.setItem('scratchImagesData', JSON.stringify([image]));
  await backgrounds.migrateScratchAssets();
  assert.equal(localStorage.getItem('scratchImagesData'), null);
  assert.deepEqual(await backgrounds.readScratchAssets(), [image]);
  const { createBackup } = await server.ssrLoadModule('/src/utils/settings/export.js');
  const backup = await createBackup(true);
  assert.deepEqual(backup.assets.scratchImages, [image]);
  await backgrounds.patchScratchAssets({ removed: [image.id] });
  localStorage.setItem('scratchImagesData', JSON.stringify([image]));
  await backgrounds.migrateScratchAssets();
  assert.deepEqual(await backgrounds.readScratchAssets(), []);
  await importSettings(JSON.stringify(backup));
  assert.deepEqual(await backgrounds.readScratchAssets(), [image]);
});
test('backups omit credentials, validate embedded lists and recover interrupted imports', async () => {
  const { prepareBackup } = await server.ssrLoadModule('/src/utils/settings/backupSchema.js');
  const { createBackup } = await server.ssrLoadModule('/src/utils/settings/export.js');
  const { recoverProfileChange, changeProfile } = await server.ssrLoadModule(
    '/src/utils/settings/profile.js',
  );
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('googleClientSecret', 'private');
  assert.equal((await createBackup()).settings.googleClientSecret, undefined);
  assert.throws(() => prepareBackup('{"todo":"[{}]"}'));
  const legacy = await importSettings('{"theme":"light","googleClientSecret":"injected"}');
  assert.equal(legacy.legacy, true);
  assert.equal(localStorage.getItem('theme'), 'light');
  assert.equal(localStorage.getItem('googleClientSecret'), 'private');
  await backgrounds.clearAllBackgrounds();
  await backgrounds.addBackground('https://example.com/old.jpg');
  await backgrounds.beginProfileChange({ theme: 'dark' }, [{ url: 'https://example.com/new.jpg' }]);
  localStorage.setItem('theme', 'light');
  assert.equal(await recoverProfileChange(), true);
  assert.equal(localStorage.getItem('theme'), 'dark');
  assert.deepEqual(await backgrounds.getAllBackgrounds(), ['https://example.com/old.jpg']);
  const write = localStorage.setItem;
  Object.defineProperty(localStorage, 'setItem', {
    configurable: true,
    value(key, value) {
      if (key === 'quota') throw new Error('Quota');
      return write.call(this, key, value);
    },
  });
  await assert.rejects(
    changeProfile((previous) => ({ ...previous, quota: 'fail' }), []),
    /Quota/,
  );
  delete localStorage.setItem;
  assert.equal(localStorage.getItem('theme'), 'dark');
  assert.deepEqual(await backgrounds.getAllBackgrounds(), ['https://example.com/old.jpg']);
  localStorage.clear();
  await importSettings('{"theme":"dark"}');
  assert.equal(localStorage.getItem('firstRun'), 'true');
});

test('notes flush the latest text before reload and retain a failed write for retry', async () => {
  const { durableWriter } = await import('../src/utils/durableWriter.js');
  let saved;
  let full = false;
  let state;
  const writer = durableWriter(
    (value) => {
      if (full) throw new Error('quota');
      saved = value;
    },
    (value) => {
      state = value;
    },
  );
  writer.schedule('first');
  writer.schedule('latest');
  assert.equal(writer.flush(), true);
  assert.equal(saved, 'latest');
  full = true;
  writer.schedule('retained');
  assert.equal(writer.flush(), false);
  assert.match(state, /Not saved/);
  full = false;
  assert.equal(writer.flush(), true);
  assert.equal(saved, 'retained');
  assert.equal(state, 'Saved');
});

test('Google list pagination retains permissions and distinct calendar identities', async () => {
  const previous = globalThis.fetch;
  globalThis.browser = {
    storage: {
      local: {
        get: async () => ({
          googleAuth: { accessToken: 'fixture', expiresAt: Date.now() + 3600000 },
        }),
      },
    },
  };
  globalThis.fetch = async (address) => {
    const url = new URL(address);
    let data;
    if (url.pathname.endsWith('/calendarList'))
      data = url.searchParams.has('pageToken')
        ? { items: [{ id: 'two', summary: 'Shared', accessRole: 'reader' }] }
        : { items: [{ id: 'one', summary: 'Mine', accessRole: 'owner' }], nextPageToken: 'next' };
    else if (url.pathname.endsWith('/events'))
      data = {
        items: [
          {
            id: 'same-id',
            summary: 'Fixture',
            start: { date: '2026-10-26' },
            end: { date: '2026-10-27' },
          },
        ],
      };
    else
      data = url.searchParams.has('pageToken')
        ? { items: [{ id: 'b', title: 'Second' }] }
        : { items: [{ id: 'a', title: 'First' }], nextPageToken: 'next' };
    return { ok: true, status: 200, text: async () => JSON.stringify(data) };
  };
  try {
    const calendars = await calendar.listCalendars();
    assert.equal(calendars.length, 2);
    const events = await calendar.listEvents({
      ...calendar.rangeBounds(),
      calendarIds: ['one', 'two'],
      calendars,
      includeDeclined: true,
    });
    assert.equal(new Set(events.map(calendar.eventKey)).size, 2);
    assert.equal(events.find((event) => event.calendarId === 'one').canEdit, true);
    assert.equal(events.find((event) => event.calendarId === 'two').canEdit, false);
    const tasks = await server.ssrLoadModule('/src/features/google/services/tasks.js');
    assert.equal((await tasks.listTaskLists()).length, 2);
    assert.equal((await tasks.listTasks('a')).length, 2);
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: { message: 'Read only' } }),
    });
    await assert.rejects(
      calendar.updateEvent('same-id', {
        title: 'Changed',
        start: '2026-10-26',
        end: '2026-10-26',
        allDay: true,
      }),
      /Read only/,
    );
  } finally {
    globalThis.fetch = previous;
    delete globalThis.browser;
  }
});
test('locale tags are preserved, fallback works and new UI keys are present', async () => {
  const { initTranslations, normalizeLocale } = await server.ssrLoadModule(
    '/src/lib/translations.js',
  );
  assert.equal(normalizeLocale('pt-BR'), 'pt_BR');
  assert.equal(normalizeLocale('zh-Hant'), 'zh_Hant');
  assert.equal(normalizeLocale('invalid'), 'en_GB');
  const language = await initTranslations('bg');
  assert.equal(language.getMessage('bg', 'ui.close_bbfa77'), 'Затвори');
  const fallback = await initTranslations('peo');
  assert.equal(fallback.getMessage('peo', 'ui.close_bbfa77'), 'Close');
});

test('scratch Markdown renders tables, images, links and task lists without executable HTML', async () => {
  const { default: Markdown } = await server.ssrLoadModule('/src/features/scratch/Markdown.jsx');
  const text =
    '# Title\n\n[link](https://example.com) ![alt](https://example.com/a.png)\n\n| A | B |\n| --- | ---: |\n| one | **two** |\n\n- [x] Done\n- [ ] Next\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1)) ![bad](javascript:alert(1))';
  const html = renderToStaticMarkup(React.createElement(Markdown, { text }));
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /href="https:\/\/example.com" target="_blank" rel="noreferrer noopener"/);
  assert.match(html, /<img[^>]+src="https:\/\/example.com\/a.png"/);
  assert.match(html, /<table>/);
  assert.match(html, /<strong>two<\/strong>/);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|(?:href|src)="javascript:/);
});

test('weather providers retain units, omit absent fields and keep API keys out of backups', async () => {
  const { getOpenMeteo, getVisualCrossing } = await server.ssrLoadModule(
    '/src/features/weather/api/providers.js',
  );
  const variables = (await server.ssrLoadModule('/src/config/variables.js')).default;
  const originalFetch = globalThis.fetch;
  const originalMessage = variables.getMessage;
  variables.getMessage = () => 'Cloudy';
  try {
    globalThis.fetch = async (url) => ({
      ok: true,
      json: async () => {
        if (String(url).includes('geocoding-api'))
          return { results: [{ latitude: 42, longitude: 23 }] };
        if (String(url).includes('api.open-meteo'))
          return {
            current: { temperature_2m: 10, apparent_temperature: 9, is_day: 1, weather_code: 3 },
            daily: {
              time: ['2026-10-27'],
              weather_code: [3],
              temperature_2m_min: [5],
              temperature_2m_max: [12],
            },
          };
        return {
          currentConditions: { temp: 10, feelslike: 9, icon: 'cloudy', windspeed: 36 },
          days: [{ datetime: '2026-10-27', tempmin: 5, tempmax: 12, icon: 'cloudy' }],
        };
      },
    });
    const meteo = await getOpenMeteo('Sofia', 'fahrenheit', 'icon_eu');
    assert.equal(meteo.weather.temp, 50);
    assert.equal(meteo.forecast[0].max, 54);
    const visual = await getVisualCrossing('Sofia', 'kelvin', 'fixture-key');
    assert.equal(visual.weather.temp, 283);
    assert.equal(visual.weather.wind_speed, 10);
    const { createBackup } = await server.ssrLoadModule('/src/utils/settings/export.js');
    const { isCredential } = await server.ssrLoadModule('/src/utils/settings/backupSchema.js');
    localStorage.setItem('weatherVisualCrossingApiKey', 'fixture-key');
    localStorage.setItem('weatherProvider', 'visualcrossing');
    assert.equal(isCredential('weatherVisualCrossingApiKey'), true);
    assert.equal((await createBackup()).settings.weatherVisualCrossingApiKey, undefined);
    assert.equal((await createBackup()).settings.weatherProvider, 'visualcrossing');
  } finally {
    globalThis.fetch = originalFetch;
    variables.getMessage = originalMessage;
  }
});

test('portfolio totals convert currencies, distinguish daily movement and reject incomplete valuations', async () => {
  const { portfolioTotals, validHolding, readHoldingsState } = await server.ssrLoadModule(
    '/src/features/portfolio/portfolioStore.js',
  );
  const holdings = [
    { symbol: 'AAA', shares: 2, cost: 8 },
    { symbol: 'BBB', shares: 1, cost: 20 },
  ];
  const quotes = {
    AAA: { price: 10, previous: 9, currency: 'USD' },
    BBB: { price: 24, previous: 25, currency: 'EUR' },
  };
  const result = portfolioTotals(holdings, quotes, 'EUR', { USD: 1, EUR: 0.8 });
  assert.equal(result.complete, true);
  assert.ok(Math.abs(result.value - 40) < 0.001);
  assert.ok(Math.abs(result.day - 0.6) < 0.001);
  assert.ok(Math.abs(result.profit - 7.2) < 0.001);
  assert.equal(portfolioTotals(holdings, quotes, 'EUR', { USD: 1 }).complete, false);
  assert.equal(portfolioTotals(holdings, { AAA: quotes.AAA }, 'USD').complete, false);
  const pence = portfolioTotals(
    [{ symbol: 'UK', shares: 1, cost: null }],
    { UK: { price: 250, previous: 200, currency: 'GBX' } },
    'GBP',
    { USD: 1, GBP: 0.8 },
  );
  assert.equal(pence.value, 2.5);
  assert.equal(validHolding({ symbol: 'AAPL', shares: 0, cost: null }), false);
  localStorage.setItem('portfolioHoldings', '[{"symbol":"AAA","shares":-5}]');
  assert.deepEqual(readHoldingsState(), { holdings: [], damaged: true });
  assert.equal(localStorage.getItem('portfolioHoldings'), '[{"symbol":"AAA","shares":-5}]');
  const { isCredential, validateSettings } = await server.ssrLoadModule(
    '/src/utils/settings/backupSchema.js',
  );
  assert.equal(isCredential('portfolioFinnhubApiKey'), true);
  assert.throws(() => validateSettings({ portfolioHoldings: '[{"symbol":"AAA","shares":-5}]' }));
});

test('Finnhub AAPL quotes and currency use browser-compatible authentication without caching credentials', async () => {
  const { loadPortfolio } = await server.ssrLoadModule('/src/features/portfolio/portfolioStore.js');
  const originalFetch = globalThis.fetch;
  const holding = [{ symbol: 'AAPL', shares: 2, cost: null }];
  localStorage.setItem('portfolioHoldings', JSON.stringify(holding));
  localStorage.setItem('portfolioProvider', 'finnhub');
  localStorage.setItem('portfolioFinnhubApiKey', 'fixture-secret');
  const paths = [];
  try {
    globalThis.fetch = async (url, options) => {
      const request = new URL(url);
      assert.equal(request.searchParams.get('symbol'), 'AAPL');
      assert.equal(request.searchParams.get('token'), 'fixture-secret');
      assert.ok(!options.headers || !Object.keys(options.headers).length);
      paths.push(request.pathname);
      return {
        ok: true,
        json: async () =>
          request.pathname.endsWith('/quote')
            ? { c: 250, pc: 245, t: 1793188800 }
            : { currency: 'USD', ticker: 'AAPL' },
      };
    };
    const result = await loadPortfolio(holding, 'finnhub', true);
    assert.deepEqual(result.failed, []);
    assert.equal(result.quotes['AAPL|'].price, 250);
    assert.equal(result.quotes['AAPL|'].currency, 'USD');
    assert.deepEqual(paths, ['/api/v1/quote', '/api/v1/stock/profile2']);
    assert.ok(!localStorage.getItem('portfolioQuoteCache').includes('fixture-secret'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('portfolio quote cache respects the selected listing and does not expose API keys', async () => {
  const { loadPortfolio } = await server.ssrLoadModule('/src/features/portfolio/portfolioStore.js');
  const originalFetch = globalThis.fetch;
  const holding = [{ symbol: 'ABC', exchange: 'XNAS', shares: 2, cost: null }];
  localStorage.setItem('portfolioHoldings', JSON.stringify(holding));
  localStorage.setItem('portfolioProvider', 'twelvedata');
  localStorage.setItem('portfolioTwelveDataApiKey', 'fixture-secret');
  let count = 0;
  try {
    globalThis.fetch = async (url, options) => {
      count += 1;
      assert.equal(new URL(url).searchParams.get('mic_code'), 'XNAS');
      assert.equal(options.headers.Authorization, 'apikey fixture-secret');
      return {
        ok: true,
        json: async () => ({ close: '10', previous_close: '9', currency: 'USD', mic_code: 'XNAS' }),
      };
    };
    const first = await loadPortfolio(holding, 'twelvedata');
    assert.equal(first.quotes['ABC|XNAS'].price, 10);
    assert.equal((await loadPortfolio(holding, 'twelvedata')).quotes['ABC|XNAS'].price, 10);
    assert.equal(count, 1);
    assert.ok(!localStorage.getItem('portfolioQuoteCache').includes('fixture-secret'));
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ close: '10', currency: 'USD', mic_code: 'XLON' }),
    });
    assert.deepEqual((await loadPortfolio(holding, 'twelvedata', true)).failed, ['ABC (XNAS)']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('portfolio exchange rates are cached locally and derive lev from the fixed euro rate', async () => {
  const { loadRates } = await server.ssrLoadModule('/src/features/portfolio/portfolioStore.js');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  try {
    globalThis.fetch = async () => {
      requests += 1;
      return {
        ok: true,
        json: async () => ({ base: 'USD', date: '2026-10-26', rates: { EUR: 0.8, GBP: 0.7 } }),
      };
    };
    const rates = await loadRates();
    assert.ok(Math.abs(rates.rates.BGN - 0.8 * 1.95583) < 0.000001);
    assert.equal((await loadRates()).date, '2026-10-26');
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('selectable languages cover English keys and retain interpolation placeholders', () => {
  const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  const languages = read('../src/i18n/languages.json');
  const flatten = (value, prefix = '') =>
    Object.entries(value).flatMap(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return item && typeof item === 'object' && !Array.isArray(item)
        ? flatten(item, path)
        : [[path, item]];
    });
  const source = flatten(read('../src/i18n/locales/en_GB.json'));
  const placeholders = (text) => (text.match(/\{[^{}]+\}/g) || []).sort();
  for (const { value } of languages) {
    const code = value === 'pt_PT' ? 'pt' : value;
    const locale = new Map(flatten(read(`../src/i18n/locales/${code}.json`)));
    for (const [key, text] of source) {
      assert.ok(typeof locale.get(key) === 'string' && locale.get(key).trim(), `${value}: ${key}`);
      assert.deepEqual(placeholders(locale.get(key)), placeholders(text), `${value}: ${key}`);
    }
  }
  for (const retired of ['peo', 'arz', 'azb']) {
    assert.ok(!languages.some((language) => language.value === retired));
  }
});

test('profile reset keeps personal notes and export includes pending text', async () => {
  const { resetProfile } = await server.ssrLoadModule('/src/utils/settings/profile.js');
  const { createBackup } = await server.ssrLoadModule('/src/utils/settings/export.js');
  const { durableWriter, registerDraft } = await server.ssrLoadModule(
    '/src/utils/durableWriter.js',
  );
  localStorage.setItem('notes', 'Navbar note');
  localStorage.setItem('googleClientSecret', 'keep');
  const note = [{ id: 'draft', x: 1, y: 1, text: 'Latest unsaved text' }];
  const writer = durableWriter((value) =>
    localStorage.setItem('scratchNotesData', JSON.stringify(value)),
  );
  const unregister = registerDraft('scratchNotesData', writer);
  writer.schedule(note);
  assert.deepEqual(JSON.parse((await createBackup()).settings.scratchNotesData), note);
  await resetProfile();
  assert.equal(localStorage.getItem('notes'), 'Navbar note');
  assert.equal(localStorage.getItem('googleClientSecret'), 'keep');
  assert.deepEqual(JSON.parse(localStorage.getItem('scratchNotesData')), note);
  unregister();
  writer.flush();
  await resetProfile(true);
  assert.equal(localStorage.getItem('googleClientSecret'), null);
  assert.deepEqual(await backgrounds.readScratchAssets(), []);
  assert.deepEqual(await backgrounds.getAllBackgrounds(), []);
});

test('RSS starts off in the centre above Mail and every widget has a preview', async () => {
  const widgets = await server.ssrLoadModule('/src/utils/widgets.js');
  const { default: migrate } = await server.ssrLoadModule('/src/utils/settings/migrations.js');
  const { WIDGET_PREVIEWS } = await server.ssrLoadModule(
    '/src/features/misc/sections/overview_skeletons/WidgetPreview.jsx',
  );
  const { THUMB_LAYOUT } = await server.ssrLoadModule(
    '/src/features/misc/sections/overview_skeletons/WidgetThumb.jsx',
  );
  assert.equal(widgets.isWidgetEnabled('rss'), false);
  localStorage.setItem('widgetPlacement', JSON.stringify({ rss: 'right', weather: 'right' }));
  localStorage.setItem('order', JSON.stringify(['time', 'mail', 'rss', 'tasks']));
  localStorage.setItem('rssEnabled', 'true');
  migrate();
  assert.equal(widgets.isWidgetEnabled('rss'), false);
  assert.equal(widgets.readPlacement().rss, 'center');
  assert.equal(widgets.readOrder().indexOf('rss') + 1, widgets.readOrder().indexOf('mail'));
  localStorage.setItem('rssEnabled', 'true');
  migrate();
  assert.equal(widgets.isWidgetEnabled('rss'), true);
  for (const widget of widgets.WIDGETS) {
    assert(Object.hasOwn(WIDGET_PREVIEWS, widget.id), `Missing ${widget.id} preview`);
    assert(WIDGET_PREVIEWS[widget.id] || THUMB_LAYOUT[widget.id], `Empty ${widget.id} preview`);
  }
});

test('Overview separates full-width centre lines from paired cards without changing side-column order', async () => {
  const { overviewRows } = await server.ssrLoadModule(
    '/src/features/misc/sections/overviewLayout.js',
  );
  const ids = ['time', 'mail', 'date', 'tasks', 'aiask', 'portfolio'];
  assert.deepEqual(overviewRows(ids, ['mail', 'tasks'], 'center'), [
    ['time'],
    ['date'],
    ['aiask'],
    ['mail', 'tasks'],
    ['portfolio'],
  ]);
  assert.deepEqual(
    overviewRows(ids, ['mail', 'tasks'], 'left'),
    ids.map((id) => [id]),
  );
  assert.deepEqual(overviewRows(['time', 'mail'], ['mail'], 'center'), [['time'], ['mail']]);
});

test('background transactions close connections so database upgrades are not blocked', async () => {
  await backgrounds.getBackgroundCount();
  await new Promise((resolve, reject) => {
    const request = indexedDB.open('MooCustomBackgrounds', 4);
    request.onblocked = () => reject(new Error('A background operation leaked its connection'));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
  });
});

test('video uploads recognise MIME types and video URLs with query strings', () => {
  for (const value of [
    'video/mp4',
    'video/webm',
    'data:video/mp4;base64,AA==',
    'https://example.com/clip.MP4?token=fixture',
  ])
    assert.equal(videoCheck(value), true);
  for (const value of ['image/png', undefined, 'https://example.com/photo.jpg'])
    assert.equal(videoCheck(value), false);
});

test('feed links resolve relative URLs and reject executable or unsupported schemes', () => {
  assert.equal(resolveFeedUrl('/story', 'https://example.com/feed'), 'https://example.com/story');
  assert.equal(resolveFeedUrl('javascript:alert(1)', 'https://example.com/feed'), '');
  assert.equal(normaliseUrl('feed://example.com/rss'), 'https://example.com/rss');
  assert.equal(normaliseUrl('ftp://example.com/rss'), null);
});

test('feed deduplication keeps distinct query-based stories and ignores tracking parameters', () => {
  const items = [
    { link: 'https://example.com/?p=1', date: 1 },
    { link: 'https://example.com/?p=2', date: 2 },
    { link: 'https://example.com/?p=1&utm_source=rss', date: 1 },
  ];
  assert.equal(mergeItems(items).length, 2);
});

test('weather shares in-flight reads and invalidates the cache for units and location', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return {
      ok: true,
      json: async () => ({
        main: { temp: 273.15, temp_min: 272.15, temp_max: 274.15, feels_like: 273.15 },
        weather: [{ icon: '01d', description: 'Clear' }],
        wind: { speed: 1, deg: 0 },
        clouds: { all: 0 },
      }),
    };
  };
  try {
    localStorage.setItem('tempformat', 'celsius');
    localStorage.setItem('currentWeather', 'damaged cache');
    const [first, second] = await Promise.all([getWeather('Sofia'), getWeather('Sofia')]);
    assert.equal(first.weather.temp, 0);
    assert.deepEqual(first, second);
    assert.equal(calls, 1);
    localStorage.setItem('tempformat', 'fahrenheit');
    assert.equal((await getWeather('Sofia')).weather.temp, 32);
    assert.equal(calls, 2);
    await getWeather('London');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = previous;
  }
});

test('webcam migration preserves custom channels and does not restore removed entries', async () => {
  const live = await server.ssrLoadModule('/src/features/background/api/live.js');
  assert.ok(live.LIVE_CHANNELS.filter((entry) => entry.id.startsWith('webcam-')).length >= 100);
  localStorage.setItem(
    'liveChannels',
    JSON.stringify([{ id: 'custom', name: 'Mine', url: 'https://example.com/live.m3u8' }]),
  );
  const migrated = live.readChannels();
  assert.equal(migrated[0].id, 'custom');
  assert.ok(migrated.length > 100);
  const removed = migrated.find((entry) => entry.id.startsWith('webcam-'));
  live.removeChannel(removed.id);
  assert.equal(
    live.readChannels().some((entry) => entry.id === removed.id),
    false,
  );
  localStorage.clear();
  localStorage.setItem('liveChannels', '[]');
  assert.deepEqual(live.readChannels(), []);
});

test('public video libraries reject unusable and copyrighted results', async () => {
  const { fetchNasaVideo, fetchCommonsVideo } = await server.ssrLoadModule(
    '/src/features/background/api/publicVideo.js',
  );
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      const address = String(url);
      if (address.includes('images-api.nasa.gov'))
        return Response.json({
          collection: {
            items: [
              {
                href: 'https://images-assets.nasa.gov/video/test/collection.json',
                data: [{ nasa_id: 'test', title: 'Earth' }],
              },
            ],
          },
        });
      if (address.includes('images-assets.nasa.gov'))
        return Response.json(['http://images-assets.nasa.gov/video/test/test~medium.mp4']);
      return Response.json({
        query: {
          pages: {
            1: {
              pageid: 1,
              title: 'File:Free.webm',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/free.webm',
                  mime: 'video/webm',
                  extmetadata: { LicenseShortName: { value: 'CC0' } },
                },
              ],
            },
            2: {
              pageid: 2,
              title: 'File:Restricted.webm',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/restricted.webm',
                  mime: 'video/webm',
                  extmetadata: { LicenseShortName: { value: 'All rights reserved' } },
                },
              ],
            },
          },
        },
      });
    };
    const nasa = await fetchNasaVideo();
    assert.equal(nasa.url, 'https://images-assets.nasa.gov/video/test/test~medium.mp4');
    assert.equal(nasa.sourceCredit.text, 'NASA');
    const commons = await fetchCommonsVideo();
    assert.equal(commons.photoInfo.id, 'commons-1');
    assert.match(commons.sourceCredit.url, /^https:\/\/commons\.wikimedia\.org\/wiki\//);
  } finally {
    globalThis.fetch = original;
  }
});
