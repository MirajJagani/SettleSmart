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
  },
  {
    key: "otherCrimesByYear",
    label: "Other crimes",
    borderColor: "#64748b",
    backgroundColor: "rgba(100, 116, 139, 0.10)"
  }
];

const SAFETY_NEWS_CATEGORIES = {
  violent: {
    label: "Violent crime",
    className: "violent",
    keywords: [
      "assault",
      "robbery",
      "violence",
      "violent",
      "stabbing",
      "attack",
      "harassment",
      "threat",
      "weapon"
    ]
  },

  property: {
    label: "Property crime",
    className: "property",
    keywords: [
      "theft",
      "burglary",
      "break-in",
      "stealing",
      "stolen",
      "car theft",
      "vehicle theft",
      "property damage",
      "vandalism"
    ]
  },

  other: {
    label: "Other safety news",
    className: "other",
    keywords: [
      "police",
      "crime",
      "safety",
      "incident",
      "antisocial",
      "drug",
      "public order",
      "investigation",
      "arrest"
    ]
  }
};

const SAFETY_NEWS_ALL_KEYWORDS = Object.values(SAFETY_NEWS_CATEGORIES)
  .flatMap((category) => category.keywords);

let activeSafetySeries = ["crimeCountByYear"];
let showSafetyTrendPrediction = true;

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
  const riskSummary = getRiskSummary(suburb, safety);
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
            <h3>Community snapshot and support</h3>

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
              <div class="suburb-detail-line">
                <span>Culture fit</span>
                <strong>${cultureScore}/10</strong>
              </div>
              <div class="suburb-detail-line">
                <span>Community strength</span>
                <strong>${community.communityStrength}%</strong>
              </div>
              <div class="suburb-detail-line">
                <span>University access</span>
                <strong>${window.formatChoice(suburb.university)}</strong>
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
            <button class="minimap-filter-btn active" data-amenity="">Default</button>
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

      <section class="info-card suburb-detail-card" id="riskSummarySection">
        <div class="suburb-section-head">
          <h3>Risk Summary</h3>
          <p>Risk summary for ${suburb.suburb}.</p>
        </div>

        <div class="minimap-toggle-row risk-summary-toggle-row">
          <button
            type="button"
            class="minimap-dropdown-btn risk-summary-dropdown-btn"
            id="riskSummaryToggle"
            aria-expanded="false"
            aria-controls="riskSummaryBody"
          >
            <span class="minimap-btn-icon">⚠️</span>
            <span id="riskSummaryBtnLabel">Show risk summary</span>
            <span class="minimap-chevron" id="riskSummaryChevron">▼</span>
          </button>
        </div>

        <div class="risk-summary-body hidden" id="riskSummaryBody">
          <p class="suburb-detail-copy text-dark mb-3">${riskSummary}</p>

          <p class="muted-line mb-2">
            Choose a crime type below to read simple explanations.
          </p>

          <div class="safety-chart-controls mb-3" aria-label="Risk categories">
            <button
              type="button"
              class="safety-chart-toggle risk-category-btn"
              data-risk-category="violent"
            >
              Violent crime
            </button>

            <button
              type="button"
              class="safety-chart-toggle risk-category-btn"
              data-risk-category="property"
            >
              Property crime
            </button>
          </div>

          <div class="risk-subcategory-grid hidden" id="riskSubcategoryGrid"></div>
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

              <div class="safety-chart-controls safety-indicator-controls" id="safetyChartControls" aria-label="Safety chart filters">
                <div class="safety-chart-control-group">
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
                    data-safety-series="propertyCrimesByYear"
                    ${hasSafetySeries(suburb, "propertyCrimesByYear") ? "" : "disabled"}
                  >
                    Property crimes
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
                    data-safety-series="otherCrimesByYear"
                    ${hasSafetySeries(suburb, "otherCrimesByYear") ? "" : "disabled"}
                  >
                    Other crimes
                  </button>
                </div>

                <div class="safety-chart-control-group safety-chart-control-group-right">
                  <button
                    type="button"
                    class="safety-chart-toggle safety-trend-toggle"
                    id="safetyTrendPredictionToggle"
                  >
                    Trend prediction
                  </button>
                </div>
              </div>
              
              <div class="safety-chart-wrap">
                <canvas id="safetyTrendChart"></canvas>
              </div>

              <p class="safety-data-source-note">
                Source: official state crime data, summarised by suburb and year where available.
              </p>
            `
            : `
              <div class="safety-empty-state compact">
              </div>
            `
        }
      </section>

      <section class="info-card suburb-detail-card" id="safetyNewsSection">
        <div class="suburb-section-head">
          <h3>News behind the safety rating</h3>
          <p>
            Real safety-related articles for ${suburb.suburb}.
          </p>
        </div>

        <div class="safety-news-filter-row" id="safetyNewsFilters" aria-label="Safety news categories">
          <button type="button" class="safety-news-filter active" data-news-category="all">
            All
          </button>

          <button type="button" class="safety-news-filter" data-news-category="violent">
            Violent crime
          </button>

          <button type="button" class="safety-news-filter" data-news-category="property">
            Property crime
          </button>

          <button type="button" class="safety-news-filter" data-news-category="other">
            Other safety news
          </button>
        </div>

        <div class="safety-news-list" id="safetyNewsList">
          <p class="safety-news-state">Loading safety news…</p>
        </div>

        <p class="safety-news-disclaimer">
          News articles are provided for reference only. They help users verify the safety context,
          but they do not replace the safety score or official crime data.
        </p>
      </section>

      <section class="info-card suburb-detail-card" id="distanceSection">
        <div class="suburb-section-head">
          <h3>Distance to university</h3>
          <p>Showing distances from ${suburb.suburb} to each campus of ${preferences.university}.</p>
        </div>
        <div id="distanceResult">
          <p style="color:var(--text-soft); font-size:0.9rem;">Calculating distance…</p>
        </div>
      </section>

    </div>
  `;

  initMiniMap(suburb.suburb, suburb.city);
  setupRiskSummaryToggle(suburb, safety);
  requestAnimationFrame(() => {
    setupSafetyChartControls(suburb);
    renderSafetyTrendChart(suburb);
    renderSafetyNewsSection(suburb);
    renderDistanceSection(suburb, preferences);
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
let minimapBounds = null;       // L.LatLngBounds of the suburb polygon, or null
let minimapRadius = 1500;       // POI search radius in metres, derived from polygon size
let activeAmenity = null;       // null = no POI layer; string = category key
let minimapPoiAbortCtrl = null; // AbortController for in-flight POI requests

function initMiniMap(suburbName, cityName) {
  const toggleBtn = document.getElementById("minimapToggleBtn");
  const body      = document.getElementById("minimapBody");
  const chevron   = document.getElementById("minimapChevron");
  const label     = document.getElementById("minimapBtnLabel");

  if (!toggleBtn) return;

  // ── Toggle map open/close ──────────────────────────────────────────
  toggleBtn.addEventListener("click", async () => {
    const isOpen = !body.classList.contains("hidden");
    if (isOpen) {
      body.classList.add("hidden");
      chevron.textContent = "▼";
      label.textContent = "Show map & filter facilities";
      toggleBtn.setAttribute("aria-expanded", "false");
      return;
    }

    body.classList.remove("hidden");
    chevron.textContent = "▲";
    label.textContent = "Hide map";
    toggleBtn.setAttribute("aria-expanded", "true");

    // Ensure the frame has a visible height before Leaflet initialises
    const frame = document.getElementById("minimapFrame");
    if (frame) {
      frame.style.height = "380px";
      frame.style.minHeight = "380px";
      frame.style.display = "block";
    }

    if (!minimapMap) {
      // First open: load Leaflet and build the map (boundary only, no POI)
      await loadLeaflet();
      await buildMap(suburbName, cityName);
    } else {
      setTimeout(() => minimapMap.invalidateSize(), 50);
    }
  });

  // ── Filter button clicks ───────────────────────────────────────────
  // Default state: no button is active; map shows boundary only.
  // Clicking a button loads that category; clicking the active button again clears it.
  document.getElementById("minimapFilters").addEventListener("click", (e) => {
    const btn = e.target.closest(".minimap-filter-btn");
    if (!btn) return;

    const clicked = btn.dataset.amenity || "";

    document.querySelectorAll(".minimap-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeAmenity = clicked || null;

    if (!activeAmenity) {
      // Default — clear all POI markers
      if (minimapPoiAbortCtrl) minimapPoiAbortCtrl.abort();
      clearMinimapMarkers();
      return;
    }

    if (minimapMap && minimapCenter) {
      fetchAndRenderPOI(activeAmenity, minimapCenter);
    }
  });
}

function clearMinimapMarkers() {
  minimapMarkers.forEach(m => { try { m.remove(); } catch {} });
  minimapMarkers = [];
}

let leafletLoadPromise = null;

function loadLeaflet() {
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }

    // Load CSS once
    if (!document.getElementById("leaflet-css")) {
      const css = document.createElement("link");
      css.id = "leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
    script.onerror = () => {
      leafletLoadPromise = null; // Allow retry on next open
      reject(new Error("Leaflet failed to load"));
    };
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

/* ─── Suburb center lookup ───────────────────────────────────────── */

// Hard-coded center coords for suburbs that Nominatim misresolves
const ABS_FIXED_COORDS = {
  "Melbourne CBD - East":  { lat: -37.8136, lon: 144.9631, zoom: 14 },
  "Melbourne CBD - North": { lat: -37.8080, lon: 144.9631, zoom: 14 },
  "Melbourne CBD - West":  { lat: -37.8143, lon: 144.9531, zoom: 14 },
  "Brisbane City":         { lat: -27.4698, lon: 153.0251, zoom: 14 },
};

// ABS compound names → preferred OSM search name
const ABS_NAME_MAP = {
  "Carlton North - Princes Hill":   "Carlton North",
  "Richmond (South) - Cremorne":    "Cremorne",
  "Richmond - North":               "Richmond",
  "South Yarra - North":            "South Yarra",
  "South Yarra - South":            "South Yarra",
  "South Yarra - West":             "South Yarra",
  "St Kilda - Central":             "St Kilda",
  "St Kilda - West":                "St Kilda West",
  "Brunswick - North":              "Brunswick",
  "Brunswick - South":              "Brunswick",
  "West Melbourne - Industrial":    "West Melbourne",
  "West Melbourne - Residential":   "West Melbourne",
  "Donvale - Park Orchards":        "Donvale",
  "Sydney (North) - Millers Point": "Millers Point",
  "Sydney (South) - Haymarket":     "Haymarket",
  "Perth (North) - Highgate":       "Highgate",
  "Perth (West) - Northbridge":     "Northbridge",
  "Perth - Evandale":               "Evandale",
  "Brisbane Port - Lytton":         "Lytton",
  "Prahran - Windsor":              "Prahran",
  "North Sydney - Lavender Bay":    "Lavender Bay",
  "South Perth - Kensington":       "South Perth",
};

// City bounding boxes — keeps Nominatim results inside the correct city
const CITY_BBOX = {
  melbourne: [-38.5, 144.3, -37.3, 146.0],
  sydney:    [-34.3, 150.3, -33.2, 151.6],
  brisbane:  [-28.0, 152.5, -26.8, 153.7],
  adelaide:  [-35.4, 138.2, -34.4, 139.2],
  perth:     [-32.7, 115.4, -31.3, 116.5],
  canberra:  [-35.7, 148.8, -35.0, 149.5],
};

function getCityKey(cityName) {
  return String(cityName || "").trim().toLowerCase().replace(/\s+/g, "");
}

// Returns a prioritised list of name strings to try in Nominatim
function getOSMSearchCandidates(suburbName) {
  const preferred = suburbName in ABS_NAME_MAP ? ABS_NAME_MAP[suburbName] : null;
  const cleaned   = String(suburbName || "").replace(/\s*\([^)]*\)/g, "").trim();
  const parts     = cleaned.split(/\s*-\s*/).map(p => p.trim()).filter(Boolean);
  return [...new Set([preferred, cleaned, parts[0], parts[1]].filter(Boolean))];
}

// Nominatim center-point lookup — only needs lat/lon, no polygon
async function nominatimSuburbLookup(searchCandidates, cityName) {
  const bbox = CITY_BBOX[getCityKey(cityName)];
  if (!bbox) return null;

  const [south, west, north, east] = bbox;
  let bestMatch = null;
  let bestScore = -Infinity;

  for (const candidate of searchCandidates) {
    const params = new URLSearchParams({
      q: `${candidate}, ${cityName}, Australia`,
      format: "json",
      limit: "5",
      addressdetails: "1",       // no polygon_geojson — we don't need it anymore
      "accept-language": "en",
      viewbox: `${west},${north},${east},${south}`,
      bounded: "1",
    });

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;

      const results = await res.json();
      const inCity = results.filter(r => {
        const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
        return lat >= south && lat <= north && lon >= west && lon <= east;
      });

      for (const r of inCity) {
        // Simple scoring: prefer place/suburb over road/building
        let score = 0;
        if (r.type === "suburb" || r.type === "neighbourhood") score += 100;
        if (r.class === "place") score += 50;
        if (r.class === "boundary") score += 40;
        const rank = parseInt(r.place_rank || 30, 10);
        if (rank >= 18 && rank <= 24) score += 30;
        if (score > bestScore) { bestScore = score; bestMatch = r; }
      }

      // First candidate that returns a usable result wins — no need to try all
      if (bestMatch) break;
    } catch {
      // try next candidate
    }

    // Respect Nominatim 1 req/s rate limit between candidates
    await new Promise(r => setTimeout(r, 1100));
  }

  if (!bestMatch) return null;
  return { lat: parseFloat(bestMatch.lat), lon: parseFloat(bestMatch.lon) };
}


async function buildMap(suburbName, cityName) {
  const frame = document.getElementById("minimapFrame");

  try {
    if (minimapMap) {
      try { minimapMap.remove(); } catch {}
      minimapMap = null;
      minimapMarkers = [];
      minimapCenter = null;
      minimapBounds = null;
      minimapRadius = 1500;
    }

    // Try fixed coords first (CBD suburbs etc.)
    const fixed = ABS_FIXED_COORDS[suburbName];
    if (fixed) {
      minimapCenter = [fixed.lat, fixed.lon];
      renderMap(frame, minimapCenter, fixed.zoom || 14);
      return;
    }

    // Only need the center point — no polygon boundary lookup
    const candidates = getOSMSearchCandidates(suburbName);
    if (!candidates.length) {
      frame.innerHTML = `<div class="minimap-error">Could not locate ${suburbName} on the map.</div>`;
      return;
    }

    const locationData = await nominatimSuburbLookup(candidates, cityName);

    if (!locationData) {
      frame.innerHTML = `<div class="minimap-error">Could not locate ${suburbName} on the map.</div>`;
      return;
    }

    minimapCenter = [locationData.lat, locationData.lon];
    renderMap(frame, minimapCenter, 14);
  } catch (err) {
    frame.innerHTML = `<div class="minimap-error">Map failed to load. Please check your connection.</div>`;
    console.error("MiniMap error:", err);
  }
}

function renderMap(frame, center, defaultZoom) {
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
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(minimapMap);

  // Always render a 3km circle around the suburb center — no polygon boundary lookup needed.
  minimapBounds = null;
  minimapRadius = 1500;
  L.circle(center, {
    radius: 1500,
    color: "#735cff",
    weight: 1.5,
    dashArray: "6 4",
    fillColor: "#735cff",
    fillOpacity: 0.04,
    interactive: false,
  }).addTo(minimapMap);
  minimapMap.setView(center, defaultZoom);

  // Map opens with boundary only; POI loads on filter button click.
  // Fire invalidateSize at multiple intervals to ensure tiles render correctly
  // after the container transitions from hidden to visible.
  setTimeout(() => minimapMap.invalidateSize(), 100);
  setTimeout(() => minimapMap.invalidateSize(), 400);
  setTimeout(() => minimapMap.invalidateSize(), 800);
}

// ── POI category config ──────────────────────────────────────────────────────
// POI category config: maps each category to its Nominatim tags, emoji, and display label
const POI_CATEGORIES = {
  restaurant:  { tags: ["amenity=restaurant", "amenity=cafe", "amenity=fast_food"],  emoji: "🍜", label: "Restaurant/Café", limit: 60 },
  supermarket: { tags: ["shop=supermarket", "shop=convenience"],                      emoji: "🛒", label: "Grocery",          limit: 40 },
  hospital:    { tags: ["amenity=hospital"],                                           emoji: "🏥", label: "Hospital",         limit: 20, radius: 5000 },
  doctors:     { tags: ["amenity=doctors", "amenity=clinic"],                          emoji: "👨‍⚕️", label: "GP/Clinic",        limit: 30, radius: 3000 },
  park:        { tags: ["leisure=park", "leisure=garden"],                             emoji: "🌳", label: "Park",            limit: 30 },
  bus_station: { tags: ["highway=bus_stop", "railway=station", "railway=tram_stop"],   emoji: "🚌", label: "Transport",       limit: 50 },
};

// ── Overpass QL builder ──────────────────────────────────────────────────────
function buildOverpassQuery(amenity, lat, lon) {
  const cat = POI_CATEGORIES[amenity];
  if (!cat) return null;

  const radius = cat.radius || minimapRadius || 1500;
  const parts = cat.tags.map(tag => {
    const [k, v] = tag.split("=");
    return `node["${k}"="${v}"](around:${radius},${lat},${lon});way["${k}"="${v}"](around:${radius},${lat},${lon});`;
  });
  // Use per-category limit if defined, otherwise return all results in the radius
  const cap = cat.limit ? ` ${cat.limit}` : "";
  return `[out:json][timeout:30];(${parts.join("")});out center${cap};`;
}

// ── fetch helpers ─────────────────────────────────────────────────────────────
async function tryOverpassDirect(query, signal) {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const url of endpoints) {
    if (signal?.aborted) return null;
    // Combine user abort with a per-request timeout so both are enforced
    const timeout = AbortSignal.timeout(5000);
    const combined = signal
      ? AbortSignal.any([signal, timeout])
      : timeout;
    try {
      const res = await fetch(url, {
        method: "POST", body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: combined,
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.elements?.length) return data.elements;
    } catch (err) {
      if (err.name === "AbortError" && signal?.aborted) throw err;
      /* timeout or network error — try next endpoint */
    }
  }
  return null;
}

async function tryOverpassViaProxy(query, signal) {
  const encoded = encodeURIComponent("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query));
  const proxies = [
    { url: `https://corsproxy.io/?url=${encoded}`,      wrap: false },
    { url: `https://api.allorigins.win/get?url=${encoded}`, wrap: true  },
  ];
  for (const proxy of proxies) {
    if (signal?.aborted) return null;
    const timeout = AbortSignal.timeout(5000);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const res = await fetch(proxy.url, { signal: combined });
      if (!res.ok) continue;
      const raw = proxy.wrap ? JSON.parse((await res.json()).contents) : await res.json();
      if (raw.elements?.length) return raw.elements;
    } catch (err) {
      if (err.name === "AbortError" && signal?.aborted) throw err;
      /* timeout or network error — try next proxy */
    }
  }
  return null;
}

// Nominatim nearby search — last resort, no Overpass needed.
// Nominatim /search only accepts a handful of tag parameters directly (amenity=,
// highway=, etc.).  Tags like shop=supermarket or leisure=park are silently
// ignored, so we map those to a free-text q= query instead.
const NOMINATIM_TAG_FALLBACK = {
  "shop=supermarket": { q: "supermarket" },
  "shop=convenience": { q: "convenience store" },
  "leisure=park":     { q: "park" },
  "leisure=garden":   { q: "garden" },
};

async function tryNominatimNearby(amenity, lat, lon, signal) {
  const cat = POI_CATEGORIES[amenity];
  if (!cat) return null;

  const delta = (cat.radius || minimapRadius || 1500) / 111000;
  const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;

  const allResults = [];
  for (const tag of cat.tags.slice(0, 2)) {
    if (signal?.aborted) break;
    const [k, v] = tag.split("=");

    // Build search params: use q= for tags Nominatim doesn't support natively
    const override = NOMINATIM_TAG_FALLBACK[tag];
    const params = override
      ? new URLSearchParams({
          format: "json", limit: "50",
          viewbox, bounded: "1",
          q: override.q,
          "accept-language": "en",
        })
      : new URLSearchParams({
          format: "json", limit: "50",
          viewbox, bounded: "1",
          [k]: v,
          "accept-language": "en",
        });

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "en" },
        signal: signal ?? AbortSignal.timeout(5000),
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
      // Respect Nominatim 1 req/s rate limit
      await new Promise(r => setTimeout(r, 1100));
    } catch (err) {
      if (err.name === "AbortError") throw err;
      /* try next tag */
    }
  }
  return allResults.length ? allResults : null;
}

// ── main render functions ────────────────────────────────────────────────────

// Renders markers for a single POI category.
// Cancels any in-flight request before starting a new one (debounce via AbortController).
async function fetchAndRenderPOI(amenity, center) {
  // Cancel previous in-flight request
  if (minimapPoiAbortCtrl) minimapPoiAbortCtrl.abort();
  minimapPoiAbortCtrl = new AbortController();
  const signal = minimapPoiAbortCtrl.signal;

  clearMinimapMarkers();

  if (!amenity) return;
  const cat = POI_CATEGORIES[amenity];
  if (!cat) return;

  const loadingBtn = document.querySelector(".minimap-filter-btn.active");
  let originalHTML = "";
  if (loadingBtn) {
    originalHTML = loadingBtn.innerHTML;
    loadingBtn.disabled = true;
    loadingBtn.innerHTML = originalHTML + " ⏳";
  }

  const [lat, lon] = center;
  const query = buildOverpassQuery(amenity, lat, lon);

  // Use a sentinel to distinguish "all sources had network errors" from
  // "sources responded but found no POI in this area" (which is valid).
  const NETWORK_ERROR = Symbol("network_error");
  let elements = null;
  let allNetworkErrors = false;

  try {
    const sources = [];

    if (query) {
      sources.push(
        tryOverpassDirect(query, signal).then(r => {
          if (r === null) throw NETWORK_ERROR;   // null = request failed
          return r ?? [];                        // empty array = no POI found
        })
      );
      sources.push(
        tryOverpassViaProxy(query, signal).then(r => {
          if (r === null) throw NETWORK_ERROR;
          return r ?? [];
        })
      );
    }

    sources.push(
      tryNominatimNearby(amenity, lat, lon, signal).then(r => {
        if (r === null) throw NETWORK_ERROR;
        return (r ?? []).map(item => ({ lat: item.lat, lon: item.lon, tags: { name: item.name } }));
      })
    );

    elements = await Promise.any(sources);
  } catch (err) {
    if (err.name === "AbortError") return; // user switched filter
    if (err.name === "AggregateError") {
      // Check if every source threw NETWORK_ERROR vs simply returned no results
      allNetworkErrors = err.errors?.every(e => e === NETWORK_ERROR) ?? true;
      elements = [];
    }
  }

  if (signal.aborted) return;

  // Render markers
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
  } else {
    // Show different message depending on whether it was a network failure or genuinely no data
    const frame = document.getElementById("minimapFrame");
    if (frame) {
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(255,255,255,0.95);border-radius:8px;padding:7px 16px;font-size:0.82rem;color:#665f85;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.1);white-space:nowrap;";
      msg.textContent = `No ${cat.label} found nearby`;
      frame.style.position = "relative";
      frame.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
    }
  }

  if (loadingBtn && loadingBtn.classList.contains("active")) {
    loadingBtn.disabled = false;
    loadingBtn.innerHTML = originalHTML;
  } else if (loadingBtn) {
    loadingBtn.disabled = false;
  }
}

/* -------- Risk Summary (US 6.2) ------------------ */

function getRiskLevel(safety) {
  if (!safety || !safety.hasData || safety.latestCrimeRateLabel === "Not available") {
    return "unknown";
  }

  const crimeRate = Number(safety.latestCrimeRateLabel);

  if (Number.isNaN(crimeRate)) {
    return "unknown";
  }

  if (crimeRate < 80) {
    return "low";
  }

  if (crimeRate < 160) {
    return "moderate";
  }

  return "high";
}

function getRiskSummary(suburb, safety) {
  const riskLevel = getRiskLevel(safety);

  if (riskLevel === "unknown") {
    return `${suburb.suburb} does not have enough safety data available yet. Students should compare nearby suburbs and check local conditions before deciding.`;
  }

  const trend = String(safety.trendLabel || "").toLowerCase();

  let trendSentence = "The recent trend is relatively stable.";

  if (trend === "increasing") {
    trendSentence = "Crime has increased recently, so students should be more careful when comparing this suburb.";
  }

  if (trend === "decreasing") {
    trendSentence = "Crime has decreased recently, which may suggest improving safety conditions.";
  }

  if (riskLevel === "low") {
    return `${suburb.suburb} appears to have a relatively low safety risk based on the latest available crime rate. ${trendSentence}`;
  }

  if (riskLevel === "moderate") {
    return `${suburb.suburb} has a moderate safety risk. It may still be suitable, but students should stay aware of their surroundings, especially at night. ${trendSentence}`;
  }

  return `${suburb.suburb} has a higher safety risk compared with lower-crime suburbs. Students should consider transport access, well-lit areas, and night-time safety before choosing housing. ${trendSentence}`;
}

function getRiskSubcategories(category) {
  const categories = {
    violent: [
      {
        title: "Assault",
        explanation: "Assault means a person is physically harmed or threatened by another person."
      },
      {
        title: "Robbery",
        explanation: "Robbery means property is taken from a person using force or threat."
      },
      {
        title: "Family violence",
        explanation: "Family violence means harmful, controlling, or threatening behaviour within a family or close relationship."
      },
      {
        title: "Harassment",
        explanation: "Harassment means unwanted behaviour that makes a person feel unsafe, distressed, or uncomfortable."
      }
    ],

    property: [
      {
        title: "Theft",
        explanation: "Theft means someone takes belongings without permission and without using force."
      },
      {
        title: "Burglary",
        explanation: "Burglary means someone enters a home, shop, or building illegally to steal or cause damage."
      },
      {
        title: "Motor vehicle theft",
        explanation: "Motor vehicle theft means a car, motorcycle, bicycle, or other vehicle is stolen."
      },
      {
        title: "Property damage",
        explanation: "Property damage means homes, vehicles, shops, or public spaces are damaged."
      }
    ]
  };

  return categories[category] || [];
}

function renderRiskSubcategoryCards(category) {
  const grid = document.getElementById("riskSubcategoryGrid");

  if (!grid) {
    return;
  }

  const subcategories = getRiskSubcategories(category);

  if (!subcategories.length) {
    grid.classList.add("hidden");
    grid.innerHTML = "";
    return;
  }

  grid.classList.remove("hidden");

  grid.innerHTML = subcategories.map((item) => `
    <article class="suburb-detail-line risk-subcategory-card">
      <span>${item.title}</span>
      <strong class="risk-subcategory-explanation">${item.explanation}</strong>
    </article>
  `).join("");
}

function setupRiskSummaryToggle(suburb, safety) {
  const toggle = document.getElementById("riskSummaryToggle");
  const body = document.getElementById("riskSummaryBody");
  const label = document.getElementById("riskSummaryBtnLabel");
  const chevron = document.getElementById("riskSummaryChevron");
  const categoryButtons = document.querySelectorAll(".risk-category-btn");
  const subcategoryGrid = document.getElementById("riskSubcategoryGrid");

  if (!toggle || !body) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isHidden = body.classList.contains("hidden");

    body.classList.toggle("hidden", !isHidden);
    toggle.setAttribute("aria-expanded", String(isHidden));

    if (label) {
      label.textContent = isHidden ? "Hide risk summary" : "Show risk summary";
    }

    if (chevron) {
      chevron.textContent = isHidden ? "▲" : "▼";
    }

    if (!isHidden) {
      categoryButtons.forEach((btn) => btn.classList.remove("active"));

      if (subcategoryGrid) {
        subcategoryGrid.classList.add("hidden");
        subcategoryGrid.innerHTML = "";
      }
    }
  });

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      renderRiskSubcategoryCards(button.dataset.riskCategory);
    });
  });

  if (subcategoryGrid) {
    subcategoryGrid.classList.add("hidden");
  }
}

/* -------- Safety Indicator (US 6.1) ------------------ */

function isValidCrimeValue(value) {
  return value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value));
}

function getCrimeCountByYear(suburb) {
  const violentSeries = suburb.violentCrimesByYear || {};
  const propertySeries = suburb.propertyCrimesByYear || {};
  const otherSeries = suburb.otherCrimesByYear || {};

  const years = [
    ...new Set([
      ...Object.keys(violentSeries),
      ...Object.keys(propertySeries),
      ...Object.keys(otherSeries)
    ])
  ].sort((a, b) => Number(a) - Number(b));

  const totalSeries = {};

  years.forEach((year) => {
    const violent = isValidCrimeValue(violentSeries[year])
      ? Number(violentSeries[year])
      : 0;

    const property = isValidCrimeValue(propertySeries[year])
      ? Number(propertySeries[year])
      : 0;

    const other = isValidCrimeValue(otherSeries[year])
      ? Number(otherSeries[year])
      : 0;

    totalSeries[year] = violent + property + other;
  });

  return totalSeries;
}

function getSafetySeries(suburb, seriesKey) {
  if (seriesKey === "crimeCountByYear") {
    return getCrimeCountByYear(suburb);
  }

  return suburb[seriesKey] || {};
}

function hasSafetySeries(suburb, seriesKey) {
  const series = getSafetySeries(suburb, seriesKey);

  return Object.values(series).some((value) => isValidCrimeValue(value));
}

function setupSafetyChartControls(suburb) {
  const controls = document.getElementById("safetyChartControls");
  const trendToggle = document.getElementById("safetyTrendPredictionToggle");

  if (!controls) {
    return;
  }

  function syncSafetyChartButtons() {
    controls.querySelectorAll("[data-safety-series]").forEach((btn) => {
      btn.classList.toggle(
        "active",
        activeSafetySeries[0] === btn.dataset.safetySeries
      );
    });

    if (trendToggle) {
      trendToggle.classList.toggle("active", showSafetyTrendPrediction);
    }
  }

  syncSafetyChartButtons();

  controls.addEventListener("click", (event) => {
    const trendButton = event.target.closest("#safetyTrendPredictionToggle");

    if (trendButton) {
      showSafetyTrendPrediction = !showSafetyTrendPrediction;
      syncSafetyChartButtons();
      renderSafetyTrendChart(suburb);
      return;
    }

    const button = event.target.closest("[data-safety-series]");

    if (!button || button.disabled) {
      return;
    }

    const selectedKey = button.dataset.safetySeries;

    activeSafetySeries = [selectedKey];

    syncSafetyChartButtons();
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
  const crimeCountByYear = getCrimeCountByYear(suburb);

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

  const trendValues = years.map((year) => {
    return Number(crimeCountByYear[year]);
  });

  const trendLabel = getRidgeTrendLabelFromSeries(years, trendValues, 5, 1);
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

/*
// Prediction with linear regression
function fitLinearTrendFromRecentYears(years, values, recentCount = 5) {
  const validPoints = years
    .map((year, index) => ({
      year: Number(year),
      value: values[index]
    }))
    .filter((point) => {
      return (
        Number.isFinite(point.year) &&
        point.value !== null &&
        point.value !== undefined &&
        Number.isFinite(Number(point.value))
      );
    })
    .slice(-recentCount);

  if (validPoints.length < 2) {
    return null;
  }

  const n = validPoints.length;

  const xValues = validPoints.map((point) => point.year);
  const yValues = validPoints.map((point) => Number(point.value));

  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const lastYear = Math.max(...xValues);
  const nextYear = lastYear + 1;

  const predict = (year) => {
    return Math.max(Math.round(slope * year + intercept), 0);
  };

  return {
    slope,
    intercept,
    fittedYears: xValues.map(String),
    fittedValues: xValues.map((year) => predict(year)),
    nextYear: String(nextYear),
    predictedNextValue: predict(nextYear)
  };
}
*/

// Prediction with Ridge Regression
function fitRidgeTrendFromRecentYears(years, values, recentCount = 5, lambda = 1) {
  const validPoints = years
    .map((year, index) => ({
      year: Number(year),
      value: values[index]
    }))
    .filter((point) => {
      return (
        Number.isFinite(point.year) &&
        point.value !== null &&
        point.value !== undefined &&
        Number.isFinite(Number(point.value))
      );
    })
    .slice(-recentCount);

  if (validPoints.length < 2) {
    return null;
  }

  const n = validPoints.length;

  const xValues = validPoints.map((point) => point.year);
  const yValues = validPoints.map((point) => Number(point.value));

  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  // Center x and y values.
  // This keeps the calculation stable because years like 2021, 2022, 2023 are large numbers.
  const centeredX = xValues.map((x) => x - xMean);
  const centeredY = yValues.map((y) => y - yMean);

  const numerator = centeredX.reduce((sum, x, index) => {
    return sum + x * centeredY[index];
  }, 0);

  const denominator = centeredX.reduce((sum, x) => {
    return sum + x ** 2;
  }, 0) + lambda;

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const lastYear = Math.max(...xValues);
  const nextYear = lastYear + 1;

  const predict = (year) => {
    return Math.max(Math.round(slope * year + intercept), 0);
  };

  return {
    slope,
    intercept,
    fittedYears: xValues.map(String),
    fittedValues: xValues.map((year) => predict(year)),
    nextYear: String(nextYear),
    predictedNextValue: predict(nextYear),
    modelName: "Ridge Regression"
  };
}

function getRidgeTrendLabelFromSeries(years, values, recentCount = 5, lambda = 1) {
  const trend = fitRidgeTrendFromRecentYears(years, values, recentCount, lambda);

  if (!trend) {
    return "Not enough data";
  }

  const fittedValues = trend.fittedValues || [];

  if (fittedValues.length < 2) {
    return "Not enough data";
  }

  const firstFittedValue = Number(fittedValues[0]);
  const lastFittedValue = Number(fittedValues[fittedValues.length - 1]);

  const average = fittedValues.reduce((sum, value) => {
    return sum + Number(value);
  }, 0) / fittedValues.length;

  const change = lastFittedValue - firstFittedValue;
  const relativeChange = average ? Math.abs(change) / average : 0;

  if (relativeChange < 0.07) {
    return "Stable";
  }

  return change > 0 ? "Increasing" : "Decreasing";
}

function buildTrendDataset(dataset, labels) {
  // const trend = fitLinearTrendFromRecentYears(labels, dataset.values, 5);
  const trend = fitRidgeTrendFromRecentYears(labels, dataset.values, 5, 1);
  if (!trend) {
    return null;
  }

  const trendLabels = [...labels, trend.nextYear];

  const trendValues = trendLabels.map((year) => {
    if (trend.fittedYears.includes(year)) {
      const index = trend.fittedYears.indexOf(year);
      return trend.fittedValues[index];
    }

    if (year === trend.nextYear) {
      return trend.predictedNextValue;
    }

    return null;
  });

  return {
    label: `${dataset.label} trend`,
    data: trendValues,
    borderColor: dataset.borderColor,
    backgroundColor: dataset.backgroundColor,
    borderWidth: 2,
    borderDash: [6, 6],
    tension: 0,
    fill: false,
    spanGaps: true,
    pointRadius: trendValues.map((value, index) => {
      const year = trendLabels[index];
      return year === trend.nextYear && value !== null ? 5 : 0;
    }),
    pointHoverRadius: 6,
    pointBackgroundColor: dataset.borderColor,
    pointBorderColor: "#ffffff",
    pointBorderWidth: 2,
    isTrendDataset: true,
    predictedYear: trend.nextYear
  };
}

function getSafetyChartData(suburb) {
  const selectedOptions = SAFETY_SERIES_OPTIONS.filter((option) => {
    const isTotalMode = activeSafetySeries.includes("crimeCountByYear");

    if (isTotalMode) {
      return hasSafetySeries(suburb, option.key);
    }

    return activeSafetySeries.includes(option.key) && hasSafetySeries(suburb, option.key);
  });

  if (!selectedOptions.length) {
    return null;
  }

  const years = [
    ...new Set(
      selectedOptions.flatMap((option) => {
        const series = getSafetySeries(suburb, option.key);

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
    const series = getSafetySeries(suburb, option.key);

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

  const latestYear = Math.max(...years.map((year) => Number(year)));
  const nextPredictionYear = String(latestYear + 1);

  return {
    labels: showSafetyTrendPrediction ? [...years, nextPredictionYear] : years,
    originalLabels: years,
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
      crimeCountByYear: getCrimeCountByYear(suburb),
      violentCrimesByYear: suburb.violentCrimesByYear,
      propertyCrimesByYear: suburb.propertyCrimesByYear,
      otherCrimesByYear: suburb.otherCrimesByYear
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

    if (seriesKey === "otherCrimesByYear") {
      gradient.addColorStop(0, "rgba(100, 116, 139, 0.22)");
      gradient.addColorStop(1, "rgba(100, 116, 139, 0.02)");
      return gradient;
    }

    gradient.addColorStop(0, "rgba(115, 92, 255, 0.22)");
    gradient.addColorStop(1, "rgba(115, 92, 255, 0.02)");
    return gradient;
  }

  let predictionMaxValue = chartData.maxValue;

  if (showSafetyTrendPrediction) {
    chartData.datasets.forEach((dataset) => {
      // const trend = fitLinearTrendFromRecentYears(chartData.originalLabels, dataset.values, 5);
      const trend = fitRidgeTrendFromRecentYears(chartData.originalLabels, dataset.values, 5, 1);

      if (trend) {
        predictionMaxValue = Math.max(predictionMaxValue, trend.predictedNextValue);
      }
    });
  }

  const yAxisMax = getNiceSafetyAxisMax(predictionMaxValue);

  safetyTrendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets.flatMap((dataset) => {
        const isTotalCrime = dataset.key === "crimeCountByYear";

        const actualDataset = {
          label: dataset.label,
          data: showSafetyTrendPrediction
            ? [...dataset.values, null]
            : dataset.values,
          borderColor: dataset.borderColor,
          backgroundColor: createSafetyGradient(dataset.key),
          borderWidth: isTotalCrime ? 3 : 2.5,
          tension: 0.35,
          fill: true,
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

        if (!showSafetyTrendPrediction) {
          return [actualDataset];
        }

        const trendDataset = buildTrendDataset(dataset, chartData.originalLabels);

        return trendDataset
          ? [actualDataset, trendDataset]
          : [actualDataset];
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

          filter: function(context) {
            const year = String(context.label);

            // Only show trend tooltip for the predicted year
            if (context.dataset.isTrendDataset) {
              return year === context.dataset.predictedYear;
            }

            return true;
          },

          callbacks: {
            title: function(items) {
              return `Year ${items[0].label}`;
            },
            label: function(context) {
              const value = context.parsed.y;

              if (value === null || value === undefined) {
                return `${context.dataset.label}: Not available`;
              }

              const year = String(context.label);
              const isPrediction =
                context.dataset.isTrendDataset &&
                year === context.dataset.predictedYear;

              if (isPrediction) {
                return `${context.dataset.label}: estimated ${value.toLocaleString("en-AU")} incidents`;
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

/* -------- Safety News (Epic 8) ------------------ */

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSafetyNewsCategory(article) {
  if (article.category && SAFETY_NEWS_CATEGORIES[article.category]) {
    return article.category;
  }

  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (SAFETY_NEWS_CATEGORIES.violent.keywords.some((word) => text.includes(word))) {
    return "violent";
  }

  if (SAFETY_NEWS_CATEGORIES.property.keywords.some((word) => text.includes(word))) {
    return "property";
  }

  return "other";
}

function formatSafetyNewsDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

async function fetchSafetyNewsArticles(suburb) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/suburb-news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      suburbSlug: suburb.slug,
      suburbName: suburb.suburb,
      city: suburb.city,
      state: suburb.state || ""
    })
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Safety news request failed:", response.status, text);
    throw new Error("Failed to fetch safety news.");
  }

  const data = JSON.parse(text);
  return Array.isArray(data.articles) ? data.articles : [];
}

function renderSafetyNewsCards(articles, selectedCategory = "all") {
  const list = document.getElementById("safetyNewsList");

  if (!list) return;

  const visibleArticles = selectedCategory === "all"
    ? articles
    : articles.filter((article) => getSafetyNewsCategory(article) === selectedCategory);

  if (!visibleArticles.length) {
    list.innerHTML = `
      <p class="safety-news-state">
        No recent safety-related articles found for this category.
      </p>
    `;
    return;
  }

  list.innerHTML = visibleArticles.map((article) => {
    const category = getSafetyNewsCategory(article);
    const categoryMeta = SAFETY_NEWS_CATEGORIES[category] || SAFETY_NEWS_CATEGORIES.other;

    return `
      <article class="safety-news-card">
        <div class="safety-news-card-top">
          <span class="safety-news-category safety-news-category--${categoryMeta.className}">
            ${categoryMeta.label}
          </span>

          <span class="safety-news-date">
            ${formatSafetyNewsDate(article.publishedAt)}
          </span>
        </div>

        <h4>${escapeHTML(article.title || "Untitled article")}</h4>

        <p class="safety-news-meta">
          ${escapeHTML(article.source || "Unknown source")}
        </p>

        <p class="safety-news-description">
          ${escapeHTML(article.description || "No summary available.")}
        </p>

        ${
          article.url
            ? `
              <a
                class="safety-news-link"
                href="${escapeHTML(article.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read original article
              </a>
            `
            : ""
        }
      </article>
    `;
  }).join("");
}

async function renderSafetyNewsSection(suburb) {
  const list = document.getElementById("safetyNewsList");
  const filters = document.getElementById("safetyNewsFilters");

  if (!list || !filters) return;

  list.innerHTML = `<p class="safety-news-state">Loading safety news…</p>`;

  try {
    const articles = await fetchSafetyNewsArticles(suburb);

    if (!articles.length) {
      list.innerHTML = `
        <p class="safety-news-state">
          No recent safety-related articles found for ${escapeHTML(suburb.suburb)}.
        </p>
      `;
      return;
    }

    renderSafetyNewsCards(articles, "all");

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-news-category]");

      if (!button) return;

      const category = button.dataset.newsCategory;

      filters.querySelectorAll("[data-news-category]").forEach((btn) => {
        btn.classList.toggle("active", btn === button);
      });

      renderSafetyNewsCards(articles, category);
    });
  } catch (error) {
    console.error("Safety news error:", error);

    list.innerHTML = `
      <p class="safety-news-state safety-news-state--error">
        Unable to load safety news right now.
      </p>
    `;
  }
}

// ── Distance to University (Supabase + Nominatim + Haversine) ────────────────

const SUPABASE_URL = "https://tvntdokwhckdhdzojmzb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OilvFk1wyG2AzJcm_q-KBg_dmFhloU9";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getSuburbCoords(suburbName, city) {
  const query = encodeURIComponent(`${suburbName}, ${city}, Australia`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { "Accept-Language": "en", "User-Agent": "SettleSmart/1.0" } }
  );
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function getUniversityCampuses(universityName) {
  const encoded = encodeURIComponent(universityName);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/University?university_name=eq.${encoded}&select=campus_name,lat,lng`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  return await res.json();
}

async function renderDistanceSection(suburb, preferences) {
  const el = document.getElementById("distanceResult");
  if (!el) return;

  const uniName = preferences.university;
  if (!uniName) {
    el.innerHTML = `<p style="color:var(--text-soft);font-size:0.9rem;">No university selected.</p>`;
    return;
  }

  try {
    const [suburbCoords, campuses] = await Promise.all([
      getSuburbCoords(suburb.suburb, suburb.city),
      getUniversityCampuses(uniName)
    ]);

    if (!suburbCoords) {
      el.innerHTML = `<p style="color:var(--text-soft);font-size:0.9rem;">Could not locate ${suburb.suburb}.</p>`;
      return;
    }

    if (!campuses || !campuses.length) {
      el.innerHTML = `<p style="color:var(--text-soft);font-size:0.9rem;">No campus data found for ${uniName}.</p>`;
      return;
    }

    const rows = campuses.map(campus => {
      const dist = haversineKm(suburbCoords.lat, suburbCoords.lng, campus.lat, campus.lng);
      return { name: campus.campus_name, dist };
    }).sort((a, b) => a.dist - b.dist);

    el.innerHTML = `
      <div class="suburb-profile-grid">
        ${rows.map(r => `
          <article class="suburb-profile-card">
            <span class="suburb-profile-kicker">${r.name}</span>
            <p style="font-size:1.1rem;font-weight:700;color:var(--primary)">${r.dist.toFixed(1)} km</p>
          </article>
        `).join("")}
      </div>
    `;
  } catch (e) {
    console.error(e);
    el.innerHTML = `<p style="color:var(--text-soft);font-size:0.9rem;">Distance calculation failed. Please try again.</p>`;
  }
}