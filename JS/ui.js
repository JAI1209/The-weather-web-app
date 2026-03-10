// UI rendering helpers: current weather, hourly strip, 5-day cards, theme/fx, and toast messages.
const ICONS = {
  clear: "assets/icon/sunny.png",
  clouds: "assets/icon/wind.png",
  rain: "assets/icon/rainy.png",
  thunder: "assets/icon/thunder_rain.png",
  snow: "assets/icon/wind.png",
  night: "assets/icon/night.png",
  hot: "assets/icon/heat.png",
};

const DEG = "\u00B0";

function formatWithOffset(dtSeconds, tzSeconds, options) {
  const d = new Date((dtSeconds + tzSeconds) * 1000);
  return new Intl.DateTimeFormat(undefined, { timeZone: "UTC", ...options }).format(d);
}

function pickTheme(main, isNight) {
  if (isNight) return "night";
  const m = String(main || "").toLowerCase();
  if (m.includes("thunder")) return "thunder";
  if (m.includes("rain") || m.includes("drizzle")) return "rain";
  if (m.includes("snow")) return "snow";
  if (m.includes("cloud")) return "clouds";
  if (m.includes("clear")) return "clear";
  return "default";
}

function pickIcon(theme, tempC) {
  if (tempC >= 40) return ICONS.hot;
  return ICONS[theme] || ICONS.clouds;
}

function toF(c) {
  return c * (9 / 5) + 32;
}

export function showToast(message, type = "error") {
  const el = document.getElementById("toast");
  if (!el) return;

  el.classList.remove("hidden", "toast-error", "toast-warn");
  if (type === "warn") el.classList.add("toast-warn");
  if (type === "error") el.classList.add("toast-error");

  el.textContent = message;
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    el.classList.add("hidden");
  }, 3800);
}

export function renderWeather(data, { unit = "C" } = {}) {
  if (!data?.list?.length) return;

  const current = data.list[0];
  const tz = data.city?.timezone || 0;

  const city = data.city?.name || "";
  const main = current.weather?.[0]?.main || "-";
  const desc = current.weather?.[0]?.description || "";

  const tempC = Number(current.main?.temp ?? NaN);
  const feelsC = Number(current.main?.feels_like ?? NaN);

  const sunrise = data.city?.sunrise;
  const sunset = data.city?.sunset;
  const now = current.dt;
  const isNight = Boolean(sunrise && sunset && (now < sunrise || now > sunset));

  const theme = pickTheme(main, isNight);
  document.body.dataset.weather = theme;
  setFx(theme, tempC);

  const localTime = formatWithOffset(current.dt, tz, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const temp = unit === "F" ? toF(tempC) : tempC;
  const tempText = Number.isFinite(temp) ? `${Math.round(temp)}` : "-";

  setText("cityName", city);
  // Clock is updated continuously in `JS/main.js`, but set a value here as a fallback.
  setText("localTime", localTime);
  setText("temperature", tempText);
  setText("tempUnitPill", unit === "F" ? `${DEG}F` : `${DEG}C`);
  setText("unitLabel", unit === "F" ? `${DEG}F` : `${DEG}C`);
  setText("conditionText", `${titleCase(main)}${desc ? ` - ${titleCase(desc)}` : ""}`);
  setText(
    "feelsLike",
    Number.isFinite(feelsC) ? `Feels like ${Math.round(feelsC)}${DEG}C` : ""
  );

  const windMs = Number(current.wind?.speed ?? 0);
  const windKmh = windMs * 3.6;
  setText("wind", `${Math.round(windKmh)} km/h`);
  setText("humidity", `${current.main?.humidity ?? "-"}%`);

  const rainMm = Number(current.rain?.["3h"] ?? 0);
  const pop = Number(current.pop ?? 0);
  const rainText = rainMm > 0 ? `${rainMm.toFixed(1)} mm` : `${Math.round(pop * 100)}%`;
  setText("rain", rainText);

  setText("detailCondition", titleCase(main));
  setText("detailHumidity", `${current.main?.humidity ?? "-"}%`);
  setText("detailWind", `${Math.round(windKmh)} km/h`);
  setText("detailRain", rainMm > 0 ? `${rainMm.toFixed(1)} mm (3h)` : `${Math.round(pop * 100)}%`);

  const iconPath = pickIcon(theme, tempC);
  const iconEl = document.getElementById("weatherIcon");
  if (iconEl) iconEl.src = iconPath;

  if (Number.isFinite(tempC) && tempC >= 40) {
    showToast(`Heat alert: temperature is above 40${DEG}C. Stay hydrated.`, "warn");
  }
}

export function renderHourly(data) {
  const container = document.getElementById("hourlyContainer");
  if (!container || !data?.list?.length) return;
  const tz = data.city?.timezone || 0;

  container.innerHTML = "";
  data.list.slice(0, 8).forEach((item) => {
    const time = formatWithOffset(item.dt, tz, { hour: "2-digit", minute: "2-digit" });
    const tempC = Number(item.main?.temp ?? NaN);
    const tempText = Number.isFinite(tempC) ? `${Math.round(tempC)}${DEG}C` : "-";

    const div = document.createElement("div");
    div.className = "hour-card";
    div.innerHTML = `
      <p class="text-xs opacity-70">${time}</p>
      <p class="mt-2 font-semibold">${tempText}</p>
      <p class="mt-1 text-xs opacity-70">${titleCase(item.weather?.[0]?.main || "")}</p>
    `;
    container.appendChild(div);
  });
}

export function renderForecast(data) {
  const container = document.getElementById("forecastContainer");
  if (!container || !data?.list?.length) return;
  const tz = data.city?.timezone || 0;

  container.innerHTML = "";
  const days = data.list.filter((i) => String(i.dt_txt || "").includes("12:00:00")).slice(0, 5);

  const hintEl = document.getElementById("forecastHint");
  if (hintEl) hintEl.textContent = days.length ? "Midday snapshot" : "";

  days.forEach((day) => {
    const date = formatWithOffset(day.dt, tz, { weekday: "short", day: "2-digit", month: "short" });
    const tempC = Number(day.main?.temp ?? NaN);
    const windKmh = Number(day.wind?.speed ?? 0) * 3.6;
    const humidity = day.main?.humidity ?? "-";

    const div = document.createElement("div");
    div.className = "forecast-card";
    div.innerHTML = `
      <p class="text-xs opacity-70">${date}</p>
      <p class="mt-2 text-2xl font-semibold">${Number.isFinite(tempC) ? Math.round(tempC) : "-"}${DEG}C</p>
      <div class="mt-3 space-y-2 text-xs opacity-90">
        <div class="flex items-center gap-2">
          <img src="assets/icon/heat.png" alt="" class="w-4 h-4 opacity-90" />
          <span>${Number.isFinite(tempC) ? `${Math.round(tempC)}${DEG}C` : "-"}</span>
        </div>
        <div class="flex items-center gap-2">
          <img src="assets/icon/wind.png" alt="" class="w-4 h-4 opacity-90" />
          <span>${Math.round(windKmh)} km/h</span>
        </div>
        <div class="flex items-center gap-2">
          <span aria-hidden="true" class="inline-flex w-4 h-4 opacity-90">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 5 10.2 5 15.2C5 19 8.1 22 12 22C15.9 22 19 19 19 15.2C19 10.2 12 2 12 2Z" stroke="currentColor" stroke-width="2" />
            </svg>
          </span>
          <span>${humidity}%</span>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function setFx(theme, tempC) {
  const fxEl = document.getElementById("fx");
  if (!fxEl) return;

  let mode = "none";
  if (Number.isFinite(tempC) && tempC >= 38) mode = "hot";
  else if (theme === "thunder") mode = "thunder";
  else if (theme === "rain") mode = "rain";
  else if (theme === "snow") mode = "snow";
  else if (theme === "night") mode = "night";
  else if (theme === "clouds") mode = "clouds";
  else if (theme === "clear" && Number.isFinite(tempC) && tempC >= 16 && tempC <= 30) mode = "spring";

  document.body.dataset.fx = mode;

  const nextClass = mode === "none" ? "fx" : `fx fx-${mode}`;
  if (fxEl.className !== nextClass) fxEl.className = nextClass;

  if (mode === "snow") {
    ensureParticles(fxEl, "flake", 42);
  } else if (mode === "spring") {
    ensureParticles(fxEl, "petal", 26);
  } else {
    if (fxEl.dataset.ptype) {
      fxEl.dataset.ptype = "";
      fxEl.replaceChildren();
    }
  }
}

function ensureParticles(fxEl, type, count) {
  if (fxEl.dataset.ptype === type && fxEl.childElementCount === count) return;

  fxEl.dataset.ptype = type;
  fxEl.replaceChildren();

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = type;

    const x = Math.random() * 100;
    const size = type === "flake" ? 4 + Math.random() * 6 : 10 + Math.random() * 12;
    const o = 0.35 + Math.random() * 0.55;
    const dur = type === "flake" ? 6 + Math.random() * 8 : 7 + Math.random() * 10;
    const delay = -Math.random() * dur;
    const drift = (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 70);

    el.style.setProperty("--x", `${x}%`);
    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--o", `${o}`);
    el.style.setProperty("--dur", `${dur}s`);
    el.style.setProperty("--delay", `${delay}s`);
    el.style.setProperty("--drift", `${drift}px`);

    frag.appendChild(el);
  }

  fxEl.appendChild(frag);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? "";
}

function titleCase(str) {
  const s = String(str || "").trim();
  if (!s) return "";
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
