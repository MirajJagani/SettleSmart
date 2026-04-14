/*
  SettleSmart - Results page logic
  --------------------------------
  This file handles Epic 4 (Culture and Language Fit Explorer).

  The user's preferences are stored in localStorage under the key
  "settlesmart_preferences" by the onboarding flow (Epic 1).

  For this prototype, we use a small set of sample suburb data.
  In a future iteration, replace the sampleSuburbs array with
  database queries (for example, Supabase) to retrieve real
  demographic and community information.
*/

(() => {
  /**
   * Load the preferences saved during onboarding. If none are found
   * or parsing fails, return null. Preferences include the user's
   * selected city, language, culture, budget, housing style, commute,
   * and lifestyle priorities.
   */
  function loadPreferences() {
    const raw = localStorage.getItem("settlesmart_preferences");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse preferences:", err);
      return null;
    }
  }

  /**
   * A simple catalogue of suburbs with associated languages,
   * cultures, and a one-sentence reason explaining the community fit.
   * This data is illustrative only; real datasets should be used
   * when connecting to a backend service.
   */
  const sampleSuburbs = [
    {
      name: "Box Hill",
      languages: ["Mandarin", "Cantonese"],
      cultures: ["Chinese"],
      reason: "Large Chinese community with Mandarin and Cantonese support."
    },
    {
      name: "Footscray",
      languages: ["Vietnamese"],
      cultures: ["Vietnamese"],
      reason: "Vietnamese restaurants and supermarkets dominate this area."
    },
    {
      name: "Springvale",
      languages: ["Vietnamese", "Khmer"],
      cultures: ["Vietnamese"],
      reason: "Strong Vietnamese community with language schools."
    },
    {
      name: "Clayton",
      languages: ["Hindi", "Mandarin"],
      cultures: ["Indian", "Chinese"],
      reason: "Multicultural area near Monash University with Indian and Chinese groceries."
    },
    {
      name: "Dandenong",
      languages: ["Punjabi"],
      cultures: ["Indian"],
      reason: "Known for its Indian temples and Punjabi restaurants."
    },
    {
      name: "Glen Waverley",
      languages: ["Mandarin"],
      cultures: ["Chinese"],
      reason: "Popular for Chinese dining and Mandarin signage."
    },
    {
      name: "Carlton",
      languages: ["Italian"],
      cultures: ["European"],
      reason: "Heritage European cafés and Italian restaurants."
    }
  ];

  /**
   * Compute a simple culture fit score for each suburb based on the
   * user's preferred language and culture. A language match is
   * weighted more heavily than a culture match. The list is
   * sorted descending by score, and only the top three suburbs are
   * returned. If no preferences are set, the first three suburbs
   * in the list are returned as default suggestions.
   */
  function computeCultureFit(prefs) {
    const { language, culture } = prefs || {};
    // If no prefs, return first three as placeholder results.
    if (!language && !culture) {
      return sampleSuburbs.slice(0, 3).map((s) => ({ ...s, score: 0 }));
    }
    const matches = sampleSuburbs.map((sub) => {
      let score = 0;
      if (
        language &&
        sub.languages
          .map((l) => l.toLowerCase())
          .includes(language.toLowerCase())
      ) {
        score += 2;
      }
      if (
        culture &&
        sub.cultures
          .map((c) => c.toLowerCase())
          .includes(culture.toLowerCase())
      ) {
        score += 1;
      }
      return { ...sub, score };
    });
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 3);
  }

  /**
   * Render the list of top culture-fit suburbs into the page. Each
   * item displays the suburb name, a simple fit ranking, a short
   * description explaining why it fits, and a set of signal pills
   * showing the languages associated with that suburb.
   */
  function renderCultureList(prefs) {
    const container = document.getElementById("cultureList");
    if (!container) return;
    const topSuburbs = computeCultureFit(prefs);
    container.innerHTML = "";
    topSuburbs.forEach((sub) => {
      const item = document.createElement("div");
      item.className = "culture-item";
      let fitLabel;
      if (sub.score >= 2) fitLabel = "High fit";
      else if (sub.score === 1) fitLabel = "Medium fit";
      else fitLabel = "Low fit";
      item.innerHTML = `
        <div class="culture-item-head">
          <strong>${sub.name}</strong>
          <span class="culture-score">${fitLabel}</span>
        </div>
        <p>${sub.reason}</p>
        <div class="culture-signals">
          ${sub.languages
            .map((lang) => `<span class="signal-pill">${lang}</span>`)
            .join("")}
        </div>
      `;
      container.appendChild(item);
    });
  }

  // Kick off rendering once the DOM is ready
  window.addEventListener("DOMContentLoaded", () => {
    const prefs = loadPreferences();
    renderCultureList(prefs);
  });
})();