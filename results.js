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
  recommendBy: "overall",
  rankedSuburbs: [],
  activeTab: "explore",
  search: "",
  showMap: false,
  currentPage: 1,
  pageSize: 4,
  suburbQuery: "",
  view: "summary",
  compareSlugs: JSON.parse(localStorage.getItem("settlesmart_compare_slugs") || "[]"),
  compareMessage: null
};

const resultsHeroBanner = document.getElementById("resultsHeroBanner");
const resultsHeroTitle = document.getElementById("resultsHeroTitle");
const resultsSummary = document.getElementById("resultsSummary");
const topMatchPanel = document.getElementById("topMatchPanel");
const resultsGrid = document.getElementById("resultsGrid");
const resultsPagination = document.getElementById("resultsPagination");
const suburbSearch = document.getElementById("suburbSearch");
const sortSelect = document.getElementById("sortSelect");
const recommendationSelect = document.getElementById("recommendationSelect");
const resultsCount = document.getElementById("resultsCount");

/* ===== Epic 7 comparison refs ===== */
const comparisonPanel = document.getElementById("comparisonPanel");
const comparisonCounter = document.getElementById("comparisonCounter");
const comparisonTray = document.getElementById("comparisonTray");
const customComparePicker = document.getElementById("customComparePicker");
const customCompareInput = document.getElementById("customCompareInput");
const customCompareValue = document.getElementById("customCompareValue");
const customCompareToggle = document.getElementById("customCompareToggle");
const customCompareMenu = document.getElementById("customCompareMenu");
const customCompareAddBtn = document.getElementById("customCompareAddBtn");
const comparisonFeedback = document.getElementById("comparisonFeedback");
const renderComparisonBtn = document.getElementById("renderComparisonBtn");
const clearComparisonBtn = document.getElementById("clearComparisonBtn");
const comparisonTableWrap = document.getElementById("comparisonTableWrap");

const summaryView = document.getElementById("summaryView");
const detailView = document.getElementById("detailView");
const viewMoreBtn = document.getElementById("viewMoreBtn");
const backToTopMatchBtn = document.getElementById("backToTopMatchBtn");

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

const DEFAULT_SHORTLIST_LIMIT = 20;
const COMPARE_LIMIT = 4;
const COMPARE_STORAGE_KEY = "settlesmart_compare_slugs";

init();

function init() {
  if (!preferences.city) {
    window.location.href = "index.html";
    return;
  }

  appState.rankedSuburbs = rankSuburbs();
  appState.compareSlugs = sanitizeCompareSlugs(appState.compareSlugs);
  saveCompareSelection();
  setupComparisonHandlers();

  if (sortSelect) {
    sortSelect.value = appState.sortBy;
    sortSelect.addEventListener("change", handleSortChange);
  }

  if (recommendationSelect) {
    recommendationSelect.value = appState.recommendBy;
    recommendationSelect.addEventListener("change", (e) => {
      appState.recommendBy = e.target.value;
      appState.currentPage = 1;
      appState.rankedSuburbs = rankSuburbs();
      appState.compareSlugs = sanitizeCompareSlugs(appState.compareSlugs);
      saveCompareSelection();
      renderPage();
    });
  }

  if (suburbSearch) {
    suburbSearch.value = appState.suburbQuery;

    suburbSearch.addEventListener("input", (event) => {
      appState.suburbQuery = event.target.value.trim().toLowerCase();
      appState.currentPage = 1;
      renderPage();
    });
  }

  if (communityTabs.length) {
    communityTabs.forEach((button) => {
      button.addEventListener("click", () => {
        appState.activeTab = button.dataset.communityTab;
        renderCommunityExplorer();
      });
    });
  }

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

  if (viewMoreBtn) {
    viewMoreBtn.addEventListener("click", () => {
      setResultsView("detail");
    });
  }

  if (backToTopMatchBtn) {
    backToTopMatchBtn.addEventListener("click", () => {
      setResultsView("summary");
    });
  }

  renderPage();
}

function rankSuburbs() {
  return window.suburbs
    .filter((suburb) => suburb.city === preferences.city)
    .map((suburb) => ({
      ...suburb,
      score: getScoreByMode(suburb),
      reasons: window.buildReasonList(suburb, preferences)
    }))
    .sort((a, b) => b.score - a.score);
}

function getMatchBadgeTone(score) {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function getScoreByMode(suburb) {
  switch (appState.recommendBy) {
    case "community": {
      // Score based purely on language + culture match + recentArrival
      let s = 0;
      if (preferences.language && suburb.commonLanguages?.includes(preferences.language)) s += 35;
      if (preferences.culture && suburb.culturalGroups?.includes(preferences.culture)) s += 35;
      if (suburb.culture === "high") s += 20;
      else if (suburb.culture === "medium") s += 10;
      if (suburb.recentArrival === "strong") s += 10;
      return Math.min(s, 100);
    }
    case "university": {
      // Score based purely on university proximity
      const uniScore = typeof window.getEpic5UniversityAccessScore === "function"
        ? window.getEpic5UniversityAccessScore(suburb, preferences)
        : 0;
      return Math.round((uniScore / 10) * 100);
    }
    case "overall":
    default:
      return window.getSuburbScore(suburb, preferences);
  }
}

function getSortedShortlistForDisplay() {
  const hasSearch = !!appState.suburbQuery;

  if (hasSearch) {
    return applySort(
      getFilteredShortlist(appState.rankedSuburbs),
      appState.sortBy
    );
  }

  return applySort(
    appState.rankedSuburbs.slice(0, DEFAULT_SHORTLIST_LIMIT),
    appState.sortBy
  );
}

function getCurrentPageSuburbs() {
  const sorted = getSortedShortlistForDisplay();
  const totalPages = sorted.length ? Math.ceil(sorted.length / appState.pageSize) : 0;

  if (totalPages === 0) return [];

  const safePage = Math.min(Math.max(appState.currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * appState.pageSize;

  return sorted.slice(startIndex, startIndex + appState.pageSize);
}

function renderPage() {
  const sorted = getSortedShortlistForDisplay();
  const totalPages = sorted.length ? Math.ceil(sorted.length / appState.pageSize) : 0;

  if (totalPages === 0) {
    appState.currentPage = 1;
  } else {
    if (appState.currentPage > totalPages) appState.currentPage = totalPages;
    if (appState.currentPage < 1) appState.currentPage = 1;
  }

  const currentPageItems = getCurrentPageSuburbs();
  const bestMatch = appState.rankedSuburbs[0] || null;
  const topWheelItems = appState.rankedSuburbs.slice(0, 4);

  renderHero();
  renderTopMatch(bestMatch);
  renderMatches(currentPageItems, bestMatch ? bestMatch.slug : "");
  renderPagination(totalPages);
  renderSpinWheel(topWheelItems);
  renderComparisonPanel();

  if (resultsCount) {
    if (appState.suburbQuery) {
      resultsCount.textContent = `${sorted.length} suburbs found`;
    } else {
      resultsCount.textContent = `Top ${sorted.length} suburbs`;
    }
  }

  setResultsView(appState.view);
}

function handleSortChange(event) {
  appState.sortBy = event.target.value;
  appState.currentPage = 1;
  localStorage.setItem("settlesmart_sort", appState.sortBy);
  renderPage();
}

function renderHero() {
  const heroImage = cityHeroImages[preferences.city] || cityHeroImages.Melbourne;

  if (resultsHeroBanner) {
    resultsHeroBanner.style.backgroundImage = `url('${heroImage}')`;
  }

  resultsHeroTitle.textContent = `Your ${preferences.city} shortlist is ready.`;

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

        <div class="suburb-card-actions">
          <button
            class="btn ss-btn ss-btn-secondary view-details-btn"
            id="topMatchViewDetailsBtn"
            data-slug="${match.slug}"
          >
            View Details
          </button>
          <button
            class="btn ss-btn ss-btn-primary compare-toggle-btn"
            type="button"
            data-compare-slug="${match.slug}"
            data-open-comparison="true"
          >
            Compare +
          </button>
        </div>
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
  if (!list.length) {
    resultsGrid.innerHTML = `
      <div class="col-12">
        <div class="info-card p-4">
          <h3 class="mb-2">No suburbs found</h3>
        </div>
      </div>
    `;
    return;
  }

  resultsGrid.innerHTML = list
    .map((match) => {
      return `
        <div class="col-12 col-lg-6">
          <article class="suburb-card shortlist-clean-card ${match.slug === bestMatchSlug ? "best-match" : ""}">
            <div class="suburb-card-header">
              <div class="suburb-card-title-wrap">
                <span class="result-city-label">${match.city}</span>
                <h3>${match.suburb}</h3>
              </div>

              <div class="match-badge-box match-badge-box--${getMatchBadgeTone(match.score)}">
                <span>MATCH</span>
                <strong>${match.score}%</strong>
              </div>
            </div>

            <p class="suburb-card-copy">${match.description}</p>

            <div class="suburb-stat-grid">
              <div class="suburb-stat-box">
                <span>Rent range</span>
                <strong>${match.rentRange || "Not available"}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Transport</span>
                <strong>${window.formatChoice(match.transport)}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>University access</span>
                <strong>${window.formatChoice(match.university)}</strong>
              </div>
              <div class="suburb-stat-box">
                <span>Language comfort</span>
                <strong>${match.commonLanguages?.slice(0, 2).join(", ") || "Not available"}</strong>
              </div>
            </div>

            <div class="suburb-card-actions">
              <button class="btn ss-btn ss-btn-secondary view-details-btn" data-slug="${match.slug}">
                View Details
              </button>
              <button class="btn ss-btn ss-btn-primary compare-toggle-btn" type="button" data-compare-slug="${match.slug}">
                Compare +
              </button>
            </div>
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

function renderPagination(totalPages) {
  if (!resultsPagination) return;

  if (totalPages <= 1) {
    resultsPagination.innerHTML = "";
    return;
  }

  const visibleItems = getVisiblePaginationItems(totalPages, appState.currentPage);

  const html = visibleItems
    .map((item) => {
      if (item === "ellipsis") {
        return `<span class="pagination-ellipsis">...</span>`;
      }

      return `
        <button
          class="pagination-btn ${item === appState.currentPage ? "active" : ""}"
          data-page="${item}"
        >
          ${item}
        </button>
      `;
    })
    .join("");

  resultsPagination.innerHTML = html;

  resultsPagination.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page);

      if (nextPage !== appState.currentPage) {
        appState.currentPage = nextPage;
        renderPage();
      }
    });
  });
}

function getVisiblePaginationItems(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1
  ]);

  const validPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items = [];

  for (let i = 0; i < validPages.length; i++) {
    const page = validPages[i];
    const prev = validPages[i - 1];

    if (i > 0 && page - prev > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  }

  return items;
}


/* ===== Epic 7: Side-by-side comparison and shortlist ===== */

function setupComparisonHandlers() {
  if (customCompareInput) {
    customCompareInput.addEventListener("input", () => {
      if (customCompareValue) customCompareValue.value = "";
      renderCustomCompareMenu(customCompareInput.value, true);
      updateCustomCompareAddState();
    });

    customCompareInput.addEventListener("focus", () => {
      renderCustomCompareMenu(customCompareInput.value, true);
      updateCustomCompareAddState();
    });

    customCompareInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCustomCompareAdd();
      }

      if (event.key === "Escape") {
        closeCustomCompareMenu();
      }
    });
  }

  if (customCompareToggle) {
    customCompareToggle.addEventListener("click", () => {
      if (!customCompareMenu || customCompareToggle.disabled) return;

      const shouldOpen = customCompareMenu.classList.contains("hidden");
      if (shouldOpen) {
        customCompareInput?.focus();
        renderCustomCompareMenu(customCompareInput?.value || "", true);
      } else {
        closeCustomCompareMenu();
      }
    });
  }

  if (customCompareMenu) {
    customCompareMenu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-custom-compare-slug]");
      if (!option) return;
      selectCustomCompareSuburb(option.dataset.customCompareSlug);
    });
  }

  if (customCompareAddBtn) {
    customCompareAddBtn.addEventListener("click", handleCustomCompareAdd);
  }

  document.addEventListener("click", (event) => {
    if (!customComparePicker || customComparePicker.contains(event.target)) return;
    closeCustomCompareMenu();
  });

  if (comparisonTray) {
    comparisonTray.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove-compare-slug]");
      if (!removeButton) return;
      removeSuburbFromCompare(removeButton.dataset.removeCompareSlug);
    });
  }

  if (renderComparisonBtn) {
    renderComparisonBtn.addEventListener("click", () => {
      if (appState.compareSlugs.length < 2) {
        setComparisonMessage("Select at least 2 suburbs to compare side by side.", "warning");
        return;
      }

      appState.compareMessage = null;
      renderComparisonPanel(true);
      comparisonTableWrap?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (clearComparisonBtn) {
    clearComparisonBtn.addEventListener("click", () => {
      appState.compareSlugs = [];
      appState.compareMessage = { text: "Comparison shortlist cleared.", type: "info" };
      saveCompareSelection();
      clearCustomCompareInput();
      renderComparisonPanel(false);
      updateCompareButtonStates();
    });
  }

  if (comparisonTableWrap) {
    comparisonTableWrap.addEventListener("click", (event) => {
      const detailsButton = event.target.closest("[data-comparison-detail-slug]");
      if (!detailsButton) return;
      localStorage.setItem("settlesmart_sort", appState.sortBy);
      window.location.href = `suburb.html?slug=${detailsButton.dataset.comparisonDetailSlug}`;
    });
  }
}

function renderComparisonPanel(forceTable = false) {
  if (!comparisonPanel) return;

  const selectedSuburbs = getSelectedCompareSuburbs();
  const shouldShowTable = forceTable || (comparisonTableWrap && !comparisonTableWrap.classList.contains("hidden") && selectedSuburbs.length >= 2);

  if (comparisonCounter) {
    comparisonCounter.textContent = `${selectedSuburbs.length} / ${COMPARE_LIMIT} selected`;
  }

  renderComparisonTray(selectedSuburbs);
  renderCustomCompareOptions();
  renderComparisonFeedback();
  bindCompareButtons();
  updateCompareButtonStates();

  if (renderComparisonBtn) {
    renderComparisonBtn.disabled = selectedSuburbs.length < 2;
  }

  if (clearComparisonBtn) {
    clearComparisonBtn.disabled = selectedSuburbs.length === 0;
  }

  if (shouldShowTable && selectedSuburbs.length >= 2) {
    renderComparisonTable(selectedSuburbs);
  } else if (comparisonTableWrap) {
    comparisonTableWrap.classList.add("hidden");
    comparisonTableWrap.innerHTML = "";
  }
}

function renderComparisonTray(selectedSuburbs) {
  if (!comparisonTray) return;

  if (!selectedSuburbs.length) {
    comparisonTray.innerHTML = `
      <div class="comparison-empty-state">
        No suburbs selected yet. Use <strong>Compare +</strong> on any result card to start.
      </div>
    `;
    return;
  }

  comparisonTray.innerHTML = selectedSuburbs
    .map((suburb) => `
      <span class="comparison-chip">
        <span>${suburb.suburb}</span>
        <button type="button" aria-label="Remove ${suburb.suburb}" data-remove-compare-slug="${suburb.slug}">×</button>
      </span>
    `)
    .join("");
}

function renderCustomCompareOptions() {
  const options = getCustomCompareOptions();
  const limitReached = appState.compareSlugs.length >= COMPARE_LIMIT;
  const disabled = limitReached || !options.length;

  if (customCompareInput) {
    customCompareInput.disabled = disabled;
    customCompareInput.placeholder = limitReached
      ? `Maximum ${COMPARE_LIMIT} suburbs selected`
      : options.length
        ? "Type or choose a suburb"
        : "No more suburbs available";
  }

  if (customCompareToggle) {
    customCompareToggle.disabled = disabled;
  }

  if (customCompareValue?.value && !options.some((suburb) => suburb.slug === customCompareValue.value)) {
    clearCustomCompareInput();
  }

  renderCustomCompareMenu(customCompareInput?.value || "", false);
  updateCustomCompareAddState();
}

function getCustomCompareOptions() {
  const selected = new Set(appState.compareSlugs);
  const selectedCity = normalizeCompareSearch(preferences.city);

  return appState.rankedSuburbs
    .filter((suburb) => normalizeCompareSearch(suburb.city) === selectedCity)
    .filter((suburb) => !selected.has(suburb.slug))
    .sort((a, b) => a.suburb.localeCompare(b.suburb));
}

function renderCustomCompareMenu(query = "", forceOpen = false) {
  if (!customCompareMenu) return;

  const options = getCustomCompareOptions();
  const limitReached = appState.compareSlugs.length >= COMPARE_LIMIT;
  const normalizedQuery = normalizeCompareSearch(query);
  const visibleOptions = normalizedQuery
    ? options.filter((suburb) => normalizeCompareSearch(suburb.suburb).includes(normalizedQuery))
    : options;
  const cityLabel = preferences.city || "your selected city";

  if (limitReached) {
    customCompareMenu.innerHTML = `<div class="custom-suburb-empty">Remove a suburb before adding another.</div>`;
  } else if (!options.length) {
    customCompareMenu.innerHTML = `<div class="custom-suburb-empty">No more suburbs available for ${cityLabel}.</div>`;
  } else if (!visibleOptions.length) {
    customCompareMenu.innerHTML = `<div class="custom-suburb-empty">No matching suburb found in ${cityLabel}. Try another spelling.</div>`;
  } else {
    customCompareMenu.innerHTML = visibleOptions.map((suburb) => `
      <button
        type="button"
        class="custom-suburb-option"
        data-custom-compare-slug="${suburb.slug}"
        role="option"
      >
        <span>${suburb.suburb}</span>
      </button>
    `).join("");
  }

  const shouldShow = forceOpen && !limitReached && !!options.length;
  customCompareMenu.classList.toggle("hidden", !shouldShow);
  customCompareInput?.setAttribute("aria-expanded", shouldShow ? "true" : "false");
}

function selectCustomCompareSuburb(slug) {
  const suburb = getCustomCompareOptions().find((item) => item.slug === slug);
  if (!suburb) return;

  if (customCompareInput) customCompareInput.value = suburb.suburb;
  if (customCompareValue) customCompareValue.value = suburb.slug;

  closeCustomCompareMenu();
  updateCustomCompareAddState();
}

function handleCustomCompareAdd() {
  const slug = resolveCustomCompareSlug();

  if (!slug) {
    const query = customCompareInput?.value.trim() || "";

    if (!query) {
      setComparisonMessage("Type a suburb name or choose one from the suggestions before adding it.", "info");
    } else {
      setComparisonMessage("Please choose one matching suburb from the suggestions before adding it.", "warning");
      renderCustomCompareMenu(query, true);
    }

    return;
  }

  addSuburbToCompare(slug, "Custom suburb added to your comparison shortlist.", { clearCustomInput: true });
}

function resolveCustomCompareSlug() {
  const options = getCustomCompareOptions();
  const selectedSlug = customCompareValue?.value || "";

  if (selectedSlug && options.some((suburb) => suburb.slug === selectedSlug)) {
    return selectedSlug;
  }

  const query = normalizeCompareSearch(customCompareInput?.value || "");
  if (!query) return "";

  const exactMatch = options.find((suburb) => normalizeCompareSearch(suburb.suburb) === query);
  if (exactMatch) return exactMatch.slug;

  const startsWithMatches = options.filter((suburb) => normalizeCompareSearch(suburb.suburb).startsWith(query));
  if (startsWithMatches.length === 1) return startsWithMatches[0].slug;

  const containsMatches = options.filter((suburb) => normalizeCompareSearch(suburb.suburb).includes(query));
  return containsMatches.length === 1 ? containsMatches[0].slug : "";
}

function updateCustomCompareAddState() {
  if (!customCompareAddBtn) return;

  const options = getCustomCompareOptions();
  const limitReached = appState.compareSlugs.length >= COMPARE_LIMIT;
  const hasTypedValue = !!(customCompareInput?.value.trim() || customCompareValue?.value);
  customCompareAddBtn.disabled = limitReached || !options.length || !hasTypedValue;
}

function clearCustomCompareInput() {
  if (customCompareInput) customCompareInput.value = "";
  if (customCompareValue) customCompareValue.value = "";
  closeCustomCompareMenu();
}

function closeCustomCompareMenu() {
  customCompareMenu?.classList.add("hidden");
  customCompareInput?.setAttribute("aria-expanded", "false");
}

function normalizeCompareSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function renderComparisonFeedback() {
  if (!comparisonFeedback) return;

  if (!appState.compareMessage) {
    comparisonFeedback.classList.add("hidden");
    comparisonFeedback.innerHTML = "";
    comparisonFeedback.className = "comparison-feedback hidden";
    return;
  }

  comparisonFeedback.className = `comparison-feedback comparison-feedback--${appState.compareMessage.type || "info"}`;
  comparisonFeedback.textContent = appState.compareMessage.text;
}

function renderComparisonTable(selectedSuburbs) {
  if (!comparisonTableWrap) return;

  const rows = buildComparisonRows(selectedSuburbs);

  comparisonTableWrap.classList.remove("hidden");
  comparisonTableWrap.innerHTML = `
    <div class="comparison-table-scroll">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Priority</th>
            ${selectedSuburbs.map((suburb) => `
              <th>
                <div class="comparison-suburb-head">
                  <span>${suburb.city}</span>
                  <strong>${suburb.suburb}</strong>
                  <button class="comparison-detail-link" type="button" data-comparison-detail-slug="${suburb.slug}">View profile</button>
                </div>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <th scope="row">
                <span>${row.label}</span>
                ${row.helper ? `<small>${row.helper}</small>` : ""}
              </th>
              ${row.values.map((value) => `<td>${value}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function buildComparisonRows(selectedSuburbs) {
  return [
    {
      label: "Overall fit",
      helper: "Based on your saved answers",
      values: selectedSuburbs.map((suburb) => `<strong class="comparison-score">${suburb.score}%</strong>`)
    },
    {
      label: "Rent and budget",
      helper: `Your budget: $${preferences.budget || "-"}/week`,
      values: selectedSuburbs.map((suburb) => formatBudgetFit(suburb))
    },
    {
      label: "Housing fit",
      helper: formatChoiceList(preferences.housing),
      values: selectedSuburbs.map((suburb) => formatPreferenceMatch(preferences.housing, suburb.housing, "housing"))
    },
    {
      label: "Commute priority",
      helper: formatChoiceList(preferences.commute),
      values: selectedSuburbs.map((suburb) => formatCommuteFit(suburb))
    },
    {
      label: "Lifestyle match",
      helper: formatChoiceList(preferences.lifestyle),
      values: selectedSuburbs.map((suburb) => formatPreferenceMatch(preferences.lifestyle, suburb.lifestyle, "lifestyle"))
    },
    {
      label: "Language comfort",
      helper: preferences.language || "No language selected",
      values: selectedSuburbs.map((suburb) => formatLanguageFit(suburb))
    },
    {
      label: "Culture and community",
      helper: preferences.culture || "No cultural background selected",
      values: selectedSuburbs.map((suburb) => formatCultureFit(suburb))
    },
    {
      label: "University access",
      helper: preferences.university || "No university selected",
      values: selectedSuburbs.map((suburb) => formatUniversityFit(suburb))
    },
    {
      label: "Safety snapshot",
      helper: "Latest available yearly counts in the prototype data",
      values: selectedSuburbs.map((suburb) => formatSafetySnapshot(suburb))
    },
    {
      label: "Why recommended",
      helper: "Main reasons from the matching model",
      values: selectedSuburbs.map((suburb) => formatReasonSummary(suburb))
    }
  ];
}

function bindCompareButtons() {
  document.querySelectorAll(".compare-toggle-btn").forEach((button) => {
    if (button.dataset.compareBound === "true") return;

    button.addEventListener("click", () => {
      toggleSuburbCompare(button.dataset.compareSlug, {
        openComparison: button.dataset.openComparison === "true"
      });
    });

    button.dataset.compareBound = "true";
  });
}

function updateCompareButtonStates() {
  const selected = new Set(appState.compareSlugs);
  const limitReached = appState.compareSlugs.length >= COMPARE_LIMIT;

  document.querySelectorAll(".compare-toggle-btn").forEach((button) => {
    const isSelected = selected.has(button.dataset.compareSlug);
    button.classList.toggle("selected", isSelected);
    button.disabled = !isSelected && limitReached;
    button.textContent = isSelected ? "Selected ✓" : limitReached ? "Max selected" : "Compare +";
  });
}

function toggleSuburbCompare(slug, options = {}) {
  if (!slug) return;

  if (appState.compareSlugs.includes(slug)) {
    removeSuburbFromCompare(slug, { openComparison: options.openComparison });
    return;
  }

  addSuburbToCompare(slug, "Suburb added to your comparison shortlist.", {
    openComparison: options.openComparison
  });
}

function addSuburbToCompare(slug, successMessage, options = {}) {
  if (!slug) return;

  if (appState.compareSlugs.includes(slug)) {
    setComparisonMessage("This suburb is already in your comparison shortlist.", "info");
    if (options.openComparison) openComparisonSection();
    return;
  }

  if (appState.compareSlugs.length >= COMPARE_LIMIT) {
    setComparisonMessage(`You can compare up to ${COMPARE_LIMIT} suburbs at once. Remove one to add another.`, "warning");
    if (options.openComparison) openComparisonSection();
    return;
  }

  const suburb = getRankedSuburbBySlug(slug);
  if (!suburb) {
    setComparisonMessage("That suburb is not available in the current city shortlist.", "warning");
    if (options.openComparison) openComparisonSection();
    return;
  }

  appState.compareSlugs.push(slug);
  appState.compareMessage = { text: successMessage || "Suburb added.", type: "success" };
  saveCompareSelection();

  if (options.clearCustomInput) {
    clearCustomCompareInput();
  }

  renderComparisonPanel(false);

  if (options.openComparison) {
    openComparisonSection();
  }
}

function removeSuburbFromCompare(slug, options = {}) {
  appState.compareSlugs = appState.compareSlugs.filter((item) => item !== slug);
  appState.compareMessage = { text: "Suburb removed from comparison.", type: "info" };
  saveCompareSelection();
  renderComparisonPanel(appState.compareSlugs.length >= 2);

  if (options.openComparison) {
    openComparisonSection();
  }
}

function openComparisonSection() {
  setResultsView("detail");

  window.setTimeout(() => {
    comparisonPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function setComparisonMessage(text, type = "info") {
  appState.compareMessage = { text, type };
  renderComparisonPanel(false);
}

function saveCompareSelection() {
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(appState.compareSlugs));
}

function sanitizeCompareSlugs(slugs) {
  const allowed = new Set(appState.rankedSuburbs.map((suburb) => suburb.slug));
  const clean = [];

  (Array.isArray(slugs) ? slugs : []).forEach((slug) => {
    if (allowed.has(slug) && !clean.includes(slug) && clean.length < COMPARE_LIMIT) {
      clean.push(slug);
    }
  });

  return clean;
}

function getSelectedCompareSuburbs() {
  appState.compareSlugs = sanitizeCompareSlugs(appState.compareSlugs);
  return appState.compareSlugs
    .map((slug) => getRankedSuburbBySlug(slug))
    .filter(Boolean);
}

function getRankedSuburbBySlug(slug) {
  return appState.rankedSuburbs.find((suburb) => suburb.slug === slug) || null;
}

function parseRentRange(rentRange) {
  const numbers = String(rentRange || "").match(/\d+/g);
  if (!numbers || numbers.length < 2) return null;
  return {
    min: Number(numbers[0]),
    max: Number(numbers[1])
  };
}

function formatBudgetFit(suburb) {
  const budget = Number(preferences.budget || 0);
  const range = parseRentRange(suburb.rentRange);

  if (!range || !budget) {
    return `${suburb.rentRange || "Not available"}<br><span class="comparison-note">Budget fit cannot be calculated.</span>`;
  }

  if (budget < range.min) {
    return `${suburb.rentRange}<br><span class="comparison-status comparison-status--low">Likely above budget</span>`;
  }

  if (budget <= range.max) {
    return `${suburb.rentRange}<br><span class="comparison-status comparison-status--high">Within your budget range</span>`;
  }

  return `${suburb.rentRange}<br><span class="comparison-status comparison-status--medium">Comfortably under budget</span>`;
}

function formatPreferenceMatch(preferenceList, suburbList, type) {
  const preferencesList = Array.isArray(preferenceList) ? preferenceList : [];
  const options = Array.isArray(suburbList) ? suburbList : [];
  const matches = preferencesList.filter((item) => options.includes(item));

  if (!preferencesList.length) {
    return `<span class="comparison-note">No ${type} preference selected</span>`;
  }

  if (!matches.length) {
    return `<span class="comparison-status comparison-status--low">No direct match</span><br><span class="comparison-note">Available: ${options.map(window.formatChoice).join(", ") || "Not available"}</span>`;
  }

  const statusClass = matches.length === preferencesList.length ? "high" : "medium";
  const label = matches.length === preferencesList.length ? "Strong match" : "Partial match";

  return `<span class="comparison-status comparison-status--${statusClass}">${label}</span><br>${matches.map(window.formatChoice).join(", ")}`;
}

function formatCommuteFit(suburb) {
  const selectedCommute = Array.isArray(preferences.commute) ? preferences.commute : [];

  if (!selectedCommute.length) {
    return `${window.formatChoice(suburb.transport)} transport<br><span class="comparison-note">No commute preference selected</span>`;
  }

  if (suburb.transport === "high") {
    return `${window.formatChoice(suburb.transport)} transport<br><span class="comparison-status comparison-status--high">Strong commute fit</span>`;
  }

  if (suburb.transport === "medium") {
    return `${window.formatChoice(suburb.transport)} transport<br><span class="comparison-status comparison-status--medium">Moderate commute fit</span>`;
  }

  return `${window.formatChoice(suburb.transport)} transport<br><span class="comparison-status comparison-status--low">May need extra planning</span>`;
}

function formatLanguageFit(suburb) {
  const languages = suburb.commonLanguages || [];

  if (!preferences.language) {
    return `${languages.slice(0, 3).join(", ") || "Not available"}<br><span class="comparison-note">No language preference selected</span>`;
  }

  if (languages.includes(preferences.language)) {
    return `<span class="comparison-status comparison-status--high">${preferences.language} supported</span><br>${languages.slice(0, 3).join(", ")}`;
  }

  return `<span class="comparison-status comparison-status--medium">Other languages available</span><br>${languages.slice(0, 3).join(", ") || "Not available"}`;
}

function formatCultureFit(suburb) {
  const groups = suburb.culturalGroups || [];

  if (preferences.culture && groups.includes(preferences.culture)) {
    return `<span class="comparison-status comparison-status--high">Strong ${preferences.culture} signal</span><br>${groups.slice(0, 3).join(", ")}`;
  }

  if (suburb.culture === "high") {
    return `<span class="comparison-status comparison-status--high">High cultural diversity</span><br>${groups.slice(0, 3).join(", ") || "Multiple community signals"}`;
  }

  if (suburb.culture === "medium") {
    return `<span class="comparison-status comparison-status--medium">Growing community mix</span><br>${groups.slice(0, 3).join(", ") || "Moderate community signals"}`;
  }

  return `<span class="comparison-status comparison-status--low">Limited culture signal</span><br>${groups.slice(0, 3).join(", ") || "Not available"}`;
}

function formatUniversityFit(suburb) {
  const access = window.formatChoice(suburb.university);
  const uniScore = typeof window.getEpic5UniversityAccessScore === "function"
    ? window.getEpic5UniversityAccessScore(suburb, preferences)
    : null;

  if (uniScore === null) {
    return access;
  }

  const statusClass = uniScore >= 8 ? "high" : uniScore >= 5 ? "medium" : "low";
  return `${access}<br><span class="comparison-status comparison-status--${statusClass}">${uniScore}/10 access score</span>`;
}

function formatSafetySnapshot(suburb) {
  const years = getSafetyYears(suburb);
  if (!years.length) return `<span class="comparison-note">Safety data not available</span>`;

  const latestYear = years[years.length - 1];
  const previousYear = years[years.length - 2];
  const latestTotal = getTotalCrimeForYear(suburb, latestYear);
  const previousTotal = previousYear ? getTotalCrimeForYear(suburb, previousYear) : null;
  const trend = previousTotal === null
    ? "Latest available year"
    : latestTotal > previousTotal
      ? "Higher than previous year"
      : latestTotal < previousTotal
        ? "Lower than previous year"
        : "Similar to previous year";

  const statusClass = previousTotal === null ? "medium" : latestTotal <= previousTotal ? "high" : "medium";
  return `${latestYear}: ${latestTotal.toLocaleString()} recorded incidents<br><span class="comparison-status comparison-status--${statusClass}">${trend}</span>`;
}

function getSafetyYears(suburb) {
  const keys = new Set([
    ...Object.keys(suburb.violentCrimesByYear || {}),
    ...Object.keys(suburb.propertyCrimesByYear || {}),
    ...Object.keys(suburb.otherCrimesByYear || {})
  ]);

  return [...keys].sort((a, b) => Number(a) - Number(b));
}

function getTotalCrimeForYear(suburb, year) {
  return Number(suburb.violentCrimesByYear?.[year] || 0)
    + Number(suburb.propertyCrimesByYear?.[year] || 0)
    + Number(suburb.otherCrimesByYear?.[year] || 0);
}

function formatReasonSummary(suburb) {
  const reasons = suburb.reasons || [];
  if (!reasons.length) return `<span class="comparison-note">No reasons available</span>`;

  return `<ul class="comparison-reason-list">${reasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("")}</ul>`;
}

function formatChoiceList(values) {
  if (Array.isArray(values)) {
    return values.length ? values.map(window.formatChoice).join(", ") : "Not selected";
  }

  return values ? window.formatChoice(values) : "Not selected";
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

function trimWheelLine(ctx, text, maxWidth) {
  const source = String(text || "").trim();
  if (!source) return "";

  if (ctx.measureText(source).width <= maxWidth) {
    return source;
  }

  let trimmed = source;

  while (trimmed.length > 0 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  return trimmed ? `${trimmed}…` : "…";
}

function splitWheelLabel(ctx, label, maxWidth, maxLines = 2) {
  const words = String(label || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(trimWheelLine(ctx, word, maxWidth));
      currentLine = "";
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = trimWheelLine(
    ctx,
    lines.slice(maxLines - 1).join(" "),
    maxWidth
  );

  return visibleLines;
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
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 16px Inter";

    const maxTextWidth = radius * 0.56;
    const labelLines = splitWheelLabel(ctx, item.suburb, maxTextWidth, 2);
    const lineHeight = 18;
    const totalHeight = (labelLines.length - 1) * lineHeight;
    const textX = radius - 44;

    labelLines.forEach((line, lineIndex) => {
      const y = (lineIndex * lineHeight) - totalHeight / 2;
      ctx.fillText(line, textX, y);
    });

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
  // Community explorer elements may not exist in the current HTML version
  if (!cultureList) return;

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
  if (!communityTabs.length) return;
  communityTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.communityTab === appState.activeTab);
  });
}

function getFilteredCommunityList() {
  const baseList = getCurrentPageSuburbs();

  if (!appState.search) return [...baseList];

  return baseList.filter((suburb) =>
    suburb.commonLanguages.some((language) =>
      language.toLowerCase().includes(appState.search)
    )
  );
}

function renderExploreView(list) {
  if (!communityViewTitle || !cultureList) return;
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
  if (!communityViewTitle || !cultureList) return;
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
  if (!communityViewTitle || !cultureList) return;
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

function getFilteredShortlist(list) {
  if (!appState.suburbQuery) return [...list];

  return list.filter((suburb) =>
    suburb.suburb.toLowerCase().includes(appState.suburbQuery)
  );
}

function setResultsView(view) {
  appState.view = view;

  if (view === "detail") {
    summaryView?.classList.add("hidden");
    detailView?.classList.remove("hidden");
  } else {
    detailView?.classList.add("hidden");
    summaryView?.classList.remove("hidden");
  }
}