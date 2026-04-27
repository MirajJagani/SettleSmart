const preferences = window.getStoredPreferences
  ? window.getStoredPreferences()
  : JSON.parse(localStorage.getItem("settlesmart_preferences") || "{}");

const suburbProfile = document.getElementById("suburbProfile");

const cityHeroImages = {
  Melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1600&q=80",
  Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
  Brisbane: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80",
  Adelaide: "https://images.unsplash.com/photo-1564419439572-1f478fe9ad4f?auto=format&fit=crop&w=1600&q=80",
  Perth: "https://images.unsplash.com/photo-1510546020571-ec8f91d1fceb?auto=format&fit=crop&w=1600&q=80",
  Canberra: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1600&q=80"
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

  const heroImage = cityHeroImages[suburb.city] || cityHeroImages.Melbourne;

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

  document.querySelectorAll(".minimap-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".minimap-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeAmenity = btn.dataset.amenity || "";
      if (minimapMap && minimapCenter) fetchAndRenderPOI(activeAmenity, minimapCenter);
    });
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

async function buildMap(suburbName, cityName) {
  const frame = document.getElementById("minimapFrame");
  try {
    const query = encodeURIComponent(`${suburbName}, ${cityName}, Australia`);
    const res   = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (!data.length) {
      frame.innerHTML = `<div class="minimap-error">Could not locate ${suburbName} on the map.</div>`;
      return;
    }
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    minimapCenter = [lat, lon];

    const mapEl = document.createElement("div");
    mapEl.id = "leafletMap";
    mapEl.style.cssText = "width:100%;height:100%;";
    frame.innerHTML = "";
    frame.appendChild(mapEl);

    minimapMap = L.map("leafletMap").setView(minimapCenter, 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(minimapMap);

    L.marker(minimapCenter).addTo(minimapMap)
      .bindPopup(`<strong>${suburbName}</strong>`).openPopup();

    await fetchAndRenderPOI("", minimapCenter);
  } catch (err) {
    frame.innerHTML = `<div class="minimap-error">Map failed to load. Please check your connection.</div>`;
    console.error("MiniMap error:", err);
  }

}

async function fetchAndRenderPOI(amenity, center) {
  minimapMarkers.forEach(m => m.remove());
  minimapMarkers = [];
  if (!amenity) return;

  const [lat, lon] = center;
  const tag = amenity === "park" ? `["leisure"="park"]` : `["amenity"="${amenity}"]`;
  const query = `[out:json][timeout:10];(node${tag}(around:1500,${lat},${lon});way${tag}(around:1500,${lat},${lon}););out center 20;`;

  try {
    const res  = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
    const data = await res.json();
    const emojiMap = { supermarket:"🛒", hospital:"🏥", doctors:"👨‍⚕️", park:"🌳", restaurant:"🍜", bus_station:"🚌" };
    const emoji = emojiMap[amenity] || "📍";

    data.elements.forEach(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return;
      const icon = L.divIcon({ html: `<div class="minimap-poi-icon">${emoji}</div>`, className: "", iconSize:[28,28], iconAnchor:[14,14] });
      const marker = L.marker([elLat, elLon], { icon }).addTo(minimapMap)
        .bindPopup(`<strong>${el.tags?.name || amenity}</strong>`);
      minimapMarkers.push(marker);
    });
  } catch (err) {
    console.warn("POI fetch failed:", err);
  }

}
