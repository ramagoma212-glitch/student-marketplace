/*
 Student Market Place
 Purpose: Student / seller profile (profile.html?id=u_lerato, defaults to the logged-in student)
 Technology: Vanilla JavaScript

 Only public information is shown – never the email address or student number.
*/
App.ready(() => {
  const { icon, esc, data, avatar, stars, publicName, productCard, timeAgo, formatDate, emptyState } = App;
  const root = document.getElementById("profile-root");
  const me = App.currentUser();
  const requestedId = App.param("id");

  if (!requestedId && !me) { App.requireLogin(); return; }
  const user = data.user(requestedId || me.id);
  if (!user) {
    root.innerHTML = `<div class="card">${emptyState({ iconName: "user", title: "Student not found", text: "This profile doesn't exist or has been removed.", actionLabel: "Browse marketplace", actionHref: "marketplace.html" })}</div>`;
    return;
  }

  const isMe = me && me.id === user.id;
  let activeTab = ["listings", "reviews", "about"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "listings";
  document.title = (isMe ? "My profile" : publicName(user)) + " | Student Market Place";

  function render() {
    const fresh = data.user(user.id);
    const rating = App.sellerRating(user.id);
    const products = data.products().filter(p => p.sellerId === user.id);
    const active = products.filter(p => p.status === "active").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const sold = products.filter(p => p.status === "sold");
    const reviews = data.reviews().filter(r => r.sellerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const tab = (key, label, count) => `<button type="button" class="tab" role="tab" id="tab-${key}" aria-controls="panel" aria-selected="${activeTab === key}" data-tab="${key}">${label}${count !== undefined ? `<span class="badge">${count}</span>` : ""}</button>`;

    let panel = "";
    if (activeTab === "listings") {
      panel = active.length ? `<div class="product-grid">${active.map(p => productCard(p)).join("")}</div>`
        : `<div class="card">${emptyState({ iconName: "tag", title: "No active listings", text: isMe ? "Items you list for sale will appear here." : `${fresh.firstName} isn't selling anything right now.`, actionLabel: isMe ? "Sell an item" : "", actionHref: "sell.html" })}</div>`;
    } else if (activeTab === "reviews") {
      panel = `<div class="card"><div class="card-body">${reviews.length ? `
        <div class="rating-summary"><span class="big">${rating.average.toFixed(1)}</span><div>${stars(rating.average)}<div class="small muted">Based on ${rating.count} review${rating.count === 1 ? "" : "s"}</div></div></div>
        ${reviews.map(r => {
          const reviewer = data.user(r.reviewerId);
          return `<div class="review-item">
            <div class="review-head">${avatar(reviewer, "avatar-sm")}<div class="grow"><strong>${esc(publicName(reviewer))}</strong><span class="small muted">${esc(timeAgo(r.createdAt))}</span></div>${stars(r.rating)}</div>
            <p>${esc(r.text)}</p><div class="review-for">Purchased: ${esc(r.productTitle)}</div></div>`;
        }).join("")}` : emptyState({ iconName: "star", title: "No reviews yet", text: "Reviews appear here after students buy from this seller." })}</div></div>`;
    } else {
      panel = `<div class="grid grid-2" style="align-items:start">
        <div class="card card-pad">
          <h3>About ${esc(fresh.firstName)}</h3>
          <p class="muted">${fresh.bio ? esc(fresh.bio) : (isMe ? "You haven't added a bio yet." : "This student hasn't added a bio yet.")}</p>
          <ul class="tip-list">
            <li>${icon("mapPin")}Usually trades at ${esc(fresh.campus || "TUT campus")}</li>
            <li>${icon("calendar")}Member since ${esc(formatDate(fresh.createdAt))}</li>
            <li>${icon("checkCircle")}${sold.length} item${sold.length === 1 ? "" : "s"} sold on Student Market Place</li>
          </ul>
        </div>
        <div class="card card-pad">
          <h3>${icon("shieldCheck")} Verified TUT Student</h3>
          <p class="muted mb-0">Student email validated: this account registered with an accepted <strong>@tut4life.ac.za</strong> address. (In this prototype the address format is checked; a live system would also send a confirmation email.) Contact details are kept private – use the marketplace inbox to get in touch.</p>
        </div>
      </div>`;
    }

    root.innerHTML = `
      <section class="card" style="overflow:hidden">
        <div class="profile-cover"></div>
        <div class="profile-head">
          <div class="profile-head-inner">
            ${avatar(fresh, "avatar-xl")}
            <div class="grow">
              <h1>${esc(isMe ? App.fullName(fresh) : publicName(fresh))}</h1>
              <div class="profile-meta">
                <span class="badge badge-verified">${icon("verified")}Verified TUT Student</span>
                <span>${icon("calendar")}Member since ${esc(formatDate(fresh.createdAt))}</span>
                <span>${icon("mapPin")}${esc(fresh.campus || "TUT")}</span>
                ${rating.count ? `<span>${stars(rating.average)} ${rating.average.toFixed(1)}</span>` : ""}
              </div>
            </div>
            <div class="row row-wrap">
              ${isMe ? `<button type="button" class="btn btn-outline" id="edit-profile">${icon("edit")}Edit profile</button><a class="btn btn-primary" href="dashboard.html">${icon("dashboard")}Dashboard</a>`
                     : active.length ? `<a class="btn btn-primary" href="messages.html?product=${encodeURIComponent(active[0].id)}">${icon("message")}Message ${esc(fresh.firstName)}</a>` : ""}
            </div>
          </div>
        </div>
        <div class="profile-stats">
          <div><strong>${rating.count ? rating.average.toFixed(1) : "–"}</strong><span>Average rating</span></div>
          <div><strong>${rating.count}</strong><span>Reviews</span></div>
          <div><strong>${active.length}</strong><span>Items selling</span></div>
          <div><strong>${sold.length}</strong><span>Items sold</span></div>
        </div>
      </section>

      <div class="tabs mt-24" role="tablist" aria-label="Profile sections">
        ${tab("listings", "Listings", active.length)}${tab("reviews", "Reviews", reviews.length)}${tab("about", "About")}
      </div>
      <div class="mt-24" id="panel" role="tabpanel" aria-labelledby="tab-${activeTab}">${panel}</div>`;

    root.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      history.replaceState(null, "", location.pathname.split("/").pop() + location.search + "#" + activeTab);
      render();
      document.getElementById("tab-" + activeTab).focus();
    }));
    const edit = document.getElementById("edit-profile");
    if (edit) edit.addEventListener("click", openEdit);
  }

  function openEdit() {
    const current = data.user(user.id);
    App.modal({
      title: "Edit profile",
      subtitle: "Your email and student number stay private.",
      iconName: "user",
      body: `<div class="form-grid">
        <div class="field"><label for="edit-campus">Main campus</label><select class="select" id="edit-campus">${CAMPUSES.map(c => `<option ${c === current.campus ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
        <div class="field"><label for="edit-bio">Short bio</label><textarea class="textarea" id="edit-bio" maxlength="200" placeholder="e.g. 2nd year IT student, selling books I no longer need.">${esc(current.bio || "")}</textarea></div>
      </div>`,
      actions: [
        { label: "Cancel", className: "btn-outline" },
        {
          label: "Save changes", className: "btn-primary", onClick: (close, modalRoot) => {
            const users = data.users().map(u => u.id === user.id ? { ...u, campus: modalRoot.querySelector("#edit-campus").value, bio: modalRoot.querySelector("#edit-bio").value.trim() } : u);
            data.saveUsers(users);
            App.toast("Profile updated.", "success");
            render();
          }
        }
      ]
    });
  }

  render();
});
