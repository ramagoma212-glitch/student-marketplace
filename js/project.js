/*
 Student Market Place
 Purpose: Academic Project Overview page (project.html)
 Technology: Vanilla JavaScript

 Financial figures and analytics are CALCULATED here from the project
 inputs (data.js) and the stored prototype data – not typed in by hand.
*/
App.ready(() => {
  const { icon, esc, money } = App;
  const $ = id => document.getElementById(id);

  /* ----- Aims ----- */
  $("aim-list").innerHTML = [
    "Help students find affordable items",
    "Help students earn extra income",
    "Make unused items useful again",
    "Provide a student-focused trading environment",
    "Make it easier for students to communicate directly"
  ].map(a => `<li>${icon("checkCircle")}${a}</li>`).join("");

  /* ----- Main features (linked to the working pages) ----- */
  const features = [
    ["graduation", "Student registration", "Only @tut4life.ac.za student emails are accepted.", "register.html"],
    ["tag", "Product listings", "Title, price in Rand, description, condition, campus and photo.", "sell.html"],
    ["search", "Search & filter", "Keyword search with category, price, condition and campus filters.", "marketplace.html"],
    ["message", "Direct messaging", "Buyer-to-seller inbox linked to each product.", "messages.html"],
    ["star", "Seller reviews", "1–5 star ratings with written feedback and seller averages.", "profile.html?id=u_lerato#reviews"],
    ["handshake", "Transaction confirmation", "Buyer confirms an agreed purchase; the item is marked sold.", "product.html?id=p05"]
  ];
  $("feature-grid").innerHTML = features.map(([ic, title, text, href]) => `
    <a class="card card-hover quick-card" href="${href}" style="align-items:flex-start">
      <span class="qc-icon">${icon(ic)}</span>
      <span><strong>${title}</strong><span>${text}</span></span>
    </a>`).join("");

  /* ----- Flowchart (from the project's system design) ----- */
  const step = (label, type = "", href = "") => href
    ? `<a class="fc-step ${type}" href="${href}">${label}</a>`
    : `<span class="fc-step ${type}">${label}</span>`;
  const arrow = `<span class="fc-arrow" aria-hidden="true">${icon("chevronDown")}</span>`;
  $("flowchart").innerHTML = `
    <div class="fc-col fc-center">
      ${step("Start", "terminal", "index.html")}${arrow}
      ${step("Register / Login", "io", "login.html")}${arrow}
      ${step("Dashboard", "", "dashboard.html")}${arrow}
      ${step("Buy or Sell?", "decision")}
    </div>
    <div class="fc-paths">
      <div class="fc-col">
        <span class="fc-label buyer">Buyer path</span>
        ${step("Browse Products", "", "marketplace.html")}${arrow}
        ${step("Search / Filter", "", "marketplace.html?q=textbook")}${arrow}
        ${step("Select Product", "", "product.html?id=p02")}${arrow}
        ${step("Is item available?", "decision")}
        <span class="fc-note">No → back to Browse · Yes ↓</span>
        ${step("Contact Seller", "io", "messages.html?product=p02")}
      </div>
      <div class="fc-col">
        <span class="fc-label seller">Seller path</span>
        ${step("Sell Item", "io", "sell.html")}${arrow}
        ${step("Set Price &amp; Details", "", "sell.html")}${arrow}
        ${step("Publish Listing", "", "dashboard.html#listings")}${arrow}
        ${step("Receive Buyer Enquiry", "io", "messages.html")}
      </div>
    </div>
    <div class="fc-col fc-center">
      ${arrow}
      ${step("Complete Purchase", "primary", "dashboard.html#purchases")}${arrow}
      ${step("Leave Review", "io", "dashboard.html#purchases")}${arrow}
      ${step("Logout · End", "terminal")}
    </div>`;

  /* ----- IPO table ----- */
  const ipo = [
    ["Student registration", "Name, student number, TUT email, password", "Validate and store details", "Student account (email accepted)", "registerUser(), validateTutEmail()"],
    ["Login", "Email, password", "Check user credentials", "Student logged in", "loginUser()"],
    ["Product listing", "Title, price, description, photo", "Create and publish listing", "Live marketplace listing", "createListing(), updateListing()"],
    ["Search and filter", "Keywords, category, price range", "Search, filter and sort products", "Matching product list", "searchProducts(), filterProducts()"],
    ["Messaging", "Buyer message", "Save and route the message to the seller's thread", "Seller receives an unread notification", "sendMessage(), markMessageRead()"],
    ["Purchase", "Buyer's agreement confirmation", "Save transaction, mark listing sold", "Purchase in My Purchases", "confirmPurchase()"],
    ["Ratings and reviews", "Star rating (1–5), written feedback", "Store review, calculate average rating", "Updated seller rating", "submitReview(), calculateAverageRating()"]
  ];
  $("ipo-table").innerHTML = `<thead><tr><th>Process</th><th>Input</th><th>Processing</th><th>Output</th><th>JavaScript function</th></tr></thead>
    <tbody>${ipo.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><code>${r[4]}</code></td></tr>`).join("")}</tbody>`;

  /* ----- Benefits ----- */
  const benefits = [
    ["coins", "Affordable Student Deals", "Second-hand textbooks, tech and essentials at student prices in Rand."],
    ["verified", "Verified Student Community", "Registration is limited to @tut4life.ac.za student email addresses."],
    ["message", "Direct Messaging", "Buyers and sellers talk inside the marketplace inbox."],
    ["mapPin", "Campus Focused Trading", "Listings show the campus, so items are collected locally."]
  ];
  $("benefit-grid").innerHTML = benefits.map(([ic, title, text]) =>
    `<div class="card aim-card"><span class="aim-icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p></div>`).join("");

  /* ----- Prototype financial overview (Year 1 projection) ----- */
  const fin = calculateFinancialProjection();
  const finCards = [
    ["Startup cost", money(fin.startupCost), PROJECT_FINANCIALS.startupItems.join(" · ")],
    ["Projected revenue", money(fin.projectedRevenue), PROJECT_FINANCIALS.revenueSources.join(" · ")],
    ["Projected profit", money(fin.projectedProfit), "Revenue − startup cost"],
    ["Projected margin", fin.profitMargin + "%", "Profit ÷ revenue × 100"]
  ];
  $("finance-cards").innerHTML = finCards.map(([label, value, sub]) => `
    <div class="card fin-card"><span class="fin-label">${label}</span><strong class="fin-value">${value}</strong><span class="fin-sub">${sub}</span></div>`).join("");
  $("cashflow-table").innerHTML = `<tbody>
    <tr><td>Opening balance</td><td class="num">${money(fin.openingBalance)}</td></tr>
    <tr><td>Revenue</td><td class="num">${money(fin.projectedRevenue)}</td></tr>
    <tr><td>Expenses</td><td class="num">−${money(fin.expenses)}</td></tr>
    <tr class="total"><td>Net cash flow</td><td class="num">${money(fin.netCashFlow)}</td></tr></tbody>`;
  $("benefit-list").innerHTML = PROJECT_FINANCIALS.benefits.map(b => `<li>${icon("check")}${esc(b)}</li>`).join("");
  $("cost-list").innerHTML = PROJECT_FINANCIALS.costs.map(c => `<li>${icon("coins")}${esc(c)}</li>`).join("");
  $("finance-note").textContent = `Calculated in JavaScript: profit = ${money(fin.projectedRevenue)} − ${money(fin.startupCost)} = ${money(fin.projectedProfit)}; margin = ${money(fin.projectedProfit)} ÷ ${money(fin.projectedRevenue)} ≈ ${fin.profitMargin}%. The prototype itself does not charge fees or process payments.`;

  /* ----- Research ----- */
  $("research-table").innerHTML = `<thead><tr><th>Platform</th><th>What it does well</th><th>Gap for TUT students</th></tr></thead>
    <tbody>${COMPETITOR_RESEARCH.map(c => `<tr><th scope="row">${esc(c.name)}</th><td>${esc(c.strength)}</td><td>${esc(c.gap)}</td></tr>`).join("")}</tbody>`;
  $("differentiators").innerHTML = ["TUT student registration", "Campus-based listings", "Direct student messaging", "Student seller reviews", "Local collection", "Prices in Rand"]
    .map(d => `<span class="chip">${icon("check")}${d}</span>`).join("");

  /* ----- Live analytics (project variables) ----- */
  function renderAnalytics() {
    const s = calculateProjectStats();
    const cards = [
      ["users", s.registeredUsers, "Registered users", "Number of users"],
      ["tag", s.totalListings, "Total listings", `${s.activeListings} active · ${s.soldListings} sold`],
      ["coins", money(Math.round(s.averagePrice)), "Average listing price", "Product prices"],
      ["bag", s.completedPurchases, "Completed purchases", `${s.dailySales} today (daily sales)`],
      ["message", s.messagesSent, "Messages sent", "Across all conversations"],
      ["star", s.averageRating.toFixed(1), "Average marketplace rating", `${s.totalReviews} reviews (user ratings)`],
      ["flag", s.reports, "Reports submitted", "Listings reported for review"],
      ["grid", CATEGORIES.length, "Categories", "Parameter"]
    ];
    $("analytics-cards").innerHTML = cards.map(([ic, value, label, sub]) => `
      <div class="card stat-card"><div class="stat-top"><span class="stat-icon">${icon(ic)}</span></div>
      <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div><div class="small muted">${sub}</div></div></div>`).join("");
  }
  renderAnalytics();

  $("parameters").innerHTML = [
    ["University", "Tshwane University of Technology (TUT)"],
    ["Currency", "South African Rand (ZAR, R)"],
    ["Website logo", `<img src="assets/images/logo.png" alt="Student Marketplace logo" style="height:56px;width:auto">`],
    ["Categories", CATEGORIES.map(c => c.name).join(", ")],
    ["Terms and Conditions", `<a href="terms.html">View Terms &amp; Conditions</a>`],
    ["Contact information", "support@studentmarketplace.demo"]
  ].map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join("");

  /* ----- Team ----- */
  $("team-grid").innerHTML = TEAM_MEMBERS.map((m, i) => {
    const [first, last] = m.name.split(" ");
    const person = { id: "team" + i, firstName: first, lastName: last || first };
    return `<div class="card team-member${i === 0 ? " lead" : ""}">${App.avatar(person)}<div><strong>${esc(m.name)}</strong><span>${esc(m.role)}</span></div></div>`;
  }).join("");
});
