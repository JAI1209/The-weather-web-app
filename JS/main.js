import { getWeatherByCity, getWeatherByCoords } from "./api.js";
import { renderForecast, renderHourly, renderWeather, showToast } from "./ui.js";
import { addRecentCity, clearRecentCities, renderRecentDropdown } from "./storage.js";

// App bootstrap: wires user interactions (search, dropdown, quick picks, geolocation, unit toggle)
// and delegates rendering to `ui.js`.
const DEG = "\u00B0";

if (window.location?.protocol === "file:") {
  showToast("Tip: run with Live Server / localhost for the API to work.", "warn");
}

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const unitToggle = document.getElementById("unitToggle");
const recentDropdown = document.getElementById("recentDropdown");
const clearBtn = document.getElementById("clearBtn");
const quickPicks = document.getElementById("quickPicks");
const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
const aboutBackdrop = document.getElementById("aboutBackdrop");
const aboutCloseBtn = document.getElementById("aboutCloseBtn");

let lastData = null;
let unit = loadUnit();
let tzOffsetSeconds = null;

renderRecentDropdown(recentDropdown);
syncUnitLabel();
startClock();
wireAboutModal();

searchBtn?.addEventListener("click", () => {
  const city = (cityInput?.value || "").trim();
  runCitySearch(city);
});

cityInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = (cityInput?.value || "").trim();
    runCitySearch(city);
  }
});

recentDropdown?.addEventListener("change", () => {
  const city = recentDropdown.value;
  if (!city) return;
  cityInput.value = city;
  runCitySearch(city);
});

quickPicks?.addEventListener("click", (e) => {
  const btn = e.target?.closest?.("[data-city]");
  if (!btn) return;
  const city = btn.getAttribute("data-city") || "";
  if (!city) return;
  cityInput.value = city;
  runCitySearch(city);
});

locationBtn?.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported in this browser.");
    return;
  }

  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const data = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        applyData(data);
      } catch (err) {
        showToast(err?.message || "Unable to fetch location weather.");
      } finally {
        setLoading(false);
      }
    },
    () => {
      setLoading(false);
      showToast("Location access denied. Allow location and try again.");
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

unitToggle?.addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  localStorage.setItem("unitPref", unit);
  syncUnitLabel();
  if (lastData) {
    renderWeather(lastData, { unit });
  }
});

clearBtn?.addEventListener("click", () => {
  if (cityInput) cityInput.value = "";
  clearRecentCities();
  renderRecentDropdown(recentDropdown);
  showToast("Cleared recent searches.", "warn");
});

async function runCitySearch(city) {
  if (!city) {
    showToast("Please enter a city name.");
    return;
  }

  setLoading(true);
  try {
    const data = await getWeatherByCity(city);
    applyData(data);
    addRecentCity(data.city?.name || city);
    renderRecentDropdown(recentDropdown);
  } catch (err) {
    showToast(err?.message || "Unable to fetch weather data.");
  } finally {
    setLoading(false);
  }
}

function applyData(data) {
  lastData = data;
  tzOffsetSeconds = Number(data?.city?.timezone ?? NaN);
  if (!Number.isFinite(tzOffsetSeconds)) tzOffsetSeconds = null;
  renderWeather(data, { unit });
  renderHourly(data);
  renderForecast(data);
}

function setLoading(isLoading) {
  const disabled = Boolean(isLoading);
  if (searchBtn) searchBtn.disabled = disabled;
  if (locationBtn) locationBtn.disabled = disabled;

  if (searchBtn) searchBtn.style.opacity = disabled ? "0.7" : "1";
  if (locationBtn) locationBtn.style.opacity = disabled ? "0.7" : "1";
}

function loadUnit() {
  const v = localStorage.getItem("unitPref");
  return v === "F" ? "F" : "C";
}

function syncUnitLabel() {
  const label = document.getElementById("unitLabel");
  if (label) label.textContent = unit === "F" ? `${DEG}F` : `${DEG}C`;
}

function wireAboutModal() {
  if (!aboutBtn || !aboutModal) return;

  const open = () => {
    aboutModal.classList.remove("hidden");
    aboutModal.classList.add("flex");
    aboutBtn.setAttribute("aria-expanded", "true");
    aboutCloseBtn?.focus?.();
  };

  const close = () => {
    aboutModal.classList.add("hidden");
    aboutModal.classList.remove("flex");
    aboutBtn.setAttribute("aria-expanded", "false");
    aboutBtn.focus?.();
  };

  aboutBtn.addEventListener("click", open);
  aboutCloseBtn?.addEventListener("click", close);
  aboutBackdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !aboutModal.classList.contains("hidden")) close();
  });
}

function startClock() {
  const el = document.getElementById("localTime");
  if (!el) return;

  const fmt = (date) =>
    new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const fmtUtcOffset = (offsetSeconds) => {
    const nowSeconds = Date.now() / 1000;
    const d = new Date((nowSeconds + offsetSeconds) * 1000);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const tick = () => {
    try {
      el.textContent = Number.isFinite(tzOffsetSeconds) ? fmtUtcOffset(tzOffsetSeconds) : fmt(new Date());
    } catch {
      el.textContent = "";
    }
  };

  tick();
  window.setInterval(tick, 10_000);
}
