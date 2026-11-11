/**
 * Forecast Processor Module
 * 
 * OpenWeatherMap's free 5-day forecast endpoint returns up to 40 data points
 * sampled at 3-hour intervals (dt_txt: "YYYY-MM-DD HH:mm:ss").
 *
 * This module groups and synthesizes these 3-hour intervals into 5 distinct daily
 * summary forecast cards using standard ES6 Array methods (map, filter, reduce).
 */

/**
 * Formats a timestamp or date string into user-friendly day and date labels.
 * @param {Date} dateObj
 * @returns {{ dayName: string, dateLabel: string, shortDay: string }}
 */
function formatDateLabels(dateObj) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    dayName: days[dateObj.getDay()],
    shortDay: days[dateObj.getDay()],
    dateLabel: `${months[dateObj.getMonth()]} ${dateObj.getDate()}`
  };
}

/**
 * Processes raw 5-day / 3-hour forecast API response into an array of 5 daily summaries.
 * 
 * Algorithm:
 * 1. Filter out entries with invalid structure.
 * 2. Group 3-hour forecast slots by local calendar date (YYYY-MM-DD).
 * 3. Exclude the current day if there are fewer than 2 slots left, or prefer upcoming 5 full/distinct days.
 * 4. For each grouped day:
 *    - Compute daily minimum temperature using Math.min across slots.
 *    - Compute daily maximum temperature using Math.max across slots.
 *    - Calculate average expected temperature across slots.
 *    - Select representative weather condition and icon (preferring midday ~12:00-15:00 slots if present).
 *    - Compute average humidity and wind speed.
 * 5. Return exactly up to 5 daily forecast summaries.
 * 
 * @param {Object} forecastData - Raw JSON response from OpenWeatherMap 5-day forecast.
 * @returns {Array<Object>} Daily forecast summaries.
 */
function processDailyForecast(forecastData) {
  if (!forecastData || !Array.isArray(forecastData.list) || forecastData.list.length === 0) {
    return [];
  }

  const list = forecastData.list;
  const timezoneOffsetSeconds = (forecastData.city && forecastData.city.timezone) || 0;

  // Step 1 & 2: Group slots by local date string using Array.reduce
  const groupedByDate = list.reduce((acc, slot) => {
    // Adjust slot timestamp by target city's timezone offset
    // dt is UTC seconds, offset is in seconds
    const localTimestamp = (slot.dt + timezoneOffsetSeconds) * 1000;
    const localDate = new Date(localTimestamp);
    
    // Create an ISO-like YYYY-MM-DD key based on UTC methods after offset adjustment
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push({
      ...slot,
      localHour: localDate.getUTCHours(),
      localDateObj: localDate
    });
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedByDate);
  if (dateKeys.length === 0) return [];

  // Determine current local day in the target city
  const nowUtc = Date.now();
  const currentCityDate = new Date(nowUtc + timezoneOffsetSeconds * 1000);
  const currentCityDateKey = `${currentCityDate.getUTCFullYear()}-${String(currentCityDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentCityDate.getUTCDate()).padStart(2, '0')}`;

  // If the first grouped key is today and has few intervals left, we can still include it or move to next 5 days
  // Standard UX: If today has 2 or more intervals, or if we need it to make 5 days, keep it;
  // otherwise focus on the next 5 upcoming days.
  let targetDates = dateKeys;
  if (targetDates.length > 5 && targetDates[0] === currentCityDateKey && groupedByDate[targetDates[0]].length <= 2) {
    // Exclude nearly finished today to give 5 clean upcoming days
    targetDates = targetDates.slice(1, 6);
  } else {
    // Keep first 5 days
    targetDates = targetDates.slice(0, 5);
  }

  // Step 3: Map each date group into a unified daily forecast summary
  const dailySummaries = targetDates.map((dateKey) => {
    const slots = groupedByDate[dateKey];
    
    // Calculate min and max temperatures across all 3-hour reading slots in the day
    const temps = slots.map(s => s.main ? s.main.temp : 0);
    const minTemps = slots.map(s => s.main ? s.main.temp_min : 0);
    const maxTemps = slots.map(s => s.main ? s.main.temp_max : 0);

    const minTemp = Math.round(Math.min(...temps, ...minTemps));
    const maxTemp = Math.round(Math.max(...temps, ...maxTemps));

    // Expected / average temperature for the day
    const avgTemp = Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length);

    // Pick the most representative weather slot for the day
    // Midday (around 12:00 - 15:00) gives the most representative day weather.
    // If not available, take the middle slot or the first available slot.
    const middaySlot = slots.find(s => s.localHour >= 11 && s.localHour <= 15) 
      || slots[Math.floor(slots.length / 2)] 
      || slots[0];

    const weatherInfo = (middaySlot.weather && middaySlot.weather[0]) ? middaySlot.weather[0] : {
      main: 'Clear',
      description: 'Clear sky',
      icon: '01d'
    };

    // Calculate average humidity & average wind speed
    const humidities = slots.map(s => s.main ? s.main.humidity : 0);
    const avgHumidity = Math.round(humidities.reduce((sum, h) => sum + h, 0) / humidities.length);

    const windSpeeds = slots.map(s => s.wind ? s.wind.speed : 0);
    const avgWindSpeed = (windSpeeds.reduce((sum, w) => sum + w, 0) / windSpeeds.length).toFixed(1);

    // Day labels
    const representativeDate = slots[0].localDateObj;
    const { dayName, dateLabel } = formatDateLabels(representativeDate);

    // Check if this date represents 'Today'
    const isToday = (dateKey === currentCityDateKey);

    return {
      dateKey,
      isToday,
      dayName: isToday ? 'Today' : dayName,
      dateLabel,
      temp: avgTemp,
      tempMin: minTemp,
      tempMax: maxTemp,
      condition: weatherInfo.main,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      humidity: avgHumidity,
      windSpeed: avgWindSpeed,
      slotsCount: slots.length
    };
  });

  return dailySummaries;
}

