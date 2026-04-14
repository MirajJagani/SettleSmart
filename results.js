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