const preferences = window.getStoredPreferences
  ? window.getStoredPreferences()
  : JSON.parse(localStorage.getItem("settlesmart_preferences") || "{}");

const cityHeroImages = {
  Melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1600&q=80",
  Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
  Brisbane: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80",
  Adelaide: "https://images.unsplash.com/photo-1564419439572-1f478fe9ad4f?auto=format&fit=crop&w=1600&q=80",
  Perth: "https://images.unsplash.com/photo-1510546020571-ec8f91d1fceb?auto=format&fit=crop&w=1600&q=80",
  Canberra: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1600&q=80"
};

const appState = {
  sortBy: localStorage.getItem("settlesmart_sort") || "match-desc",
  rankedSuburbs: [],
  activeTab: "explore",
  search: "",
  showMap: false
};

const resultsHeroBanner = document.getElementById("resultsHeroBanner");
const resultsHeroTitle = document.getElementById("resultsHeroTitle");
const resultsHeroCopy = document.getElementById("resultsHeroCopy");
const resultsSummary = document.getElementById("resultsSummary");
const topMatchPanel = document.getElementById("topMatchPanel");
const resultsGrid = document.getElementById("resultsGrid");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");

const communityTabs = document.querySelectorAll("[data-community-tab]");
const communitySearch = document.getElementById("communitySearch");
const communityMapToggle = document.getElementById("communityMapToggle");
const communityViewTitle = document.getElementById("communityViewTitle");
const communityMap = document.getElementById("communityMap");
const cultureList = document.getElementById("cultureList");

/* ===== Spin wheel refs ===== */
const spinWheelPanel = document.getElementById("spinWheelPanel");
const wheelCandidates = document.getElementById("wheelCandidates");
const spinWheelBtn = document.getElementById("spinWheelBtn");
const viewWinnerBtn = document.getElementById("viewWinnerBtn");
const spinWheelResult = document.getElementById("spinWheelResult");
const shortlistWheel = document.getElementById("shortlistWheel");

const wheelState = {
  items: [],
  rotation: 0,
  spinning: false,
  winner: null,
  listenersBound: false
};

init();

function init() {
  if (!preferences.city) {
    window.location.href = "index.html";
    return;
  }

  appState.rankedSuburbs = rankSuburbs();

  if (sortSelect) {
    sortSelect.value = appState.sortBy;
    sortSelect.addEventListener("change", handleSortChange);
  }

  communityTabs.forEach((button) => {
    button.addEventListener("click", () => {
      appState.activeTab = button.dataset.communityTab;
      renderCommunityExplorer();
    });
  });

  if (communitySearch) {
    communitySearch.addEventListener("input", (event) => {
      appState.search = event.target.value.trim().toLowerCase();
      renderCommunityExplorer();
    });
  }

  if (communityMapToggle) {
    communityMapToggle.addEventListener("click", () => {
      appState.showMap = !appState.showMap;
      renderCommunityExplorer();
    });
  }

  renderPage();
}

function rankSuburbs() {
  return window.suburbs
    .filter((suburb) => suburb.city === preferences.city)
    .map((suburb) => ({
      ...suburb,
      score: window.getSuburbScore(suburb, preferences),
      reasons: window.buildReasonList(suburb, preferences)
    }))
    .sort((a, b) => b.score - a.score);
}

function renderPage() {
  const bestMatchList = [...appState.rankedSuburbs].sort((a, b) => b.score - a.score);
  const sorted = applySort(appState.rankedSuburbs, appState.sortBy);
  const bestMatch = bestMatchList[0];

  renderHero();
  renderTopMatch(bestMatch);
  renderSpinWheel(bestMatchList.slice(0, 4));
  renderMatches(sorted, bestMatch ? bestMatch.slug : "");
  renderCommunityExplorer();

  if (resultsCount) {
    resultsCount.textContent = `${sorted.length} suburbs found`;
  }
}

function handleSortChange(event) {
  appState.sortBy = event.target.value;
  localStorage.setItem("settlesmart_sort", appState.sortBy);
  renderPage();
}

function renderHero() {
  const heroImage = cityHeroImages[preferences.city] || cityHeroImages.Melbourne;

  if (resultsHeroBanner) {
    resultsHeroBanner.style.backgroundImage = `url('${heroImage}')`;
  }

  resultsHeroTitle.textContent = `Your ${preferences.city} shortlist is ready.`;
  resultsHeroCopy.textContent =
    "Review the suburbs that best align with your budget, housing style, commute, language familiarity, and lifestyle priorities.";

  resultsSummary.innerHTML = `
    <div class="col-12 col-sm-6">
      <div class="hero-summary-card">
        <span class="hero-summary-label">Selected city</span>
        <strong class="hero-summary-value">${preferences.city}</strong>
      </div>
    </div>
    <div class="col-12 col-sm-6">
      <div class="hero-summary-card">
        <span class="hero-summary-label">Weekly budget</span>
        <strong class="hero-summary-value">$${preferences.budget}/week</strong>
      </div>
    </div>
    <div class="col-12 col-sm-6">
      <div class="hero-summary-card">
        <span class="hero-summary-label">Commute priority</span>
        <strong class="hero-summary-value">${window.formatChoice(preferences.commute)}</strong>
      </div>
    </div>
    <div class="col-12 col-sm-6">
      <div class="hero-summary-card">
        <span class="hero-summary-label">Language</span>
        <strong class="hero-summary-value">${preferences.language || "Not set"}</strong>
      </div>
    </div>
  `;
}

function renderTopMatch(match) {
  if (!match) {
    topMatchPanel.innerHTML = "";
    return;
  }

  topMatchPanel.innerHTML = `
    <div class="top-match-inline-layout">
      <div class="top-match-main">
        <span class="section-kicker">Top match</span>
        <h3 class="top-match-title">${match.suburb}, ${match.city}</h3>

        <p class="top-match-copy">
          ${match.description} Recommended because ${match.reasons.join(", ")}.
        </p>

        <div class="top-match-tags mt-3">
          ${(match.lifestyleTags || [])
            .slice(0, 3)
            .map((tag) => `<span class="result-tag-lite">${tag}</span>`)
            .join("")}
        </div>

        <ul class="result-reason-list mt-3">
          ${match.reasons.map((reason) => `<li>${reason}</li>`).join("")}
        </ul>
      </div>

      <div class="top-match-aside">
        <div class="top-match-stats-grid">
          <div class="top-match-stat-card">
            <span>Fit score</span>
            <strong>${match.score}%</strong>
          </div>

          <div class="top-match-stat-card">
            <span>Transport</span>
            <strong>${window.formatChoice(match.transport)}</strong>
          </div>

          <div class="top-match-stat-card">
            <span>University access</span>
            <strong>${window.formatChoice(match.university)}</strong>
          </div>

          <div class="top-match-stat-card">
            <span>Language comfort</span>
            <strong>${match.commonLanguages.slice(0, 2).join(", ")}</strong>
          </div>
        </div>

        <div class="top-match-focus-card">
          <span class="top-match-focus-label">Why it stands out</span>
          <p>${getCultureConnectionLabel(match)}</p>

          <div class="top-match-focus-pills">
            <span class="signal-pill">Housing: ${window.formatChoice(preferences.housing)}</span>
            <span class="signal-pill">Lifestyle: ${window.formatChoice(preferences.lifestyle)}</span>
            <span class="signal-pill">Community: ${window.formatChoice(match.culture)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderMatches(list, bestMatchSlug) {
  resultsGrid.innerHTML = list
    .map((match) => {
      const languageBadges = getPriorityLanguageBadges(match)
        .map((badge) => `<span class="language-badge">${badge}</span>`)
        .join("");

      return `
        <div class="col-12 col-lg-6">
          <article class="suburb-card ${match.slug === bestMatchSlug ? "best-match" : ""}">
            <div class="suburb-card-header">
              <div>
                <span class="result-city-label">${match.city}</span>
                <h3>${match.suburb}</h3>
              </div>

              <div class="match-badge-box">
                <span>MATCH</span>
                <strong>${match.score}%</strong>
              </div>
            </div>

            <p class="suburb-card-copy">${match.description}</p>

            <div class="suburb-badge-row">
              ${languageBadges}
              <span class="connection-badge">${getCultureConnectionLabel(match)}</span>
            </div>

            <div class="suburb-stat-grid">
              <div class="suburb-stat-box">
                <span>Your budget</span>
                <strong>$${preferences.budget}/week</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Your housing</span>
                <strong>${window.formatChoice(preferences.housing)}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Your commute</span>
                <strong>${window.formatChoice(preferences.commute)}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Your lifestyle</span>
                <strong>${window.formatChoice(preferences.lifestyle)}</strong>
              </div>
            </div>

            <div class="suburb-tag-row">
              ${(match.lifestyleTags || [])
                .slice(0, 3)
                .map((tag) => `<span class="result-tag-lite">${tag}</span>`)
                .join("")}
            </div>

            <ul class="result-reason-list compact-list">
              ${match.reasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("")}
            </ul>

            <button class="btn ss-btn ss-btn-secondary w-100 view-details-btn" data-slug="${match.slug}">
              View Details
            </button>
          </article>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem("settlesmart_sort", appState.sortBy);
      window.location.href = `suburb.html?slug=${button.dataset.slug}`;
    });
  });
}

/* ===== Spin wheel ===== */

function renderSpinWheel(items) {
  if (!spinWheelPanel || !shortlistWheel || !wheelCandidates || !spinWheelBtn || !viewWinnerBtn || !spinWheelResult) {
    return;
  }

  wheelState.items = items;
  wheelState.winner = null;

  if (!items.length) {
    spinWheelPanel.classList.add("hidden");
    return;
  }

  spinWheelPanel.classList.remove("hidden");

  wheelCandidates.innerHTML = items
    .map((item) => `<span class="wheel-candidate-pill">${item.suburb}</span>`)
    .join("");

  spinWheelResult.classList.add("hidden");
  spinWheelResult.innerHTML = "";
  viewWinnerBtn.disabled = true;

  drawWheel();

  if (!wheelState.listenersBound) {
    spinWheelBtn.addEventListener("click", spinWheel);

    viewWinnerBtn.addEventListener("click", () => {
      if (!wheelState.winner) return;
      window.location.href = `suburb.html?slug=${wheelState.winner.slug}`;
    });

    wheelState.listenersBound = true;
  }
}

function drawWheel() {
  const canvas = shortlistWheel;
  const ctx = canvas.getContext("2d");
  const items = wheelState.items;

  if (!ctx || !items.length) return;

  const size = canvas.width;
  const center = size / 2;
  const radius = center - 16;
  const anglePerItem = (Math.PI * 2) / items.length;

  const segmentThemes = [
    ["#735cff", "#8b72ff"],
    ["#5f49f2", "#7b68ff"],
    ["#8d67ff", "#a78bfa"],
    ["#5542d5", "#735cff"],
    ["#6d59ff", "#8f7bff"],
    ["#4f3cc7", "#735cff"]
  ];

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(wheelState.rotation);

  items.forEach((item, index) => {
    const start = index * anglePerItem;
    const end = start + anglePerItem;

    const [colorA, colorB] = segmentThemes[index % segmentThemes.length];
    const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(start + anglePerItem / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 16px Inter";
    ctx.fillText(item.suburb, radius - 22, 6);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "#735cff";
  ctx.fill();

  ctx.restore();
}

function spinWheel() {
  if (wheelState.spinning || !wheelState.items.length) return;

  wheelState.spinning = true;
  spinWheelBtn.disabled = true;
  viewWinnerBtn.disabled = true;

  const startRotation = wheelState.rotation;
  const extraTurns = Math.PI * 2 * (5 + Math.random() * 2);
  const endRotation = startRotation + extraTurns + Math.random() * Math.PI * 2;
  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    wheelState.rotation = startRotation + (endRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    wheelState.winner = getWheelWinner();
    wheelState.spinning = false;
    spinWheelBtn.disabled = false;
    viewWinnerBtn.disabled = false;

    spinWheelResult.classList.remove("hidden");
    spinWheelResult.innerHTML = `
      <strong>${wheelState.winner.suburb}</strong> was selected for your first visit.
      <div class="mt-2">
        <span class="result-tag-lite">Match ${wheelState.winner.score}%</span>
        <span class="result-tag-lite">${wheelState.winner.city}</span>
      </div>
    `;
  }

  requestAnimationFrame(animate);
}

function getWheelWinner() {
  const items = wheelState.items;
  const anglePerItem = (Math.PI * 2) / items.length;

  let normalized = wheelState.rotation % (Math.PI * 2);
  if (normalized < 0) normalized += Math.PI * 2;

  const pointerAngle = (Math.PI * 1.5 - normalized + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor(pointerAngle / anglePerItem) % items.length;

  return items[index];
}

/* ===== Community explorer ===== */

function renderCommunityExplorer() {
  updateCommunityTabs();

  const filtered = getFilteredCommunityList();
  renderCommunityMap(filtered);

  if (!filtered.length) {
    communityViewTitle.innerHTML = `
      <h3>No shortlist suburbs match that language search</h3>
      <p class="muted-line">Try another language or clear the search field.</p>
    `;

    cultureList.className = "community-content-grid";
    cultureList.innerHTML = `
      <div class="community-empty-state">
        <h4>No suburbs match that search</h4>
        <p>Try another language or remove the search term.</p>
      </div>
    `;
    return;
  }

  if (appState.activeTab === "culture") {
    renderCultureFitView(filtered);
  } else if (appState.activeTab === "compare") {
    renderCompareView(filtered);
  } else {
    renderExploreView(filtered);
  }
}

function updateCommunityTabs() {
  communityTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.communityTab === appState.activeTab);
  });
}

function getFilteredCommunityList() {
  if (!appState.search) return [...appState.rankedSuburbs];

  return appState.rankedSuburbs.filter((suburb) =>
    suburb.commonLanguages.some((language) => language.toLowerCase().includes(appState.search))
  );
}

function renderExploreView(list) {
  communityViewTitle.innerHTML = `
    <h3>Community and language signals from your shortlist</h3>
    <p class="muted-line">Explore language familiarity, multicultural signals, and community comfort across your shortlisted suburbs.</p>
  `;

  cultureList.className = "community-content-grid community-explore-grid";
  cultureList.innerHTML = list
    .map((suburb) => {
      const community = getCommunityData(suburb);

      return `
        <article class="community-card">
          <div class="community-card-head">
            <div>
              <h4>${suburb.suburb}</h4>
              <span class="result-city-label">${suburb.city}</span>
            </div>
            <span class="community-score">Culture fit ${getCultureFitScore(suburb)}/10</span>
          </div>

          <div class="suburb-badge-row">
            ${getPriorityLanguageBadges(suburb)
              .map((badge) => `<span class="language-badge">${badge}</span>`)
              .join("")}
            <span class="connection-badge">${getCultureConnectionLabel(suburb)}</span>
          </div>

          <p class="muted-line">Common language cues: ${suburb.commonLanguages.join(", ")}</p>

          <div class="community-metric-row">
            <span class="community-metric-pill">Community strength: ${community.communityStrength}%</span>
            <span class="community-metric-pill">Overseas-born share: ${community.overseasBornShare}</span>
            <span class="community-metric-pill">Shops: ${community.specialtyShops}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCultureFitView(list) {
  const ranked = [...list].sort((a, b) => getCultureFitScore(b) - getCultureFitScore(a));

  communityViewTitle.innerHTML = `
    <h3>${preferences.culture ? `${preferences.culture} community fit` : "Culture fit ranking"}</h3>
    <p class="muted-line">Ranked by language familiarity, community strength, and multicultural support signals.</p>
  `;

  cultureList.className = "community-content-grid community-rank-list";
  cultureList.innerHTML = ranked
    .map((suburb, index) => {
      const community = getCommunityData(suburb);

      return `
        <article class="community-rank-card">
          <div class="rank-number-box">#${index + 1}</div>

          <div class="rank-content-block">
            <div class="community-card-head mb-2">
              <div>
                <h4>${suburb.suburb}</h4>
                <span class="result-city-label">${suburb.city}</span>
              </div>
              <span class="community-score">Culture fit ${getCultureFitScore(suburb)}/10</span>
            </div>

            <div class="suburb-badge-row">
              ${getPriorityLanguageBadges(suburb)
                .map((badge) => `<span class="language-badge">${badge}</span>`)
                .join("")}
              <span class="connection-badge">${getCultureConnectionLabel(suburb)}</span>
            </div>

            <div class="community-rank-metrics">
              <div class="suburb-stat-box">
                <span>Community strength</span>
                <strong>${community.communityStrength}%</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Overseas-born</span>
                <strong>${community.overseasBornShare}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Specialty shops</span>
                <strong>${community.specialtyShops}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Places of worship</span>
                <strong>${community.placesOfWorship}</strong>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCompareView(list) {
  const compareList = [...list]
    .sort((a, b) => getCultureFitScore(b) - getCultureFitScore(a))
    .slice(0, 3);

  communityViewTitle.innerHTML = `
    <h3>Compare community comfort side by side</h3>
    <p class="muted-line">Use this quick view to compare your strongest suburbs on culture and language support.</p>
  `;

  cultureList.className = "community-content-grid community-compare-grid";
  cultureList.innerHTML = compareList
    .map((suburb) => {
      const community = getCommunityData(suburb);

      return `
        <article class="community-compare-card">
          <span class="result-city-label">${suburb.city}</span>
          <h4>${suburb.suburb}</h4>

          <div class="suburb-badge-row mb-3">
            ${getPriorityLanguageBadges(suburb)
              .slice(0, 2)
              .map((badge) => `<span class="language-badge">${badge}</span>`)
              .join("")}
          </div>

          <div class="compare-line"><span>Culture fit</span><strong>${getCultureFitScore(suburb)}/10</strong></div>
          <div class="compare-line"><span>Community strength</span><strong>${community.communityStrength}%</strong></div>
          <div class="compare-line"><span>Overseas-born share</span><strong>${community.overseasBornShare}</strong></div>
          <div class="compare-line"><span>Shops</span><strong>${community.specialtyShops}</strong></div>
          <div class="compare-line"><span>Worship places</span><strong>${community.placesOfWorship}</strong></div>
        </article>
      `;
    })
    .join("");
}

function renderCommunityMap(list) {
  if (!communityMap) return;

  if (!appState.showMap) {
    communityMap.classList.add("hidden");
    communityMap.innerHTML = "";
    return;
  }

  communityMap.classList.remove("hidden");
  communityMap.innerHTML = `
    <div class="community-map-card">
      <h4>Community density guide</h4>
      <p class="muted-line">Prototype density view based on the shortlisted suburbs in your selected city.</p>

      ${list
        .slice(0, 5)
        .map((suburb) => {
          const community = getCommunityData(suburb);

          return `
            <div class="density-row">
              <div class="density-head">
                <strong>${suburb.suburb}</strong>
                <span>${community.communityStrength}%</span>
              </div>
              <div class="density-bar"><span style="width:${community.communityStrength}%"></span></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function getCultureFitScore(suburb) {
  let score = 6;

  if (suburb.culture === "high") score += 2;
  if (suburb.culture === "medium") score += 1;

  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
    score += 1;
  }

  if (preferences.culture && suburb.culturalGroups?.includes(preferences.culture)) {
    score += 1;
  }

  if (suburb.recentArrival === "strong") {
    score += 1;
  }

  return Math.min(score, 10);
}

function getPriorityLanguageBadges(suburb) {
  const badges = [];

  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
    badges.push(`${preferences.language} spoken`);
  }

  suburb.commonLanguages.forEach((language) => {
    if (badges.length < 3 && !badges.includes(language) && !badges.includes(`${language} spoken`)) {
      badges.push(language);
    }
  });

  return badges.slice(0, 3);
}

function getCultureConnectionLabel(suburb) {
  if (preferences.culture && suburb.culturalGroups?.includes(preferences.culture)) {
    return `Strong ${preferences.culture} community`;
  }

  if (preferences.language && suburb.commonLanguages.includes(preferences.language)) {
    return `${preferences.language} spoken here`;
  }

  if (suburb.culture === "high") return "High cultural diversity";
  if (suburb.culture === "medium") return "Growing multicultural mix";
  return "Emerging community support";
}

function getCommunityData(suburb) {
  if (typeof window.getEpic4CommunityData === "function") {
    return window.getEpic4CommunityData(suburb);
  }

  return {
    communityStrength: suburb.culture === "high" ? 82 : suburb.culture === "medium" ? 68 : 54,
    overseasBornShare: suburb.culture === "high" ? "42%" : suburb.culture === "medium" ? "31%" : "22%",
    specialtyShops: suburb.culture === "high" ? "6+" : "3+",
    placesOfWorship: suburb.culture === "high" ? "3+" : "1+"
  };
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