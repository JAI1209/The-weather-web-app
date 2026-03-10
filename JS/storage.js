// Stores recently searched cities in localStorage and renders the dropdown UI.
const KEY = "recentCities";

export function getRecentCities() {
  try {
    const cities = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(cities) ? cities : [];
  } catch {
    return [];
  }
}

export function addRecentCity(city) {
  const clean = city.trim();
  if (!clean) return;

  const current = getRecentCities();
  const next = [clean, ...current.filter((c) => c.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    5
  );
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearRecentCities() {
  localStorage.removeItem(KEY);
}

export function renderRecentDropdown(dropdownEl) {
  const cities = getRecentCities();
  if (!dropdownEl) return;

  if (cities.length === 0) {
    dropdownEl.classList.add("hidden");
    dropdownEl.innerHTML = "";
    return;
  }

  dropdownEl.classList.remove("hidden");
  dropdownEl.innerHTML =
    `<option value="" disabled selected>Recently searched</option>` +
    cities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
