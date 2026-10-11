/*
 Student Market Place
 Purpose: Student dashboard – views are switched with the URL hash:
          #overview (default), #listings, #purchases, #reviews, #saved
 Technology: Vanilla JavaScript

 All numbers are calculated live from localStorage with
 calculateUserStats() and calculateProjectStats() (services.js).
*/
App.ready(() => {
  const { icon, esc, data, money, avatar, stars, publicName, productImage, productCard, timeAgo, formatDate, emptyState } = App;
  const me = App.currentUser();
  const view = document.getElementById("dash-view");

  /* ---------- Data helpers for the logged-in student ---------- */
  const myProducts = () => data.products().filter(p => p.sellerId === me.id);
  const myPurchases = () => data.purchases().filter(p => p.buyerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myConversations = () => data.conversations().filter(c => c.buyerId === me.id || c.sellerId === me.id);

  /* ---------- Sidebar ---------- */
  document.getElementById("dash-user").innerHTML = `${avatar(me)}<div><strong>${esc(App.fullName(me))}</strong><span class="badge badge-verified">${icon("verified")}Verified</span></div>`;

  function renderNav(active) {
    const unread = App.unreadCount(me.id);
    const link = (href, ic, label, key, extra = "") =>
      `<a href="${href}" ${key === active ? 'aria-current="page"' : ""}>${icon(ic)}${label}${extra}</a>`;
    document.getElementById("dash-nav").innerHTML =
      link("#overview", "dashboard", "Dashboard", "overview") +
      link("marketplace.html", "grid", "Marketplace", "") +
      link("sell.html", "plusCircle", "Sell Item", "") +
      link("#listings", "list", "My Listings", "listings") +
      link("messages.html", "message", "Messages", "", unread ? `<span class="nav-count">${unread}</span>` : "") +
      link("#purchases", "bag", "Purchases", "purchases") +
      link("#reviews", "star", "Reviews", "reviews") +
      link("#saved", "heart", "Saved Items", "saved") +
      link("profile.html", "user", "Profile", "") +
      `<hr><button type="button" class="logout" data-logout>${icon("logout")}Logout</button>`;
  }

  /* ---------- Overview ---------- */
  function overview() {
    const stats = calculateUserStats(me.id);
    const active = myProducts().filter(p => p.status === "active");
    const unread = stats.unreadMessages;
    const pendingReviews = stats.pendingReviews;
    const rating = { average: stats.averageRating, count: stats.reviewCount };

    const statCard = (ic, value, label, href) => `
      <a class="card card-hover stat-card" href="${href}" style="color:inherit">
        <div class="stat-top"><span class="stat-icon">${icon(ic)}</span>${icon("arrowRight", "icon-sm muted")}</div>
        <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>
      </a>`;

    const quick = [
      ["search", "Browse Items", "Find deals on campus", "marketplace.html"],
      ["plusCircle", "Sell an Item", "List in under a minute", "sell.html"],
      ["list", "My Listings", `${stats.activeListings} active`, "#listings"],
      ["message", "Messages", unread ? `${unread} unread` : `${stats.conversations} conversations`, "messages.html"],
      ["bag", "My Purchases", pendingReviews ? `${pendingReviews} awaiting review` : `${stats.purchases} total`, "#purchases"],
      ["star", "My Reviews", rating.count ? `${rating.average.toFixed(1)} average` : "No reviews yet", "#reviews"]
    ];

    const recommended = data.products()
      .filter(p => p.status === "active" && p.sellerId !== me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);

    view.innerHTML = `
      <section class="welcome-card">
        <div>
          <span class="badge badge-verified">${icon("verified")}Verified TUT Student</span>
          <h1>Welcome back, ${esc(me.firstName)}</h1>
          <p>${unread ? `You have <strong style="color:#fff">${unread} unread message${unread === 1 ? "" : "s"}</strong>. ` : ""}${pendingReviews ? `${pendingReviews} purchase${pendingReviews === 1 ? " is" : "s are"} waiting for your review.` : "Here's what's happening with your marketplace activity."}</p>
        </div>
        <div class="row row-wrap">
          <a class="btn btn-white" href="marketplace.html">${icon("search")}Browse</a>
          <a class="btn btn-on-dark" href="sell.html">${icon("plus")}Sell an item</a>
        </div>
      </section>

      <section class="stat-grid" aria-label="Your statistics">
        ${statCard("tag", stats.activeListings, "My active listings", "#listings")}
        ${statCard("checkCircle", stats.itemsSold, "Items sold", "#listings")}
        ${statCard("message", stats.conversations, unread ? `Messages · ${unread} unread` : "Message threads", "messages.html")}
        ${statCard("bag", stats.purchases, "Purchases", "#purchases")}
        ${statCard("star", rating.count ? rating.average.toFixed(1) : "–", rating.count ? `Average rating (${rating.count})` : "No ratings yet", "#reviews")}
      </section>

      <section aria-labelledby="quick-heading">
        <h2 class="sr-only" id="quick-heading">Quick actions</h2>
        <div class="quick-grid">
          ${quick.map(([ic, title, sub, href]) => `<a class="card card-hover quick-card" href="${href}"><span class="qc-icon">${icon(ic)}</span><span><strong>${title}</strong><span>${esc(sub)}</span></span></a>`).join("")}
        </div>
      </section>

      <div class="dash-columns">
        <section class="card" aria-labelledby="activity-heading">
          <div class="card-head"><h2 id="activity-heading">Recent activity</h2></div>
          <div class="activity" style="padding:8px 0">${activityHTML()}</div>
        </section>
        <section class="card" aria-labelledby="recent-msg-heading">
          <div class="card-head"><h2 id="recent-msg-heading">Recent messages</h2><a class="link-arrow small" href="messages.html">Inbox ${icon("arrowRight")}</a></div>
          <div class="list">${recentMessagesHTML()}</div>
        </section>
      </div>

      <div class="dash-columns">
        <section class="card" aria-labelledby="mylist-heading">
          <div class="card-head"><h2 id="mylist-heading">My listings</h2><a class="link-arrow small" href="#listings">Manage ${icon("arrowRight")}</a></div>
          <div class="list">${active.length ? active.slice(0, 3).map(p => `
            <a class="list-item" href="product.html?id=${encodeURIComponent(p.id)}">
              <img class="thumb" src="${esc(productImage(p))}" alt="">
              <div class="grow"><span class="title">${esc(p.title)}</span><span class="sub">${esc(p.campus)} · listed ${esc(timeAgo(p.createdAt))}</span></div>
              <strong style="color:var(--navy)">${money(p.price)}</strong>
            </a>`).join("") : emptyState({ iconName: "tag", title: "No listings yet", text: "Sell something you no longer need.", actionLabel: "Sell an item", actionHref: "sell.html" })}
          </div>
        </section>
        <section class="card" aria-labelledby="platform-heading">
          <div class="card-head"><h2 id="platform-heading">Project analytics</h2><a class="link-arrow small" href="project.html#analytics">Details ${icon("arrowRight")}</a></div>
          ${platformStatsHTML()}
        </section>
      </div>

      <section aria-labelledby="rec-heading">
        <div class="section-head" style="margin-bottom:16px"><div><h2 id="rec-heading" style="font-size:1.25rem">Recommended for you</h2></div><a class="link-arrow small" href="marketplace.html">View marketplace ${icon("arrowRight")}</a></div>
        <div class="product-grid">${recommended.map(p => productCard(p)).join("")}</div>
      </section>`;
  }

  function activityHTML() {
    const items = [];
    const users = {};
    const userName = id => (users[id] = users[id] || publicName(data.user(id)));
    const products = data.products();
    const titleOf = id => { const p = products.find(x => x.id === id); return p ? p.title : "an item"; };

    myProducts().forEach(p => items.push({ at: p.createdAt, ic: "tag", text: `You listed <strong>${esc(p.title)}</strong> for ${money(p.price)}` }));
    data.purchases().forEach(p => {
      if (p.buyerId === me.id) items.push({ at: p.createdAt, ic: "bag", text: `You bought <strong>${esc(titleOf(p.productId))}</strong> from ${esc(userName(p.sellerId))}` });
      if (p.sellerId === me.id) items.push({ at: p.createdAt, ic: "checkCircle", text: `${esc(userName(p.buyerId))} bought your <strong>${esc(titleOf(p.productId))}</strong>` });
    });
    data.reviews().forEach(r => {
      if (r.sellerId === me.id) items.push({ at: r.createdAt, ic: "star", text: `${esc(userName(r.reviewerId))} left you a ${r.rating}-star review` });
      if (r.reviewerId === me.id) items.push({ at: r.createdAt, ic: "star", text: `You reviewed ${esc(userName(r.sellerId))} (${r.rating} stars)` });
    });
    myConversations().forEach(c => {
      const last = c.messages[c.messages.length - 1];
      if (!last) return;
      const other = c.buyerId === me.id ? c.sellerId : c.buyerId;
      items.push({
        at: last.createdAt, ic: "message",
        text: last.senderId === me.id ? `You messaged ${esc(userName(other))} about <strong>${esc(titleOf(c.productId))}</strong>` : `${esc(userName(other))} sent you a message about <strong>${esc(titleOf(c.productId))}</strong>`
      });
    });

    items.sort((a, b) => b.at.localeCompare(a.at));
    if (!items.length) return emptyState({ iconName: "clock", title: "No activity yet", text: "Your listings, purchases and messages will appear here." });
    return items.slice(0, 6).map(i => `
      <div class="activity-item"><span class="a-icon">${icon(i.ic)}</span><div><p>${i.text}</p><time datetime="${i.at}">${esc(timeAgo(i.at))}</time></div></div>`).join("");
  }

  function recentMessagesHTML() {
    const convos = myConversations()
      .filter(c => c.messages.length)
      .sort((a, b) => b.messages[b.messages.length - 1].createdAt.localeCompare(a.messages[a.messages.length - 1].createdAt))
      .slice(0, 4);
    if (!convos.length) return emptyState({ iconName: "message", title: "No messages yet", text: "When you contact a seller, your conversation will appear here.", actionLabel: "Browse items", actionHref: "marketplace.html" });
    return convos.map(c => {
      const other = data.user(c.buyerId === me.id ? c.sellerId : c.buyerId);
      const last = c.messages[c.messages.length - 1];
      const unread = App.conversationUnread(c, me.id);
      return `<a class="list-item" href="messages.html?c=${encodeURIComponent(c.id)}">
        ${avatar(other)}
        <div class="grow"><span class="title">${esc(publicName(other))}</span><span class="sub">${last.senderId === me.id ? "You: " : ""}${esc(last.text)}</span></div>
        <div class="text-center"><span class="small muted nowrap">${esc(timeAgo(last.createdAt))}</span>${unread ? `<div class="unread-dot" style="margin:4px auto 0">${unread}</div>` : ""}</div>
      </a>`;
    }).join("");
  }

  /* Project variables: users, products listed, prices, daily sales, ratings, messages sent */
  function platformStatsHTML() {
    const s = calculateProjectStats();
    return `<div class="platform-stats">
      <div><strong>${s.registeredUsers}</strong><span>Registered users</span></div>
      <div><strong>${s.totalListings}</strong><span>Total listings</span></div>
      <div><strong>${s.completedPurchases}</strong><span>Completed purchases</span></div>
      <div><strong>${s.messagesSent}</strong><span>Messages sent</span></div>
      <div><strong>${s.averageRating.toFixed(1)} ★</strong><span>Avg marketplace rating</span></div>
      <div><strong>${money(Math.round(s.averagePrice))}</strong><span>Average listing price</span></div>
    </div>
    <p class="small muted" style="padding:12px 22px 16px;margin:0;border-top:1px solid var(--border-2)">Sales today: <strong>${s.dailySales}</strong> · Calculated live from marketplace data.</p>`;
  }

  /* ---------- My listings ---------- */
  let listingFilter = "all";
  function listings() {
    const all = myProducts().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const shown = all.filter(p => listingFilter === "all" || p.status === listingFilter);
    const count = s => all.filter(p => s === "all" || p.status === s).length;
    const tab = (key, label) => `<button type="button" class="tab" role="tab" data-filter="${key}" aria-selected="${listingFilter === key}">${label}<span class="badge">${count(key)}</span></button>`;

    view.innerHTML = `
      <div class="row row-between row-wrap">
        <div><h1 style="font-size:1.6rem;margin:0">My listings</h1><p class="muted mb-0">View, edit, delete or mark your items as sold.</p></div>
        <a class="btn btn-primary" href="sell.html">${icon("plus")}New listing</a>
      </div>
      <section class="card">
        <div class="tabs" role="tablist" style="padding:0 12px">${tab("all", "All")}${tab("active", "Active")}${tab("sold", "Sold")}</div>
        <div class="list table-like">
          ${shown.length ? shown.map(p => `
            <div class="list-item" data-id="${esc(p.id)}">
              <img class="thumb" src="${esc(productImage(p))}" alt="">
              <div class="grow">
                <a class="title" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.title)}</a>
                <span class="sub">${money(p.price)} · ${esc(p.category)} · listed ${esc(formatDate(p.createdAt))}</span>
              </div>
              ${countEnquiries(p.id) ? `<a class="badge" href="messages.html" title="Buyer enquiries">${icon("message")}${countEnquiries(p.id)} enquir${countEnquiries(p.id) === 1 ? "y" : "ies"}</a>` : ""}
              ${p.status === "sold" ? '<span class="badge badge-sold">Sold</span>' : '<span class="badge badge-verified">Active</span>'}
              <div class="listing-actions">
                <a class="btn btn-sm btn-ghost" href="product.html?id=${encodeURIComponent(p.id)}">${icon("eye")}View</a>
                ${p.status === "active" ? `
                  <a class="btn btn-sm btn-ghost" href="sell.html?edit=${encodeURIComponent(p.id)}">${icon("edit")}Edit</a>
                  <button type="button" class="btn btn-sm btn-light" data-action="sold">${icon("check")}Mark as sold</button>` : ""}
                <button type="button" class="btn btn-sm btn-danger-soft" data-action="delete" aria-label="Delete ${esc(p.title)}">${icon("trash")}Delete</button>
              </div>
            </div>`).join("") :
            emptyState({ iconName: "tag", title: listingFilter === "sold" ? "No sold items yet" : "No listings yet", text: "Items you list for sale will appear here.", actionLabel: "Sell an item", actionHref: "sell.html" })}
        </div>
      </section>`;

    view.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => { listingFilter = btn.dataset.filter; listings(); }));
    view.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.closest("[data-id]").dataset.id;
      const product = data.product(id);
      if (btn.dataset.action === "delete") {
        App.confirm({ title: "Delete this listing?", message: `"${product.title}" will be permanently removed from the marketplace.`, confirmLabel: "Delete listing", danger: true, iconName: "trash" })
          .then(ok => {
            if (!ok) return;
            const result = deleteListing(id, me.id);
            App.toast(result.ok ? "Listing deleted." : result.error, result.ok ? "success" : "error");
            listings();
          });
      } else {
        App.confirm({ title: "Mark as sold?", message: `"${product.title}" will be hidden from the marketplace and counted as sold.`, confirmLabel: "Mark as sold", iconName: "checkCircle" })
          .then(ok => {
            if (!ok) return;
            const result = markListingSold(id, me.id);
            App.toast(result.ok ? "Listing marked as sold." : result.error, result.ok ? "success" : "error");
            listings();
          });
      }
    }));
  }

  /* ---------- Purchases ---------- */
  function purchases() {
    const list = myPurchases();
    view.innerHTML = `
      <div><h1 style="font-size:1.6rem;margin:0">My purchases</h1><p class="muted mb-0">Items you confirmed buying. Leave a review once you've collected the item.</p></div>
      <section class="card">
        <div class="list">
          ${list.length ? list.map(pur => {
            const p = data.product(pur.productId);
            const seller = data.user(pur.sellerId);
            return `<div class="list-item" data-purchase="${esc(pur.id)}">
              <img class="thumb" src="${esc(p ? productImage(p) : App.productArt("box", "Other"))}" alt="">
              <div class="grow">
                <span class="title">${esc(p ? p.title : "Removed listing")}</span>
                <span class="sub">${money(pur.price)} · from ${esc(publicName(seller))} · ${esc(formatDate(pur.createdAt))}</span>
              </div>
              <div class="listing-actions">
                ${p ? `<a class="btn btn-sm btn-ghost" href="product.html?id=${encodeURIComponent(p.id)}">${icon("eye")}View</a>` : ""}
                ${p ? `<a class="btn btn-sm btn-ghost" href="messages.html?product=${encodeURIComponent(p.id)}">${icon("message")}Message</a>` : ""}
                ${pur.reviewed ? `<span class="badge badge-verified">${icon("check")}Reviewed</span>` : `<button type="button" class="btn btn-sm btn-primary" data-review>${icon("star")}Leave review</button>`}
              </div>
            </div>`;
          }).join("") : emptyState({ iconName: "bag", title: "No purchases yet", text: "When you confirm a purchase with a seller it will appear here.", actionLabel: "Browse marketplace", actionHref: "marketplace.html" })}
        </div>
      </section>`;
    view.querySelectorAll("[data-review]").forEach(btn => btn.addEventListener("click", () => {
      const purchase = data.purchases().find(p => p.id === btn.closest("[data-purchase]").dataset.purchase);
      App.openReview(purchase, purchases);
    }));
  }

  /* ---------- Reviews ---------- */
  let reviewTab = "received";
  function reviews() {
    const received = data.reviews().filter(r => r.sellerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const written = data.reviews().filter(r => r.reviewerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const rating = App.sellerRating(me.id);
    const list = reviewTab === "received" ? received : written;

    view.innerHTML = `
      <div><h1 style="font-size:1.6rem;margin:0">Reviews</h1><p class="muted mb-0">Ratings help students trade with confidence.</p></div>
      <section class="card">
        <div class="card-body rating-summary" style="border-bottom:1px solid var(--border-2)">
          <span class="big">${rating.count ? rating.average.toFixed(1) : "–"}</span>
          <div>${stars(rating.average)}<div class="small muted">${rating.count} review${rating.count === 1 ? "" : "s"} as a seller</div></div>
        </div>
        <div class="tabs" role="tablist" style="padding:0 12px">
          <button type="button" class="tab" role="tab" data-tab="received" aria-selected="${reviewTab === "received"}">About me<span class="badge">${received.length}</span></button>
          <button type="button" class="tab" role="tab" data-tab="written" aria-selected="${reviewTab === "written"}">Written by me<span class="badge">${written.length}</span></button>
        </div>
        <div class="card-body" style="padding-top:4px">
          ${list.length ? list.map(r => {
            const person = data.user(reviewTab === "received" ? r.reviewerId : r.sellerId);
            return `<div class="review-item">
              <div class="review-head">${avatar(person, "avatar-sm")}<div class="grow"><strong>${reviewTab === "received" ? "" : "To "}${esc(publicName(person))}</strong><span class="small muted">${esc(timeAgo(r.createdAt))}</span></div>${stars(r.rating)}</div>
              <p>${esc(r.text)}</p><div class="review-for">Item: ${esc(r.productTitle)}</div>
            </div>`;
          }).join("") : emptyState({ iconName: "star", title: "No reviews yet", text: reviewTab === "received" ? "Reviews from your buyers will appear here." : "After a purchase you can review the seller from My Purchases.", actionLabel: reviewTab === "written" ? "My purchases" : "", actionHref: "#purchases" })}
        </div>
      </section>`;
    view.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { reviewTab = btn.dataset.tab; reviews(); }));
  }

  /* ---------- Saved items ---------- */
  function saved() {
    const ids = App.favourites(me.id);
    const items = ids.map(id => data.product(id)).filter(Boolean);
    view.innerHTML = `
      <div><h1 style="font-size:1.6rem;margin:0">Saved items</h1><p class="muted mb-0">Items you've saved with the heart button.</p></div>
      ${items.length ? `<div class="product-grid">${items.map(p => productCard(p)).join("")}</div>` :
        `<section class="card">${emptyState({ iconName: "heart", title: "No saved items", text: "Tap the heart on any listing to save it for later.", actionLabel: "Browse marketplace", actionHref: "marketplace.html" })}</section>`}`;
  }
  document.addEventListener("favourites:changed", () => { if (currentView() === "saved") saved(); });

  /* ---------- Router ---------- */
  const views = { overview, listings, purchases, reviews, saved };
  function currentView() {
    const key = window.location.hash.replace("#", "");
    return views[key] ? key : "overview";
  }
  function route(focus) {
    const key = currentView();
    renderNav(key);
    views[key]();
    if (focus) { view.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  window.addEventListener("hashchange", () => route(true));
  route(false);
});
