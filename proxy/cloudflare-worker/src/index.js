const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/forecast";

function json(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function okCors(init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(null, { status: 204, ...init, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return okCors();
    if (request.method !== "GET") return json({ message: "Method not allowed." }, { status: 405 });

    if (url.pathname !== "/forecast") {
      return json({ message: "Not found. Use /forecast?q=City or /forecast?lat=..&lon=.." }, { status: 404 });
    }

    const apiKey = env.OPENWEATHER_API_KEY;
    if (!apiKey) return json({ message: "Server missing OPENWEATHER_API_KEY." }, { status: 500 });

    const q = url.searchParams.get("q");
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!q && !(lat && lon)) {
      return json({ message: "Missing query. Provide q=City or lat=..&lon=.." }, { status: 400 });
    }

    const upstream = new URL(OPENWEATHER_BASE);
    upstream.searchParams.set("appid", apiKey);
    upstream.searchParams.set("units", "metric");
    if (q) upstream.searchParams.set("q", q);
    if (lat && lon) {
      upstream.searchParams.set("lat", lat);
      upstream.searchParams.set("lon", lon);
    }

    const res = await fetch(upstream.toString(), { cf: { cacheTtl: 60, cacheEverything: true } });
    const text = await res.text();

    // Pass through status code and body (JSON text). This keeps the frontend error handling consistent.
    const headers = new Headers();
    headers.set("content-type", "application/json; charset=utf-8");
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");

    return new Response(text, { status: res.status, headers });
  },
};

