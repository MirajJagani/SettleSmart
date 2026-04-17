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