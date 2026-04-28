const preferences = window.getStoredPreferences
  ? window.getStoredPreferences()
  : JSON.parse(localStorage.getItem("settlesmart_preferences") || "{}");

const suburbProfile = document.getElementById("suburbProfile");

function normalizeCityKey(value) {
  return String(value || "").trim().toLowerCase();
}

const cityHeroImages = {
  melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1600&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
  brisbane: "https://images.unsplash.com/photo-1589976567749-2f011d95ffec?q=80&w=1600&auto=format&fit=crop",
  adelaide: "https://plus.unsplash.com/premium_photo-1697730252622-0e1cec87d8c4?q=80&w=1600&auto=format&fit=crop",
  perth: "https://images.unsplash.com/photo-1574471101497-d958f6e3ebd4?q=80&w=1600&auto=format&fit=crop",
  canberra: "https://images.unsplash.com/photo-1672264597620-d792bb6de88d?q=80&w=1600&auto=format&fit=crop"
};

initSuburbPage();

function initSuburbPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const suburb = window.suburbs.find((item) => item.slug === slug);

  if (!suburb) {
    suburbProfile.innerHTML = `
      <div class="info-card p-4">
        <h2>Suburb not found</h2>
        <p>Please go back and choose a suburb again.</p>
        <a href="results.html" class="btn ss-btn ss-btn-secondary">Back to results</a>
      </div>
    `;
    return;
  }

  const score = window.getSuburbScore(suburb, preferences);
  const reasons = window.buildReasonList(suburb, preferences);
  const community = typeof window.getEpic4CommunityData === "function"
    ? window.getEpic4CommunityData(suburb)
    : getFallbackCommunity(suburb);

  const cultureScore = typeof window.getEpic4ProfileCultureScore === "function"
    ? window.getEpic4ProfileCultureScore(suburb, preferences)
    : 7;

  const heroImage = cityHeroImages[normalizeCityKey(suburb.city)] || cityHeroImages.melbourne;

  suburbProfile.innerHTML = `
    <div class="suburb-detail-shell">
      <section class="suburb-detail-hero" style="background-image:url('${heroImage}')">
        <div class="suburb-detail-hero-overlay"></div>

        <div class="suburb-detail-hero-inner row g-4 align-items-end">
          <div class="col-12 col-xl-7">
            <span class="ss-pill">Suburb profile</span>
            <h1 class="suburb-detail-title">${suburb.suburb}, ${suburb.city}</h1>
            <p class="suburb-detail-copy">${suburb.description}</p>

            <div class="suburb-detail-badges">
              <span class="suburb-hero-badge">Match ${score}%</span>
              <span class="suburb-hero-badge">${window.formatChoice(suburb.transport)} transport</span>
              <span class="suburb-hero-badge">${window.formatChoice(suburb.culture)} culture signal</span>
              <span class="suburb-hero-badge">${window.formatChoice(suburb.university)} university access</span>
            </div>
          </div>

          <div class="col-12 col-xl-5">
            <div class="suburb-hero-sidecard">
              <h3>Your selected priorities</h3>

              <div class="suburb-hero-sidegrid">
                <div class="suburb-mini-card">
                  <span>Budget</span>
                  <strong>$${preferences.budget || "-"} / week</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Housing</span>
                  <strong>${window.formatChoice(preferences.housing)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Commute</span>
                  <strong>${window.formatChoice(preferences.commute)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Lifestyle</span>
                  <strong>${window.formatChoice(preferences.lifestyle)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Language</span>
                  <strong>${preferences.language || "Not set"}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Culture</span>
                  <strong>${preferences.culture || "Not set"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="row g-4">
        <div class="col-12 col-xl-7">
          <div class="info-card suburb-detail-card h-100">
            <h3>Why this suburb fits you</h3>
            <ul class="suburb-detail-list">
              ${reasons.map((reason) => `<li>${reason}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="col-12 col-xl-5">
          <div class="info-card suburb-detail-card h-100">
            <h3>Language and community snapshot</h3>

            <div class="suburb-detail-stack">
              <div class="suburb-detail-line">
                <span>Common languages</span>
                <strong>${suburb.commonLanguages.join(", ")}</strong>
              </div>
              <div class="suburb-detail-line">
                <span>Cultural groups</span>
                <strong>${(suburb.culturalGroups || []).join(", ") || "Not available"}</strong>
              </div>
              <div class="suburb-detail-line">
                <span>English support</span>
                <strong>${window.formatChoice(suburb.englishSupport)}</strong>
              </div>
              <div class="suburb-detail-line">
                <span>Recent arrivals</span>
                <strong>${window.formatChoice(suburb.recentArrival)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="info-card suburb-detail-card">
        <div class="suburb-section-head">
          <h3>Suburb profile</h3>
          <p>Quick practical notes for housing, rent, transport, and daily student life.</p>
        </div>

        <div class="suburb-profile-grid">
          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Overview</span>
            <p>${suburb.profile?.overview || "Not available"}</p>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Rent</span>
            <p>${suburb.profile?.rentNote || "Not available"}</p>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Transport</span>
            <p>${suburb.profile?.transportNote || "Not available"}</p>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Housing</span>
            <p>${suburb.profile?.housingNote || "Not available"}</p>
          </article>
        </div>
      </section>

      <section class="info-card suburb-detail-card" id="miniMapSection">
        <div class="suburb-section-head">
          <h3>Explore nearby facilities</h3>
          <p>Click the dropdown to open the map and filter facilities around ${suburb.suburb}.</p>
        </div>

        <div class="minimap-toggle-row">
          <button class="minimap-dropdown-btn" id="minimapToggleBtn" aria-expanded="false">
            <span class="minimap-btn-icon">🗺️</span>
            <span id="minimapBtnLabel">Show map &amp; filter facilities</span>
            <span class="minimap-chevron" id="minimapChevron">▼</span>
          </button>
        </div>

        <div class="minimap-body hidden" id="minimapBody">
          <div class="minimap-filters" id="minimapFilters">
            <button class="minimap-filter-btn active" data-amenity="">All</button>
            <button class="minimap-filter-btn" data-amenity="supermarket">🛒 Grocery</button>
            <button class="minimap-filter-btn" data-amenity="hospital">🏥 Hospital</button>
            <button class="minimap-filter-btn" data-amenity="doctors">👨‍⚕️ GP</button>
            <button class="minimap-filter-btn" data-amenity="park" data-overpass-tag="leisure=park">🌳 Park</button>
            <button class="minimap-filter-btn" data-amenity="restaurant">🍜 Restaurant</button>
            <button class="minimap-filter-btn" data-amenity="bus_station">🚌 Transport</button>
          </div>

          <div class="minimap-frame" id="minimapFrame">
            <div class="minimap-loading" id="minimapLoading">
              <div class="minimap-spinner"></div>
              <span>Locating ${suburb.suburb}…</span>
            </div>
          </div>
        </div>
      </section>

      <section class="info-card suburb-detail-card">
        <div class="suburb-section-head">
          <h3>Multicultural support signals</h3>
          <p>Helpful community indicators that may support confidence, belonging, and day-to-day comfort.</p>
        </div>

        <div class="suburb-multicultural-topline">
          <span class="suburb-metric-pill">Culture fit ${cultureScore}/10</span>
          <span class="suburb-metric-pill">Community strength ${community.communityStrength}%</span>
          <span class="suburb-metric-pill">Overseas-born share ${community.overseasBornShare}</span>
        </div>

        <div class="suburb-multicultural-grid">
          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Cultural amenities</span>
            <ul class="suburb-detail-list minimal">
              ${community.keyPlaces.map((place) => `<li>${place}</li>`).join("")}
            </ul>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Practical community support</span>
            <div class="suburb-pill-wrap">
              <span class="signal-pill">Specialty shops: ${community.specialtyShops}</span>
              <span class="signal-pill">Places of worship: ${community.placesOfWorship}</span>
              <span class="signal-pill">English support: ${window.formatChoice(suburb.englishSupport)}</span>
              <span class="signal-pill">Recent arrivals: ${window.formatChoice(suburb.recentArrival)}</span>
            </div>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Nearby cultural activity</span>
            <ul class="suburb-detail-list minimal">
              ${community.events.map((event) => `<li>${event}</li>`).join("")}
            </ul>
          </article>
        </div>
      </section>
    </div>
  `;
  initMiniMap(suburb.suburb, suburb.city);
}

function getFallbackCommunity(suburb) {
  return {
    communityStrength: suburb.culture === "high" ? 82 : suburb.culture === "medium" ? 68 : 54,
    overseasBornShare: suburb.culture === "high" ? "42%" : suburb.culture === "medium" ? "31%" : "22%",
    specialtyShops: suburb.culture === "high" ? "6+" : "3+",
    placesOfWorship: suburb.culture === "high" ? "3+" : "1+",
    keyPlaces: [
      "International grocery options",
      "Culturally familiar food venues",
      "Community / worship support nearby"
    ],
    highlightDistance: "800m walk",
    events: [
      "Seasonal cultural festival nearby",
      "Student community meetup"
    ]
  };

}
/* ─── Mini Map (US5.4) ───────────────────────────────────────────── */

let minimapMap = null;
let minimapMarkers = [];
let minimapCenter = null;
let minimapBounds = null;   // L.LatLngBounds of the suburb polygon, or null
let activeAmenity = "";

function initMiniMap(suburbName, cityName) {
  const toggleBtn = document.getElementById("minimapToggleBtn");
  const body      = document.getElementById("minimapBody");
  const chevron   = document.getElementById("minimapChevron");
  const label     = document.getElementById("minimapBtnLabel");

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", async () => {
    const isOpen = !body.classList.contains("hidden");
    if (isOpen) {
      body.classList.add("hidden");
      chevron.textContent = "▼";
      label.textContent = "Show map & filter facilities";
      toggleBtn.setAttribute("aria-expanded", "false");
    } else {
      body.classList.remove("hidden");
      chevron.textContent = "▲";
      label.textContent = "Hide map";
      toggleBtn.setAttribute("aria-expanded", "true");

      if (!minimapMap) {
        await loadLeaflet();
        await buildMap(suburbName, cityName);
      } else {
        setTimeout(() => minimapMap.invalidateSize(), 50);
      }
    }
  });

  document.getElementById("minimapFilters").addEventListener("click", (e) => {
    const btn = e.target.closest(".minimap-filter-btn");
    if (!btn) return;
    document.querySelectorAll(".minimap-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeAmenity = btn.dataset.amenity || "";
    if (minimapMap && minimapCenter) {
      if (activeAmenity === "") {
        fetchAndRenderAll(minimapCenter);
      } else {
        fetchAndRenderPOI(activeAmenity, minimapCenter);
      }
    }
  });

}

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });

}

/* ─── ABS SA2 name → real OSM search term ───────────────────────── */
// Suburbs where Nominatim returns wrong/oversized boundaries → use fixed coords + zoom
const ABS_FIXED_COORDS = {
  "Melbourne CBD - East":  { lat: -37.8143, lon: 144.9731, zoom: 16 },
  "Melbourne CBD - North": { lat: -37.8080, lon: 144.9631, zoom: 16 },
  "Melbourne CBD - West":  { lat: -37.8143, lon: 144.9531, zoom: 16 },
  "Brisbane City":         { lat: -27.4698, lon: 153.0251, zoom: 15 },
};

const ABS_NAME_MAP = {
  "Melbourne CBD - East":            null,
  "Melbourne CBD - North":           null,
  "Melbourne CBD - West":            null,
  "Carlton North - Princes Hill":    "Carlton North",
  "Richmond (South) - Cremorne":     "Cremorne Melbourne",
  "Richmond - North":                "Richmond Melbourne",
  "South Yarra - North":             "South Yarra",
  "South Yarra - South":             "South Yarra",
  "South Yarra - West":              "South Yarra",
  "St Kilda - Central":              "St Kilda",
  "St Kilda - West":                 "St Kilda West",
  "Brunswick - North":               "Brunswick Melbourne",
  "Brunswick - South":               "Brunswick Melbourne",
  "West Melbourne - Industrial":     "West Melbourne",
  "West Melbourne - Residential":    "West Melbourne",
  "Sydney (North) - Millers Point":  "Millers Point Sydney",
  "Sydney (South) - Haymarket":      "Haymarket Sydney",
  "Perth (North) - Highgate":        "Highgate Perth",
  "Perth (West) - Northbridge":      "Northbridge Perth",
  "Perth - Evandale":                "Evandale Perth",
  "Brisbane Port - Lytton":          "Lytton Brisbane",
  "Prahran - Windsor":               "Prahran",
  "North Sydney - Lavender Bay":     "Lavender Bay",
  "South Perth - Kensington":        "South Perth",
  "South Yarra":                     "South Yarra",
};

async function buildMap(suburbName, cityName) {
  const frame = document.getElementById("minimapFrame");
  try {
    // ── Fixed-coord suburbs (ABS names not in OSM) ──────────────────────────
    const fixed = ABS_FIXED_COORDS[suburbName];
    if (fixed) {
      minimapCenter = [fixed.lat, fixed.lon];
      minimapBounds = null;
      const mapEl = document.createElement("div");
      mapEl.id = "leafletMap";
      mapEl.style.cssText = "width:100%;height:100%;";
      frame.innerHTML = "";
      frame.appendChild(mapEl);
      minimapMap = L.map("leafletMap").setView(minimapCenter, fixed.zoom || 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd", maxZoom: 19,
      }).addTo(minimapMap);
      // No real boundary available — fall back to 3km circle
      L.circle(minimapCenter, {
        radius: 3000, color: "#735cff", weight: 1.5,
        dashArray: "6 4", fillColor: "#735cff", fillOpacity: 0.04,
        interactive: false,
      }).addTo(minimapMap);
      await fetchAndRenderAll(minimapCenter);
      return;
    }

    // ── Nominatim lookup ────────────────────────────────────────────────────
    const mapped = ABS_NAME_MAP[suburbName];
    const parts  = suburbName.split(/\s*-\s*/).map(s => s.trim()).filter(Boolean);
    const queryList = [...new Set([
      mapped,
      parts[0],
      parts.length > 1 ? parts[1] : null,
      parts[0].split(/\s+/)[0],
    ].filter(Boolean))];

    let nominatimData = null;
    for (const q of queryList) {
      const params = new URLSearchParams({
        q: `${q}, ${cityName}, Australia`,
        format: "json", limit: "8",
        polygon_geojson: "1",
        "accept-language": "en",
      });
      try {
        const res     = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        if (!res.ok) continue;
        const results = await res.json();
        const withPoly = results.filter(r =>
          r.geojson?.type === "Polygon" || r.geojson?.type === "MultiPolygon"
        );
        const preferred = withPoly.find(r =>
          ["suburb","neighbourhood","quarter","village","town",
           "city_district","administrative","city"].includes(r.type)
          || r.class === "boundary" || r.class === "place"
        );
        if (preferred)       { nominatimData = preferred; break; }
        if (withPoly.length) { nominatimData = withPoly[0]; break; }
        if (results.length && !nominatimData) nominatimData = results[0];
      } catch (e) { /* try next query */ }
    }

    if (!nominatimData) {
      frame.innerHTML = `<div class="minimap-error">Could not locate ${suburbName} on the map.</div>`;
      return;
    }

    const lat = parseFloat(nominatimData.lat);
    const lon = parseFloat(nominatimData.lon);
    minimapCenter = [lat, lon];

    const mapEl = document.createElement("div");
    mapEl.id = "leafletMap";
    mapEl.style.cssText = "width:100%;height:100%;";
    frame.innerHTML = "";
    frame.appendChild(mapEl);

    minimapMap = L.map("leafletMap", { zoomSnap: 0.5 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd", maxZoom: 19,
    }).addTo(minimapMap);

    // ── Draw suburb boundary from Nominatim geojson ─────────────────────────
    if (nominatimData.geojson?.type === "Polygon" || nominatimData.geojson?.type === "MultiPolygon") {
      const boundaryLayer = L.geoJSON(nominatimData.geojson, {
        style: {
          color: "#735cff", weight: 2.5, opacity: 0.85,
          dashArray: "6 4", fillColor: "#735cff", fillOpacity: 0.07,
        },
        interactive: false,
      }).addTo(minimapMap);

      minimapBounds = boundaryLayer.getBounds();
      minimapMap.fitBounds(minimapBounds, { padding: [20, 20] });
    } else {
      // No polygon — fall back to 3km circle centred view
      minimapBounds = null;
      L.circle(minimapCenter, {
        radius: 3000, color: "#735cff", weight: 1.5,
        dashArray: "6 4", fillColor: "#735cff", fillOpacity: 0.04,
        interactive: false,
      }).addTo(minimapMap);
      minimapMap.setView(minimapCenter, 14);
    }

    await fetchAndRenderAll(minimapCenter);
  } catch (err) {
    frame.innerHTML = `<div class="minimap-error">Map failed to load. Please check your connection.</div>`;
    console.error("MiniMap error:", err);
  }
}

// ── POI category config ──────────────────────────────────────────────────────
// 每个类别对应 Nominatim amenity/leisure/shop tag，以及显示 emoji 和标签名称
const POI_CATEGORIES = {
  restaurant:  { tags: ["amenity=restaurant", "amenity=cafe", "amenity=fast_food"],  emoji: "🍜", label: "Restaurant/Café" },
  supermarket: { tags: ["shop=supermarket", "shop=convenience"],                      emoji: "🛒", label: "Grocery" },
  hospital:    { tags: ["amenity=hospital"],                                           emoji: "🏥", label: "Hospital" },
  doctors:     { tags: ["amenity=doctors", "amenity=clinic"],                          emoji: "👨‍⚕️", label: "GP/Clinic" },
  park:        { tags: ["leisure=park", "leisure=garden"],                             emoji: "🌳", label: "Park" },
  bus_station: { tags: ["highway=bus_stop", "railway=station", "railway=tram_stop"],   emoji: "🚌", label: "Transport" },
};

// ── Overpass QL builder ──────────────────────────────────────────────────────
function buildOverpassQuery(amenity, lat, lon, maxResults) {
  const cat = POI_CATEGORIES[amenity];
  if (!cat) return null;

  // Use suburb boundary bbox if available, otherwise 3km radius
  let areaFilter;
  if (minimapBounds) {
    const sw = minimapBounds.getSouthWest();
    const ne = minimapBounds.getNorthEast();
    // Overpass bbox format: (south,west,north,east)
    areaFilter = `(${sw.lat},${sw.lng},${ne.lat},${ne.lng})`;
    const parts = cat.tags.map(tag => {
      const [k, v] = tag.split("=");
      return `node["${k}"="${v}"]${areaFilter};way["${k}"="${v}"]${areaFilter};`;
    });
    return `[out:json][timeout:25];(${parts.join("")});out center ${maxResults};`;
  } else {
    const parts = cat.tags.map(tag => {
      const [k, v] = tag.split("=");
      return `node["${k}"="${v}"](around:3000,${lat},${lon});way["${k}"="${v}"](around:3000,${lat},${lon});`;
    });
    return `[out:json][timeout:25];(${parts.join("")});out center ${maxResults};`;
  }
}

// ── fetch helpers ─────────────────────────────────────────────────────────────
async function tryOverpassDirect(query) {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST", body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.elements?.length) return data.elements;
    } catch { /* try next */ }
  }
  return null;
}

async function tryOverpassViaProxy(query) {
  const encoded = encodeURIComponent("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query));
  const proxies = [
    { url: `https://corsproxy.io/?url=${encoded}`,                        wrap: false },
    { url: `https://api.allorigins.win/get?url=${encoded}`,               wrap: true  },
  ];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy.url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const raw = proxy.wrap ? JSON.parse((await res.json()).contents) : await res.json();
      if (raw.elements?.length) return raw.elements;
    } catch { /* try next */ }
  }
  return null;
}

// Nominatim nearby search — last resort, no Overpass needed
async function tryNominatimNearby(amenity, lat, lon, maxResults) {
  const cat = POI_CATEGORIES[amenity];
  if (!cat) return null;

  // Use suburb boundary bbox if available, otherwise ~3km box
  let viewbox;
  if (minimapBounds) {
    const sw = minimapBounds.getSouthWest();
    const ne = minimapBounds.getNorthEast();
    viewbox = `${sw.lng},${ne.lat},${ne.lng},${sw.lat}`;
  } else {
    const delta = 0.027;
    viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
  }
  // Try each tag separately and merge results
  const allResults = [];
  for (const tag of cat.tags.slice(0, 2)) { // limit to avoid rate limit
    const [k, v] = tag.split("=");
    const params = new URLSearchParams({
      format: "json", limit: String(maxResults),
      viewbox, bounded: "1",
      [`${k}`]: v,
      "accept-language": "en",
    });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const items = await res.json();
      items.forEach(item => {
        if (item.lat && item.lon) {
          allResults.push({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            name: item.display_name?.split(",")[0] || v,
          });
        }
      });
      // small delay between Nominatim requests to respect rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch { /* try next tag */ }
  }
  return allResults.length ? allResults : null;
}

// ── main render functions ────────────────────────────────────────────────────
async function fetchAndRenderAll(center) {
  minimapMarkers.forEach(m => m.remove());
  minimapMarkers = [];
  const allCategories = Object.keys(POI_CATEGORIES);
  for (const cat of allCategories) {
    await fetchAndRenderPOI(cat, center, 5, true);
  }
}

async function fetchAndRenderPOI(amenity, center, maxResults = 20, skipClear = false) {
  if (!skipClear) {
    minimapMarkers.forEach(m => m.remove());
    minimapMarkers = [];
  }
  if (!amenity) return;

  const cat = POI_CATEGORIES[amenity];
  if (!cat) return;

  // 按钮 loading（单独类别点击时才更新）
  const activeBtn = skipClear ? null : document.querySelector(".minimap-filter-btn.active");
  let originalHTML = "";
  if (activeBtn) {
    originalHTML = activeBtn.innerHTML;
    activeBtn.disabled = true;
    activeBtn.innerHTML = originalHTML + " ⏳";
  }

  const [lat, lon] = center;
  const query = buildOverpassQuery(amenity, lat, lon, maxResults);
  let elements = null;

  // 1️⃣ 直连 Overpass
  if (query) elements = await tryOverpassDirect(query);

  // 2️⃣ CORS 代理 Overpass
  if (!elements && query) elements = await tryOverpassViaProxy(query);

  // 3️⃣ Nominatim 兜底
  if (!elements) {
    const nominatimResults = await tryNominatimNearby(amenity, lat, lon, maxResults);
    if (nominatimResults) {
      // convert to same shape as Overpass elements
      elements = nominatimResults.map(r => ({ lat: r.lat, lon: r.lon, tags: { name: r.name } }));
    }
  }

  // 渲染标记
  if (elements && elements.length) {
    elements.forEach(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return;
      const icon = L.divIcon({
        html: `<div class="minimap-poi-icon">${cat.emoji}</div>`,
        className: "", iconSize: [30, 30], iconAnchor: [15, 15],
      });
      const marker = L.marker([elLat, elLon], { icon })
        .addTo(minimapMap)
        .bindPopup(`<strong>${el.tags?.name || el.tags?.["name:en"] || cat.label}</strong>`);
      minimapMarkers.push(marker);
    });
  } else if (!skipClear) {
    // 全部 fallback 都失败时，在地图上短暂提示
    const frame = document.getElementById("minimapFrame");
    if (frame) {
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(255,255,255,0.95);border-radius:8px;padding:7px 16px;font-size:0.82rem;color:#665f85;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.1);white-space:nowrap;";
      msg.textContent = `暂时无法加载 ${cat.label} 数据，请稍后重试`;
      frame.style.position = "relative";
      frame.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
    }
  }

  if (activeBtn) {
    activeBtn.disabled = false;
    activeBtn.innerHTML = originalHTML;
  }
}


