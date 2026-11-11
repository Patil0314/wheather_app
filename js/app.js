/**
 * Main Application Module
 * Orchestrates DOM interactions, state, search history, theme switching, and live UI updates.
 */

// Application State
const state = {
  currentCity: '',
  currentWeatherData: null,
  forecastData: null,
  isLoading: false,
  activeTheme: 'theme-default'
};

// DOM Element References Cache
const elements = {
  // Search and Header
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  searchButton: document.getElementById('search-btn'),
  clearInputButton: document.getElementById('clear-input-btn'),
  currentDateDisplay: document.getElementById('current-date-display'),
  
  // Status feedback
  loadingOverlay: document.getElementById('loading-overlay'),
  errorMessageContainer: document.getElementById('error-message-container'),
  errorMessageText: document.getElementById('error-message-text'),
  errorDismissBtn: document.getElementById('error-dismiss-btn'),
  apiConfigBanner: document.getElementById('api-config-banner'),

  // Weather Content Display
  dashboardContent: document.getElementById('dashboard-content'),
  
  // Primary weather card
  cityName: document.getElementById('city-name'),
  countryCode: document.getElementById('country-code'),
  weatherCondition: document.getElementById('weather-condition'),
  weatherDescription: document.getElementById('weather-description'),
  currentTemp: document.getElementById('current-temp'),
  feelsLikeTemp: document.getElementById('feels-like-temp'),
  todayTempMax: document.getElementById('today-temp-max'),
  todayTempMin: document.getElementById('today-temp-min'),
  currentWeatherIcon: document.getElementById('current-weather-icon'),
  cityLocalTime: document.getElementById('city-local-time'),

  // Metrics
  metricHumidity: document.getElementById('metric-humidity'),
  metricHumidityBar: document.getElementById('metric-humidity-bar'),
  metricWindSpeed: document.getElementById('metric-wind-speed'),
  metricWindDirection: document.getElementById('metric-wind-direction'),
  metricPressure: document.getElementById('metric-pressure'),
  metricVisibility: document.getElementById('metric-visibility'),
  metricSunrise: document.getElementById('metric-sunrise'),
  metricSunset: document.getElementById('metric-sunset'),

  // Forecast
  forecastContainer: document.getElementById('forecast-container'),

  // Recent Searches
  recentSearchesList: document.getElementById('recent-searches-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  recentSearchesSection: document.getElementById('recent-searches-section')
};

// Theme mapping based on OpenWeatherMap icon codes and weather conditions
const THEME_MAP = {
  // Clear Day & Night
  '01d': 'theme-sunny',
  '01n': 'theme-night',
  // Few Clouds Day & Night
  '02d': 'theme-sunny',
  '02n': 'theme-night',
  // Scattered / Broken / Overcast Clouds
  '03d': 'theme-cloudy',
  '03n': 'theme-cloudy-night',
  '04d': 'theme-cloudy',
  '04n': 'theme-cloudy-night',
  // Shower Rain / Rain
  '09d': 'theme-rainy',
  '09n': 'theme-rainy-night',
  '10d': 'theme-rainy',
  '10n': 'theme-rainy-night',
  // Thunderstorm
  '11d': 'theme-thunderstorm',
  '11n': 'theme-thunderstorm',
  // Snow
  '13d': 'theme-snowy',
  '13n': 'theme-snowy',
  // Atmosphere (Mist, Fog, Haze, Dust)
  '50d': 'theme-mist',
  '50n': 'theme-mist'
};

/**
 * Format timestamp (UTC seconds + timezone offset in seconds) to a localized HH:MM string.
 * @param {number} timestampUtcSec
 * @param {number} timezoneOffsetSec
 * @returns {string} e.g. "06:42 AM"
 */
function formatLocalTime(timestampUtcSec, timezoneOffsetSec = 0) {
  const localDate = new Date((timestampUtcSec + timezoneOffsetSec) * 1000);
  let hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * Format wind direction degrees into 16-point compass directions.
 * @param {number} deg
 * @returns {string} Compass direction (e.g., 'ENE', 'SW')
 */
function degToCompass(deg) {
  if (typeof deg !== 'number') return '';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[(val % 16)];
}

/**
 * Capitalizes every word in a string for crisp presentation.
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Updates UI loading state.
 * Disables form submission and shows loading spinner.
 */
function showLoading() {
  state.isLoading = true;
  elements.loadingOverlay.classList.remove('hidden');
  elements.searchButton.disabled = true;
  elements.searchInput.disabled = true;
  hideError();
}

/**
 * Removes loading state and re-enables UI controls.
 */
function hideLoading() {
  state.isLoading = false;
  elements.loadingOverlay.classList.add('hidden');
  elements.searchButton.disabled = false;
  elements.searchInput.disabled = false;
}

/**
 * Displays user-friendly error message container.
 * @param {string} message
 */
function showError(message) {
  elements.errorMessageText.textContent = message;
  elements.errorMessageContainer.classList.remove('hidden');
  elements.errorMessageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hides error message container.
 */
function hideError() {
  elements.errorMessageContainer.classList.add('hidden');
  elements.errorMessageText.textContent = '';
}

/**
 * Updates dynamic body background theme according to weather conditions and daylight.
 * @param {Object} currentData
 */
function updateWeatherTheme(currentData) {
  if (!currentData || !currentData.weather || !currentData.weather[0]) {
    return;
  }

  const iconCode = currentData.weather[0].icon;
  const themeClass = THEME_MAP[iconCode] || 'theme-sunny';

  // Remove existing themes from body
  document.body.className = '';
  document.body.classList.add(themeClass);
  state.activeTheme = themeClass;
}

/**
 * Displays current weather data in dashboard UI.
 * @param {Object} data - OpenWeatherMap current weather response
 */
function displayCurrentWeather(data) {
  if (!data) return;

  const weather = data.weather && data.weather[0] ? data.weather[0] : {};
  const main = data.main || {};
  const wind = data.wind || {};
  const sys = data.sys || {};
  const timezone = data.timezone || 0;

  // City & Country
  elements.cityName.textContent = data.name || 'Unknown Location';
  elements.countryCode.textContent = sys.country ? `${sys.country}` : '';
  
  // Local Time
  const nowUtc = Math.floor(Date.now() / 1000);
  elements.cityLocalTime.textContent = `Local Time: ${formatLocalTime(nowUtc, timezone)}`;

  // Weather Condition & Description
  elements.weatherCondition.textContent = weather.main || 'Clear';
  elements.weatherDescription.textContent = capitalizeWords(weather.description || '');

  // Weather Icon
  if (weather.icon) {
    elements.currentWeatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
    elements.currentWeatherIcon.alt = weather.description || 'Weather condition icon';
  }

  // Temperatures
  elements.currentTemp.textContent = Math.round(main.temp ?? 0);
  elements.feelsLikeTemp.textContent = Math.round(main.feels_like ?? 0);
  elements.todayTempMax.textContent = Math.round(main.temp_max ?? 0);
  elements.todayTempMin.textContent = Math.round(main.temp_min ?? 0);

  // Metrics Section
  // 1. Humidity
  const humidity = main.humidity ?? 0;
  elements.metricHumidity.textContent = `${humidity}%`;
  if (elements.metricHumidityBar) {
    elements.metricHumidityBar.style.width = `${Math.min(humidity, 100)}%`;
  }

  // 2. Wind Speed & Direction
  const windSpeed = (wind.speed ?? 0).toFixed(1);
  const windDir = degToCompass(wind.deg);
  elements.metricWindSpeed.textContent = `${windSpeed} m/s`;
  elements.metricWindDirection.textContent = windDir ? `Direction: ${windDir} (${wind.deg}°)` : 'Direction: N/A';

  // 3. Pressure
  elements.metricPressure.textContent = `${main.pressure ?? 1013} hPa`;

  // 4. Visibility (API gives meters, convert to km)
  if (typeof data.visibility === 'number') {
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    elements.metricVisibility.textContent = `${visibilityKm} km`;
  } else {
    elements.metricVisibility.textContent = 'N/A';
  }

  // 5. Sunrise & Sunset
  if (sys.sunrise) {
    elements.metricSunrise.textContent = formatLocalTime(sys.sunrise, timezone);
  } else {
    elements.metricSunrise.textContent = '--:--';
  }

  if (sys.sunset) {
    elements.metricSunset.textContent = formatLocalTime(sys.sunset, timezone);
  } else {
    elements.metricSunset.textContent = '--:--';
  }

  // Update Dynamic Theme
  updateWeatherTheme(data);
}

/**
 * Displays the 5-day daily forecast cards in the forecast grid.
 * @param {Array<Object>} dailyForecasts - Processed daily summaries
 */
function displayForecast(dailyForecasts) {
  elements.forecastContainer.innerHTML = '';

  if (!dailyForecasts || dailyForecasts.length === 0) {
    elements.forecastContainer.innerHTML = '<p class="empty-state">No forecast data available.</p>';
    return;
  }

  dailyForecasts.forEach((forecast, index) => {
    const card = document.createElement('article');
    card.className = `forecast-card ${forecast.isToday ? 'is-today' : ''}`;
    card.style.animationDelay = `${index * 80}ms`;

    const iconUrl = `https://openweathermap.org/img/wn/${forecast.icon}@2x.png`;

    card.innerHTML = `
      <div class="forecast-day-header">
        <h4 class="forecast-day-name">${forecast.dayName}</h4>
        <span class="forecast-date-label">${forecast.dateLabel}</span>
      </div>
      <div class="forecast-icon-wrapper">
        <img src="${iconUrl}" alt="${forecast.description}" class="forecast-icon" loading="lazy" />
      </div>
      <div class="forecast-condition-desc" title="${forecast.description}">${forecast.description}</div>
      <div class="forecast-temps">
        <span class="forecast-temp-main">${forecast.temp}°C</span>
        <div class="forecast-temp-range">
          <span class="temp-high" title="Maximum Temperature"><i class="fas fa-arrow-up"></i> ${forecast.tempMax}°</span>
          <span class="temp-low" title="Minimum Temperature"><i class="fas fa-arrow-down"></i> ${forecast.tempMin}°</span>
        </div>
      </div>
      <div class="forecast-extra-metrics">
        <span title="Humidity"><i class="fas fa-droplet"></i> ${forecast.humidity}%</span>
        <span title="Wind Speed"><i class="fas fa-wind"></i> ${forecast.windSpeed}m/s</span>
      </div>
    `;

    elements.forecastContainer.appendChild(card);
  });
}

/**
 * Saves a city to localStorage recent searches, preventing duplicates and keeping latest at front.
 * @param {string} city
 */
function saveRecentSearch(city) {
  if (!city || typeof city !== 'string') return;
  const trimmed = city.trim();
  if (!trimmed) return;

  try {
    let searches = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_RECENT_SEARCHES) || '[]');
    // Filter out existing occurrence (case-insensitive match)
    searches = searches.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    // Prepend to top
    searches.unshift(trimmed);
    // Limit to configured max
    if (searches.length > CONFIG.MAX_RECENT_SEARCHES) {
      searches = searches.slice(0, CONFIG.MAX_RECENT_SEARCHES);
    }
    localStorage.setItem(CONFIG.STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(searches));
    renderRecentSearches();
  } catch (e) {
    console.warn('Unable to save search to localStorage:', e);
  }
}

/**
 * Reads recent searches from localStorage.
 * @returns {Array<string>}
 */
function loadRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_RECENT_SEARCHES) || '[]');
  } catch (e) {
    console.warn('Unable to read recent searches from localStorage:', e);
    return [];
  }
}

/**
 * Clears recent search history from localStorage and DOM.
 */
function clearRecentSearches() {
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEY_RECENT_SEARCHES);
    renderRecentSearches();
  } catch (e) {
    console.warn('Unable to clear recent searches:', e);
  }
}

/**
 * Renders the recent searches pill list in the DOM.
 */
function renderRecentSearches() {
  const searches = loadRecentSearches();
  elements.recentSearchesList.innerHTML = '';

  if (searches.length === 0) {
    elements.recentSearchesSection.classList.add('hidden');
    return;
  }

  elements.recentSearchesSection.classList.remove('hidden');

  searches.forEach(city => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'recent-city-pill';
    pill.setAttribute('aria-label', `Search weather for ${city}`);
    pill.innerHTML = `
      <i class="fas fa-location-dot pill-icon"></i>
      <span class="pill-text">${city}</span>
    `;

    pill.addEventListener('click', () => {
      elements.searchInput.value = city;
      handleSearch(city);
    });

    elements.recentSearchesList.appendChild(pill);
  });
}

/**
 * Primary search handler for city weather fetching.
 * Orchestrates fetch, forecast processing, DOM updates, error handling, and history.
 * @param {string} cityQuery
 */
async function handleSearch(cityQuery) {
  const query = (cityQuery || elements.searchInput.value || '').trim();

  // Validate empty input
  if (!query) {
    showError('Please enter a city name to search.');
    elements.searchInput.focus();
    return;
  }

  // Prevent duplicate requests while already fetching
  if (state.isLoading) {
    return;
  }

  showLoading();

  try {
    // Check if API key is still placeholder
    if (CONFIG.API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
      elements.apiConfigBanner.classList.remove('hidden');
      throw new WeatherAPIError(
        'Please configure your OpenWeatherMap API key in js/config.js to retrieve live weather data.',
        401,
        'MISSING_KEY'
      );
    } else {
      elements.apiConfigBanner.classList.add('hidden');
    }

    // Fetch both current weather and 5-day forecast concurrently
    const [currentData, forecastRaw] = await Promise.all([
      fetchCurrentWeather(query),
      fetchWeatherForecast(query)
    ]);

    // Update State
    state.currentCity = currentData.name;
    state.currentWeatherData = currentData;
    state.forecastData = forecastRaw;

    // Render Current Weather
    displayCurrentWeather(currentData);

    // Process & Render 5-day forecast
    const dailyForecast = processDailyForecast(forecastRaw);
    displayForecast(dailyForecast);

    // Save to search history with official normalized city name
    const formattedCity = currentData.sys && currentData.sys.country 
      ? `${currentData.name}, ${currentData.sys.country}` 
      : currentData.name;
    saveRecentSearch(formattedCity);

    // Reveal Dashboard
    elements.dashboardContent.classList.remove('hidden');

  } catch (error) {
    console.error('Error fetching weather data:', error);
    showError(error.message || 'An unexpected error occurred while fetching weather data.');
  } finally {
    hideLoading();
  }
}

/**
 * Initialize current date display in header.
 */
function initCurrentDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const today = new Date();
  elements.currentDateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

/**
 * Setup event listeners for forms, buttons, and inputs.
 */
function setupEventListeners() {
  // Search Form Submit
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch(elements.searchInput.value);
  });

  // Clear Input Button
  if (elements.clearInputButton) {
    elements.clearInputButton.addEventListener('click', () => {
      elements.searchInput.value = '';
      elements.searchInput.focus();
      elements.clearInputButton.classList.add('hidden');
    });

    elements.searchInput.addEventListener('input', () => {
      if (elements.searchInput.value.trim().length > 0) {
        elements.clearInputButton.classList.remove('hidden');
      } else {
        elements.clearInputButton.classList.add('hidden');
      }
    });
  }

  // Error dismiss button
  if (elements.errorDismissBtn) {
    elements.errorDismissBtn.addEventListener('click', hideError);
  }

  // Clear History Button
  if (elements.clearHistoryBtn) {
    elements.clearHistoryBtn.addEventListener('click', () => {
      clearRecentSearches();
    });
  }

  // Check online/offline status
  window.addEventListener('online', () => {
    hideError();
  });
  window.addEventListener('offline', () => {
    showError('Internet connection lost. You are currently offline.');
  });
}

/**
 * Initialize the application on DOM ready.
 */
function initApp() {
  initCurrentDateDisplay();
  setupEventListeners();
  renderRecentSearches();

  // Check for API key presence
  if (CONFIG.API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
    elements.apiConfigBanner.classList.remove('hidden');
  }

  // Load either the last searched city or default city
  const recent = loadRecentSearches();
  const initialCity = recent.length > 0 ? recent[0] : CONFIG.DEFAULT_CITY;
  elements.searchInput.value = initialCity;

  // Initial fetch
  if (CONFIG.API_KEY !== 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
    handleSearch(initialCity);
  }
}

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

