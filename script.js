/*
  SettleSmart - Landing page onboarding flow
  -----------------------------------------
  This file handles Epic 1 (Guided Preference Input).

  DATABASE ADMIN NOTES:
  Replace the sample arrays below with Supabase queries when the suburb dataset is ready.

  Suggested source tables / fields for later integration:
  - cities: city_name, city_slug, hero_image_url, city_subtitle
  - languages: language_name
  - cultures: culture_name

  Suggested query comments for implementation:
  -- SELECT city_name, city_slug, hero_image_url, city_subtitle
  -- FROM cities
  -- WHERE is_active = true
  -- ORDER BY city_name;

  -- SELECT language_name FROM languages ORDER BY language_name;
  -- SELECT culture_name FROM cultures ORDER BY culture_name;
*/

const cities = [
  {
    name: "Melbourne",
    slug: "melbourne",
    subtitle: "Student life, trams, multicultural neighbourhoods",
    image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Sydney",
    slug: "sydney",
    subtitle: "Big-city opportunity, beaches, global networks",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Brisbane",
    slug: "brisbane",
    subtitle: "Warm weather, good growth, easier pace",
    image: "https://images.unsplash.com/photo-1589976567749-2f011d95ffec?q=80&w=735&auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Adelaide",
    slug: "adelaide",
    subtitle: "Calmer lifestyle and student-friendly feel",
    image: "https://plus.unsplash.com/premium_photo-1697730252622-0e1cec87d8c4?q=80&w=1170&auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Perth",
    slug: "perth",
    subtitle: "Spacious, coastal, independent lifestyle",
    image: "https://images.unsplash.com/photo-1574471101497-d958f6e3ebd4?q=80&w=1074&auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Canberra",
    slug: "canberra",
    subtitle: "Safe, planned, academic and policy hub",
    image: "https://images.unsplash.com/photo-1672264597620-d792bb6de88d?q=80&w=1170&auto=format&fit=crop&w=1200&q=80"
  }
];

const languages = [
  "English", "Hindi", "Punjabi", "Gujarati", "Tamil", "Telugu", "Urdu",
  "Vietnamese", "Mandarin", "Cantonese", "Korean", "Japanese", "Arabic",
  "Spanish", "Nepali", "Malayalam", "Bengali", "Thai", "Indonesian", "French"
];

const cultures = [
  "Indian", "Chinese", "Vietnamese", "Pakistani", "Nepalese", "Sri Lankan",
  "Bangladeshi", "Korean", "Japanese", "Middle Eastern", "Latin American",
  "African", "European", "Southeast Asian"
];

const housingOptions = [
  { key: "shared", title: "Shared housing", desc: "Budget-friendly, social, common for students" },
  { key: "studio", title: "Private studio", desc: "More privacy and independence" },
  { key: "apartment", title: "Apartment living", desc: "Close to city hubs and transport" }
];

const commuteOptions = [
  { key: "public-transport", title: "Good public transport", desc: "Easy access to trams, trains, and buses" },
  { key: "bike-walk", title: "Walkable / bike-friendly", desc: "Daily needs within reach" },
  { key: "low-commute", title: "Shorter commute", desc: "Prefer living closer to study or work" }
];

const lifestyleOptions = [
  { key: "cafe", title: "Cafe and social vibe", desc: "More lively and student-active areas" },
  { key: "quiet", title: "Quiet environment", desc: "Less noise and a calmer neighbourhood" },
  { key: "nature", title: "Parks and outdoor access", desc: "Closer to green spaces and open areas" },
  { key: "culture", title: "Strong cultural diversity", desc: "More familiar languages and communities" },
  { key: "food", title: "Food and shopping access", desc: "Convenient for groceries and daily needs" },
  { key: "beach", title: "Coastal lifestyle", desc: "Closer to beaches and open-air living" }
];

const appState = {
  step: 1,
  city: "",
  language: "",
  culture: "",
  budget: 300,
  housing: "",
  commute: "",
  lifestyle: ""
};

const totalSteps = 6;
const stepMeta = {
  1: { label: "Step 1 of 6", title: "Choose your destination city" },
  2: { label: "Step 2 of 6", title: "Language and cultural background" },
  3: { label: "Step 3 of 6", title: "Set your weekly rent budget" },
  4: { label: "Step 4 of 6", title: "Choose your housing style" },
  5: { label: "Step 5 of 6", title: "Tell us your commute preference" },
  6: { label: "Step 6 of 6", title: "Lifestyle priorities and final review" }
};

const stepContent = document.getElementById("stepContent");
const stepLabel = document.getElementById("pageStepLabel");
const stepTitle = document.getElementById("pageStepTitle");
const progressDots = document.getElementById("progressDots");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stepHint = document.getElementById("stepHint");
const heroCityStack = document.getElementById("heroCityStack");
const loadingOverlay = document.getElementById("loadingOverlay");
const shortlistSection = document.getElementById("shortlist-builder");

document.querySelectorAll("[data-scroll-shortlist]").forEach(btn => {
  btn.addEventListener("click", () => {
    shortlistSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

backBtn.addEventListener("click", handleBack);
nextBtn.addEventListener("click", handleNext);
window.addEventListener("resize", renderHeroCards);

function init() {
  renderHeroCards();
  renderProgress();
  renderStep();
}

function renderHeroCards() {
  const [featured, second, third] = [cities[0], cities[1], cities[2]];

  heroCityStack.innerHTML = `
    <div class="hero-showcase-grid">
      <article class="hero-city-card hero-city-card-main" style="background-image:url('${featured.image}')">
        <div class="hero-city-content">
          <span class="city-kicker">Top pick for students</span>
          <h3>${featured.name}</h3>
          <p>${featured.subtitle}</p>
        </div>
      </article>

      <article class="hero-city-card hero-city-card-small" style="background-image:url('${second.image}')">
        <div class="hero-city-content">
          <h3>${second.name}</h3>
          <p>${second.subtitle}</p>
        </div>
      </article>

      <article class="hero-city-card hero-city-card-small" style="background-image:url('${third.image}')">
        <div class="hero-city-content">
          <h3>${third.name}</h3>
          <p>${third.subtitle}</p>
        </div>
      </article>
    </div>
  `;
}

function renderProgress() {
  const meta = stepMeta[appState.step];
  stepLabel.textContent = meta.label;
  stepTitle.textContent = meta.title;

  progressDots.innerHTML = "";
  for (let i = 1; i <= totalSteps; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (i < appState.step) dot.classList.add("done");
    if (i === appState.step) dot.classList.add("active");
    progressDots.appendChild(dot);
  }

  backBtn.style.visibility = appState.step === 1 ? "hidden" : "visible";
  updateNextButtonState();
}

function renderStep() {
  switch (appState.step) {
    case 1: renderCityStep(); break;
    case 2: renderLanguageStep(); break;
    case 3: renderBudgetStep(); break;
    case 4: renderHousingStep(); break;
    case 5: renderCommuteStep(); break;
    case 6: renderLifestyleReviewStep(); break;
    default: renderCityStep();
  }
  renderProgress();
}

function renderCityStep() {
  stepContent.innerHTML = `
    <div class="row g-4 selection-grid" id="cityGrid">
      ${cities.map(city => `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="city-choice ${appState.city === city.name ? "selected" : ""}" data-city="${city.name}" style="background-image:url('${city.image}')">
            <div class="city-info">
              <h3>${city.name}</h3>
              <p>${city.subtitle}</p>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  document.querySelectorAll(".city-choice").forEach(card => {
    card.addEventListener("click", () => { appState.city = card.dataset.city; renderStep(); });
  });
}

function renderLanguageStep() {
  const filteredLanguages = getFilteredLanguages("");
  stepContent.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-lg-6">
        <div class="panel-card">
          <h3 class="section-mini-title">Select your primary language</h3>
          <div class="search-wrap"><input type="text" class="search-input" id="languageSearch" placeholder="Search language e.g. Hindi, Vietnamese" /></div>
          <div class="chips" id="languageChips">
            ${filteredLanguages.map(lang => `<button class="chip ${appState.language === lang ? "selected" : ""}" data-language="${lang}" type="button">${lang}</button>`).join("")}
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="panel-card">
          <h3 class="section-mini-title">Select your cultural background</h3>
          <div class="chips" id="cultureChips">
            ${cultures.map(culture => `<button class="chip ${appState.culture === culture ? "selected" : ""}" data-culture="${culture}" type="button">${culture}</button>`).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-language]").forEach(chip => {
    chip.addEventListener("click", () => { appState.language = chip.dataset.language; renderStep(); });
  });
  document.querySelectorAll("[data-culture]").forEach(chip => {
    chip.addEventListener("click", () => { appState.culture = chip.dataset.culture; renderStep(); });
  });

  const search = document.getElementById("languageSearch");
  search.addEventListener("input", (e) => {
    const list = getFilteredLanguages(e.target.value);
    const container = document.getElementById("languageChips");
    container.innerHTML = list.map(lang => `<button class="chip ${appState.language === lang ? "selected" : ""}" data-language="${lang}" type="button">${lang}</button>`).join("");
    container.querySelectorAll("[data-language]").forEach(chip => {
      chip.addEventListener("click", () => { appState.language = chip.dataset.language; renderStep(); });
    });
  });
}

function renderBudgetStep() {
  stepContent.innerHTML = `
    <div class="range-wrap">
      <div class="range-top">
        <div>
          <h3 class="section-mini-title">Choose your weekly rent budget</h3>
          <p class="muted-line">Use this to filter areas that suit your expected housing cost.</p>
        </div>
        <strong id="budgetValue">$${appState.budget}/week</strong>
      </div>
      <input type="range" id="budgetSlider" min="200" max="800" step="10" value="${appState.budget}" />
      <div class="range-meta"><span>$200</span><span>$800</span></div>
      <div class="panel-card mt-4">
        <h3 class="section-mini-title">Budget note</h3>
        <p id="budgetNote" class="muted-line">${getBudgetNote(appState.budget)}</p>
      </div>
    </div>
  `;
  const slider = document.getElementById("budgetSlider");
  slider.addEventListener("input", (e) => {
    appState.budget = Number(e.target.value);
    document.getElementById("budgetValue").textContent = `$${appState.budget}/week`;
    document.getElementById("budgetNote").textContent = getBudgetNote(appState.budget);
    updateNextButtonState();
  });
}

function renderHousingStep() {
  stepContent.innerHTML = `
    <div class="row g-4 preference-grid">
      ${housingOptions.map(option => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="pref-card ${appState.housing === option.key ? "selected" : ""}" data-housing="${option.key}">
            <h4>${option.title}</h4>
            <p>${option.desc}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  document.querySelectorAll("[data-housing]").forEach(card => {
    card.addEventListener("click", () => { appState.housing = card.dataset.housing; renderStep(); });
  });
}

function renderCommuteStep() {
  stepContent.innerHTML = `
    <div class="row g-4 preference-grid">
      ${commuteOptions.map(option => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="pref-card ${appState.commute === option.key ? "selected" : ""}" data-commute="${option.key}">
            <h4>${option.title}</h4>
            <p>${option.desc}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  document.querySelectorAll("[data-commute]").forEach(card => {
    card.addEventListener("click", () => { appState.commute = card.dataset.commute; renderStep(); });
  });
}

function renderLifestyleReviewStep() {
  stepContent.innerHTML = `
    <div class="panel-card mb-4">
      <h3 class="section-mini-title">Choose your main lifestyle priority</h3>
      <div class="row g-4 preference-grid">
        ${lifestyleOptions.map(option => `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="pref-card ${appState.lifestyle === option.key ? "selected" : ""}" data-lifestyle="${option.key}">
              <h4>${option.title}</h4>
              <p>${option.desc}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="row g-4">
      <div class="col-12 col-md-6"><div class="review-item"><span>Destination city</span><strong>${appState.city || "-"}</strong></div></div>
      <div class="col-12 col-md-6"><div class="review-item"><span>Language and culture</span><strong>${appState.language || "-"}${appState.culture ? ` · ${appState.culture}` : ""}</strong></div></div>
      <div class="col-12 col-md-6"><div class="review-item"><span>Budget</span><strong>$${appState.budget}/week</strong></div></div>
      <div class="col-12 col-md-6"><div class="review-item"><span>Housing preference</span><strong>${formatChoice(appState.housing)}</strong></div></div>
      <div class="col-12 col-md-6"><div class="review-item"><span>Commute preference</span><strong>${formatChoice(appState.commute)}</strong></div></div>
      <div class="col-12 col-md-6"><div class="review-item"><span>Lifestyle priority</span><strong>${formatChoice(appState.lifestyle)}</strong></div></div>
    </div>
  `;
  document.querySelectorAll("[data-lifestyle]").forEach(card => {
    card.addEventListener("click", () => { appState.lifestyle = card.dataset.lifestyle; renderStep(); });
  });
}

function handleBack() {
  if (appState.step > 1) {
    appState.step -= 1;
    renderStep();
  }
}

function handleNext() {
  if (!isStepValid(appState.step)) return;
  if (appState.step < totalSteps) {
    appState.step += 1;
    renderStep();
    return;
  }
  localStorage.setItem("settlesmart_preferences", JSON.stringify(appState));
  loadingOverlay.classList.remove("hidden");
  setTimeout(() => {
    window.location.href = "results.html";
  }, 1400);
}

function isStepValid(step) {
  switch (step) {
    case 1: return !!appState.city;
    case 2: return !!appState.language && !!appState.culture;
    case 3: return !!appState.budget;
    case 4: return !!appState.housing;
    case 5: return !!appState.commute;
    case 6: return !!appState.lifestyle;
    default: return false;
  }
}

function updateNextButtonState() {
  const valid = isStepValid(appState.step);
  nextBtn.disabled = !valid;
  nextBtn.style.opacity = valid ? "1" : "0.55";
  nextBtn.style.cursor = valid ? "pointer" : "not-allowed";
  if (!valid) {
    stepHint.textContent = "Complete this step to continue";
  } else if (appState.step === totalSteps) {
    stepHint.textContent = "Ready to build your shortlist";
    nextBtn.textContent = "Show My Shortlist";
  } else {
    stepHint.textContent = "Looks good — continue to the next step";
    nextBtn.textContent = "Next";
  }
}

function getFilteredLanguages(searchTerm) {
  return languages.filter(lang => lang.toLowerCase().includes(searchTerm.toLowerCase()));
}

function getBudgetNote(budget) {
  if (budget <= 250) return "Lower budgets may work better with shared housing.";
  if (budget >= 550) return "Higher budgets may allow more private or premium options.";
  return "This budget sits within a common student-friendly range.";
}

function formatChoice(value) {
  if (!value) return "-";
  return value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

init();
