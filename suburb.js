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