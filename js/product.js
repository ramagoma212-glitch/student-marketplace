/*
 Student Market Place
 Purpose: Product detail page (product.html?id=p01)
 Technology: Vanilla JavaScript

 Buyer flow: Select Product → Check Availability → Contact Seller
             → Confirm Purchase → Leave Review
*/
App.ready(() => {
  const { icon, esc, data, money, avatar, stars, publicName, productImage, productCard, timeAgo, formatDate } = App;
  const root = document.getElementById("product-root");

  function render() {
    const product = data.product(App.param("id"));
    if (!product) {
      root.innerHTML = `<div class="card">${App.emptyState({
        iconName: "search", title: "Listing not found",
        text: "This item may have been removed by the seller.",
        actionLabel: "Browse marketplace", actionHref: "marketplace.html"
      })}</div>`;
      return;
    }

    document.title = product.title + " | Student Market Place";
    const me = App.currentUser();
    const seller = data.user(product.sellerId);
    const rating = App.sellerRating(product.sellerId);
    const isOwn = me && me.id === product.sellerId;
    const availability = checkAvailability(product.id); // flowchart: "Is item available?"
    const sold = !availability.available;
    const isFav = me && App.favourites(me.id).includes(product.id);
    const myPurchase = me && data.purchases().find(p => p.productId === product.id && p.buyerId === me.id);
    const sellerSoldCount = data.products().filter(p => p.sellerId === seller.id && p.status === "sold").length;
    const reviews = data.reviews().filter(r => r.sellerId === seller.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const others = data.products().filter(p => p.sellerId === seller.id && p.id !== product.id && p.status === "active").slice(0, 4);

    let actions;
    if (isOwn) {
      actions = `
        <div class="alert">${icon("info")}<div><strong>This is your listing</strong><p>Manage it from your dashboard.</p></div></div>
        <div class="action-row">
          <a class="btn btn-primary" href="sell.html?edit=${encodeURIComponent(product.id)}">${icon("edit")}Edit listing</a>
          <a class="btn btn-outline" href="dashboard.html#listings">${icon("list")}My listings</a>
        </div>`;
    } else if (sold) {
      actions = `
        <div class="alert alert-warning">${icon("info")}<div><strong>This item has been sold</strong><p>${myPurchase ? "You bought this item on " + formatDate(myPurchase.createdAt) + "." : "Browse similar items in the marketplace."}</p></div></div>
        ${myPurchase && !myPurchase.reviewed ? `<button type="button" class="btn btn-primary btn-lg btn-block" id="review-btn">${icon("star")}Leave a review for ${esc(seller.firstName)}</button>` : ""}
        ${myPurchase && myPurchase.reviewed ? `<div class="alert alert-success">${icon("checkCircle")}<div><strong>Review submitted</strong><p>Thanks for rating ${esc(seller.firstName)}.</p></div></div>` : ""}
        <a class="btn btn-outline btn-block" href="marketplace.html?category=${encodeURIComponent(product.category)}">Browse similar items</a>`;
    } else {
      actions = `
        <a class="btn btn-primary btn-lg" href="messages.html?product=${encodeURIComponent(product.id)}">${icon("message")}Message Seller</a>
        <button type="button" class="btn btn-blue btn-lg" id="buy-btn">${icon("handshake")}Confirm Purchase</button>
        <div class="action-row">
          <button type="button" class="btn btn-outline" id="fav-detail" aria-pressed="${isFav ? "true" : "false"}">${icon("heart")}<span>${isFav ? "Saved" : "Save item"}</span></button>
          <button type="button" class="btn btn-ghost" id="report-btn">${icon("flag")}Report listing</button>
        </div>`;
    }

    root.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span aria-hidden="true">/</span>
        <a href="marketplace.html">Marketplace</a><span aria-hidden="true">/</span>
        <a href="marketplace.html?category=${encodeURIComponent(product.category)}">${esc(product.category)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(product.title)}</span>
      </nav>

      <div class="product-layout">
        <div class="gallery">
          <div class="gallery-main">
            <img src="${esc(productImage(product))}" alt="${esc(product.title)}" id="main-image">
            <span class="badge badge-glass">${esc(product.category)}</span>
          </div>
        </div>

        <div class="product-info">
          <div class="row row-wrap mb-8">
            ${sold ? '<span class="badge badge-sold">Sold</span>' : ""}
            <span class="badge badge-neutral">${icon("clock")}Listed ${esc(timeAgo(product.createdAt))}</span>
          </div>
          <h1>${esc(product.title)}</h1>
          <div class="product-price">${money(product.price)}</div>

          <div class="spec-grid">
            <div class="spec">${icon("tag")}<div><small>Condition</small><strong>${esc(product.condition)}</strong></div></div>
            <div class="spec">${icon("mapPin")}<div><small>Campus / collection</small><strong>${esc(product.campus)}</strong></div></div>
            <div class="spec">${icon(App.categoryIcon(product.category))}<div><small>Category</small><strong>${esc(product.category)}</strong></div></div>
            <div class="spec">${icon("calendar")}<div><small>Date listed</small><strong>${esc(formatDate(product.createdAt))}</strong></div></div>
          </div>

          <div class="availability ${sold ? "is-sold" : ""}" role="status">
            ${icon(sold ? "x" : "checkCircle")}
            <div><strong>Availability check: ${sold ? "Not available" : "Available"}</strong><span>${sold ? esc(availability.message) + " Browse similar items instead." : "You can contact the seller and confirm a purchase."}</span></div>
          </div>
          <div class="action-stack">${actions}</div>

          <div class="card seller-card">
            ${avatar(seller, "avatar-lg")}
            <div class="grow">
              <strong>${esc(publicName(seller))} ${icon("verified", "verified-tick")}</strong>
              <span class="badge badge-verified mt-8">${icon("verified")}Verified TUT Student</span>
              <div class="seller-stats">
                <span>${rating.count ? `<span class="rating-inline">${icon("star")}${rating.average.toFixed(1)}</span> (${rating.count} review${rating.count === 1 ? "" : "s"})` : "No reviews yet"}</span>
                <span>${sellerSoldCount} sold</span>
                <span>${esc(seller.campus)}</span>
              </div>
            </div>
            <a class="btn btn-outline btn-sm" href="profile.html?id=${encodeURIComponent(seller.id)}">View profile</a>
          </div>
          <p class="small muted mt-16">Contact preference: ${esc(product.contactPreference || "Marketplace inbox")}</p>
        </div>
      </div>

      <div class="grid grid-2 mt-32" style="align-items:start">
        <section class="card">
          <div class="card-head"><h2>Description</h2></div>
          <div class="card-body"><p class="description mb-0">${esc(product.description)}</p></div>
        </section>
        <section class="card">
          <div class="card-head"><h2>Safety tips</h2>${icon("shieldCheck")}</div>
          <div class="card-body">
            <ul class="tip-list">
              <li>${icon("check")}Meet in a safe, public campus area such as the library.</li>
              <li>${icon("check")}Inspect the item before paying.</li>
              <li>${icon("check")}Avoid sending money before confirming the seller and item.</li>
              <li>${icon("check")}Keep communication inside the marketplace inbox.</li>
              <li>${icon("check")}Never share your password or banking PINs.</li>
            </ul>
          </div>
        </section>
      </div>

      <section class="card mt-24" aria-labelledby="reviews-heading">
        <div class="card-head"><h2 id="reviews-heading">Reviews for ${esc(publicName(seller))}</h2><a class="link-arrow small" href="profile.html?id=${encodeURIComponent(seller.id)}#reviews">All reviews ${icon("arrowRight")}</a></div>
        <div class="card-body">
          ${reviews.length ? `
            <div class="rating-summary"><span class="big">${rating.average.toFixed(1)}</span><div>${stars(rating.average)}<div class="small muted">Based on ${rating.count} review${rating.count === 1 ? "" : "s"}</div></div></div>
            ${reviews.slice(0, 3).map(reviewHTML).join("")}` :
            App.emptyState({ iconName: "star", title: "No reviews yet", text: "This seller hasn't received any reviews yet." })}
        </div>
      </section>

      ${others.length ? `
      <section class="mt-48" aria-labelledby="others-heading">
        <div class="section-head"><div><h2 id="others-heading">More from ${esc(seller.firstName)}</h2><p>Other items this seller has listed.</p></div></div>
        <div class="product-grid">${others.map(p => productCard(p)).join("")}</div>
      </section>` : ""}`;

    bind(product);
  }

  function reviewHTML(r) {
    const reviewer = data.user(r.reviewerId);
    return `<div class="review-item">
      <div class="review-head">${avatar(reviewer, "avatar-sm")}<div class="grow"><strong>${esc(App.publicName(reviewer))}</strong><span class="small muted">${esc(timeAgo(r.createdAt))}</span></div>${stars(r.rating)}</div>
      <p>${esc(r.text)}</p>
      <div class="review-for">Purchased: ${esc(r.productTitle)}</div>
    </div>`;
  }

  function bind(product) {
    const buy = document.getElementById("buy-btn");
    if (buy) buy.addEventListener("click", () => App.openPurchase(product, () => setTimeout(render, 50)));

    const report = document.getElementById("report-btn");
    if (report) report.addEventListener("click", () => App.openReport(product));

    const reviewBtn = document.getElementById("review-btn");
    if (reviewBtn) reviewBtn.addEventListener("click", () => {
      const me = App.currentUser();
      const purchase = data.purchases().find(p => p.productId === product.id && p.buyerId === me.id);
      App.openReview(purchase, render);
    });

    const fav = document.getElementById("fav-detail");
    if (fav) fav.addEventListener("click", () => {
      const saved = App.toggleFavourite(product.id);
      if (saved === null) return;
      fav.setAttribute("aria-pressed", saved ? "true" : "false");
      fav.querySelector("span").textContent = saved ? "Saved" : "Save item";
      App.toast(saved ? "Saved to your favourites." : "Removed from your favourites.", "success");
    });
  }

  render();
});
