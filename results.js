/*
  SettleSmart - Results page
  --------------------------
  This file supports Epic 2 (Personalised Suburb Matching)
  and Epic 4 (Culture and Language Fit Explorer).

  DATABASE ADMIN NOTES:
  Replace the sample suburbs array with a Supabase / PostgreSQL query.

  Fields that would be useful from suburb datasets:
  - suburb_name
  - city_name
  - rent_band or median_weekly_rent
  - transport_score / public_transport_access
  - culture_score / cultural_diversity_score
  - university_access_score
  - common_languages (array or joined string)
  - overseas_born_share
  - recent_arrival_signal
  - english_support_signal
  - grocery_access / daily_life_score
  - student_housing_types (array)
  - hero_image_url

  Example SQL comments for DB admin:
  -- SELECT suburb_name, city_name, rent_band, transport_score, culture_score,
  --        university_access_score, common_languages, overseas_born_share,
  --        recent_arrival_signal, english_support_signal, daily_life_score,
  --        hero_image_url
  -- FROM suburb_profiles
  -- WHERE city_name = :selected_city;

  -- SELECT suburb_name, common_languages, overseas_born_share,
  --        recent_arrival_signal, english_support_signal
  -- FROM suburb_profiles
  -- WHERE city_name = :selected_city
  -- ORDER BY culture_score DESC;
*/

const preferences = JSON.parse(localStorage.getItem("settlesmart_preferences") || "{}");

const appState = {
  sortBy: localStorage.getItem("settlesmart_sort") || "match-desc",
  rankedSuburbs: []
};

const resultsHeroTitle = document.getElementById("resultsHeroTitle");
const resultsHeroCopy = document.getElementById("resultsHeroCopy");
const resultsSummary = document.getElementById("resultsSummary");
const topMatchPanel = document.getElementById("topMatchPanel");
const resultsGrid = document.getElementById("resultsGrid");
const cultureList = document.getElementById("cultureList");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");

init();

function init() {
  if (!preferences.city) {
    window.location.href = "index.html";
    return;
  }

  sortSelect.value = appState.sortBy;
  sortSelect.addEventListener("change", handleSortChange);

  appState.rankedSuburbs = rankSuburbs();
  renderPage();
}

function renderPage() {
  const bestMatchList = [...appState.rankedSuburbs].sort((a, b) => b.score - a.score);
  const bestMatch = bestMatchList[0];
  const displayList = applySort(appState.rankedSuburbs, appState.sortBy);

  renderHero(displayList);
  renderTopMatch(bestMatch);
  renderMatches(displayList, bestMatch?.slug);
  renderCultureExplorer(bestMatchList.slice(0, 3));

  resultsCount.textContent = `${displayList.length} suburbs found`;
}

function handleSortChange(event) {
  appState.sortBy = event.target.value;
  localStorage.setItem("settlesmart_sort", appState.sortBy);
  renderPage();
}

function rankSuburbs() {
  return suburbs
    .filter(suburb => suburb.city === preferences.city)
    .map(suburb => {
      const score = getSuburbScore(suburb);
      return {
        ...suburb,
        score,
        reasons: buildReasonList(suburb)
      };
    });
}

function getSuburbScore(suburb) {
  const budgetBand = getBudgetBand(preferences.budget);

  let points = 0;
  let total = 0;

  total += 20;
  if (suburb.city === preferences.city) points += 20;

  total += 18;
  points += getRentScore(suburb.rentBand, budgetBand);

  total += 12;
  if (preferences.housing && suburb.housing.includes(preferences.housing)) {
    points += 12;
  }

  total += 12;
  points += getCommuteScore(suburb);

  total += 14;
  if (preferences.lifestyle && suburb.lifestyle.includes(preferences.lifestyle)) {
    points += 14;
  }

  total += 12;
  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
    points += 12;
  }

  total += 12;
  if (preferences.culture && suburb.culturalGroups?.includes(preferences.culture)) {
    points += 12;
  }

  return Math.round((points / total) * 100);
}

function getBudgetBand(budget) {
  if (budget <= 300) return "low";
  if (budget <= 500) return "medium";
  return "high";
}

function getRentScore(suburbBand, targetBand) {
  const rank = { low: 1, medium: 2, high: 3 };
  const distance = Math.abs(rank[suburbBand] - rank[targetBand]);

  if (distance === 0) return 18;
  if (distance === 1) return 9;
  return 3;
}

function getCommuteScore(suburb) {
  if (preferences.commute === "public-transport") {
    if (suburb.transport === "high") return 12;
    if (suburb.transport === "medium") return 6;
    return 2;
  }

  if (preferences.commute === "low-commute") {
    if (suburb.university === "high") return 12;
    if (suburb.university === "medium") return 6;
    return 2;
  }

  if (preferences.commute === "bike-walk") {
    if (suburb.transport === "high" || suburb.lifestyle.includes("cafe")) return 10;
    return 5;
  }

  return 0;
}

function renderHero(ranked) {
  resultsHeroTitle.textContent = `Your ${preferences.city} shortlist is ready.`;
  resultsHeroCopy.textContent = `These suburb recommendations are shaped by your budget, housing style, commute needs, language preferences, and lifestyle priorities.`;
  resultsSummary.innerHTML = `
    <span class="summary-chip">City: ${preferences.city}</span>
    <span class="summary-chip">Budget: $${preferences.budget}/week</span>
    <span class="summary-chip">Housing: ${formatChoice(preferences.housing)}</span>
    <span class="summary-chip">Commute: ${formatChoice(preferences.commute)}</span>
    <span class="summary-chip">Lifestyle: ${formatChoice(preferences.lifestyle)}</span>
    <span class="summary-chip">Language: ${preferences.language || "Not set"}</span>
  `;
}

function renderTopMatch(match) {
  if (!match) return;

  topMatchPanel.innerHTML = `
    <div class="top-match-copy">
      <span class="preview-kicker">Top match</span>
      <h3>${match.suburb}, ${match.city}</h3>
      <p>${match.description} Recommended because ${match.reasons.join(", ")}.</p>

      <div class="top-match-meta">
        <span class="meta-pill">Fit score ${match.score}/100</span>
        <!-- <span class="meta-pill">Rent ${match.rentRange}</span> -->
        <span class="meta-pill">${match.transport} transport</span>
        <span class="meta-pill">${match.university} university access</span>
      </div>
    </div>

    <div class="top-match-highlights">
      <div class="highlight-card">
        <span>Best for</span>
        <strong>${formatChoice(preferences.lifestyle)} and ${formatChoice(preferences.commute)}</strong>
      </div>

      <div class="highlight-card">
        <span>Language comfort</span>
        <strong>${match.commonLanguages.join(", ")}</strong>
      </div>

      <div class="highlight-card">
        <span>Student cue</span>
        <strong>${(match.lifestyleTags || []).join(", ")}</strong>
      </div>
    </div>
  `;
}

function renderMatches(list, bestMatchSlug) {
  resultsGrid.innerHTML = list.map((match) => `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="result-card ${match.slug === bestMatchSlug ? "best-match-card" : ""}">
        <div class="result-image" style="background-image:url('${match.image}')">
        </div>

        <div class="result-body">
          <span class="result-city-label">${match.city}</span>
          <h3>${match.suburb}</h3>
          <p>${match.description}</p>

          <div class="result-meta-row">
            <span class="result-tag">Match ${match.score}%</span>
            ${(match.lifestyleTags || []).slice(0, 3).map(tag => `
              <span class="result-chip">${tag}</span>
            `).join("")}
          </div>

          <ul class="inline-reason-list">
            ${(match.reasons || []).slice(0, 3).map(reason => `<li>${reason}</li>`).join("")}
          </ul>

          <button
            class="btn ss-btn ss-btn-secondary w-100 view-details-btn"
            data-slug="${match.slug}"
          >
            View Details
          </button>
        </div>
      </article>
    </div>
  `).join("");

  document.querySelectorAll(".view-details-btn").forEach(button => {
    button.addEventListener("click", () => {
      const { slug } = button.dataset;
      localStorage.setItem("settlesmart_sort", appState.sortBy);
      window.location.href = `suburb.html?slug=${slug}`;
    });
  });
}

function renderCultureExplorer(list) {
  cultureList.innerHTML = list.map(match => `
    <div class="culture-item">
      <div class="culture-item-head">
        <strong>${match.suburb}</strong>
        <span class="culture-score">Culture fit ${getCultureFitScore(match)}/10</span>
      </div>
      <p class="muted-line mb-2">Common language cues: ${match.commonLanguages.join(", ")}</p>
      <div class="culture-signals">
        <span class="signal-pill">Recent arrivals: ${match.recentArrival}</span>
        <span class="signal-pill">English support: ${match.englishSupport}</span>
        <span class="signal-pill">${match.culture} diversity signal</span>
      </div>
    </div>
  `).join("");
}

function buildReasonList(suburb) {
  const reasons = [];

  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
    reasons.push("your language is commonly spoken here");
  }

  if (preferences.culture && suburb.culturalGroups?.includes(preferences.culture)) {
    reasons.push(`it has stronger ${preferences.culture} community signals`);
  }

  if (preferences.housing && suburb.housing.includes(preferences.housing)) {
    reasons.push("its housing options match your preferred living style");
  }

  if (preferences.commute === "public-transport" && suburb.transport === "high") {
    reasons.push("it offers strong public transport access");
  }

  if (preferences.commute === "low-commute" && suburb.university === "high") {
    reasons.push("it supports a shorter study commute");
  }

  if (preferences.lifestyle && suburb.lifestyle.includes(preferences.lifestyle)) {
    reasons.push("its daily lifestyle aligns with your priority");
  }

  const budgetBand = getBudgetBand(preferences.budget);
  if (suburb.rentBand === budgetBand) {
    reasons.push("it fits your expected weekly budget");
  }

  if (!reasons.length) {
    reasons.push("it offers a balanced overall match for your selected city");
  }

  return reasons.slice(0, 4);
}

function getCultureFitScore(suburb) {
  let score = 6;
  if (suburb.culture === "high") score += 2;
  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) score += 1;
  if (suburb.recentArrival === "strong") score += 1;
  return score;
}

function formatChoice(value) {
  if (!value) return "-";
  return value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function applySort(list, sortBy) {
  const sorted = [...list];

  switch (sortBy) {
    case "name-asc":
      return sorted.sort((a, b) => a.suburb.localeCompare(b.suburb));

    case "name-desc":
      return sorted.sort((a, b) => b.suburb.localeCompare(a.suburb));

    case "match-asc":
      return sorted.sort((a, b) => a.score - b.score);

    case "match-desc":
    default:
      return sorted.sort((a, b) => b.score - a.score);
  }
}

/* =========================
   Epic 4 additive enhancement
   Append only - do not edit existing code
========================= */

(() => {
  const epic4State = {
    tab: "explore",
    search: "",
    showMap: false
  };

  const originalRenderPage = renderPage;

  function getRankedListForEpic4() {
    return [...appState.rankedSuburbs].sort((a, b) => b.score - a.score);
  }

  function getEpic4CultureScore(suburb) {
    let score = getCultureFitScore(suburb);

    if (
      preferences.culture &&
      suburb.culturalGroups &&
      suburb.culturalGroups.includes(preferences.culture)
    ) {
      score += 1;
    }

    return Math.min(score, 10);
  }

  function getCultureConnectionLabel(suburb) {
    if (
      preferences.culture &&
      suburb.culturalGroups &&
      suburb.culturalGroups.includes(preferences.culture)
    ) {
      return `Strong ${preferences.culture} community`;
    }

    if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
      return `${preferences.language} spoken here`;
    }

    if (suburb.culture === "high") return "High cultural diversity";
    if (suburb.culture === "medium") return "Growing multicultural mix";
    return "Emerging community support";
  }

  function getPriorityLanguageBadges(suburb) {
    const badges = [];

    if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
      badges.push(`${preferences.language} spoken`);
    }

    suburb.commonLanguages.forEach(language => {
      if (badges.length < 3 && !badges.includes(language) && !badges.includes(`${language} spoken`)) {
        badges.push(language);
      }
    });

    return badges.slice(0, 3);
  }

  function getCommunityData(suburb) {
    if (typeof window.getEpic4CommunityData === "function") {
      return window.getEpic4CommunityData(suburb);
    }

    return {
      communityStrength: suburb.culture === "high" ? 82 : 68,
      overseasBornShare: "35%",
      specialtyShops: "4+",
      placesOfWorship: "2+",
      keyPlaces: ["International grocery options", "Community food access", "Support venues nearby"],
      highlightDistance: "800m walk",
      events: ["Seasonal community event", "Student meetup"]
    };
  }

  function ensureCultureToolbar() {
    const panel = document.querySelector(".culture-panel");
    const heading = panel ? panel.querySelector(".panel-heading") : null;

    if (!panel || !heading || document.getElementById("epic4CultureToolbar")) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.id = "epic4CultureToolbar";
    toolbar.className = "epic4-culture-toolbar";
    toolbar.innerHTML = `
      <div class="epic4-culture-toolbar-row">
        <div class="epic4-tab-group">
          <button type="button" class="epic4-tab-btn active" data-epic4-tab="explore">Explore</button>
          <button type="button" class="epic4-tab-btn" data-epic4-tab="culture">Culture Fit</button>
          <button type="button" class="epic4-tab-btn" data-epic4-tab="compare">Compare</button>
        </div>

        <div class="epic4-toolbar-actions">
          <input
            type="text"
            id="epic4LanguageSearch"
            class="epic4-language-search"
            placeholder="Search language e.g. Mandarin"
          />
          <button type="button" class="epic4-map-toggle" id="epic4MapToggle">Toggle density map</button>
        </div>
      </div>

      <div id="epic4CultureTitle" class="epic4-culture-title"></div>
      <div id="epic4CultureMap" class="epic4-culture-map hidden"></div>
    `;

    heading.insertAdjacentElement("afterend", toolbar);

    toolbar.querySelectorAll("[data-epic4-tab]").forEach(button => {
      button.addEventListener("click", () => {
        epic4State.tab = button.dataset.epic4Tab;
        renderEpic4CultureArea();
      });
    });

    const searchInput = document.getElementById("epic4LanguageSearch");
    searchInput.addEventListener("input", (event) => {
      epic4State.search = event.target.value.trim();
      renderEpic4CultureArea();
    });

    document.getElementById("epic4MapToggle").addEventListener("click", () => {
      epic4State.showMap = !epic4State.showMap;
      renderEpic4CultureArea();
    });
  }

  function enhanceResultCards() {
    document.querySelectorAll("#resultsGrid .result-card").forEach(card => {
      const existingRow = card.querySelector(".epic4-badge-row");
      if (existingRow) existingRow.remove();

      const suburbName = card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : "";
      const suburb = appState.rankedSuburbs.find(item => item.suburb === suburbName);

      if (!suburb) return;

      const badgeRow = document.createElement("div");
      badgeRow.className = "epic4-badge-row";
      badgeRow.innerHTML = `
        ${getPriorityLanguageBadges(suburb).map(badge => `
          <span class="epic4-language-badge">${badge}</span>
        `).join("")}
        <span class="epic4-connection-badge">${getCultureConnectionLabel(suburb)}</span>
      `;

      const metaRow = card.querySelector(".result-meta-row");
      if (metaRow) {
        metaRow.insertAdjacentElement("beforebegin", badgeRow);
      }
    });
  }

  function updateToolbarState() {
    const toolbar = document.getElementById("epic4CultureToolbar");
    if (!toolbar) return;

    toolbar.querySelectorAll("[data-epic4-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.epic4Tab === epic4State.tab);
    });

    const searchInput = document.getElementById("epic4LanguageSearch");
    if (searchInput) {
      searchInput.value = epic4State.search;
    }
  }

  function getFilteredCultureList() {
    let list = getRankedListForEpic4();

    if (epic4State.search) {
      const keyword = epic4State.search.toLowerCase();
      list = list.filter(suburb =>
        suburb.commonLanguages.some(language => language.toLowerCase().includes(keyword))
      );
    }

    return list;
  }

  function renderEpic4Map(list) {
    const map = document.getElementById("epic4CultureMap");
    if (!map) return;

    if (!epic4State.showMap) {
      map.classList.add("hidden");
      map.innerHTML = "";
      return;
    }

    map.classList.remove("hidden");
    map.innerHTML = `
      <div class="epic4-map-inner">
        <h4>Community density guide</h4>
        <p class="muted-line">Prototype density view based on community strength signals.</p>

        ${list.slice(0, 5).map(suburb => {
          const community = getCommunityData(suburb);
          return `
            <div class="epic4-density-item">
              <div class="epic4-density-head">
                <strong>${suburb.suburb}</strong>
                <span>${community.communityStrength}%</span>
              </div>
              <div class="epic4-density-bar">
                <span style="width:${community.communityStrength}%"></span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderExploreView(list) {
    const title = document.getElementById("epic4CultureTitle");

    title.innerHTML = `
      <h4>Best culture-fit suburbs from your shortlist</h4>
      <p class="muted-line">Search by language and compare cultural connection signals before opening suburb details.</p>
    `;

    cultureList.innerHTML = list.map(suburb => {
      const community = getCommunityData(suburb);

      return `
        <div class="culture-item epic4-culture-item">
          <div class="culture-item-head">
            <strong>${suburb.suburb}</strong>
            <span class="culture-score">Culture fit ${getEpic4CultureScore(suburb)}/10</span>
          </div>

          <div class="epic4-inline-badges">
            ${getPriorityLanguageBadges(suburb).map(badge => `
              <span class="epic4-language-badge">${badge}</span>
            `).join("")}
            <span class="epic4-connection-badge">${getCultureConnectionLabel(suburb)}</span>
          </div>

          <p class="muted-line mb-2">
            Common language cues: ${suburb.commonLanguages.join(", ")}
          </p>

          <div class="culture-signals">
            <span class="signal-pill">Community strength: ${community.communityStrength}%</span>
            <span class="signal-pill">Overseas-born share: ${community.overseasBornShare}</span>
            <span class="signal-pill">Shops: ${community.specialtyShops}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCultureFitView(list) {
    const title = document.getElementById("epic4CultureTitle");

    title.innerHTML = `
      <h4>${preferences.culture ? `Top ${preferences.culture} communities` : "Top culture communities"}</h4>
      <p class="muted-line">Ranked by community strength, cultural connection, and language familiarity.</p>
    `;

    const ranked = [...list].sort((a, b) => {
      return getCommunityData(b).communityStrength - getCommunityData(a).communityStrength;
    });

    cultureList.innerHTML = ranked.map((suburb, index) => {
      const community = getCommunityData(suburb);

      return `
        <div class="epic4-rank-card">
          <div class="epic4-rank-number">#${index + 1}</div>

          <div class="epic4-rank-content">
            <div class="culture-item-head">
              <strong>${suburb.suburb}</strong>
              <span class="culture-score">Culture fit ${getEpic4CultureScore(suburb)}/10</span>
            </div>

            <div class="epic4-inline-badges">
              ${getPriorityLanguageBadges(suburb).map(badge => `
                <span class="epic4-language-badge">${badge}</span>
              `).join("")}
              <span class="epic4-connection-badge">${getCultureConnectionLabel(suburb)}</span>
            </div>

            <div class="epic4-metric-grid">
              <div class="epic4-metric-card">
                <span>Community strength</span>
                <strong>${community.communityStrength}%</strong>
              </div>
              <div class="epic4-metric-card">
                <span>Overseas-born</span>
                <strong>${community.overseasBornShare}</strong>
              </div>
              <div class="epic4-metric-card">
                <span>Specialty shops</span>
                <strong>${community.specialtyShops}</strong>
              </div>
              <div class="epic4-metric-card">
                <span>Places of worship</span>
                <strong>${community.placesOfWorship}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCompareView(list) {
    const title = document.getElementById("epic4CultureTitle");

    title.innerHTML = `
      <h4>Compare community signals</h4>
      <p class="muted-line">Quick comparison of your strongest culture-fit suburbs.</p>
    `;

    const compareList = [...list]
      .sort((a, b) => getEpic4CultureScore(b) - getEpic4CultureScore(a))
      .slice(0, 3);

    cultureList.innerHTML = `
      <div class="epic4-compare-grid">
        ${compareList.map(suburb => {
          const community = getCommunityData(suburb);

          return `
            <div class="epic4-compare-card">
              <span class="result-city-label">${suburb.city}</span>
              <h4>${suburb.suburb}</h4>

              <div class="epic4-inline-badges">
                ${getPriorityLanguageBadges(suburb).map(badge => `
                  <span class="epic4-language-badge">${badge}</span>
                `).join("")}
              </div>

              <div class="epic4-compare-line">
                <span>Culture fit</span>
                <strong>${getEpic4CultureScore(suburb)}/10</strong>
              </div>
              <div class="epic4-compare-line">
                <span>Community strength</span>
                <strong>${community.communityStrength}%</strong>
              </div>
              <div class="epic4-compare-line">
                <span>Overseas-born share</span>
                <strong>${community.overseasBornShare}</strong>
              </div>
              <div class="epic4-compare-line">
                <span>Shops</span>
                <strong>${community.specialtyShops}</strong>
              </div>
              <div class="epic4-compare-line">
                <span>Worship places</span>
                <strong>${community.placesOfWorship}</strong>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderEpic4CultureArea() {
    ensureCultureToolbar();
    updateToolbarState();

    const filteredList = getFilteredCultureList();

    if (!filteredList.length) {
      cultureList.innerHTML = `
        <div class="epic4-empty-state">
          <h4>No suburbs match that language search</h4>
          <p>Try another language or clear the search field.</p>
        </div>
      `;
      renderEpic4Map([]);
      return;
    }

    if (epic4State.tab === "culture") {
      renderCultureFitView(filteredList);
    } else if (epic4State.tab === "compare") {
      renderCompareView(filteredList);
    } else {
      renderExploreView(filteredList);
    }

    renderEpic4Map(filteredList);
  }

  renderPage = function () {
    originalRenderPage();
    enhanceResultCards();
    renderEpic4CultureArea();
  };

  renderPage();
})();