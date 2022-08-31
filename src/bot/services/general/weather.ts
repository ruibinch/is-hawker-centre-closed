/* istanbul ignore file */
import axios from 'axios';
import { addHours, format } from 'date-fns';

import { Result } from '../../../lib/Result';
import { escapeCharacters } from '../../../telegram';
import { currentDate } from '../../../utils/date';

type WeatherForecastResponse = {
  api_info: { status: string };
  items: Array<WeatherForecastInfo>;
};

type WeatherForecastInfo = {
  update_timestamp: string;
  timestamp: string;
  valid_period: {
    start: string;
    end: string;
  };
  general: {
    forecast: string;
    relative_humidity: {
      low: number;
      high: number;
    };
    temperature: {
      low: number;
      high: number;
    };
    wind: {
      speed: {
        low: number;
        high: number;
      };
      direction: string;
    };
  };
  periods?: Array<{
    time: {
      start: string;
      end: string;
    };
    regions: {
      north: string;
      south: string;
      east: string;
      west: string;
      central: string;
    };
  }>;
};

export async function getWeatherReport() {
  const todayInUTC8 = addHours(currentDate(), 8);
  const todayFormatted = todayInUTC8.toISOString().substring(0, 19);

  const response = await axios.get<WeatherForecastResponse>(
    `https://api.data.gov.sg/v1/environment/24-hour-weather-forecast?date_time=${todayFormatted}`,
  );
  if (response.status !== 200) {
    return Result.Err<void>();
  }

  const weatherForecast = response.data.items[0];
  const message =
    `*${format(todayInUTC8, 'dd MMM yyyy')} Weather Report*` +
    `\n\n${makeGeneralWeatherInfo(weatherForecast)}` +
    `\n\n${makeTimePeriodsWeatherInfo(weatherForecast)}` +
    `\n\n${makeLastUpdatedInfo(weatherForecast)}`;

  return Result.Ok({ message });
}

function makeGeneralWeatherInfo(weatherForecast: WeatherForecastInfo) {
  const { general: generalForecast } = weatherForecast;

  const forecast = generalForecast.forecast;
  const tempLow = generalForecast.temperature.low;
  const tempHigh = generalForecast.temperature.high;
  const rhLow = generalForecast.relative_humidity.low;
  const rhHigh = generalForecast.relative_humidity.high;
  const windLow = generalForecast.wind.speed.low;
  const windHigh = generalForecast.wind.speed.high;
  const windDirection = generalForecast.wind.direction;

  return (
    `*Forecast*: ${escapeCharacters(forecast)}\n` +
    `*Temperature*: ${tempLow}°C to ${tempHigh}°C\n` +
    `*Relative Humidity*: ${rhLow}% to ${rhHigh}%\n` +
    `*Wind*: ${windDirection} ${windLow}\\-${windHigh}km/h`
  );
}

function makeTimePeriodsWeatherInfo(weatherForecast: WeatherForecastInfo) {
  const { periods } = weatherForecast;
  if (!periods) return '';

  const formatDate = (d: Date) => {
    const date = d.getDate();
    const month = d.getMonth() + 1;
    const hours = d.getHours();
    const hoursDisplay = (() => {
      if (hours === 0) return 12;
      return hours > 12 ? hours - 12 : hours;
    })();
    const hoursSuffix = hours < 12 ? 'am' : 'pm';

    return `${date}/${month} ${hoursDisplay}${hoursSuffix}`;
  };

  return periods
    .slice(0, periods.length - 1)
    .map((period) => {
      const periodStart = new Date(period.time.start);
      const periodEnd = new Date(period.time.end);
      const regions = period.regions;

      return (
        `*${formatDate(periodStart)} \\- ${formatDate(periodEnd)}*\n` +
        `• North: ${escapeCharacters(regions.north)}\n` +
        `• South: ${escapeCharacters(regions.south)}\n` +
        `• East: ${escapeCharacters(regions.east)}\n` +
        `• West: ${escapeCharacters(regions.west)}\n` +
        `• Central: ${escapeCharacters(regions.central)}`
      );
    })
    .join('\n');
}

function makeLastUpdatedInfo(weatherForecast: WeatherForecastInfo) {
  const lastUpdated = format(
    new Date(weatherForecast.update_timestamp),
    'd/MM/yyyy HH:mm:ss',
  );

  return `_Last updated: ${lastUpdated}_`;
}
