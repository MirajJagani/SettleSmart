document.getElementById("suburbName").textContent = suburb.suburb;
document.getElementById("suburbDesc").textContent = suburb.description;

// amenities
document.getElementById("amenities").innerHTML =
  suburb.culturalAmenities.map(a => `
    <div class="culture-item mb-2">
      <strong>${a.name}</strong>
      <span class="ms-2 text-muted">${a.distance}</span>
    </div>
  `).join("");

// events
document.getElementById("events").innerHTML =
  suburb.events.map(e => `
    <div class="culture-item mb-2">${e}</div>
  `).join("");

// photos
document.getElementById("photos").innerHTML =
  suburb.photos.map(p => `
    <img src="${p}" class="rounded" width="200"/>
  `).join("");