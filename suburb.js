const preferences = window.getStoredPreferences();
const suburbProfile = document.getElementById("suburbProfile");

initSuburbPage();

function initSuburbPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const suburb = window.suburbs.find(item => item.slug === slug);

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

  suburbProfile.innerHTML = `
    <section class="detail-hero info-card mb-4">
        <div class="detail-hero-image" style="background-image:url('${suburb.image}')"></div>
        <div class="detail-hero-copy">
        <span class="ss-pill ss-pill-light">${suburb.city}</span>
        <h1>${suburb.suburb}</h1>
        <p>${suburb.description}</p>

        <div class="result-tags mb-3">
            <span class="result-tag">Match ${score}%</span>
            <!-- <span class="result-tag">Rent ${suburb.rentRange}</span> -->
            <span class="result-tag">${suburb.transport} transport</span>
        </div>

        <div class="result-chip-row">
            ${(suburb.lifestyleTags || []).map(tag => `<span class="result-chip">${tag}</span>`).join("")}
        </div>
        </div>
    </section>

    <section class="detail-top-grid mb-4">
        <div class="info-card detail-section">
        <h3>Why this suburb fits you</h3>
        <ul class="inline-reason-list">
            ${reasons.map(reason => `<li>${reason}</li>`).join("")}
        </ul>
        </div>

        <div class="info-card detail-section">
        <h3>Languages and community</h3>
        <p><strong>Common languages:</strong> ${suburb.commonLanguages.join(", ")}</p>
        <p><strong>Cultural groups:</strong> ${(suburb.culturalGroups || []).join(", ") || "Not available"}</p>
        <p><strong>English support:</strong> ${suburb.englishSupport}</p>
        <p><strong>Recent arrivals:</strong> ${suburb.recentArrival}</p>
        </div>
    </section>

    <section class="info-card detail-profile-section">
        <div class="detail-profile-header">
        <h3>Suburb profile</h3>
        </div>

        <div class="detail-profile-grid">
        <article class="profile-card">
            <span class="profile-kicker">Overview</span>
            <p>${suburb.profile?.overview || "Not available"}</p>
        </article>

        <article class="profile-card">
            <span class="profile-kicker">Rent</span>
            <p>${suburb.profile?.rentNote || "Not available"}</p>
        </article>

        <article class="profile-card">
            <span class="profile-kicker">Transport</span>
            <p>${suburb.profile?.transportNote || "Not available"}</p>
        </article>

        <article class="profile-card">
            <span class="profile-kicker">Housing</span>
            <p>${suburb.profile?.housingNote || "Not available"}</p>
        </article>
        </div>
    </section>
    `;
}

/* =========================
   Epic 4 profile enhancement
   Append only - do not edit existing code
========================= */

(() => {
  if (!suburbProfile) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const suburb = window.suburbs.find(item => item.slug === slug);

  if (!suburb) return;

  const community = typeof window.getEpic4CommunityData === "function"
    ? window.getEpic4CommunityData(suburb)
    : null;

  const cultureScore = typeof window.getEpic4ProfileCultureScore === "function"
    ? window.getEpic4ProfileCultureScore(suburb, preferences)
    : 7;

  const photoCards = [
    {
      title: "Community grocery access",
      caption: "Prototype cultural support photo",
      image: suburb.image
    },
    {
      title: "Local food and social strip",
      caption: "Prototype food and restaurant signal",
      image: suburb.image
    },
    {
      title: "Community venue / worship access",
      caption: "Prototype support and belonging signal",
      image: suburb.image
    }
  ];

  const section = document.createElement("section");
  section.className = "info-card detail-profile-section epic4-profile-section mt-4";
  section.innerHTML = `
    <div class="detail-profile-header">
      <h3>Multicultural support signals</h3>
    </div>

    <div class="epic4-profile-topline">
      <span class="epic4-profile-score">Culture fit ${cultureScore}/10</span>
      <span class="epic4-profile-score">Community strength ${community.communityStrength}%</span>
      <span class="epic4-profile-score">Overseas-born share ${community.overseasBornShare}</span>
    </div>

    <div class="epic4-profile-grid">
      <article class="profile-card">
        <span class="profile-kicker">Cultural amenities</span>
        <ul class="epic4-detail-list">
          ${community.keyPlaces.map(place => `
            <li>
              <strong>${place}</strong>
              <span>${community.highlightDistance}</span>
            </li>
          `).join("")}
        </ul>
      </article>

      <article class="profile-card">
        <span class="profile-kicker">Practical community support</span>
        <div class="culture-signals">
          <span class="signal-pill">Specialty shops: ${community.specialtyShops}</span>
          <span class="signal-pill">Places of worship: ${community.placesOfWorship}</span>
          <span class="signal-pill">English support: ${suburb.englishSupport}</span>
          <span class="signal-pill">Recent arrivals: ${suburb.recentArrival}</span>
        </div>
      </article>

      <article class="profile-card">
        <span class="profile-kicker">Event calendar hints</span>
        <ul class="epic4-detail-list">
          ${community.events.map(event => `
            <li>
              <strong>${event}</strong>
              <span>Nearby cultural activity</span>
            </li>
          `).join("")}
        </ul>
      </article>
    </div>

    <div class="epic4-photo-grid">
      ${photoCards.map(photo => `
        <article class="epic4-photo-card">
          <div class="epic4-photo-image" style="background-image:url('${photo.image}')"></div>
          <div class="epic4-photo-copy">
            <strong>${photo.title}</strong>
            <span>${photo.caption}</span>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  suburbProfile.insertAdjacentElement("beforeend", section);
})();