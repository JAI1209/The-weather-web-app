# Weather Forecast Dashboard (Vanilla JS + Tailwind)

A responsive weather forecast app built with **vanilla JavaScript**, **Tailwind CSS (CDN)**, and a small amount of **custom CSS** for the glass / background effects.

## Features

- Search weather by **city name**
- Get weather using **current location** (browser geolocation)
- **Recently searched** dropdown (saved in `localStorage`, up to 5 cities)
- **Current conditions**: temperature, feels-like, humidity, wind, rain/chance
- **Unit toggle (°C / °F)** for **today's temperature**
- **Heat alert** toast when temperature is **above 40°C**
- **Hourly forecast** (next 24 hours)
- **5-day forecast** cards (date, temp, wind, humidity)
- Dynamic background tint based on condition (clear/clouds/rain/thunder/snow/night)

## Setup

1. Create an OpenWeatherMap API key.
2. Open `JS/api.js` and replace:
   - `const API_KEY = "YOUR_API_KEY";`
3. Run the app:
   - Option A (recommended): use VS Code “Live Server” extension on `index.html`
   - Option B: open `index.html` directly in a browser (location feature may require HTTPS / localhost)

## Usage

- Type a city in the search box and press **Enter** or click the search icon.
- Click **Use my location** to fetch weather for your current coordinates.
- Use the **Recently searched** dropdown to re-load a previous city.
- Click the unit pill (top-right) to toggle **today's temperature** between **°C** and **°F**.

## Notes

- API endpoint used: `api.openweathermap.org/data/2.5/forecast` (3-hour intervals).
- Recently searched cities are stored under `localStorage["recentCities"]`.
