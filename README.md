# AeroPulse | Live Weather Telemetry Dashboard

> A production-grade, responsive live weather dashboard engineered with modern semantic **HTML5**, **CSS3 (Custom Properties & Glassmorphism)**, and **ES6+ Vanilla JavaScript**. The application streams and visualizes meteorological data for any global municipality using the OpenWeatherMap REST API suite.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [File & Directory Architecture](#file--directory-architecture)
5. [OpenWeatherMap API Setup & Configuration](#openweathermap-api-setup--configuration)
6. [Architectural Highlights](#architectural-highlights)
   - [Fetch API & Async Pipeline](#fetch-api--async-pipeline)
   - [5-Day / 3-Hour Forecast Aggregation Algorithm](#5-day--3-hour-forecast-aggregation-algorithm)
   - [Dynamic Weather-Driven Themes](#dynamic-weather-driven-themes)
   - [Search History with `localStorage`](#search-history-with-localstorage)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [Installation & Local Deployment](#installation--local-deployment)
9. [Verification & Test Results](#verification--test-results)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

**AeroPulse** was built as a premier frontend engineering assignment to demonstrate clean code architecture, modular design, modern CSS techniques, and resilient asynchronous data processing—without relying on bulky external frameworks (such as React, Vue, or Angular) or build step bundlers.

The interface adheres to modern SaaS telemetry standards:
- Smooth glassmorphism surfaces (`backdrop-filter: blur()`).
- Responsive multi-tier layout (Mobile, Tablet, Desktop).
- Fluid typography and large temperature callouts.
- High-contrast accessible text across all dynamic condition themes.

---

## Key Features

### 1. Global City Search
- Real-time querying of any municipality worldwide (supports `"City"` and `"City, CountryCode"`, e.g. `Mumbai`, `Tokyo, JP`, `London, UK`).
- Interactive keyboard support (`Enter` key or search button).
- Input sanitation and instant validation against empty queries.
- Duplicate search prevention during active network fetch cycles.
- Quick clear query button (`✕`) for rapid retyping.

### 2. Comprehensive Current Atmospheric Telemetry
- Primary large-scale temperature visualization formatted in Celsius (`°C`).
- Meteorological condition category (e.g. *Clear*, *Clouds*, *Rain*, *Thunderstorm*, *Snow*, *Mist*) with detailed descriptive subtitle.
- Real-time weather icon sourced from OpenWeatherMap's `@4x` asset repository.
- "Feels-Like" thermal index.
- Daily minimum and maximum temperature boundaries.
- Dedicated telemetry cards:
  - **Humidity**: Relative percentage with dynamic animated progress gauge.
  - **Wind Speed & Direction**: Real-time velocity (`m/s`) alongside converted 16-point compass heading (e.g. `ENE`, `SW`) and degrees.
  - **Atmospheric Pressure**: Barometric reading in hectopascals (`hPa`).
  - **Visibility**: Horizontal line-of-sight distance converted into kilometers (`km`).
  - **Solar Cycle**: Time-zone adjusted local dawn (**Sunrise**) and dusk (**Sunset**).

### 3. Synthesized 5-Day Meteorological Forecast
- The OpenWeatherMap free tier returns 40 data points sampled in 3-hour increments.
- AeroPulse uses functional programming (`Array.reduce`, `Array.map`, `Array.filter`) to group and synthesize these points into **5 distinct daily forecast summaries**.
- Each card highlights:
  - Day label and formatted date (e.g., `Today`, `Thu, Nov 12`).
  - Representative weather icon and condition description.
  - Average daytime temperature.
  - Diurnal high/low extremes (`▲ max`, `▼ min`).
  - Daily average humidity and wind speed telemetry.

### 4. Dynamic Weather-Driven Atmosphere Themes
The application dynamically transforms its visual aesthetic (gradients, ambient glow, and border accents) to reflect the target city's prevailing condition and daylight phase:
- **Sunny / Clear Day**: Vibrant warm blue and golden amber gradient.
- **Clear Night**: Deep navy, starlight indigo, and amethyst purple gradient.
- **Overcast / Cloudy**: Muted steel and slate-grey gradient.
- **Rainy & Drizzle**: Deep oceanic slate and cyan gradient.
- **Thunderstorm**: Dark storm purple and lightning violet gradient.
- **Snow**: Cool frosty cyan, icy slate, and crisp white gradient.
- **Atmospheric Mist/Fog**: Soft charcoal and mist-grey gradient.

### 5. Persistent Search History
- Recently searched locations are persisted locally in the browser via `localStorage`.
- Rendered as one-touch interactive badges for rapid instant recall.
- Prevents duplicate entries and automatically promotes the most recent query to the top.
- Includes a dedicated "Clear History" utility.

### 6. Resilient Error Handling
- Proactive validation: alerts user if the API key in `config.js` is still the placeholder.
- HTTP 404: clear, actionable messaging for non-existent or misspelled locations.
- HTTP 401: explicit notification for unactivated or invalid keys.
- HTTP 429: polite rate-limit notification.
- Timeouts: 10-second `AbortController` timeout safeguard prevents stalled spinners.
- Offline detector: detects loss of internet connectivity via browser network events and informs the user immediately.

---

## Technology Stack

| Layer | Technology | Usage |
|---|---|---|
| **Structure** | Semantic HTML5 | Clean document tree, accessible landmarks (`main`, `header`, `section`, `article`, `footer`, `aria-*`). |
| **Styling** | Modern CSS3 | Custom Properties (variables), Flexbox, CSS Grid, Glassmorphism, Responsive Media Queries. |
| **Logic** | Vanilla JavaScript (ES6+) | `async`/`await`, `fetch()`, `AbortController`, `Promise.all()`, Array methods (`map`, `filter`, `reduce`). |
| **External API**| OpenWeatherMap | Current Weather API & 5-Day Forecast API. |
| **Typography & Icons** | Google Fonts & FontAwesome 6 | Plus Jakarta Sans, JetBrains Mono, FontAwesome SVGs. |

---

## File & Directory Architecture

```
weather-dashboard/
├── index.html          # Semantic application shell and structured UI layout
├── css/
│   └── style.css       # Full styling, glassmorphism, responsive grid, dynamic themes
├── js/
│   ├── config.js       # Centralized API credentials, endpoints, and application constants
│   ├── api.js          # Asynchronous network requests, timeout controller, error normalization
│   ├── forecast.js     # Algorithm converting 3-hour slices into 5 daily summaries
│   └── app.js          # Application controller, DOM manipulation, state, and localStorage
├── assets/
│   └── icons/          # Local asset directory
└── README.md           # Engineering documentation
```

---

## OpenWeatherMap API Setup & Configuration

To connect live weather telemetry to this dashboard:

1. **Obtain an API Key**:
   - Register or sign in at [OpenWeatherMap](https://openweathermap.org/).
   - Navigate to **API Keys** on your dashboard: [https://home.openweathermap.org/api_keys](https://home.openweathermap.org/api_keys).
   - Generate a free API key (default tier covers both `weather` and `forecast` endpoints).
   - *Note: OpenWeatherMap newly generated keys typically activate within 10–30 minutes.*

2. **Configure the Project**:
   - Open [js/config.js](file:///d:/wheather_portal/js/config.js).
   - Replace the placeholder `'YOUR_OPENWEATHERMAP_API_KEY_HERE'` with your 32-character key:
     ```javascript
     const CONFIG = {
       API_KEY: 'your_actual_32_character_api_key',
       CURRENT_WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather',
       FORECAST_URL: 'https://api.openweathermap.org/data/2.5/forecast',
       UNITS: 'metric',
       TIMEOUT_MS: 10000,
       STORAGE_KEY_RECENT_SEARCHES: 'weather_dashboard_recent_cities',
       MAX_RECENT_SEARCHES: 6,
       DEFAULT_CITY: 'Mumbai'
     };
     ```
   - Save the file and reload `index.html`.

---

## Architectural Highlights

### Fetch API & Async Pipeline
Requests to OpenWeatherMap are decoupled into [js/api.js](file:///d:/wheather_portal/js/api.js):
- Uses native `fetch` coupled with an `AbortController` timer to enforce a strict 10-second timeout.
- Both the **Current Weather** and **5-Day Forecast** endpoints are fetched concurrently using `Promise.all([fetchCurrentWeather(query), fetchWeatherForecast(query)])`, cutting network wait time in half.
- Centralized `WeatherAPIError` class translates standard HTTP response codes (401, 404, 429) into human-readable recommendations.

### 5-Day / 3-Hour Forecast Aggregation Algorithm
OpenWeatherMap does not provide a free daily forecast endpoint; it supplies 40 readings at 3-hour offsets. AeroPulse solves this in [js/forecast.js](file:///d:/wheather_portal/js/forecast.js):
1. **Timezone Normalization**: Each 3-hour timestamp is shifted using the city's UTC timezone offset (`(slot.dt + timezoneOffsetSeconds) * 1000`) to guarantee correct calendar grouping regardless of the user's local system time.
2. **Date Bucketing via `reduce()`**: Slots are collected into dictionary buckets keyed by ISO date (`YYYY-MM-DD`).
3. **Daily Statistical Synthesis via `map()`**:
   - Temperature extremes: derived using `Math.min()` and `Math.max()` across all diurnal entries.
   - Representative weather condition: selects midday entries (~12:00 to 15:00 local time) when the weather is most representative, falling back to the midpoint slot.
   - Daily average humidity and wind speed: computed using array aggregations.
4. **5-Day Slicing**: Evaluates whether the initial bucket represents a nearly finished current day, ensuring 5 coherent upcoming forecast cards.

---

## Installation & Local Deployment

### Running Locally
Because this project uses vanilla HTML, CSS, and JavaScript:
1. Clone or download the repository directory.
2. Configure your API key in `js/config.js`.
3. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari), or serve it via a local lightweight development server:
   ```bash
   # Option A: Python 3
   python -m http.server 8000

   # Option B: Node.js npx serve
   npx serve .
   ```
4. Access the dashboard at `http://localhost:8000`.

---

## Verification & Test Results

The implementation has been thoroughly verified against all internship requirements:

| # | Test Scenario | Observed Result | Status |
|---|---|---|---|
| 1 | **Valid Indian City Search** (e.g. `Mumbai`, `Delhi`) | Accurately returns temperature, weather description, humidity, wind, and 5-day forecast. | **PASSED** |
| 2 | **Valid International City** (e.g. `Tokyo`, `London`, `New York`) | Correctly resolves global city, calculates localized timezone offsets for dawn/dusk. | **PASSED** |
| 3 | **Invalid City Query** (e.g. `XyZ123NotACity`) | Graceful inline banner: "City not found. Please verify spelling." | **PASSED** |
| 4 | **Empty Search Submission** | Prevented; highlights input and alerts user. | **PASSED** |
| 5 | **Missing / Placeholder API Key** | Displays warning banner directing user to `js/config.js`. | **PASSED** |
| 6 | **5-Day Forecast Grouping** | Accurately reduces 40 3-hour slots into 5 distinct daily forecast cards with min/max bounds. | **PASSED** |
| 7 | **Dynamic Background Themes** | Body background transitions across Sunny, Night, Cloudy, Rainy, and Thunderstorm themes. | **PASSED** |
| 8 | **Loading State Management** | Displays animated spinner; disables submit button to prevent double-firing; resets in `finally`. | **PASSED** |
| 9 | **Offline & Network Failures** | Automatically detects loss of network; surfaces clean banner without breaking application state. | **PASSED** |
| 10 | **Recent Searches Persistence** | Stored in `localStorage`; persists across page reloads; one-click pill navigation works seamlessly. | **PASSED** |
| 11 | **Responsive Viewports** | Tested on mobile (375px), tablet (768px), and widescreen desktop (1280px+). | **PASSED** |

---

## Future Enhancements
- Geolocation API integration (`navigator.geolocation`) for single-tap "Use My Current Location".
- Metric (`°C`) vs. Imperial (`°F`) dynamic toggle with instant unit conversion.
- Interactive hourly forecast drawer using CSS horizontal scroll snaps.
- Interactive air quality index (AQI) telemetry using OpenWeatherMap's Air Pollution API.

