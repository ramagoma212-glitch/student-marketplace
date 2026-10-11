/*
 Student Market Place
 Purpose: Home page – hero search, categories, featured listings, trust & safety
 Technology: Vanilla JavaScript
*/
App.ready(() => {
  const { icon, esc, data, productCard, productImage, money } = App;
  const activeProducts = data.products().filter(p => p.status === "active");

  // Hero search – category options + blank search handling
  const catSelect = document.getElementById("hero-cat");
  CATEGORIES.forEach(c => catSelect.insertAdjacentHTML("beforeend", `<option value="${esc(c.name)}">${esc(c.name)}</option>`));

  document.getElementById("hero-search").addEventListener("submit", e => {
    e.preventDefault();
    const q = document.getElementById("hero-q").value.trim();
    const cat = catSelect.value;
    const msg = document.getElementById("hero-search-msg");
    if (!q && !cat) {
      msg.innerHTML = `<span class="field-msg error">${icon("alert")}<span>Please enter a product name or keyword, or choose a category.</span></span>`;
      document.getElementById("hero-q").focus();
      return;
    }
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    window.location.href = "marketplace.html?" + params.toString();
  });
  document.getElementById("hero-q").addEventListener("input", () => { document.getElementById("hero-search-msg").innerHTML = ""; });

  // Hero stats – calculated from stored data, not hardcoded
  const stats = calculateProjectStats();
  const sellers = new Set(activeProducts.map(p => p.sellerId)).size;
  document.getElementById("hero-stats").innerHTML = `
    <div><strong>${stats.registeredUsers}</strong><span>Student members</span></div>
    <div><strong>${stats.activeListings}</strong><span>Items for sale</span></div>
    <div><strong>${sellers}</strong><span>Active sellers</span></div>
    <div><strong>${CAMPUSES.length}</strong><span>TUT campuses</span></div>`;

  // Hero visual – three floating product cards
  const heroPicks = ["p03", "p01", "p09"].map(id => data.product(id)).filter(Boolean);
  document.getElementById("hero-visual").innerHTML = heroPicks.map((p, i) => `
    <div class="float-card fc-${i + 1}">
      <img src="${esc(productImage(p))}" alt="">
      <div class="fc-body">
        <div class="fc-price">${money(p.price)}</div>
        <div class="fc-title">${esc(p.title)}</div>
        <div class="fc-meta">${icon("mapPin")}${esc(p.campus)}</div>
      </div>
    </div>`).join("") + `
    <div class="hero-chip c-1"><span class="chip-icon">${icon("verified")}</span><span>TUT email accepted<small>@tut4life.ac.za</small></span></div>
    <div class="hero-chip c-2"><span class="chip-icon">${icon("message")}</span><span>"Is this still available?"<small>New message · just now</small></span></div>`;

  // Trust bar
  const trust = [
    ["coins", "Affordable Student Deals", "Second-hand prices in Rand"],
    ["verified", "Verified Student Community", "@tut4life.ac.za emails only"],
    ["message", "Direct Messaging", "Chat inside the platform"],
    ["mapPin", "Campus Focused Trading", "Collect on your campus"]
  ];
  document.getElementById("trust-bar").innerHTML = trust.map(([ic, title, sub]) => `
    <div class="trust-item"><span class="ti-icon">${icon(ic)}</span><div><strong>${title}</strong><span>${sub}</span></div></div>`).join("");

  // Categories (all except "Other") with live item counts
  document.getElementById("category-grid").innerHTML = CATEGORIES.filter(c => c.name !== "Other").map(c => {
    const count = activeProducts.filter(p => p.category === c.name).length;
    return `<a class="category-card" href="marketplace.html?category=${encodeURIComponent(c.name)}">
      <span class="cat-icon">${icon(c.icon)}</span>
      <span><strong>${esc(c.name)}</strong><span>${count} item${count === 1 ? "" : "s"} · ${esc(c.blurb)}</span></span>
    </a>`;
  }).join("");

  // Featured: newest 8 active listings
  const featured = activeProducts.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  document.getElementById("featured-grid").innerHTML = featured.map(p => productCard(p)).join("");

  // How it works
  const steps = [
    ["graduation", "Sign up with your TUT email", "Register using your official @tut4life.ac.za address to become a verified student."],
    ["search", "Search & discover", "Browse by category, campus and price to find exactly what you need."],
    ["message", "Chat with the seller", "Ask questions and agree on a price using the built-in marketplace inbox."],
    ["handshake", "Meet, buy & review", "Inspect the item on campus, confirm your purchase and rate the seller."]
  ];
  document.getElementById("steps").innerHTML = steps.map(([ic, title, text], i) => `
    <div class="card step"><span class="step-num">0${i + 1}</span><span class="step-icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p></div>`).join("");

  // Safety tips
  const tips = [
    ["mapPin", "Meet in public campus areas", "Libraries, cafeterias and main entrances are best."],
    ["eye", "Inspect before you pay", "Check the item works and matches the listing."],
    ["lock", "Never share passwords", "We will never ask for your TUT login details."],
    ["flag", "Report suspicious listings", "Help keep the community safe for everyone."],
    ["coins", "Don't pay upfront", "Avoid sending money before seeing the seller and item."],
    ["message", "Keep chats in the inbox", "Your conversation history stays in one place."]
  ];
  document.getElementById("safety-list").innerHTML = tips.map(([ic, title, text]) => `
    <div class="safety-item">${icon(ic)}<div><strong>${title}</strong><span>${text}</span></div></div>`).join("");

  if (App.currentUser()) {
    const cta = document.getElementById("cta-register");
    cta.textContent = "Go to dashboard";
    cta.href = "dashboard.html";
    document.getElementById("hero-eyebrow").lastChild.textContent = "Welcome back, " + App.currentUser().firstName;
  }
});
