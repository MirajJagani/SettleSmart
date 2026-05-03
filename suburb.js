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

let safetyTrendChartInstance = null;

// Safety chart line configuration
const SAFETY_SERIES_OPTIONS = [
  {
    key: "crimeCountByYear",
    label: "Total crime",
    borderColor: "#735cff",
    backgroundColor: "rgba(115, 92, 255, 0.12)"
  },
  {
    key: "propertyCrimesByYear",
    label: "Property crimes",
    borderColor: "#f59e0b",
    backgroundColor: "rgba(245, 158, 11, 0.10)"
  },
  {
    key: "violentCrimesByYear",
    label: "Violent crimes",
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.10)"
  }
];

let activeSafetySeries = ["crimeCountByYear"];

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
  const community = typeof window.getEpic4CommunityData === "function"
    ? window.getEpic4CommunityData(suburb)
    : getFallbackCommunity(suburb);

  const cultureScore = typeof window.getEpic4ProfileCultureScore === "function"
    ? window.getEpic4ProfileCultureScore(suburb, preferences)
    : 7;

  const safety = getSafetyIndicator(suburb);
  const heroImage = cityHeroImages[normalizeCityKey(suburb.city)] || cityHeroImages.melbourne;
  const priorityRows = buildPriorityMatchRows(suburb, preferences);

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
                  <strong>${formatChoiceList(preferences.housing)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Commute</span>
                  <strong>${formatChoiceList(preferences.commute)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Lifestyle</span>
                  <strong>${formatChoiceList(preferences.lifestyle)}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Language</span>
                  <strong>${preferences.language || "Not set"}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>Culture</span>
                  <strong>${preferences.culture || "Not set"}</strong>
                </div>
                <div class="suburb-mini-card">
                  <span>University</span>
                  <strong>${preferences.university || "Not set"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="row g-4">
        <div class="col-12 col-xl-7">
          <div class="info-card suburb-detail-card h-100">
            <div class="suburb-section-head">
              <h3>How it matches your priorities</h3>
              <p>See where this suburb aligns with your selected preferences and where it may be a partial fit.</p>
            </div>

            <div class="priority-match-grid">
              ${priorityRows.map((row) => renderPriorityMatchRow(row)).join("")}
            </div>
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

      <section class="info-card suburb-detail-card" id="safetyIndicatorSection">
        <div class="suburb-section-head">
          <h3>Safety indicator</h3>
          <p>
            ${
              safety.hasData
                ? `Yearly crime count trend for ${suburb.suburb}, based on yearly crime data up to ${safety.latestYearLabel}.`
                : `No safety data is currently available for ${suburb.suburb}.`
            }
          </p>
        </div>

        ${
          safety.hasData
            ? `
              <div class="suburb-profile-grid">
                <article class="suburb-profile-card">
                  <span class="suburb-profile-kicker">Population</span>
                  <p>${safety.populationLabel}</p>
                </article>

                <article class="suburb-profile-card">
                  <span class="suburb-profile-kicker">Latest crime count</span>
                  <p>${safety.latestCrimeLabel}</p>
                </article>

                <article class="suburb-profile-card">
                  <span class="suburb-profile-kicker">Latest crime rate / 1000 residents</span>
                  <p>${safety.latestCrimeRateLabel}</p>
                </article>

                <article class="suburb-profile-card">
                  <span class="suburb-profile-kicker">Trend</span>
                  <p>${safety.trendLabel}</p>
                </article>
              </div>

              <div class="safety-chart-controls" id="safetyChartControls" aria-label="Safety chart filters">
                <button
                  type="button"
                  class="safety-chart-toggle active"
                  data-safety-series="crimeCountByYear"
                >
                  Total crime
                </button>

                <button
                  type="button"
                  class="safety-chart-toggle"
                  data-safety-series="violentCrimesByYear"
                  ${hasSafetySeries(suburb, "violentCrimesByYear") ? "" : "disabled"}
                >
                  Violent crimes
                </button>

                <button
                  type="button"
                  class="safety-chart-toggle"
                  data-safety-series="propertyCrimesByYear"
                  ${hasSafetySeries(suburb, "propertyCrimesByYear") ? "" : "disabled"}
                >
                  Property crimes
                </button>
              </div>
              
              <div class="safety-chart-wrap">
                <canvas id="safetyTrendChart"></canvas>
              </div>
            `
            : `
              <div class="safety-empty-state compact">
              </div>
            `
        }
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
            <span class="suburb-profile-kicker">Community comfort details</span>
            <ul class="suburb-detail-list minimal">
              <li>Common language cues: ${suburb.commonLanguages.join(", ")}</li>
              <li>Community strength: ${community.communityStrength}%</li>
              <li>Overseas-born share: ${community.overseasBornShare}</li>
              <li>Specialty shops nearby: ${community.specialtyShops}</li>
              <li>Places of worship nearby: ${community.placesOfWorship}</li>
            </ul>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Cultural amenities</span>
            <ul class="suburb-detail-list minimal">
              ${community.keyPlaces.map((place) => `<li>${place}</li>`).join("")}
            </ul>
          </article>

          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">Practical community support</span>
            <ul class="suburb-detail-list minimal">
              <li>English support: ${window.formatChoice(suburb.englishSupport)}</li>
              <li>Recent arrivals: ${window.formatChoice(suburb.recentArrival)}</li>
              <li>Culture signal: ${window.formatChoice(suburb.culture)}</li>
              <li>University access: ${window.formatChoice(suburb.university)}</li>
            </ul>
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
  requestAnimationFrame(() => {
    setupSafetyChartControls(suburb);
    renderSafetyTrendChart(suburb);
  });
}

function getPreferenceArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function formatChoiceList(value) {
  const values = getPreferenceArray(value);
  if (!values.length) return "Not set";
  return values.map((item) => window.formatChoice(item)).join(", ");
}

function parseRentRange(rangeText) {
  const match = String(rangeText || "").match(/\$?([\d,]+)\s*[–-]\s*\$?([\d,]+)/);
  if (!match) return null;

  return {
    min: Number(match[1].replace(/,/g, "")),
    max: Number(match[2].replace(/,/g, ""))
  };
}

function getStatusMeta(status) {
  if (status === "match") {
    return { symbol: "✓", label: "Match", className: "match" };
  }
  if (status === "partial") {
    return { symbol: "~", label: "Partial", className: "partial" };
  }
  return { symbol: "✕", label: "No match", className: "no-match" };
}

function renderPriorityMatchRow(row) {
  const meta = getStatusMeta(row.status);

  return `
    <div class="priority-match-row priority-match-row--${meta.className}">
      <div class="priority-match-status priority-match-status--${meta.className}">
        ${meta.symbol}
      </div>

      <div class="priority-match-content">
        <div class="priority-match-top">
          <div>
            <h4>${row.label}</h4>
            <p class="priority-match-summary">${row.summary}</p>
          </div>

          <span class="priority-match-pill priority-match-pill--${meta.className}">
            ${meta.label}
          </span>
        </div>

        <p class="priority-match-detail">${row.detail}</p>
      </div>
    </div>
  `;
}

function buildPriorityMatchRows(suburb, preferences) {
  return [
    getBudgetPriorityMatch(suburb, preferences),
    getHousingPriorityMatch(suburb, preferences),
    getCommutePriorityMatch(suburb, preferences),
    getLifestylePriorityMatch(suburb, preferences),
    getLanguagePriorityMatch(suburb, preferences),
    getCulturePriorityMatch(suburb, preferences),
    getUniversityPriorityMatch(suburb, preferences)
  ];
}

function getBudgetPriorityMatch(suburb, preferences) {
  const budget = Number(preferences.budget || 0);
  const rentRange = parseRentRange(suburb.rentRange);

  if (!budget || !rentRange) {
    return {
      label: "Budget",
      status: "partial",
      summary: "Budget fit is available only as a broad estimate.",
      detail: `Your budget is $${preferences.budget || "-"} per week and this suburb is listed at ${suburb.rentRange || "Not available"}.`
    };
  }

  if (budget >= rentRange.max) {
    return {
      label: "Budget",
      status: "match",
      summary: "This suburb fits within your weekly rent budget.",
      detail: `Your budget is $${budget}/week and the typical range here is ${suburb.rentRange}.`
    };
  }

  if (budget >= rentRange.min) {
    return {
      label: "Budget",
      status: "partial",
      summary: "This suburb may fit your budget depending on the property.",
      detail: `Your budget is $${budget}/week and the suburb range is ${suburb.rentRange}, so some listings may still be suitable.`
    };
  }

  return {
    label: "Budget",
    status: "no-match",
    summary: "This suburb is likely above your preferred weekly budget.",
    detail: `Your budget is $${budget}/week while the suburb typically ranges ${suburb.rentRange}.`
  };
}

function getHousingPriorityMatch(suburb, preferences) {
  const selected = getPreferenceArray(preferences.housing);
  const available = getPreferenceArray(suburb.housing);
  const matched = selected.filter((item) => available.includes(item));
  const missing = selected.filter((item) => !available.includes(item));

  if (!selected.length) {
    return {
      label: "Housing",
      status: "partial",
      summary: "No housing preference was saved.",
      detail: "A clearer housing match can be shown once a housing preference is selected."
    };
  }

  if (matched.length === selected.length) {
    return {
      label: "Housing",
      status: "match",
      summary: "This suburb supports your selected housing style.",
      detail: `Available options here align with ${formatChoiceList(selected)}.`
    };
  }

  if (matched.length > 0) {
    return {
      label: "Housing",
      status: "partial",
      summary: "This suburb supports some of your preferred housing styles.",
      detail: `Available here: ${formatChoiceList(matched)}. Less aligned: ${formatChoiceList(missing)}.`
    };
  }

  return {
    label: "Housing",
    status: "no-match",
    summary: "This suburb does not strongly reflect your selected housing style.",
    detail: `You selected ${formatChoiceList(selected)}, while this suburb is better known for ${formatChoiceList(available)}.`
  };
}

function getCommutePreferenceScore(preferenceKey, suburb) {
  const transportLevel = suburb.transport;
  const universityLevel = suburb.university;

  if (preferenceKey === "low-commute") {
    if (universityLevel === "high") return 2;
    if (universityLevel === "medium") return 1;
    return 0;
  }

  if (preferenceKey === "public-transport" || preferenceKey === "bike-walk") {
    if (transportLevel === "high") return 2;
    if (transportLevel === "medium") return 1;
    return 0;
  }

  return 0;
}

function getCommutePriorityMatch(suburb, preferences) {
  const selected = getPreferenceArray(preferences.commute);

  if (!selected.length) {
    return {
      label: "Commute",
      status: "partial",
      summary: "No commute preference was saved.",
      detail: "A clearer commute match can be shown once a commute preference is selected."
    };
  }

  const scores = selected.map((item) => getCommutePreferenceScore(item, suburb));
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;

  if (average >= 1.5) {
    return {
      label: "Commute",
      status: "match",
      summary: "Transport and access signals support your commute priorities well.",
      detail: `Transport is ${window.formatChoice(suburb.transport)} and university access is ${window.formatChoice(suburb.university)} for your selected commute needs.`
    };
  }

  if (average >= 0.75) {
    return {
      label: "Commute",
      status: "partial",
      summary: "This suburb may support some of your commute needs, but not all of them.",
      detail: `Transport is ${window.formatChoice(suburb.transport)} and university access is ${window.formatChoice(suburb.university)}.`
    };
  }

  return {
    label: "Commute",
    status: "no-match",
    summary: "This suburb is less aligned with your current commute priorities.",
    detail: `Transport is ${window.formatChoice(suburb.transport)} and university access is ${window.formatChoice(suburb.university)} for the commute style you selected.`
  };
}

function getLifestylePriorityMatch(suburb, preferences) {
  const selected = getPreferenceArray(preferences.lifestyle);
  const available = getPreferenceArray(suburb.lifestyle);
  const matched = selected.filter((item) => available.includes(item));
  const missing = selected.filter((item) => !available.includes(item));

  if (!selected.length) {
    return {
      label: "Lifestyle",
      status: "partial",
      summary: "No lifestyle priorities were saved.",
      detail: "A clearer lifestyle match can be shown once lifestyle priorities are selected."
    };
  }

  if (matched.length === selected.length) {
    return {
      label: "Lifestyle",
      status: "match",
      summary: "This suburb strongly reflects your lifestyle priorities.",
      detail: `It aligns with ${formatChoiceList(selected)}.`
    };
  }

  if (matched.length > 0) {
    return {
      label: "Lifestyle",
      status: "partial",
      summary: "This suburb reflects some of your lifestyle priorities.",
      detail: `Stronger fit for ${formatChoiceList(matched)}. Less aligned with ${formatChoiceList(missing)}.`
    };
  }

  return {
    label: "Lifestyle",
    status: "no-match",
    summary: "This suburb does not strongly reflect your selected lifestyle priorities.",
    detail: `You selected ${formatChoiceList(selected)}, while this suburb is more associated with ${formatChoiceList(available)}.`
  };
}

function getLanguagePriorityMatch(suburb, preferences) {
  const selectedLanguage = String(preferences.language || "").trim();
  const commonLanguages = suburb.commonLanguages || [];

  if (!selectedLanguage) {
    return {
      label: "Language",
      status: "partial",
      summary: "No language preference was saved.",
      detail: `Common languages here include ${commonLanguages.join(", ") || "Not available"}.`
    };
  }

  if (commonLanguages.includes(selectedLanguage)) {
    return {
      label: "Language",
      status: "match",
      summary: "Your selected language is commonly spoken here.",
      detail: `Common languages in this suburb include ${commonLanguages.join(", ")}.`
    };
  }

  if (
    suburb.englishSupport === "high" ||
    suburb.englishSupport === "medium" ||
    commonLanguages.includes("English")
  ) {
    return {
      label: "Language",
      status: "partial",
      summary: "Your selected language is not a main signal here, but English support may still help.",
      detail: `Common languages include ${commonLanguages.join(", ") || "Not available"}, and English support is ${window.formatChoice(suburb.englishSupport)}.`
    };
  }

  return {
    label: "Language",
    status: "no-match",
    summary: "This suburb does not strongly reflect your selected language preference.",
    detail: `Common languages here are ${commonLanguages.join(", ") || "Not available"}.`
  };
}

function getCulturePriorityMatch(suburb, preferences) {
  const selectedCulture = String(preferences.culture || "").trim();
  const culturalGroups = suburb.culturalGroups || [];

  if (!selectedCulture) {
    return {
      label: "Culture",
      status: "partial",
      summary: "No cultural preference was saved.",
      detail: `This suburb currently shows a ${window.formatChoice(suburb.culture)} culture signal.`
    };
  }

  if (culturalGroups.includes(selectedCulture)) {
    return {
      label: "Culture",
      status: "match",
      summary: "This suburb shows a direct connection to your selected cultural background.",
      detail: `Cultural groups here include ${culturalGroups.join(", ")}.`
    };
  }

  if (
    suburb.culture === "high" ||
    suburb.culture === "medium" ||
    suburb.recentArrival === "strong" ||
    suburb.recentArrival === "medium"
  ) {
    return {
      label: "Culture",
      status: "partial",
      summary: "This suburb has multicultural signals, even if your selected culture is not a direct match.",
      detail: `Culture signal is ${window.formatChoice(suburb.culture)} and recent arrivals are ${window.formatChoice(suburb.recentArrival)}.`
    };
  }

  return {
    label: "Culture",
    status: "no-match",
    summary: "This suburb shows fewer cultural signals aligned with your selected background.",
    detail: `Culture signal is ${window.formatChoice(suburb.culture)} and listed cultural groups are ${culturalGroups.join(", ") || "not available"}.`
  };
}

function getUniversityPriorityMatch(suburb, preferences) {
  const selectedUniversity = String(preferences.university || "").trim();

  if (!selectedUniversity) {
    return {
      label: "University",
      status: "partial",
      summary: "No university was saved.",
      detail: `This suburb currently shows ${window.formatChoice(suburb.university)} university access.`
    };
  }

  if (suburb.university === "high") {
    return {
      label: "University",
      status: "match",
      summary: "This suburb shows strong university access for your selected study location.",
      detail: `${selectedUniversity} is paired with a ${window.formatChoice(suburb.university)} university access signal here.`
    };
  }

  if (suburb.university === "medium") {
    return {
      label: "University",
      status: "partial",
      summary: "This suburb may still work for university access, but it is not the strongest option.",
      detail: `${selectedUniversity} is paired with a ${window.formatChoice(suburb.university)} university access signal here.`
    };
  }

  return {
    label: "University",
    status: "no-match",
    summary: "This suburb is less aligned with your selected university access needs.",
    detail: `${selectedUniversity} is paired with a ${window.formatChoice(suburb.university)} university access signal here.`
  };
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

      // Force the frame to have a visible height before Leaflet initialises
      const frame = document.getElementById("minimapFrame");
      if (frame) {
        frame.style.height = "380px";
        frame.style.minHeight = "380px";
        frame.style.display = "block";
      }

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

    // Load CSS first
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    // Load JS — once loaded, give the CSS a tick to apply before resolving
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // Wait two animation frames so the browser has painted the CSS
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    document.head.appendChild(script);
  });
}

/* ─── ABS SA2 name → real OSM search term ───────────────────────── */
// Suburbs where Nominatim returns wrong/oversized boundaries → use fixed coords + zoom
const ABS_FIXED_COORDS = {
  "Melbourne CBD - East":  { lat: -37.8136, lon: 144.9631, zoom: 15 },
  "Melbourne CBD - North": { lat: -37.8080, lon: 144.9631, zoom: 15 },
  "Melbourne CBD - West":  { lat: -37.8143, lon: 144.9531, zoom: 15 },
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
      mapEl.style.cssText = "width:100%;height:380px;min-height:380px;display:block;";
      frame.style.height = "380px";
      frame.style.minHeight = "380px";
      frame.innerHTML = "";
      frame.appendChild(mapEl);
      minimapMap = L.map("leafletMap").setView(minimapCenter, fixed.zoom || 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd", maxZoom: 19,
      }).addTo(minimapMap);
      // No real boundary available — fall back to 1km circle
      L.circle(minimapCenter, {
        radius: 1000, color: "#735cff", weight: 1.5,
        dashArray: "6 4", fillColor: "#735cff", fillOpacity: 0.04,
        interactive: false,
      }).addTo(minimapMap);
      setTimeout(() => minimapMap.invalidateSize(), 300);
      await fetchAndRenderAll(minimapCenter);
      return;
    }

    // ── Nominatim lookup ────────────────────────────────────────────────────
    // Use structured search first (suburb= param) so Nominatim matches the
    // administrative boundary rather than a street or building with the same name.
    const mapped = ABS_NAME_MAP[suburbName];
    const parts  = suburbName.split(/\s*-\s*/).map(s => s.trim()).filter(Boolean);
    const candidates = [...new Set([mapped, parts[0], parts.length > 1 ? parts[1] : null].filter(Boolean))];

    // Score a result: higher = better match for an SA2 suburb boundary
    function scoreResult(r) {
      let s = 0;
      if (r.geojson?.type === "Polygon" || r.geojson?.type === "MultiPolygon") s += 100;
      if (r.class === "boundary") s += 60;
      if (r.class === "place")    s += 40;
      const goodTypes = ["suburb","neighbourhood","quarter","village","town","municipality","city_district","administrative"];
      if (goodTypes.includes(r.type)) s += 50;
      // place_rank 20-22 is suburb level in Nominatim; penalise anything too fine or too coarse
      const rank = parseInt(r.place_rank || 30);
      if (rank >= 18 && rank <= 24) s += 30;
      else if (rank < 18 || rank > 28) s -= 20;
      return s;
    }

    let nominatimData = null;

    for (const name of candidates) {
      // 1️⃣ Structured query: suburb + city (most precise)
      const structuredParams = new URLSearchParams({
        suburb: name,
        city: cityName,
        country: "Australia",
        format: "json", limit: "6",
        polygon_geojson: "1",
        addressdetails: "1",
        "accept-language": "en",
      });
      // 2️⃣ Free-text fallback
      const freeParams = new URLSearchParams({
        q: `${name}, ${cityName}, Australia`,
        format: "json", limit: "8",
        polygon_geojson: "1",
        addressdetails: "1",
        "accept-language": "en",
      });

      for (const params of [structuredParams, freeParams]) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
          if (!res.ok) continue;
          const results = await res.json();
          if (!results.length) continue;

          // Pick the highest-scoring result
          const scored = results
            .map(r => ({ r, score: scoreResult(r) }))
            .sort((a, b) => b.score - a.score);

          const best = scored[0];
          // Accept if it has a decent boundary polygon, otherwise keep trying
          if (best.score >= 100) { nominatimData = best.r; break; }
          // Keep as fallback if nothing better found
          if (!nominatimData || best.score > scoreResult(nominatimData)) {
            nominatimData = best.r;
          }
        } catch (e) { /* try next */ }
      }

      if (nominatimData && scoreResult(nominatimData) >= 100) break;
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
    mapEl.style.cssText = "width:100%;height:380px;min-height:380px;display:block;";
    frame.style.height = "380px";
    frame.style.minHeight = "380px";
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
      setTimeout(() => minimapMap.invalidateSize(), 300);
    } else {
      // No polygon — fall back to 1km circle centred view
      minimapBounds = null;
      L.circle(minimapCenter, {
        radius: 1000, color: "#735cff", weight: 1.5,
        dashArray: "6 4", fillColor: "#735cff", fillOpacity: 0.04,
        interactive: false,
      }).addTo(minimapMap);
      minimapMap.setView(minimapCenter, 14);
      setTimeout(() => minimapMap.invalidateSize(), 300);
    }

    await fetchAndRenderAll(minimapCenter);
  } catch (err) {
    frame.innerHTML = `<div class="minimap-error">Map failed to load. Please check your connection.</div>`;
    console.error("MiniMap error:", err);
  }
}

// ── POI category config ──────────────────────────────────────────────────────
// POI category config: maps each category to its Nominatim tags, emoji, and display label
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

  // Use suburb boundary bbox if available, otherwise 1km radius
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
      return `node["${k}"="${v}"](around:1000,${lat},${lon});way["${k}"="${v}"](around:1000,${lat},${lon});`;
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

  // Use suburb boundary bbox if available, otherwise ~1km box
  let viewbox;
  if (minimapBounds) {
    const sw = minimapBounds.getSouthWest();
    const ne = minimapBounds.getNorthEast();
    viewbox = `${sw.lng},${ne.lat},${ne.lng},${sw.lat}`;
  } else {
    const delta = 0.009;
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

  // 1️⃣ Direct Overpass request
  if (query) elements = await tryOverpassDirect(query);

  // 2️⃣ Overpass via CORS proxy
  if (!elements && query) elements = await tryOverpassViaProxy(query);

  // 3️⃣ Nominatim fallback
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
    // All fallbacks failed — show a brief toast on the map
    const frame = document.getElementById("minimapFrame");
    if (frame) {
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(255,255,255,0.95);border-radius:8px;padding:7px 16px;font-size:0.82rem;color:#665f85;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.1);white-space:nowrap;";
      msg.textContent = `Could not load ${cat.label} data — please try again later`;
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

/* -------- Safety Indicator (Epic 6) ------------------ */

function hasSafetySeries(suburb, seriesKey) {
  const series = suburb[seriesKey] || {};

  // True if this category has at least one value
  return Object.values(series).some((value) => {
    return value !== null && value !== undefined && !Number.isNaN(Number(value));
  });
}

function setupSafetyChartControls(suburb) {
  const controls = document.getElementById("safetyChartControls");

  // If has no safety data, stop
  if (!controls) {
    return;
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-safety-series]");

    if (!button || button.disabled) {
      return;
    }

    const selectedKey = button.dataset.safetySeries;

    if (activeSafetySeries.includes(selectedKey)) {
      // Keep at least one line active
      if (activeSafetySeries.length === 1) {
        return;
      }

      activeSafetySeries = activeSafetySeries.filter((key) => key !== selectedKey);
    } else {
      activeSafetySeries.push(selectedKey);
    }

    controls.querySelectorAll("[data-safety-series]").forEach((btn) => {
      btn.classList.toggle(
        "active",
        activeSafetySeries.includes(btn.dataset.safetySeries)
      );
    });

    renderSafetyTrendChart(suburb);
  });
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return Number(value).toLocaleString("en-AU");
}

function getSafetyIndicator(suburb) {
  const population = suburb.population ?? null;
  const crimeCountByYear = suburb.crimeCountByYear || {};

  const years = Object.keys(crimeCountByYear).sort((a, b) => Number(a) - Number(b));

  if (!years.length) {
    return {
      hasData: false,
      populationLabel: formatNumber(population),
      latestCrimeLabel: "Not available",
      latestYearLabel: "Not available",
      latestCrimeRateLabel: "Not available",
      trendLabel: "Not available"
    };
  }

  const latestYear = years[years.length - 1];
  const latestCrime = Number(crimeCountByYear[latestYear]);

  const recentYears = years.slice(-3);
  const numericPopulation = Number(population);

  // Calculate trend using a linear fit over the latest three years of crime data.
  const trendValues = recentYears.map((year) => {
    const crimeCount = Number(crimeCountByYear[year]);

    if (numericPopulation && numericPopulation > 0) {
      return (crimeCount / numericPopulation) * 1000;
    }

    return crimeCount;
  });

  const trendLabel = getLinearTrend(trendValues);
  const latestCrimeRate = population
  ? ((latestCrime / population) * 1000).toFixed(2)
  : null;

  return {
    hasData: true,
  populationLabel: formatNumber(population),
  latestCrimeLabel: formatNumber(latestCrime),
  latestYearLabel: latestYear,
  latestCrimeRateLabel: latestCrimeRate,
  trendLabel
  };
}

// Calculate trend using linear fit over the latest three years
function getLinearTrend(values) {
  if (!values || values.length < 2) {
    return "Not enough data";
  }

  const n = values.length;
  const xValues = values.map((_, index) => index);

  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  const average = yMean || 1;
  const relativeSlope = Math.abs(slope) / average;

  if (relativeSlope < 0.05) {
    return "Stable";
  }

  return slope > 0 ? "Increasing" : "Decreasing";
}

function getSafetyChartData(suburb) {
  const selectedOptions = SAFETY_SERIES_OPTIONS.filter((option) => {
    return activeSafetySeries.includes(option.key) && hasSafetySeries(suburb, option.key);
  });

  if (!selectedOptions.length) {
    return null;
  }

  const years = [
    ...new Set(
      selectedOptions.flatMap((option) => {
        const series = suburb[option.key] || {};

        return Object.keys(series).filter((year) => {
          const value = series[year];
          return value !== null && value !== undefined && !Number.isNaN(Number(value));
        });
      })
    )
  ].sort((a, b) => Number(a) - Number(b));

  if (!years.length) {
    return null;
  }

  // Track the largest visible value, used to adjust y scale
  let maxValue = 0;

  const datasets = selectedOptions.map((option) => {
    const series = suburb[option.key] || {};

    const values = years.map((year) => {
      const value = series[year];

      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return null;
      }

      const numericValue = Number(value);
      maxValue = Math.max(maxValue, numericValue);
      return numericValue;
    });

    return {
      key: option.key,
      label: option.label,
      values,
      borderColor: option.borderColor,
      backgroundColor: option.backgroundColor
    };
  });

  return {
    labels: years,
    datasets,
    maxValue
  };
}

function getNiceSafetyAxisMax(maxValue) {
  if (!maxValue || maxValue <= 0) {
    return 10;
  }

  const paddedMax = maxValue * 1.05;
  const roughStep = paddedMax / 4;

  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  let niceStep;

  if (normalizedStep <= 1) {
    niceStep = 1 * magnitude;
  } else if (normalizedStep <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalizedStep <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  return Math.ceil(paddedMax / niceStep) * niceStep;
}

function renderSafetyTrendChart(suburb) {
  const canvas = document.getElementById("safetyTrendChart");

  if (!canvas) {
    console.warn("Safety chart canvas not found.");
    return;
  }

  if (!window.Chart) {
    console.warn("Chart.js is not loaded.");
    return;
  }

  // Get chart data from active crime categories
  const chartData = getSafetyChartData(suburb);

  if (!chartData) {
    console.warn("No safety chart data available.", {
      population: suburb.population,
      crimeCountByYear: suburb.crimeCountByYear,
      violentCrimesByYear: suburb.violentCrimesByYear,
      propertyCrimesByYear: suburb.propertyCrimesByYear
    });
    return;
  }

  // Remove the previous chart before a new one
  if (safetyTrendChartInstance) {
    safetyTrendChartInstance.destroy();
  }

  const ctx = canvas.getContext("2d");

  function createSafetyGradient(seriesKey) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);

    if (seriesKey === "violentCrimesByYear") {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.22)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.02)");
      return gradient;
    }

    if (seriesKey === "propertyCrimesByYear") {
      gradient.addColorStop(0, "rgba(245, 158, 11, 0.22)");
      gradient.addColorStop(1, "rgba(245, 158, 11, 0.02)");
      return gradient;
    }

    gradient.addColorStop(0, "rgba(115, 92, 255, 0.22)");
    gradient.addColorStop(1, "rgba(115, 92, 255, 0.02)");
    return gradient;
  }

  const yAxisMax = getNiceSafetyAxisMax(chartData.maxValue);

  safetyTrendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets.map((dataset) => {
        const isTotalCrime = dataset.key === "crimeCountByYear";

        return {
          label: dataset.label,
          data: dataset.values,
          borderColor: dataset.borderColor,
          backgroundColor: createSafetyGradient(dataset.key),
          borderWidth: isTotalCrime ? 3 : 2.5,
          tension: 0.35,
          fill: "origin",
          spanGaps: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: dataset.borderColor,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: dataset.borderColor,
          pointHoverBorderColor: "#ffffff",
          pointHoverBorderWidth: 2
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(36, 31, 66, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#f3f1ff",
          padding: 12,
          displayColors: true,
          cornerRadius: 12,
          caretSize: 6,
          callbacks: {
            title: function(items) {
              return `Year ${items[0].label}`;
            },
            label: function(context) {
              const value = context.parsed.y;

              if (value === null || value === undefined) {
                return `${context.dataset.label}: Not available`;
              }

              return `${context.dataset.label}: ${value.toLocaleString("en-AU")} incidents`;
            }
          }
        }
      },
      layout: {
        padding: {
          top: 8,
          right: 8,
          bottom: 0,
          left: 4
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: "#7b7890",
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: "Year",
            color: "#5f5b75",
            font: {
              size: 12,
              weight: "600"
            },
            padding: {
              top: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          max: yAxisMax,
          grid: {
            color: "rgba(115, 92, 255, 0.10)",
            drawBorder: false
          },
          ticks: {
            color: "#7b7890",
            font: {
              size: 12
            },
            padding: 8,
            precision: 0,
            count: 11
          },
          title: {
            display: true,
            text: "Crime count",
            color: "#5f5b75",
            font: {
              size: 12,
              weight: "600"
            },
            padding: {
              bottom: 8
            }
          }
        }
      }
    }
  });
}