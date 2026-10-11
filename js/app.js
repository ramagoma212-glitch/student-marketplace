/*
 Student Market Place
 Purpose: Shared front-end code used by every page of the prototype
 Technology: Vanilla JavaScript + localStorage
*/

/* ==========================================================
   Loaded on every page (after data.js, before services.js). Provides:
   - Store:   read/write helpers for localStorage
   - Session: login state of the current student
   - UI:      header, footer, mobile nav, modals, toasts
   - Shared flows: purchase, review and report modals

   IMPORTANT: This is a static front-end prototype. All data
   lives in the browser's localStorage, which is NOT secure.
   A production version would need a real backend with a
   database, hashed passwords and server-side sessions.
   ========================================================== */

const App = (() => {

  /* ---------------- Storage helpers ---------------- */
  const KEYS = {
    users: "smp_users",
    session: "smp_current_user",
    products: "smp_products",
    messages: "smp_messages",
    purchases: "smp_purchases",
    reviews: "smp_reviews",
    reports: "smp_reports",
    favourites: "smp_favourites",
    seeded: "smp_seed_version"
  };
  const SEED_VERSION = "1";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      // Usually means the browser storage quota is full (large images).
      toast("Your browser storage is full. Try a smaller image.", "error");
      return false;
    }
  }

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* Demo-only password scrambling. This is NOT real security –
     a production system must hash passwords on a secure server. */
  function hashPassword(password) {
    let hash = 5381;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) + hash + password.charCodeAt(i)) >>> 0;
    }
    return "demo$" + hash.toString(16);
  }

  /* ---------------- Seeding ---------------- */
  function daysAgoISO(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(9 + (days % 8), (days * 17) % 60, 0, 0);
    return d.toISOString();
  }

  function minutesAgoISO(minutes) {
    return new Date(Date.now() - minutes * 60000).toISOString();
  }

  function seedIfNeeded() {
    if (read(KEYS.seeded, null) === SEED_VERSION) return;

    const users = SEED_USERS.map(u => {
      const { password, ...rest } = u;
      return { ...rest, passwordHash: hashPassword(password) };
    });

    const products = SEED_PRODUCTS.map(p => {
      const { daysAgo, ...rest } = p;
      return {
        status: "active",
        contactPreference: "Marketplace inbox",
        image: "",
        ...rest,
        createdAt: daysAgoISO(daysAgo),
        soldAt: p.status === "sold" ? daysAgoISO(Math.max(daysAgo - 3, 0)) : null
      };
    });

    const reviews = SEED_REVIEWS.map((r, i) => {
      const { daysAgo, ...rest } = r;
      return { id: "r" + (i + 1), productId: null, ...rest, createdAt: daysAgoISO(daysAgo) };
    });

    const conversations = SEED_CONVERSATIONS.map(c => {
      const messages = c.messages.map((m, i) => ({
        id: c.id + "_m" + i,
        senderId: m.senderId,
        text: m.text,
        createdAt: minutesAgoISO(m.minutesAgo)
      }));
      const lastRead = {};
      const latest = messages[messages.length - 1].createdAt;
      [c.buyerId, c.sellerId].forEach(id => {
        if (id === "u_demo") {
          lastRead[id] = c.readByDemo ? latest : minutesAgoISO(60 * 24 * 30);
        } else {
          lastRead[id] = latest;
        }
      });
      return { id: c.id, productId: c.productId, buyerId: c.buyerId, sellerId: c.sellerId, messages, lastRead, autoReplied: true };
    });

    const purchases = SEED_PURCHASES.map(p => {
      const { daysAgo, ...rest } = p;
      return { ...rest, createdAt: daysAgoISO(daysAgo) };
    });

    write(KEYS.users, users);
    write(KEYS.products, products);
    write(KEYS.reviews, reviews);
    write(KEYS.messages, conversations);
    write(KEYS.purchases, purchases);
    write(KEYS.reports, []);
    write(KEYS.favourites, { u_demo: ["p03", "p09"] });
    write(KEYS.seeded, SEED_VERSION);
  }

  function resetDemoData() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(KEYS.session);
    seedIfNeeded();
  }

  /* ---------------- Data access ---------------- */
  const data = {
    users: () => read(KEYS.users, []),
    saveUsers: list => write(KEYS.users, list),
    user: id => read(KEYS.users, []).find(u => u.id === id) || null,

    products: () => read(KEYS.products, []),
    saveProducts: list => write(KEYS.products, list),
    product: id => read(KEYS.products, []).find(p => p.id === id) || null,
    updateProduct(id, changes) {
      const list = read(KEYS.products, []);
      const index = list.findIndex(p => p.id === id);
      if (index === -1) return false;
      list[index] = { ...list[index], ...changes };
      return write(KEYS.products, list);
    },

    conversations: () => read(KEYS.messages, []),
    saveConversations: list => write(KEYS.messages, list),

    purchases: () => read(KEYS.purchases, []),
    savePurchases: list => write(KEYS.purchases, list),

    reviews: () => read(KEYS.reviews, []),
    saveReviews: list => write(KEYS.reviews, list),

    reports: () => read(KEYS.reports, []),
    saveReports: list => write(KEYS.reports, list)
  };

  /* Seller reputation – uses calculateAverageRating() from services.js */
  function sellerRating(userId) {
    const list = data.reviews().filter(r => r.sellerId === userId);
    return { average: calculateAverageRating(list), count: list.length };
  }

  function unreadCount(userId) {
    if (!userId) return 0;
    return data.conversations().reduce((total, c) => total + countUnread(c, userId), 0);
  }

  function conversationUnread(convo, userId) {
    return countUnread(convo, userId);
  }

  /* ---------------- Session ---------------- */
  function getSession() {
    return read(KEYS.session, null) || JSON.parse(sessionStorage.getItem(KEYS.session) || "null");
  }

  function currentUser() {
    const session = getSession();
    return session ? data.user(session.userId) : null;
  }

  function startSession(userId, remember) {
    const session = { userId, loginAt: new Date().toISOString(), remember: !!remember };
    // "Remember me" keeps the session after the browser closes (localStorage);
    // otherwise it only lasts for this browser tab session (sessionStorage).
    if (remember) {
      write(KEYS.session, session);
    } else {
      localStorage.removeItem(KEYS.session);
      sessionStorage.setItem(KEYS.session, JSON.stringify(session));
    }
  }

  function endSession() {
    localStorage.removeItem(KEYS.session);
    sessionStorage.removeItem(KEYS.session);
  }

  function logout() {
    confirmDialog({
      title: "Log out?",
      message: "You will need to log in again to message sellers or manage your listings.",
      confirmLabel: "Log out",
      icon: "logout"
    }).then(ok => {
      if (!ok) return;
      logoutUser();
      flash("You have been logged out. See you soon!");
      window.location.href = "index.html";
    });
  }

  /* Pages that need a logged-in student call this first. */
  function requireLogin() {
    if (currentUser()) return true;
    const page = window.location.pathname.split("/").pop() || "index.html";
    flash("Please log in with your TUT student account to continue.", "info");
    window.location.replace("login.html?next=" + encodeURIComponent(page + window.location.search + window.location.hash));
    return false;
  }

  /* Only allow redirects to pages inside this site (no external URLs). */
  function safeNext(next) {
    if (!next || /^[a-z]+:|^\/\//i.test(next) || next.startsWith("/")) return "dashboard.html";
    return next;
  }

  /* ---------------- Favourites ---------------- */
  function favourites(userId) {
    const all = read(KEYS.favourites, {});
    return all[userId] || [];
  }

  function toggleFavourite(productId) {
    const user = currentUser();
    if (!user) {
      toast("Log in to save items to your favourites.", "info");
      return null;
    }
    const all = read(KEYS.favourites, {});
    const list = all[user.id] || [];
    const index = list.indexOf(productId);
    if (index === -1) list.push(productId); else list.splice(index, 1);
    all[user.id] = list;
    write(KEYS.favourites, all);
    return index === -1;
  }

  /* ---------------- Formatting ---------------- */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* South African Rand formatting. Prices are stored as numbers (450) and only
     formatted for display. Intl.NumberFormat("en-ZA") supplies the "R" symbol;
     the parts are rebuilt so the result reads R1,200 (the default en-ZA output
     is "R 1 200,00"). */
  function money(amount) {
    const n = Number(amount) || 0;
    const decimals = Number.isInteger(n) ? 0 : 2;
    const formatter = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return formatter.formatToParts(n).map(part => {
      if (part.type === "group") return ",";
      if (part.type === "decimal") return ".";
      if (part.type === "literal") return "";
      return part.value;
    }).join("");
  }

  function timeAgo(iso) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + " min ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return days + " days ago";
    if (days < 30) { const w = Math.floor(days / 7); return w + (w === 1 ? " week ago" : " weeks ago"); }
    return formatDate(iso);
  }

  function formatDate(iso, withYear = true) {
    const options = withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" };
    return new Date(iso).toLocaleDateString("en-ZA", options);
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }

  function fullName(user) { return user ? user.firstName + " " + user.lastName : "Unknown student"; }
  /* Public display name hides the full surname for privacy: "Lerato M." */
  function publicName(user) { return user ? user.firstName + " " + user.lastName.charAt(0) + "." : "Unknown"; }
  function initials(user) { return user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : "?"; }

  const AVATAR_COLOURS = ["#1f6fd1", "#0d3561", "#2b7a9e", "#4a5fc1", "#155e9c", "#3768b3", "#0f6b78", "#5a4fb0"];
  function avatar(user, size = "") {
    const id = user ? user.id : "x";
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const colour = AVATAR_COLOURS[sum % AVATAR_COLOURS.length];
    return `<span class="avatar ${size}" style="--avatar-bg:${colour}" aria-hidden="true">${esc(initials(user))}</span>`;
  }

  function stars(rating, label = true) {
    let html = `<span class="stars" ${label ? `role="img" aria-label="${rating} out of 5 stars"` : 'aria-hidden="true"'}>`;
    for (let i = 1; i <= 5; i++) {
      html += icon("star", i <= Math.round(rating) ? "" : "off", i <= Math.round(rating) ? "currentColor" : "currentColor");
    }
    return html + "</span>";
  }

  function ratingInline(userId) {
    const r = sellerRating(userId);
    if (!r.count) return `<span class="rating-inline muted">New seller</span>`;
    return `<span class="rating-inline" aria-label="Rated ${r.average} out of 5">${icon("star")}${r.average.toFixed(1)}</span>`;
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /* ---------------- Icons (inline SVG) ---------------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    message: '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.7 3.7 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.3 0 5.5 3.2 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
    checkDouble: '<path d="m2 12.5 4.5 4.5L16 7.5M12 16.5l.5.5L22 7.5"/>',
    shieldCheck: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    verified: '<path d="M12 2.5 14.4 4.3 17.4 4.1 18.4 7 21 8.6 20.2 11.5 21 14.4 18.4 16 17.4 18.9 14.4 18.7 12 20.5 9.6 18.7 6.6 18.9 5.6 16 3 14.4 3.8 11.5 3 8.6 5.6 7 6.6 4.1 9.6 4.3z"/><path d="m8.7 11.6 2.3 2.3 4.3-4.5"/>',
    mapPin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8"/>',
    laptop: '<rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>',
    shirt: '<path d="M8 3 3 6l2 4.5 2.5-1V21h9V9.5l2.5 1L21 6l-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
    sofa: '<path d="M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M5 17v2M19 17v2"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M10 21v-4h4v4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2M3 12.5h18"/>',
    pen: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="m14.5 5.5 3 3"/>',
    calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="4" rx=".8"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="M21.5 2.5 10.5 13.5"/><path d="m21.5 2.5-7 19-4-8-8-4z"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bag: '<path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    coins: '<circle cx="12" cy="12" r="9"/><path d="M9 8h4a2.5 2.5 0 0 1 0 5H9zm0 5 5 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
    upload: '<path d="M12 15V4M7 9l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11"/>',
    trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    graduation: '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9.5v5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
    lamp: '<path d="M9 21h6M12 21v-8"/><path d="M7 4h10l2 7H5z"/>',
    handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2.8 2.8 0 0 0-4 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a5 5 0 0 1 5.3-1.1l.6.2a2 2 0 0 0 1.6 0L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1.4 1.4 0 0 0 2-2M3 4h8"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    file: '<path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5M9 12h6M9 15.5h6"/>'
  };

  function icon(name, extraClass = "", fill = "none") {
    const body = ICONS[name] || ICONS.box;
    const filled = name === "star" ? 'fill="currentColor"' : `fill="${fill}"`;
    return `<svg class="icon${extraClass ? " " + extraClass : ""}" viewBox="0 0 24 24" ${filled} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  /* ---------------- Product illustrations ----------------
     The seed listings use generated SVG illustrations so the
     demo works offline. Uploaded listings use the student's
     own photo instead. */
  const ART_SHAPES = {
    fridge: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12M9 5.5v2M9 13v3"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/>',
    backpack: '<path d="M6 9a6 6 0 0 1 12 0v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M9.5 3.5h5M8.5 14h7v4h-7z"/>',
    chair: '<rect x="7" y="3" width="10" height="8" rx="1.5"/><path d="M5 11h14v3H5zM7 14v7M17 14v7"/>',
    desk: '<path d="M2.5 9h19M4 9v11M20 9v11M13 9v7h7"/><path d="M15 12.5h3"/>',
    charger: '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
    notes: '<path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5M9 12h6M9 15.5h6M9 9h2"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    tutor: ICONS.graduation,
    bed: '<path d="M3 7v13M3 16h18v4M21 16v-4a3 3 0 0 0-3-3h-8v7"/><circle cx="6.5" cy="11.5" r="1.5"/>',
    mouse: '<rect x="6.5" y="3" width="11" height="18" rx="5.5"/><path d="M12 3v6M6.5 9h11"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'
  };

  const ART_COLOURS = {
    "Textbooks": ["#dbe9ff", "#b4cff7"],
    "Electronics": ["#e1f1ff", "#b8d9f5"],
    "Clothing": ["#e5e8ff", "#c3c9f3"],
    "Furniture": ["#e2f0f6", "#bcd9e6"],
    "Accommodation": ["#e6edfb", "#c6d4ef"],
    "Student Services": ["#dff3fa", "#b2dcee"],
    "Stationery": ["#e8efff", "#ccd9f8"],
    "Study Equipment": ["#dcecfd", "#b6d1f3"],
    "Other": ["#eaeff6", "#cfd8e5"]
  };

  const artCache = {};
  function productArt(kind, category) {
    const key = kind + "|" + category;
    if (artCache[key]) return artCache[key];
    const shape = ART_SHAPES[kind] || ICONS[kind] || ICONS[categoryIcon(category)] || ICONS.box;
    const [c1, c2] = ART_COLOURS[category] || ART_COLOURS.Other;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <rect width="800" height="600" fill="url(#b)"/>
      <circle cx="660" cy="100" r="190" fill="#fff" opacity=".28"/>
      <circle cx="110" cy="540" r="150" fill="#fff" opacity=".2"/>
      <circle cx="400" cy="290" r="185" fill="#fff" opacity=".55"/>
      <ellipse cx="400" cy="505" rx="150" ry="16" fill="#082744" opacity=".08"/>
      <g transform="translate(400 290) scale(10.5) translate(-12 -12)" fill="none" stroke="#1f6fd1" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${shape}</g>
      <g transform="translate(400 290) scale(10.5) translate(-12 -12)" fill="none" stroke="#082744" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${shape}</g>
    </svg>`;
    artCache[key] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return artCache[key];
  }

  function productImage(product) {
    return product.image || productArt(product.art || categoryIcon(product.category), product.category);
  }

  function categoryIcon(name) {
    const cat = CATEGORIES.find(c => c.name === name);
    return cat ? cat.icon : "box";
  }

  /* ---------------- Product card ---------------- */
  function productCard(product, options = {}) {
    const seller = data.user(product.sellerId);
    const me = currentUser();
    const isOwn = me && me.id === product.sellerId;
    const isFav = me && favourites(me.id).includes(product.id);
    const sold = product.status === "sold";
    const showActions = options.actions !== false;
    const url = "product.html?id=" + encodeURIComponent(product.id);

    return `
      <article class="product-card${sold ? " is-sold" : ""}" data-id="${esc(product.id)}">
        <div class="pc-media">
          <img src="${esc(productImage(product))}" alt="${esc(product.title)}" loading="lazy" decoding="async">
          <span class="badge badge-glass">${esc(product.category)}</span>
          ${sold ? '<span class="badge badge-sold">Sold</span>' : ""}
        </div>
        ${options.preview ? "" : `<button type="button" class="fav-btn" data-fav="${esc(product.id)}" aria-pressed="${isFav ? "true" : "false"}" aria-label="${isFav ? "Remove from saved items" : "Save item"}">${icon("heart")}</button>`}
        <div class="pc-body">
          <div class="pc-price">${money(product.price)}</div>
          <h3 class="pc-title"><a href="${options.preview ? "#" : url}">${esc(product.title)}</a></h3>
          <div class="pc-meta">
            <span>${icon("tag")}${esc(product.condition)}</span>
            <span class="pc-campus">${icon("mapPin")}${esc(product.campus)}</span>
          </div>
          <div class="pc-seller">
            ${avatar(seller, "avatar-xs")}
            <span class="name">${esc(publicName(seller))}</span>
            ${icon("verified", "verified-tick")}
            ${ratingInline(product.sellerId)}
          </div>
          <div class="pc-meta"><span>${icon("clock")}Listed ${esc(timeAgo(product.createdAt))}</span></div>
          ${showActions && !options.preview ? `
          <div class="pc-actions">
            <a class="btn btn-sm btn-outline" href="${url}">View item</a>
            ${!isOwn && !sold ? `<a class="btn btn-sm btn-light" href="messages.html?product=${encodeURIComponent(product.id)}" aria-label="Contact seller about ${esc(product.title)}">${icon("message")}<span class="sr-only">Contact seller</span></a>` : ""}
          </div>` : ""}
        </div>
      </article>`;
  }

  function skeletonCards(count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<div class="product-card skeleton-card" aria-hidden="true">
        <div class="pc-media skeleton"></div>
        <div class="pc-body">
          <div class="skeleton skeleton-line" style="width:40%;height:18px"></div>
          <div class="skeleton skeleton-line" style="width:90%"></div>
          <div class="skeleton skeleton-line" style="width:60%"></div>
        </div></div>`;
    }
    return html;
  }

  function emptyState({ iconName = "inbox", title, text, actionLabel, actionHref }) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon(iconName)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${actionLabel ? `<a class="btn btn-primary" href="${actionHref}">${esc(actionLabel)}</a>` : ""}
    </div>`;
  }

  /* Favourite hearts work everywhere through one delegated listener. */
  function handleFavouriteClicks(event) {
    const btn = event.target.closest("[data-fav]");
    if (!btn) return;
    event.preventDefault();
    const saved = toggleFavourite(btn.dataset.fav);
    if (saved === null) return;
    document.querySelectorAll(`[data-fav="${btn.dataset.fav}"]`).forEach(b => {
      b.setAttribute("aria-pressed", saved ? "true" : "false");
      b.setAttribute("aria-label", saved ? "Remove from saved items" : "Save item");
    });
    toast(saved ? "Saved to your favourites." : "Removed from your favourites.", "success");
    document.dispatchEvent(new CustomEvent("favourites:changed"));
  }

  /* ---------------- Toasts ---------------- */
  function toast(message, type = "info") {
    let region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    const iconName = type === "success" ? "check" : type === "error" ? "alert" : "info";
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `<span class="toast-icon">${icon(iconName)}</span><span>${esc(message)}</span>`;
    region.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 3400);
  }

  /* A flash message survives one page redirect (e.g. after logout). */
  function flash(message, type = "success") {
    sessionStorage.setItem("smp_flash", JSON.stringify({ message, type }));
  }
  function showFlash() {
    const raw = sessionStorage.getItem("smp_flash");
    if (!raw) return;
    sessionStorage.removeItem("smp_flash");
    const { message, type } = JSON.parse(raw);
    setTimeout(() => toast(message, type), 250);
  }

  /* ---------------- Modals ---------------- */
  function modal({ title, subtitle = "", iconName = "", iconType = "", body = "", actions = [], size = "", onOpen }) {
    const previouslyFocused = document.activeElement;
    const titleId = uid("mt");
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="modal-header">
          ${iconName ? `<div class="modal-icon ${iconType}">${icon(iconName)}</div>` : ""}
          <div><h2 id="${titleId}">${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>
          <button type="button" class="icon-btn modal-close" aria-label="Close dialog">${icon("x")}</button>
        </div>
        <div class="modal-body"></div>
        ${actions.length ? '<div class="modal-footer"></div>' : ""}
      </div>`;
    const bodyEl = backdrop.querySelector(".modal-body");
    if (typeof body === "string") bodyEl.innerHTML = body; else bodyEl.appendChild(body);
    if (!body) bodyEl.remove();

    function close() {
      backdrop.classList.remove("open");
      document.removeEventListener("keydown", onKey);
      setTimeout(() => {
        backdrop.remove();
        if (!document.querySelector(".modal-backdrop")) document.body.classList.remove("modal-open");
        if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      }, 200);
    }

    const footer = backdrop.querySelector(".modal-footer");
    actions.forEach(action => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn " + (action.className || "btn-outline");
      btn.innerHTML = (action.iconName ? icon(action.iconName) : "") + esc(action.label);
      btn.addEventListener("click", () => {
        const result = action.onClick ? action.onClick(close, backdrop) : undefined;
        if (result !== false) close();
      });
      footer.appendChild(btn);
    });

    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const focusables = backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const visible = Array.from(focusables).filter(el => !el.disabled && el.offsetParent !== null);
        if (!visible.length) return;
        const first = visible[0], last = visible[visible.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    backdrop.querySelector(".modal-close").addEventListener("click", close);
    backdrop.addEventListener("mousedown", e => { if (e.target === backdrop) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(backdrop);
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => backdrop.classList.add("open"));
    const firstInput = backdrop.querySelector(".modal-body input, .modal-body textarea, .modal-body select") || backdrop.querySelector(".modal-footer .btn:last-child") || backdrop.querySelector(".modal-close");
    setTimeout(() => firstInput && firstInput.focus(), 50);
    if (onOpen) onOpen(backdrop, close);
    return { close, el: backdrop };
  }

  function confirmDialog({ title, message, confirmLabel = "Confirm", danger = false, iconName, icon: iconAlias }) {
    return new Promise(resolve => {
      let answered = false;
      const m = modal({
        title,
        subtitle: message,
        iconName: iconName || iconAlias || (danger ? "alert" : "info"),
        iconType: danger ? "danger" : "",
        actions: [
          { label: "Cancel", className: "btn-outline", onClick: () => { answered = true; resolve(false); } },
          { label: confirmLabel, className: danger ? "btn-danger" : "btn-primary", onClick: () => { answered = true; resolve(true); } }
        ]
      });
      // Resolve false if closed with Esc / backdrop / X.
      const observer = new MutationObserver(() => {
        if (!document.body.contains(m.el)) { observer.disconnect(); if (!answered) resolve(false); }
      });
      observer.observe(document.body, { childList: true });
    });
  }

  /* Small helpers to show/clear inline field errors */
  function setFieldError(input, message) {
    const field = input.closest(".field");
    if (!field) return;
    let msg = field.querySelector(".field-msg");
    field.classList.remove("is-valid");
    if (!message) {
      field.classList.remove("has-error");
      input.removeAttribute("aria-invalid");
      if (msg) msg.remove();
      return;
    }
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    if (!msg) {
      msg = document.createElement("div");
      msg.id = (input.id || uid("f")) + "-msg";
      input.setAttribute("aria-describedby", msg.id);
      field.appendChild(msg);
    }
    msg.className = "field-msg error";
    msg.setAttribute("role", "alert");
    msg.innerHTML = icon("alert") + "<span>" + esc(message) + "</span>";
  }

  function setFieldSuccess(input, message) {
    const field = input.closest(".field");
    setFieldError(input, "");
    field.classList.add("is-valid");
    const msg = document.createElement("div");
    msg.className = "field-msg success";
    msg.id = input.id + "-msg";
    input.setAttribute("aria-describedby", msg.id);
    msg.innerHTML = icon("checkCircle") + "<span>" + esc(message) + "</span>";
    field.appendChild(msg);
  }

  /* ---------------- Shared flows ---------------- */

  /* Report a listing (product page). */
  function openReport(product) {
    const me = currentUser();
    if (!me) { requireLogin(); return; }
    const reasons = REPORT_REASONS;
    const body = `
      <form id="report-form" class="form-grid" novalidate>
        <fieldset class="field" style="border:0;padding:0;margin:0">
          <legend class="label" style="margin-bottom:8px">Reason for reporting <span class="muted">(required)</span></legend>
          <div class="radio-list">
            ${reasons.map((r, i) => `<label><span><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'id="report-reason-0"' : ""}>${esc(r)}</span></label>`).join("")}
          </div>
          <div class="field-msg error" id="reason-error" hidden>${icon("alert")}<span>Please choose a reason for your report.</span></div>
        </fieldset>
        <div class="field">
          <label for="report-details">Additional details <span class="muted">(optional, required for "Other")</span></label>
          <textarea id="report-details" class="textarea" maxlength="500" placeholder="Tell us what looks wrong with this listing…"></textarea>
        </div>
      </form>`;
    modal({
      title: "Report listing",
      subtitle: product.title,
      iconName: "flag",
      iconType: "danger",
      body,
      actions: [
        { label: "Cancel", className: "btn-outline" },
        {
          label: "Submit report", className: "btn-danger", onClick: (close, root) => {
            const chosen = root.querySelector('input[name="reason"]:checked');
            const details = root.querySelector("#report-details");
            const result = reportListing(product.id, me.id, chosen ? chosen.value : "", details.value);
            root.querySelector("#reason-error").hidden = result.field !== "reason";
            setFieldError(details, result.field === "details" ? result.error : "");
            if (!result.ok) { if (result.field === "details") details.focus(); return false; }
            setTimeout(() => modal({
              title: "Report submitted",
              subtitle: "Thank you. Your report has been submitted for review.",
              iconName: "checkCircle", iconType: "success",
              actions: [{ label: "Done", className: "btn-primary" }]
            }), 220);
          }
        }
      ]
    });
  }

  /* Confirm purchase – no real payment is processed. */
  function openPurchase(product, onDone) {
    const me = currentUser();
    if (!me) { requireLogin(); return; }
    if (product.sellerId === me.id) { toast("You cannot buy your own listing.", "error"); return; }
    const availability = checkAvailability(product.id);
    if (!availability.available) { toast(availability.message, "error"); return; }
    const seller = data.user(product.sellerId);
    const body = `
      <div class="list-item" style="padding:0 0 16px;border-bottom:1px solid var(--border-2)">
        <img class="thumb" src="${esc(productImage(product))}" alt="">
        <div class="grow"><span class="title">${esc(product.title)}</span><span class="sub">Seller: ${esc(publicName(seller))} · ${esc(product.campus)}</span></div>
        <strong style="color:var(--navy);font-size:1.15rem">${money(product.price)}</strong>
      </div>
      <div class="alert mt-16">${icon("info")}<div><strong>No online payment is taken</strong><p>Student Market Place does not process payments. You and the seller must agree on payment and collection – ideally in person at a safe campus location after inspecting the item.</p></div></div>
      <div class="field mt-16">
        <label class="checkbox"><input type="checkbox" id="agree-purchase"> <span>I have agreed to purchase this item.</span></label>
        <div class="field-msg error" id="agree-error" hidden>${icon("alert")}<span>Please tick the box to confirm you have agreed with the seller.</span></div>
      </div>`;
    modal({
      title: "Confirm purchase",
      subtitle: "Confirm only after you have agreed on the deal with the seller.",
      iconName: "handshake",
      body,
      actions: [
        { label: "Cancel", className: "btn-outline" },
        {
          label: "Confirm purchase", className: "btn-primary", iconName: "check", onClick: (close, root) => {
            const agree = root.querySelector("#agree-purchase");
            root.querySelector("#agree-error").hidden = agree.checked;
            if (!agree.checked) return false;
            const result = confirmPurchase(product.id, me.id);
            if (!result.ok) { toast(result.error, "error"); return; }
            const purchase = result.purchase;
            toast("Purchase confirmed.", "success");
            setTimeout(() => modal({
              title: "Purchase confirmed",
              subtitle: "Saved to My Purchases. Once you've received the item, leave a review to help other students.",
              iconName: "checkCircle", iconType: "success",
              actions: [
                { label: "View my purchases", className: "btn-outline", onClick: () => { window.location.href = "dashboard.html#purchases"; } },
                { label: "Leave a review", className: "btn-primary", iconName: "star", onClick: () => { setTimeout(() => openReview(purchase, onDone), 220); } }
              ]
            }), 220);
            if (onDone) onDone(purchase);
          }
        }
      ]
    });
  }

  /* Leave a 1–5 star review for the seller after a purchase. */
  function openReview(purchase, onDone) {
    const me = currentUser();
    if (!me) { requireLogin(); return; }
    const product = data.product(purchase.productId);
    const seller = data.user(purchase.sellerId);
    const starInputs = [5, 4, 3, 2, 1].map(n => `
      <input type="radio" name="rating" id="rate-${n}" value="${n}">
      <label for="rate-${n}" title="${n} star${n > 1 ? "s" : ""}"><span class="sr-only">${n} star${n > 1 ? "s" : ""}</span>${icon("star")}</label>`).join("");
    const body = `
      <form class="form-grid" novalidate>
        <div class="field">
          <span class="label" id="rating-label">Your rating</span>
          <div class="star-input" role="radiogroup" aria-labelledby="rating-label">${starInputs}</div>
          <div class="field-msg error" id="rating-error" hidden>${icon("alert")}<span>Please choose a rating between 1 and 5 stars.</span></div>
        </div>
        <div class="field">
          <label for="review-text">Your review</label>
          <textarea id="review-text" class="textarea" maxlength="400" placeholder="Was the item as described? Was the seller on time and friendly?"></textarea>
        </div>
      </form>`;
    modal({
      title: "Review " + publicName(seller),
      subtitle: product ? "For: " + product.title : "",
      iconName: "star",
      body,
      actions: [
        { label: "Cancel", className: "btn-outline" },
        {
          label: "Submit review", className: "btn-primary", onClick: (close, root) => {
            const chosen = root.querySelector('input[name="rating"]:checked');
            const text = root.querySelector("#review-text");
            const result = submitReview(purchase.id, me.id, chosen ? Number(chosen.value) : 0, text.value);
            root.querySelector("#rating-error").hidden = !(result.errors && result.errors.rating);
            setFieldError(text, (result.errors && result.errors.text) || "");
            if (!result.ok) {
              if (result.errors.form) toast(result.errors.form, "error");
              return false;
            }
            toast(`Review submitted. ${publicName(seller)}'s rating is now ${result.newAverage.toFixed(1)}.`, "success");
            if (onDone) onDone();
          }
        }
      ]
    });
  }

  /* ---------------- Header / footer / navigation ----------------
     NOTE on "Verified TUT Student": in this prototype the badge means the account
     registered with an accepted @tut4life.ac.za address. Real verification would
     need server-side checks and an emailed confirmation link. */
  function renderHeader() {
    const holder = document.getElementById("app-header");
    if (!holder) return;
    const me = currentUser();
    const page = document.body.dataset.page || "";
    const unread = me ? unreadCount(me.id) : 0;
    const current = name => page === name ? 'aria-current="page"' : "";
    const msgHref = me ? "messages.html" : "login.html?next=messages.html";
    const unreadLabel = unread ? `, ${unread} unread` : "";

    holder.outerHTML = `
      <a class="skip-link" href="#main">Skip to main content</a>
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="index.html" aria-label="Student Market Place – home">
            <img class="brand-logo" src="assets/images/logo-mark.png" alt="" width="44" height="44">
            <span class="brand-name">Student Marketplace<small>Buy. Sell. Save.</small></span>
          </a>
          <nav class="main-nav" aria-label="Main">
            <a href="index.html" ${current("home")}>Home</a>
            <a href="marketplace.html" ${current("marketplace")}>Marketplace</a>
            <a href="index.html#categories">Categories</a>
            <a href="sell.html" ${current("sell")}>Sell an Item</a>
            ${me ? `<a href="dashboard.html" ${current("dashboard")}>Dashboard</a>` : ""}
          </nav>
          <div class="header-actions">
            <a class="icon-btn" href="marketplace.html?focus=search" aria-label="Search the marketplace">${icon("search")}</a>
            <a class="icon-btn" href="${msgHref}" aria-label="Messages${unreadLabel}" ${current("messages")}>
              ${icon("message")}${unread ? `<span class="count-badge" data-unread>${unread}</span>` : ""}
            </a>
            ${me ? `
              <div class="user-menu hide-mobile">
                <button type="button" class="user-trigger" aria-haspopup="true" aria-expanded="false" aria-controls="user-dropdown">
                  ${avatar(me, "avatar-sm")}<span class="name">${esc(me.firstName)}</span>${icon("chevronDown")}
                </button>
                <div class="dropdown" id="user-dropdown">
                  <div class="dropdown-head"><strong>${esc(fullName(me))}</strong><span class="badge badge-verified mt-8">${icon("verified")}Verified TUT Student</span></div>
                  <a href="dashboard.html">${icon("dashboard")}Dashboard</a>
                  <a href="profile.html">${icon("user")}My profile</a>
                  <a href="dashboard.html#listings">${icon("list")}My listings</a>
                  <a href="dashboard.html#saved">${icon("heart")}Saved items</a>
                  <button type="button" class="danger" data-logout>${icon("logout")}Log out</button>
                </div>
              </div>` : `
              <a class="btn btn-ghost hide-mobile" href="login.html">Log in</a>
              <a class="btn btn-primary hide-mobile" href="register.html">Sign up</a>`}
            <button type="button" class="icon-btn menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
          </div>
        </div>
      </header>
      <div class="mobile-menu" id="mobile-menu">
        <nav class="mobile-menu-panel" aria-label="Mobile">
          ${me ? `<div class="row" style="padding:10px 8px 14px">${avatar(me)}<div><strong>${esc(fullName(me))}</strong><br><span class="badge badge-verified">${icon("verified")}Verified TUT Student</span></div></div>` : ""}
          <a href="index.html">${icon("home")}Home</a>
          <a href="marketplace.html">${icon("grid")}Marketplace</a>
          <a href="index.html#categories">${icon("tag")}Categories</a>
          <a href="sell.html">${icon("plusCircle")}Sell an Item</a>
          <a href="${msgHref}">${icon("message")}Messages${unread ? ` <span class="badge badge-danger" style="margin-left:auto">${unread} new</span>` : ""}</a>
          ${me ? `<a href="dashboard.html">${icon("dashboard")}Dashboard</a><a href="profile.html">${icon("user")}My profile</a>` : ""}
          <a href="about.html">${icon("info")}About the project</a>
          <div class="btn-row">
            ${me ? `<button type="button" class="btn btn-danger-soft" data-logout style="grid-column:1/-1">${icon("logout")}Log out</button>`
                 : `<a class="btn btn-outline" href="login.html">Log in</a><a class="btn btn-primary" href="register.html" style="color:#fff">Sign up</a>`}
          </div>
        </nav>
      </div>`;

    // Mobile menu toggle
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.getElementById("mobile-menu");
    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.innerHTML = icon(open ? "x" : "menu");
    });
    menu.addEventListener("click", e => { if (e.target === menu) toggle.click(); });

    // User dropdown
    const trigger = document.querySelector(".user-trigger");
    if (trigger) {
      const dropdown = document.getElementById("user-dropdown");
      trigger.addEventListener("click", e => {
        e.stopPropagation();
        const open = !dropdown.classList.contains("open");
        dropdown.classList.toggle("open", open);
        trigger.setAttribute("aria-expanded", open);
      });
      document.addEventListener("click", e => {
        if (!e.target.closest(".user-menu")) { dropdown.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); }
      });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && dropdown.classList.contains("open")) { dropdown.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); trigger.focus(); }
      });
    }
  }

  function renderBottomNav() {
    if (document.body.dataset.noBottomNav !== undefined) return;
    const me = currentUser();
    const page = document.body.dataset.page || "";
    const unread = me ? unreadCount(me.id) : 0;
    const current = names => names.includes(page) ? 'aria-current="page"' : "";
    const nav = document.createElement("nav");
    nav.className = "bottom-nav";
    nav.setAttribute("aria-label", "Quick navigation");
    nav.innerHTML = `
      <a href="index.html" ${current(["home"])}>${icon("home")}Home</a>
      <a href="marketplace.html" ${current(["marketplace", "product"])}>${icon("search")}Browse</a>
      <a href="sell.html" class="sell-fab" ${current(["sell"])}><span class="fab">${icon("plus")}</span>Sell</a>
      <a href="${me ? "messages.html" : "login.html?next=messages.html"}" ${current(["messages"])}>${icon("message")}Messages${unread ? `<span class="count-badge">${unread}</span>` : ""}</a>
      <a href="${me ? "dashboard.html" : "login.html"}" ${current(["dashboard", "profile", "login", "register"])}>${icon("user")}${me ? "Account" : "Log in"}</a>`;
    document.body.appendChild(nav);
  }

  function renderFooter() {
    const holder = document.getElementById("app-footer");
    if (!holder) return;
    const year = new Date().getFullYear();
    holder.outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="logo-chip" href="index.html"><img src="assets/images/logo.png" alt="Student Marketplace – Buy. Sell. Save." width="419" height="400"></a>
              <p>A trusted campus marketplace where Tshwane University of Technology students buy, sell and exchange affordable items and services.</p>
            </div>
            <div>
              <h3>Marketplace</h3>
              <ul>
                <li><a href="marketplace.html">Browse items</a></li>
                <li><a href="sell.html">Sell an item</a></li>
                <li><a href="marketplace.html?category=Textbooks">Textbooks</a></li>
                <li><a href="marketplace.html?category=Electronics">Electronics</a></li>
                <li><a href="index.html#safety">Safety tips</a></li>
              </ul>
            </div>
            <div>
              <h3>Project</h3>
              <ul>
                <li><a href="about.html">About us</a></li>
                <li><a href="project.html">About the Project</a></li>
                <li><a href="project.html#team">Project team</a></li>
                <li><a href="terms.html">Terms &amp; Conditions</a></li>
                <li><a href="dashboard.html">Student dashboard</a></li>
              </ul>
            </div>
            <div>
              <h3>Contact</h3>
              <ul class="footer-contact">
                <li>${icon("mapPin")}<span>Tshwane University of Technology, Polokwane Campus</span></li>
                <li>${icon("mail")}<span>support@studentmarketplace</span></li>
                <li>${icon("clock")}<span>Mon – Fri, 08:00 – 16:30</span></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} Student Market Place · Code &amp; Canvas. Academic prototype for TUT students.</span>
          </div>
        </div>
      </footer>`;
  }

  function updateUnreadBadges() {
    const me = currentUser();
    const unread = me ? unreadCount(me.id) : 0;
    document.querySelectorAll('.header-actions a[href="messages.html"], .bottom-nav a[href="messages.html"]').forEach(link => {
      let badge = link.querySelector(".count-badge");
      if (unread) {
        if (!badge) { badge = document.createElement("span"); badge.className = "count-badge"; link.appendChild(badge); }
        badge.textContent = unread;
      } else if (badge) badge.remove();
      if (link.classList.contains("icon-btn")) link.setAttribute("aria-label", "Messages" + (unread ? `, ${unread} unread` : ""));
    });
  }

  /* ---------------- Boot ---------------- */
  const readyCallbacks = [];
  function ready(fn) { readyCallbacks.push(fn); }

  document.addEventListener("DOMContentLoaded", () => {
    seedIfNeeded();
    if (document.body.dataset.auth === "required" && !requireLogin()) return;
    renderHeader();
    renderFooter();
    renderBottomNav();
    document.addEventListener("click", handleFavouriteClicks);
    document.addEventListener("click", e => {
      if (e.target.closest("[data-logout]")) { e.preventDefault(); logout(); }
    });
    readyCallbacks.forEach(fn => fn());
    showFlash();
  });

  return {
    KEYS, read, write, uid, hashPassword, data, resetDemoData,
    sellerRating, unreadCount, conversationUnread,
    currentUser, startSession, endSession, logout, requireLogin, safeNext,
    favourites, toggleFavourite,
    esc, money, timeAgo, formatDate, formatTime, fullName, publicName, initials, avatar, stars, ratingInline, param,
    icon, productArt, productImage, categoryIcon, productCard, skeletonCards, emptyState,
    toast, flash, modal, confirm: confirmDialog, setFieldError, setFieldSuccess,
    openReport, openPurchase, openReview, updateUnreadBadges, ready
  };
})();
