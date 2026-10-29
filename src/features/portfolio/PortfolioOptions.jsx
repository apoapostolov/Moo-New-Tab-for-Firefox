import { useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';
import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';
import { Dropdown } from 'components/Form/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import EventBus from 'utils/eventbus';
import {
  CURRENCIES,
  holdingId,
  providerKeys,
  readHoldingsState,
  validHolding,
} from './portfolioStore';
import './portfolio.scss';
import 'scss/features.scss';
import 'components/Form/Settings/Text/Text.scss';

const empty = { symbol: '', exchange: '', shares: '', cost: '' };
export default function PortfolioOptions() {
  useTranslationVersion();
  const [initial] = useState(readHoldingsState);
  const [holdings, setHoldings] = useState(initial.holdings);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(
    () => localStorage.getItem('portfolioProvider') || 'finnhub',
  );
  const [keys, setKeys] = useState(() =>
    Object.fromEntries(
      Object.values(providerKeys).map((key) => [key, localStorage.getItem(key) || '']),
    ),
  );
  const keyName = providerKeys[provider];
  const currencyNames = new Intl.DisplayNames([navigator.language], { type: 'currency' });
  const commit = (change) => {
    const current = readHoldingsState();
    if (current.damaged) {
      setError(uiText('portfolio_data_damaged'));
      return false;
    }
    const next = typeof change === 'function' ? change(current.holdings) : change;
    try {
      localStorage.setItem('portfolioHoldings', JSON.stringify(next));
    } catch {
      setError(uiText('portfolio_save_error'));
      return false;
    }
    localStorage.removeItem('portfolioQuoteCache');
    localStorage.removeItem('portfolioHistory');
    setHoldings(next);
    EventBus.emit('refresh', 'portfolio');
    return true;
  };
  const save = () => {
    const current = readHoldingsState();
    if (current.damaged) {
      setError(uiText('portfolio_data_damaged'));
      return;
    }
    const latest = current.holdings;
    const item = {
      symbol: draft.symbol.trim().toUpperCase(),
      exchange: provider === 'finnhub' ? '' : draft.exchange.trim().toUpperCase(),
      shares: Number(draft.shares),
      cost: draft.cost.trim() === '' ? null : Number(draft.cost),
    };
    if (
      !validHolding(item) ||
      (editing && !latest.some((item) => holdingId(item) === editing)) ||
      latest.some(
        (existing) => holdingId(existing) === holdingId(item) && holdingId(existing) !== editing,
      )
    ) {
      setError(uiText('portfolio_invalid_holding'));
      return;
    }
    const saved = commit(
      editing ? latest.map((old) => (holdingId(old) === editing ? item : old)) : [...latest, item],
    );
    if (!saved) return;
    setDraft(empty);
    setEditing(null);
    setError('');
  };
  return (
    <>
      <Header
        title={uiText('portfolio_title')}
        setting="portfolioEnabled"
        category="widgets"
        visibilityToggle
      />
      <Group>
        <Row>
          <Content
            title={uiText('portfolio_provider')}
            subtitle={uiText('portfolio_provider_hint')}
          />
          <Action>
            <Dropdown
              name="portfolioProvider"
              category="portfolio"
              items={[
                { value: 'finnhub', text: 'Finnhub' },
                { value: 'twelvedata', text: 'Twelve Data' },
              ]}
              onChange={(value) => {
                localStorage.removeItem('portfolioQuoteCache');
                localStorage.removeItem('portfolioHistory');
                setProvider(value);
              }}
            />
          </Action>
        </Row>
        <Row>
          <Content
            title={uiText('portfolio_currency')}
            subtitle={uiText('portfolio_currency_hint')}
          />
          <Action>
            <Dropdown
              name="portfolioCurrency"
              category="portfolio"
              items={CURRENCIES.map((code) => ({
                value: code,
                text: `${code} · ${currencyNames.of(code)}`,
              }))}
              onChange={() => localStorage.removeItem('portfolioHistory')}
            />
          </Action>
        </Row>
        <Row>
          <Content
            title={uiText('portfolio_api_key')}
            subtitle={uiText('portfolio_api_key_hint')}
          />
          <Action>
            <div className="text-field-container">
              <div className="text-field">
                <input
                  className="text-field-input"
                  type="password"
                  autoComplete="off"
                  aria-label={uiText('portfolio_api_key')}
                  value={keys[keyName] || ''}
                  onChange={(event) => setKeys({ ...keys, [keyName]: event.target.value })}
                  onBlur={() => {
                    localStorage.setItem(keyName, (keys[keyName] || '').trim());
                    localStorage.removeItem('portfolioQuoteCache');
                    EventBus.emit('refresh', 'portfolio');
                  }}
                />
              </div>
            </div>
            <a
              className="portfolioProviderLink"
              href={
                provider === 'finnhub'
                  ? 'https://finnhub.io/register'
                  : 'https://twelvedata.com/pricing'
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              {provider === 'finnhub' ? 'Finnhub' : 'Twelve Data'}
            </a>
          </Action>
        </Row>
        <WidgetSurface setting="surfacePortfolio" category="portfolio" />
      </Group>
      <Group>
        <Row>
          <Content
            title={uiText('portfolio_holdings')}
            subtitle={uiText('portfolio_holdings_hint')}
          />
        </Row>
        {initial.damaged ? (
          <Row>
            <Content subtitle={uiText('portfolio_data_damaged')} />
          </Row>
        ) : (
          <Row>
            <form
              className="portfolioForm"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <div
                className="portfolioHoldingsScroll"
                role="region"
                aria-label={uiText('portfolio_holdings')}
                tabIndex={0}
              >
                <table className="portfolioHoldingsTable">
                  <colgroup>
                    <col />
                    <col />
                    <col />
                    <col className="portfolioControlsColumn" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" id="portfolio-symbol-heading">
                        {uiText('portfolio_symbol')}
                      </th>
                      <th scope="col" id="portfolio-shares-heading">
                        {uiText('portfolio_shares')}
                      </th>
                      <th scope="col" id="portfolio-cost-heading">
                        {uiText('portfolio_cost')}{' '}
                        <span className="portfolioOptional">({uiText('portfolio_optional')})</span>
                      </th>
                      <th scope="col" aria-label={uiText('portfolio_actions')} />
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((item) => (
                      <tr key={holdingId(item)}>
                        <td>
                          <button
                            type="button"
                            className="portfolioEditSymbol"
                            aria-label={`${uiText('portfolio_edit')} ${item.symbol} ${item.exchange || ''}`}
                            onClick={() => {
                              setDraft({
                                symbol: item.symbol,
                                exchange: item.exchange || '',
                                shares: String(item.shares),
                                cost: item.cost == null ? '' : String(item.cost),
                              });
                              setEditing(holdingId(item));
                              setError('');
                            }}
                          >
                            <strong>{item.symbol}</strong>
                            {item.exchange && (
                              <small className="portfolioExchangeLabel">{item.exchange}</small>
                            )}
                          </button>
                        </td>
                        <td>{item.shares}</td>
                        <td>{item.cost ?? '—'}</td>
                        <td>
                          <div className="portfolioHoldingActions">
                            <button
                              type="button"
                              className="portfolioGlyph"
                              aria-label={`${uiText('portfolio_remove')} ${item.symbol} ${item.exchange || ''}`}
                              onClick={() => {
                                if (
                                  !commit((latest) =>
                                    latest.filter(
                                      (holding) => holdingId(holding) !== holdingId(item),
                                    ),
                                  )
                                )
                                  return;
                                if (editing === holdingId(item)) {
                                  setEditing(null);
                                  setDraft(empty);
                                }
                              }}
                            >
                              <MdDeleteOutline />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="portfolioDraftRow">
                      <td>
                        <div className="portfolioSymbolFields">
                          <input
                            className="text-field-input"
                            aria-labelledby="portfolio-symbol-heading"
                            value={draft.symbol}
                            placeholder="AAPL"
                            maxLength={20}
                            required
                            onChange={(event) => setDraft({ ...draft, symbol: event.target.value })}
                          />
                          {provider === 'twelvedata' && (
                            <input
                              className="text-field-input portfolioExchangeInput"
                              aria-label={uiText('portfolio_exchange')}
                              placeholder="MIC"
                              maxLength={4}
                              value={draft.exchange}
                              onChange={(event) =>
                                setDraft({ ...draft, exchange: event.target.value })
                              }
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          className="text-field-input"
                          aria-labelledby="portfolio-shares-heading"
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={draft.shares}
                          onChange={(event) => setDraft({ ...draft, shares: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="text-field-input"
                          aria-label={uiText('portfolio_cost_optional')}
                          type="number"
                          min="0"
                          step="any"
                          value={draft.cost}
                          onChange={(event) => setDraft({ ...draft, cost: event.target.value })}
                        />
                      </td>
                      <td>
                        <div className="portfolioHoldingActions">
                          <button
                            type="button"
                            className="portfolioGlyph"
                            aria-label={uiText('portfolio_clear_fields')}
                            disabled={!editing && !Object.values(draft).some(Boolean)}
                            onClick={() => {
                              setDraft(empty);
                              setEditing(null);
                              setError('');
                            }}
                          >
                            <MdDeleteOutline />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {error && <p role="alert">{error}</p>}
              <div className="featureActions portfolioFormActions">
                {editing && (
                  <button
                    type="button"
                    className="featureButton featureButtonSecondary"
                    onClick={() => {
                      setEditing(null);
                      setDraft(empty);
                      setError('');
                    }}
                  >
                    {uiText('portfolio_cancel')}
                  </button>
                )}
                <button type="submit" className="featureButton">
                  {uiText(editing ? 'portfolio_save' : 'portfolio_add')}
                </button>
              </div>
            </form>
          </Row>
        )}
      </Group>
    </>
  );
}
