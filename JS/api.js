// OpenWeatherMap "5 day / 3 hour" forecast API wrapper.
// This module fetches forecast JSON and normalizes common error cases into friendly messages.
const API_KEY = "YOUR_API_KEY";
const DIRECT_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

// Optional proxy to keep the API key off the frontend (recommended for public deployments).
// Set `window.WEATHER_PROXY_URL` in `index.html` to something like: https://your-worker.workers.dev
const PROXY_BASE_URL =
  typeof window !== "undefined" && typeof window.WEATHER_PROXY_URL === "string"
    ? window.WEATHER_PROXY_URL.trim()
    : "";

function usingProxy() {
  return Boolean(PROXY_BASE_URL);
}

function assertApiKey() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    throw new Error(
      "Missing API key. Open `JS/api.js` and replace `YOUR_API_KEY` with your OpenWeatherMap key."
    );
  }
}

function assertNotFileProtocol() {
  if (typeof window !== "undefined" && window.location?.protocol === "file:") {
    throw new Error(
      "App is running from file://. Start a local server (VS Code Live Server or `python -m http.server`) and open http://localhost instead."
    );
  }
}

function buildUrl(params) {
  const url = usingProxy()
    ? new URL("/forecast", PROXY_BASE_URL)
    : new URL(DIRECT_BASE_URL);

  if (!usingProxy()) {
    url.searchParams.set("appid", API_KEY);
    url.searchParams.set("units", "metric");
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function requestJson(url) {
  assertNotFileProtocol();
  if (!usingProxy()) assertApiKey();

  const res = await fetch(url, { mode: "cors", cache: "no-store" });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  if (res.ok) {
    if (body?.cod && String(body.cod) !== "200") {
      throw new Error(body?.message || "Unable to fetch weather data.");
    }
    return body;
  }

  let message = body?.message || "Unable to fetch weather data.";

  if (res.status === 0) {
    message = "Network error. Check your internet connection and try again.";
  } else if (res.status === 401) {
    message = usingProxy()
      ? "Proxy unauthorized (401). Check the proxy's OpenWeatherMap key/secret."
      : "Invalid API key (401). Check your OpenWeatherMap key in `JS/api.js`.";
  } else if (res.status === 404) {
    message = "City not found. Try a different name.";
  } else if (res.status === 429) {
    message = "Rate limit reached (429). Wait a bit and try again.";
  }

  throw new Error(message);
}

export function getWeatherByCity(city) {
  const clean = String(city || "").trim();
  if (!clean) return Promise.reject(new Error("Please enter a city name."));
  return requestJson(buildUrl({ q: clean }));
}

export function getWeatherByCoords(lat, lon) {
  if (lat == null || lon == null) {
    return Promise.reject(new Error("Missing coordinates."));
  }
  return requestJson(buildUrl({ lat, lon }));
}
