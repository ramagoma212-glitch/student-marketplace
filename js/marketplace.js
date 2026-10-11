/*
 Student Market Place
 Purpose: Marketplace page – live search, filters and sorting
 Technology: Vanilla JavaScript

 IPO: keywords + category + price range → searchProducts() / filterProducts()
      / sortProducts() in services.js → matching product list.
*/
App.ready(() => {
  const { icon, esc, data, productCard, skeletonCards, money } = App;

  const els = {
    q: document.getElementById("q"),
    sort: document.getElementById("sort"),
    min: document.getElementById("min-price"),
    max: document.getElementById("max-price"),
    campus: document.getElementById("campus"),
    showSold: document.getElementById("show-sold"),
    categoryFilter: document.getElementById("category-filter"),
    conditionFilter: document.getElementById("condition-filter"),
    grid: document.getElementById("product-grid"),
    count: document.getElementById("result-count"),
    active: document.getElementById("active-filters"),
    hint: document.getElementById("search-hint"),
    priceError: document.getElementById("price-error"),
    filters: document.getElementById("filters"),
    toggle: document.getElementById("filter-toggle"),
    filterCount: document.getElementById("filter-count")
  };

  // The current filter state (also mirrored in the URL so results can be shared/bookmarked)
  const state = {
    q: App.param("q") || "",
    category: App.param("category") || "",
    min: App.param("min") || "",
    max: App.param("max") || "",
    conditions: (App.param("condition") || "").split(",").filter(Boolean),
    campus: App.param("campus") || "",
    sort: App.param("sort") || "newest",
    showSold: App.param("sold") === "1"
  };

  /* ----- Build filter controls ----- */
  const allProducts = data.products();
  const countFor = name => allProducts.filter(p => p.status === "active" && (!name || p.category === name)).length;

  els.categoryFilter.innerHTML = [{ name: "" }].concat(CATEGORIES).map(c => `
    <label><span><input type="radio" name="category" value="${esc(c.name)}">${c.name ? esc(c.name) : "All categories"}</span><span class="count">${countFor(c.name)}</span></label>`).join("");

  els.conditionFilter.innerHTML = CONDITIONS.map(c =>
    `<button type="button" class="chip" data-condition="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("");

  CAMPUSES.forEach(c => els.campus.insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));

  function syncControls() {
    els.q.value = state.q;
    els.sort.value = state.sort;
    els.min.value = state.min;
    els.max.value = state.max;
    els.campus.value = state.campus;
    els.showSold.checked = state.showSold;
    els.categoryFilter.querySelectorAll("input").forEach(r => { r.checked = r.value === state.category; });
    els.conditionFilter.querySelectorAll(".chip").forEach(chip => {
      chip.setAttribute("aria-pressed", state.conditions.includes(chip.dataset.condition) ? "true" : "false");
    });
  }

  /* ----- Search → filter → sort (functions from services.js) ----- */
  function getResults() {
    const searched = searchProducts(data.products(), state.q);
    const filtered = filterProducts(searched, {
      category: state.category,
      minPrice: state.min,
      maxPrice: state.max,
      conditions: state.conditions,
      campus: state.campus,
      includeSold: state.showSold
    });
    return sortProducts(filtered, state.sort);
  }

  function validPriceRange() {
    const min = state.min === "" ? null : Number(state.min);
    const max = state.max === "" ? null : Number(state.max);
    let message = "";
    if ((min !== null && min < 0) || (max !== null && max < 0)) message = "Prices cannot be negative.";
    else if (min !== null && max !== null && min > max) message = "Minimum price cannot be higher than maximum price.";
    els.priceError.hidden = !message;
    els.priceError.innerHTML = message ? icon("alert") + "<span>" + message + "</span>" : "";
    return !message;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.category) params.set("category", state.category);
    if (state.min !== "") params.set("min", state.min);
    if (state.max !== "") params.set("max", state.max);
    if (state.conditions.length) params.set("condition", state.conditions.join(","));
    if (state.campus) params.set("campus", state.campus);
    if (state.sort !== "newest") params.set("sort", state.sort);
    if (state.showSold) params.set("sold", "1");
    const qs = params.toString();
    history.replaceState(null, "", "marketplace.html" + (qs ? "?" + qs : ""));
  }

  function activeFilterChips() {
    const chips = [];
    if (state.q) chips.push(["q", `"${state.q}"`]);
    if (state.category) chips.push(["category", state.category]);
    state.conditions.forEach(c => chips.push(["condition:" + c, c]));
    if (state.campus) chips.push(["campus", state.campus]);
    if (state.min !== "") chips.push(["min", "From " + money(state.min)]);
    if (state.max !== "") chips.push(["max", "Up to " + money(state.max)]);
    els.active.innerHTML = chips.map(([key, label]) =>
      `<button type="button" class="chip" data-remove="${esc(key)}" aria-label="Remove filter ${esc(label)}">${esc(label)}${icon("x")}</button>`).join("");
    const filterTotal = chips.filter(([k]) => k !== "q").length;
    els.filterCount.hidden = !filterTotal;
    els.filterCount.textContent = filterTotal;
  }

  function render() {
    if (!validPriceRange()) return;
    const results = getResults();
    els.count.textContent = `${results.length} item${results.length === 1 ? "" : "s"} found`;
    activeFilterChips();
    updateUrl();

    if (!results.length) {
      els.grid.innerHTML = `<div style="grid-column:1/-1" class="card">${App.emptyState({
        iconName: "search",
        title: "No matching items found.",
        text: "Try a different keyword, remove a filter or browse all categories."
      })}<div class="text-center" style="margin-top:-28px;padding-bottom:36px"><button type="button" class="btn btn-primary" data-clear>Clear filters</button></div></div>`;
      return;
    }
    els.grid.innerHTML = results.map(p => productCard(p)).join("");
  }

  /* ----- Events ----- */
  let searchTimer;
  els.q.addEventListener("input", () => {
    clearTimeout(searchTimer);
    els.hint.innerHTML = "";
    searchTimer = setTimeout(() => { state.q = els.q.value.trim(); render(); }, 120);
  });

  document.getElementById("search-form").addEventListener("submit", e => {
    e.preventDefault();
    state.q = els.q.value.trim();
    // A blank search is handled gracefully: show everything and explain why.
    els.hint.innerHTML = state.q ? "" : `${icon("info")}<span>Please enter a product name or keyword to search. Showing all available items.</span>`;
    render();
    if (!state.q) els.q.focus();
  });

  els.sort.addEventListener("change", () => { state.sort = els.sort.value; render(); });
  els.campus.addEventListener("change", () => { state.campus = els.campus.value; render(); });
  els.showSold.addEventListener("change", () => { state.showSold = els.showSold.checked; render(); });
  els.min.addEventListener("input", () => { state.min = els.min.value; render(); });
  els.max.addEventListener("input", () => { state.max = els.max.value; render(); });
  els.categoryFilter.addEventListener("change", e => { state.category = e.target.value; render(); });
  els.conditionFilter.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const value = chip.dataset.condition;
    state.conditions = state.conditions.includes(value) ? state.conditions.filter(c => c !== value) : state.conditions.concat(value);
    chip.setAttribute("aria-pressed", state.conditions.includes(value) ? "true" : "false");
    render();
  });

  els.active.addEventListener("click", e => {
    const chip = e.target.closest("[data-remove]");
    if (!chip) return;
    const key = chip.dataset.remove;
    if (key.startsWith("condition:")) state.conditions = state.conditions.filter(c => c !== key.slice(10));
    else state[key] = "";
    syncControls();
    render();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("[data-clear]")) return;
    Object.assign(state, { q: "", category: "", min: "", max: "", conditions: [], campus: "", showSold: false });
    els.hint.innerHTML = "";
    syncControls();
    render();
    App.toast("Filters cleared.");
  });

  // Mobile filter drawer
  let backdrop;
  function openFilters(open) {
    els.filters.classList.toggle("open", open);
    els.toggle.setAttribute("aria-expanded", open);
    document.body.classList.toggle("modal-open", open);
    if (open) {
      backdrop = document.createElement("div");
      backdrop.className = "filters-backdrop";
      backdrop.addEventListener("click", () => openFilters(false));
      document.body.appendChild(backdrop);
      document.getElementById("filters-close").focus();
    } else if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
  }
  els.toggle.addEventListener("click", () => openFilters(true));
  document.getElementById("filters-close").addEventListener("click", () => { openFilters(false); els.toggle.focus(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && els.filters.classList.contains("open")) openFilters(false); });

  // Initial render with a short skeleton loading state
  syncControls();
  els.grid.innerHTML = skeletonCards(8);
  setTimeout(render, 280);
  if (App.param("focus") === "search") els.q.focus();
});
