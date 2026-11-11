/**
 * OpenWeatherMap API Configuration
 * 
 * INSTRUCTIONS:
 * 1. Register or sign in at https://openweathermap.org/
 * 2. Navigate to your API keys section: https://home.openweathermap.org/api_keys
 * 3. Generate a free API key (default "Current Weather and 5-Day Forecast" tier).
 * 4. Paste your key into the API_KEY constant below, replacing 'YOUR_OPENWEATHERMAP_API_KEY_HERE'.
 * 5. Save this file and reload the application.
 *
 * NOTE: Newly generated keys on OpenWeatherMap can take 10-30 minutes to activate globally.
 */
const CONFIG = {
  // Replace the placeholder below with your 32-character hex API key:
  API_KEY: '5e15b6cae83e4cd0e2bd88dfebb86a2e',

  // Base URLs for OpenWeatherMap endpoints
  CURRENT_WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather',
  FORECAST_URL: 'https://api.openweathermap.org/data/2.5/forecast',

  // Default units: metric (Celsius, m/s)
  UNITS: 'metric',

  // Request timeout in milliseconds (10 seconds)
  TIMEOUT_MS: 10000,

  // Storage key for recent searches
  STORAGE_KEY_RECENT_SEARCHES: 'weather_dashboard_recent_cities',
  MAX_RECENT_SEARCHES: 6,

  // Default city to load if no previous search exists
  DEFAULT_CITY: 'Mumbai'
};

// Freeze the configuration object to prevent inadvertent modifications
Object.freeze(CONFIG);

