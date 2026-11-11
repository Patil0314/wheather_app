/**
 * API Service Module
 * Handles all network requests to OpenWeatherMap with robust timeout, error handling, and parameter encoding.
 */

class WeatherAPIError extends Error {
  constructor(message, status = null, code = 'WEATHER_ERROR') {
    super(message);
    this.name = 'WeatherAPIError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Validates the API key configuration before initiating network traffic.
 */
function validateApiKey() {
  if (
    !CONFIG.API_KEY ||
    CONFIG.API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE' ||
    CONFIG.API_KEY.trim() === ''
  ) {
    throw new WeatherAPIError(
      'OpenWeatherMap API Key is missing or unconfigured. Please open js/config.js and paste your API key.',
      401,
      'MISSING_KEY'
    );
  }
}

/**
 * Wrapper for fetch with AbortController timeout support.
 * @param {string} url - Target URL.
 * @param {number} timeoutMs - Timeout duration in milliseconds.
 */
async function fetchWithTimeout(url, timeoutMs = CONFIG.TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new WeatherAPIError(
        'Request timed out. The weather server took too long to respond. Please check your connection.',
        408,
        'TIMEOUT'
      );
    }
    if (!navigator.onLine) {
      throw new WeatherAPIError(
        'You appear to be offline. Please verify your internet connection and try again.',
        0,
        'OFFLINE'
      );
    }
    throw new WeatherAPIError(
      'Network request failed. Please check your internet connection or firewall settings.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses and handles API response errors in a unified format.
 * @param {Response} response
 */
async function handleResponse(response) {
  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {
    throw new WeatherAPIError(
      `Received invalid response from weather server (HTTP ${response.status}).`,
      response.status,
      'INVALID_JSON'
    );
  }

  if (!response.ok) {
    // Extract OpenWeatherMap message if available
    const apiMessage = responseData && responseData.message 
      ? responseData.message 
      : response.statusText;

    switch (response.status) {
      case 401:
        throw new WeatherAPIError(
          'Invalid API Key (HTTP 401). Please verify your OpenWeatherMap key in js/config.js. Note: Newly generated keys may take 10-30 minutes to activate.',
          401,
          'INVALID_KEY'
        );
      case 404:
        throw new WeatherAPIError(
          'City not found. Please verify the city name or spelling and try again (e.g., "London" or "Tokyo, JP").',
          404,
          'CITY_NOT_FOUND'
        );
      case 429:
        throw new WeatherAPIError(
          'API Rate limit exceeded (HTTP 429). Too many requests in a short period. Please wait a minute and try again.',
          429,
          'RATE_LIMIT'
        );
      default:
        throw new WeatherAPIError(
          `Weather API error: ${apiMessage} (Code ${response.status})`,
          response.status,
          'API_ERROR'
        );
    }
  }

  return responseData;
}

/**
 * Fetches current weather data for a given city query or coordinates.
 * @param {string} city - City name or 'City,CountryCode'
 * @returns {Promise<Object>}
 */
async function fetchCurrentWeather(city) {
  validateApiKey();
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    throw new WeatherAPIError('Please enter a city name to search.', 400, 'EMPTY_QUERY');
  }

  const queryParams = new URLSearchParams({
    q: trimmedCity,
    units: CONFIG.UNITS,
    appid: CONFIG.API_KEY
  });

  const url = `${CONFIG.CURRENT_WEATHER_URL}?${queryParams.toString()}`;
  const response = await fetchWithTimeout(url);
  return await handleResponse(response);
}

/**
 * Fetches 5-day / 3-hour forecast data for a given city query.
 * @param {string} city - City name or 'City,CountryCode'
 * @returns {Promise<Object>}
 */
async function fetchWeatherForecast(city) {
  validateApiKey();
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    throw new WeatherAPIError('Please enter a city name to search.', 400, 'EMPTY_QUERY');
  }

  const queryParams = new URLSearchParams({
    q: trimmedCity,
    units: CONFIG.UNITS,
    appid: CONFIG.API_KEY
  });

  const url = `${CONFIG.FORECAST_URL}?${queryParams.toString()}`;
  const response = await fetchWithTimeout(url);
  return await handleResponse(response);
}

