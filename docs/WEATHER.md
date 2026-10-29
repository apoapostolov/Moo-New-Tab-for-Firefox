# Weather sources

Choose a source under Settings → Weather. The default OpenWeather option uses Mue's shared connection and needs no personal API key.

- **Open-Meteo** needs no key for non-commercial use. Choose its automatic forecast or one of the listed models. Model coverage and available fields vary by location. The data is served by Open-Meteo and credited in the widget.
- **OpenWeather**, **WeatherAPI.com** and **Visual Crossing** each require an API key from the respective service. Free accounts are available, subject to each provider's limits and terms. Moo stores keys on the device, sends them to the selected provider and excludes them from backups.
- **Sinoptik.bg** reads a public forecast page. Open your location on Sinoptik.bg and paste its address into Weather settings. The page currently provides three days of forecast in the view Moo reads. The scraper depends on the site's page structure and may need updating if it changes.

The selected provider supplies both current conditions and the forecast, apart from the default OpenWeather option, whose forecast uses Open-Meteo. WeatherAPI.com's free plan may provide fewer than five forecast days. Not every source supplies every detail; Moo leaves unavailable details out.
