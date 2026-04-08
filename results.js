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

const suburbs = [
  {
    suburb: "Carlton",
    city: "Melbourne",
    image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1200&q=80",
    rentBand: "high",
    transport: "high",
    culture: "high",
    university: "high",
    housing: ["shared", "studio", "apartment"],
    lifestyle: ["cafe", "urban", "culture", "study"],
    commonLanguages: ["English", "Mandarin", "Hindi"],
    recentArrival: "strong",
    englishSupport: "good",
    description: "Close to major universities, lively student activity, and strong transport links."
  },
  {
    suburb: "Clayton",
    city: "Melbourne",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "medium",
    culture: "high",
    university: "high",
    housing: ["shared", "studio"],
    lifestyle: ["quiet", "culture", "food", "study"],
    commonLanguages: ["English", "Hindi", "Malayalam"],
    recentArrival: "strong",
    englishSupport: "good",
    description: "Known for Monash access, shared housing options, and strong multicultural communities."
  },
  {
    suburb: "Footscray",
    city: "Melbourne",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    rentBand: "low",
    transport: "high",
    culture: "high",
    university: "medium",
    housing: ["shared", "apartment"],
    lifestyle: ["culture", "food", "urban", "cafe"],
    commonLanguages: ["Vietnamese", "English", "Mandarin"],
    recentArrival: "strong",
    englishSupport: "medium",
    description: "Popular for value, food culture, and easy CBD connectivity."
  },
  {
    suburb: "Box Hill",
    city: "Melbourne",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "high",
    culture: "high",
    university: "medium",
    housing: ["shared", "apartment", "studio"],
    lifestyle: ["culture", "food", "quiet"],
    commonLanguages: ["Mandarin", "English", "Cantonese"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "A strong cultural hub with transport convenience and a comfortable suburban feel."
  },
  {
    suburb: "Burwood",
    city: "Sydney",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "high",
    culture: "high",
    university: "medium",
    housing: ["shared", "apartment"],
    lifestyle: ["food", "culture", "urban"],
    commonLanguages: ["Mandarin", "English", "Korean"],
    recentArrival: "strong",
    englishSupport: "good",
    description: "Well-connected suburb with diverse communities and student-friendly rental patterns."
  },
  {
    suburb: "Parramatta",
    city: "Sydney",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "high",
    culture: "high",
    university: "medium",
    housing: ["shared", "apartment", "studio"],
    lifestyle: ["urban", "food", "culture"],
    commonLanguages: ["Hindi", "English", "Arabic"],
    recentArrival: "strong",
    englishSupport: "good",
    description: "A major western Sydney hub with trains, services, and diverse community support."
  },
  {
    suburb: "Kensington",
    city: "Sydney",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    rentBand: "high",
    transport: "high",
    culture: "medium",
    university: "high",
    housing: ["studio", "apartment", "shared"],
    lifestyle: ["study", "urban", "cafe"],
    commonLanguages: ["English", "Mandarin", "Hindi"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "Close to UNSW and useful for students who want stronger campus access."
  },
  {
    suburb: "St Lucia",
    city: "Brisbane",
    image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "medium",
    culture: "medium",
    university: "high",
    housing: ["shared", "apartment"],
    lifestyle: ["study", "quiet", "nature"],
    commonLanguages: ["English", "Mandarin", "Hindi"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "Known for UQ access and a quieter student-oriented living environment."
  },
  {
    suburb: "South Brisbane",
    city: "Brisbane",
    image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "high",
    culture: "medium",
    university: "medium",
    housing: ["apartment", "studio"],
    lifestyle: ["urban", "cafe", "food"],
    commonLanguages: ["English", "Mandarin", "Spanish"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "A central option with river access, culture, and strong transport links."
  },
  {
    suburb: "North Adelaide",
    city: "Adelaide",
    image: "https://images.unsplash.com/photo-1564419439572-1f478fe9ad4f?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "medium",
    culture: "medium",
    university: "high",
    housing: ["apartment", "shared"],
    lifestyle: ["quiet", "cafe", "study"],
    commonLanguages: ["English", "Mandarin", "Hindi"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "Comfortable for students wanting a quieter city and easier campus proximity."
  },
  {
    suburb: "Bentley",
    city: "Perth",
    image: "https://images.unsplash.com/photo-1510546020571-ec8f91d1fceb?auto=format&fit=crop&w=1200&q=80",
    rentBand: "low",
    transport: "medium",
    culture: "medium",
    university: "high",
    housing: ["shared", "studio"],
    lifestyle: ["study", "quiet", "food"],
    commonLanguages: ["English", "Hindi", "Malay"],
    recentArrival: "medium",
    englishSupport: "medium",
    description: "Strong for Curtin access and more affordable student housing patterns."
  },
  {
    suburb: "Bruce",
    city: "Canberra",
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=80",
    rentBand: "medium",
    transport: "medium",
    culture: "medium",
    university: "high",
    housing: ["shared", "apartment"],
    lifestyle: ["study", "quiet", "nature"],
    commonLanguages: ["English", "Hindi", "Mandarin"],
    recentArrival: "medium",
    englishSupport: "good",
    description: "Good for students looking for a quieter academic environment and campus access."
  }
];

const preferences = JSON.parse(localStorage.getItem("settlesmart_preferences") || "{}");
const resultsHeroTitle = document.getElementById("resultsHeroTitle");
const resultsHeroCopy = document.getElementById("resultsHeroCopy");
const resultsSummary = document.getElementById("resultsSummary");
const topMatchPanel = document.getElementById("topMatchPanel");
const resultsGrid = document.getElementById("resultsGrid");
const cultureList = document.getElementById("cultureList");

init();

function init() {
  if (!preferences.city) {
    window.location.href = "index.html";
    return;
  }

  const ranked = rankSuburbs().slice(0, 6);
  renderHero(ranked);
  renderTopMatch(ranked[0]);
  renderMatches(ranked.slice(0, 4));
  renderCultureExplorer(ranked.slice(0, 3));
}

function rankSuburbs() {
  return suburbs
    .filter(suburb => suburb.city === preferences.city)
    .map(suburb => ({ ...suburb, score: getSuburbScore(suburb) }))
    .sort((a, b) => b.score - a.score);
}

function getSuburbScore(suburb) {
  let score = 52;

  if (preferences.city === suburb.city) score += 16;

  if (preferences.budget <= 300 && suburb.rentBand === "low") score += 12;
  if (preferences.budget > 300 && preferences.budget <= 500 && suburb.rentBand === "medium") score += 10;
  if (preferences.budget > 500 && suburb.rentBand === "high") score += 8;

  if (preferences.housing && suburb.housing.includes(preferences.housing)) score += 8;
  if (preferences.commute === "public-transport" && suburb.transport === "high") score += 8;
  if (preferences.commute !== "public-transport" && suburb.transport === "medium") score += 4;
  if (preferences.lifestyle && suburb.lifestyle.includes(preferences.lifestyle)) score += 10;
  if (preferences.culture && suburb.culture === "high") score += 8;
  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) score += 8;
  if (suburb.university === "high") score += 6;

  return Math.min(score, 98);
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
      <p>${match.description} Recommended because ${buildReasonList(match).join(", ")}.</p>
      <div class="top-match-meta">
        <span class="meta-pill">Fit score ${match.score}/100</span>
        <span class="meta-pill">${match.transport} transport</span>
        <span class="meta-pill">${match.culture} culture fit</span>
        <span class="meta-pill">${match.university} university access</span>
      </div>
    </div>
    <div class="top-match-highlights">
      <div class="highlight-card">
        <span>Best for</span>
        <strong>${formatChoice(preferences.lifestyle)} and ${formatChoice(preferences.commute)} priorities</strong>
      </div>
      <div class="highlight-card">
        <span>Language comfort</span>
        <strong>${match.commonLanguages.join(", ")}</strong>
      </div>
      <div class="highlight-card">
        <span>Student cue</span>
        <strong>${match.university === "high" ? "Strong university access" : "Balanced campus connectivity"}</strong>
      </div>
    </div>
  `;
}

function renderMatches(list) {
  resultsGrid.innerHTML = list.map(match => `
    <div class="col-12 col-md-6 col-xl-3">
      <article class="result-card">
        <div class="result-image" style="background-image:url('${match.image}')"></div>
        <div class="result-body">
          <span class="result-city-label">${match.city}</span>
          <h3>${match.suburb}</h3>
          <p>${match.description}</p>
          <div class="result-tags">
            <span class="result-tag">Fit ${match.score}/100</span>
            <span class="result-tag">${match.transport} transport</span>
            <span class="result-tag">${match.culture} culture</span>
          </div>
          <ul class="inline-reason-list">
            ${buildReasonList(match).slice(0, 3).map(reason => `<li>${reason}</li>`).join("")}
          </ul>
        </div>
      </article>
    </div>
  `).join("");
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
    reasons.push(`your language appears more familiar here`);
  }
  if (preferences.culture && suburb.culture === "high") {
    reasons.push(`it shows stronger multicultural community signals`);
  }
  if (preferences.housing && suburb.housing.includes(preferences.housing)) {
    reasons.push(`its housing pattern suits your preferred living style`);
  }
  if (preferences.commute === "public-transport" && suburb.transport === "high") {
    reasons.push(`it supports stronger public transport access`);
  }
  if (preferences.lifestyle && suburb.lifestyle.includes(preferences.lifestyle)) {
    reasons.push(`its local lifestyle aligns with your priority`);
  }
  if (preferences.budget <= 300 && suburb.rentBand === "low") {
    reasons.push(`it is friendlier for tighter student budgets`);
  }
  if (preferences.budget > 300 && preferences.budget <= 500 && suburb.rentBand === "medium") {
    reasons.push(`it fits a balanced student rent range`);
  }
  if (suburb.university === "high") {
    reasons.push(`it has stronger university access signals`);
  }

  if (!reasons.length) reasons.push("it offers a balanced overall fit for your selected city");
  return reasons;
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
