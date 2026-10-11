/*
 Student Market Place
 Purpose: Inbox / messaging screen
 Technology: Vanilla JavaScript

 IPO: buyer message → sendMessage() saves it in the seller's thread
      → seller sees an unread notification (countUnread / markMessageRead).
*/
/* ==========================================================
   Inbox / messaging (messages.html)
   messages.html?product=p01  -> start or open a chat with that seller
   messages.html?c=c01        -> open an existing conversation

   Conversations are stored in localStorage (key: smp_messages):
   { id, productId, buyerId, sellerId, messages: [...], lastRead: { userId: ISO date } }
   ========================================================== */
App.ready(() => {
  const { icon, esc, data, avatar, publicName, productImage, money, timeAgo, formatTime, formatDate } = App;
  const me = App.currentUser();
  const inbox = document.getElementById("inbox");
  const listEl = document.getElementById("convo-list");
  const chatEl = document.getElementById("chat");
  const searchEl = document.getElementById("convo-search");

  let activeId = null;
  let draft = null; // a new conversation that has no messages yet
  const isMobile = () => window.matchMedia("(max-width: 960px)").matches;

  const myConversations = () => data.conversations().filter(c => c.buyerId === me.id || c.sellerId === me.id);
  const lastMessage = c => c.messages[c.messages.length - 1];
  const otherUserId = c => (c.buyerId === me.id ? c.sellerId : c.buyerId);

  function getConversation(id) {
    if (draft && draft.id === id) return draft;
    return data.conversations().find(c => c.id === id) || null;
  }

  /* ----- Start a conversation from "Contact Seller" ----- */
  function startFromProduct(productId) {
    const product = data.product(productId);
    if (!product) { App.toast("That listing no longer exists.", "error"); return null; }
    if (product.sellerId === me.id) { App.toast("This is your own listing – buyers will message you here.", "info"); return null; }
    const existing = findConversation(productId, me.id);
    if (existing) return existing.id;
    // Flowchart decision "Is item available?" – sold items cannot start a new enquiry
    const availability = checkAvailability(productId);
    if (!availability.available) { App.toast(availability.message + " Browse similar items instead.", "error"); return null; }
    draft = newConversation(productId, me.id);
    return draft.id;
  }

  /* ----- Conversation list ----- */
  function renderList() {
    const term = searchEl.value.trim().toLowerCase();
    let convos = myConversations().filter(c => c.messages.length);
    if (draft) convos.unshift(draft);
    convos.sort((a, b) => {
      if (a === draft) return -1;
      if (b === draft) return 1;
      return lastMessage(b).createdAt.localeCompare(lastMessage(a).createdAt);
    });

    if (term) {
      convos = convos.filter(c => {
        const other = data.user(otherUserId(c));
        const product = data.product(c.productId);
        const text = [App.fullName(other), product ? product.title : "", ...c.messages.map(m => m.text)].join(" ").toLowerCase();
        return text.includes(term);
      });
    }

    const totalUnread = App.unreadCount(me.id);
    const badge = document.getElementById("inbox-unread");
    badge.hidden = !totalUnread;
    badge.textContent = totalUnread + " new";

    if (!convos.length) {
      listEl.innerHTML = term
        ? `<p class="muted small text-center" style="padding:24px">No conversations match "${esc(term)}".</p>`
        : App.emptyState({ iconName: "message", title: "No messages yet", text: "When you contact a seller, your conversation will appear here.", actionLabel: "Browse items", actionHref: "marketplace.html" });
      return;
    }

    listEl.innerHTML = convos.map(c => {
      const other = data.user(otherUserId(c));
      const product = data.product(c.productId);
      const last = lastMessage(c);
      const unread = App.conversationUnread(c, me.id);
      return `<button type="button" role="listitem" class="convo${unread ? " unread" : ""}" data-id="${esc(c.id)}" ${c.id === activeId ? 'aria-current="true"' : ""}>
        ${avatar(other)}
        <span class="grow">
          <span class="convo-top"><span class="convo-name">${esc(publicName(other))}</span><time>${last ? esc(timeAgo(last.createdAt)) : "New"}</time></span>
          <span class="convo-product" style="display:block">${esc(product ? product.title : "Removed listing")}</span>
          <span class="convo-last"><span>${last ? (last.senderId === me.id ? "You: " : "") + esc(last.text) : "Start the conversation…"}</span>${unread ? `<span class="unread-dot" aria-label="${unread} unread">${unread}</span>` : ""}</span>
        </span>
      </button>`;
    }).join("");
  }

  listEl.addEventListener("click", e => {
    const btn = e.target.closest(".convo");
    if (btn) openConversation(btn.dataset.id, true);
  });
  searchEl.addEventListener("input", renderList);

  /* ----- Active conversation ----- */
  function openConversation(id, focusComposer) {
    const convo = getConversation(id);
    if (!convo) return;
    activeId = id;

    if (convo !== draft) markMessageRead(convo, me.id);
    history.replaceState(null, "", "messages.html?c=" + encodeURIComponent(id));
    inbox.classList.add("chat-open");
    renderList();
    renderChat(convo);
    App.updateUnreadBadges();
    if (focusComposer && !isMobile()) document.getElementById("composer-input").focus();
  }

  function renderChat(convo) {
    const other = data.user(otherUserId(convo));
    const product = data.product(convo.productId);
    const iAmBuyer = convo.buyerId === me.id;
    const canBuy = iAmBuyer && product && product.status === "active";

    chatEl.innerHTML = `
      <header class="chat-header">
        <button type="button" class="icon-btn chat-back" id="chat-back" aria-label="Back to conversations">${icon("chevronLeft")}</button>
        ${avatar(other)}
        <div class="grow">
          <strong><a href="profile.html?id=${encodeURIComponent(other.id)}" style="color:inherit">${esc(publicName(other))}</a> ${icon("verified", "verified-tick")}</strong>
          <span class="small muted">${iAmBuyer ? "Seller" : "Buyer"} · Verified TUT Student<span class="hide-sm"> · ${esc(other.campus || "")}</span></span>
        </div>
        <a class="btn btn-sm btn-outline hide-sm" href="profile.html?id=${encodeURIComponent(other.id)}">Profile</a>
      </header>
      ${product ? `
      <div class="chat-product">
        <img src="${esc(productImage(product))}" alt="">
        <div class="grow">
          <a class="title" href="product.html?id=${encodeURIComponent(product.id)}">${esc(product.title)}</a>
          <span class="price">${money(product.price)}</span> ${product.status === "sold" ? '<span class="badge badge-sold" style="margin-left:6px">Sold</span>' : ""}
        </div>
        ${canBuy ? `<button type="button" class="btn btn-sm btn-blue" id="chat-buy" aria-label="Confirm purchase">${icon("handshake")}<span class="hide-sm">Confirm purchase</span><span class="show-sm">Buy</span></button>` : `<a class="btn btn-sm btn-light" href="product.html?id=${encodeURIComponent(product.id)}">View</a>`}
      </div>` : ""}
      <div class="chat-messages" id="chat-messages" aria-live="polite"></div>
      <form class="composer" id="composer" novalidate>
        <label for="composer-input" class="sr-only">Type a message</label>
        <textarea id="composer-input" class="textarea" rows="1" maxlength="1000" placeholder="Write a message…"></textarea>
        <button type="submit" class="btn btn-primary">${icon("send")}<span>Send</span></button>
      </form>
      <div class="composer-error" id="composer-error" hidden></div>`;

    renderMessages(convo, false);

    const input = document.getElementById("composer-input");
    if (convo === draft && !input.value) {
      input.value = `Hi ${other.firstName}, is the "${product.title}" still available?`;
    }
    autoGrow(input);
    input.addEventListener("input", () => { autoGrow(input); document.getElementById("composer-error").hidden = true; });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("composer").requestSubmit(); }
    });
    document.getElementById("composer").addEventListener("submit", e => { e.preventDefault(); handleSend(convo.id); });
    document.getElementById("chat-back").addEventListener("click", () => {
      inbox.classList.remove("chat-open");
      activeId = null;
      history.replaceState(null, "", "messages.html");
      renderList();
    });
    const buy = document.getElementById("chat-buy");
    if (buy) buy.addEventListener("click", () => App.openPurchase(product, () => setTimeout(() => renderChat(getConversation(convo.id) || convo), 50)));
  }

  function renderMessages(convo, animateLast) {
    const box = document.getElementById("chat-messages");
    if (!convo.messages.length) {
      box.innerHTML = `<div class="chat-empty">${App.emptyState({ iconName: "message", title: "Start the conversation", text: "Say hello and ask about the item. Keep all communication inside the marketplace for your safety." })}</div>`;
      return;
    }
    const other = otherUserId(convo);
    const otherRead = (convo.lastRead && convo.lastRead[other]) || "";
    let lastDay = "";
    box.innerHTML = convo.messages.map((m, i) => {
      const day = new Date(m.createdAt).toDateString();
      let divider = "";
      if (day !== lastDay) {
        lastDay = day;
        const label = day === new Date().toDateString() ? "Today" : day === new Date(Date.now() - 864e5).toDateString() ? "Yesterday" : formatDate(m.createdAt);
        divider = `<div class="day-divider">${label}</div>`;
      }
      const mine = m.senderId === me.id;
      const seen = mine && otherRead >= m.createdAt;
      const isNew = animateLast && i === convo.messages.length - 1;
      return `${divider}<div class="bubble-row ${mine ? "me" : "them"}${isNew ? " new" : ""}">
        <div class="bubble">${esc(m.text)}</div>
        <span class="bubble-time">${formatTime(m.createdAt)}${mine ? (seen ? icon("checkDouble") + '<span class="sr-only">Seen</span>' : icon("check")) : ""}</span>
      </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  function autoGrow(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight + 2, 140) + "px";
  }

  /* ----- Sending ----- */
  function handleSend(convoId) {
    const input = document.getElementById("composer-input");
    const errorEl = document.getElementById("composer-error");
    const convo = getConversation(convoId);
    const result = sendMessage(convo, me.id, input.value);
    if (!result.ok) {
      // IPO table: an empty message is rejected and the user is asked to type one
      errorEl.hidden = false;
      errorEl.innerHTML = `<span class="field-msg error">${icon("alert")}<span>${result.error}</span></span>`;
      input.focus();
      return;
    }
    if (convo === draft) draft = null; // the new thread is now saved

    input.value = "";
    autoGrow(input);
    renderMessages(convo, true);
    renderList();
    App.toast("Message sent.", "success");
    simulateReply(convo.id);
  }

  /* Demo only: the other student replies once to a brand-new conversation,
     so the inbox can be demonstrated with a single account.
     (Tip: log in as the second demo account in another browser to reply manually.) */
  function simulateReply(convoId) {
    const convo = getConversation(convoId);
    const other = otherUserId(convo);
    if (convo.autoReplied || convo.messages.some(m => m.senderId === other)) return;
    convo.autoReplied = true;
    saveConversation(convo);

    setTimeout(() => {
      if (activeId !== convoId) return;
      const box = document.getElementById("chat-messages");
      box.insertAdjacentHTML("beforeend", `<div class="bubble-row them new" id="typing"><div class="typing" aria-label="Typing"><span></span><span></span><span></span></div></div>`);
      box.scrollTop = box.scrollHeight;
    }, 900);

    setTimeout(() => {
      const fresh = getConversation(convoId);
      const product = data.product(fresh.productId);
      const otherUser = data.user(other);
      const reply = fresh.buyerId === me.id
        ? `Hi ${me.firstName}! Thanks for your message. Yes, the ${product ? product.title : "item"} is still available. I can meet at ${product ? product.campus : "campus"} – which day suits you?`
        : `Hi ${me.firstName}, thanks! When can we meet?`;
      sendMessage(fresh, otherUser.id, reply);
      if (activeId === convoId) markMessageRead(fresh, me.id);
      if (activeId === convoId) renderMessages(fresh, true);
      renderList();
      App.updateUnreadBadges();
    }, 2600);
  }

  // Keep the inbox in sync if another tab (e.g. the second demo account) sends a message
  window.addEventListener("storage", e => {
    if (e.key !== App.KEYS.messages) return;
    renderList();
    if (activeId) {
      const convo = getConversation(activeId);
      if (convo) {
        markMessageRead(convo, me.id);
        renderMessages(convo, true);
      }
    }
    App.updateUnreadBadges();
  });

  /* ----- Initial state ----- */
  function showPlaceholder() {
    chatEl.innerHTML = `<div class="chat-empty">${App.emptyState({ iconName: "inbox", title: "Select a conversation", text: "Choose a conversation on the left, or contact a seller from any listing.", actionLabel: "Browse marketplace", actionHref: "marketplace.html" })}</div>`;
  }

  const fromProduct = App.param("product");
  const fromConvo = App.param("c");
  let initialId = null;
  if (fromProduct) initialId = startFromProduct(fromProduct);
  else if (fromConvo && getConversation(fromConvo)) initialId = fromConvo;

  renderList();
  showPlaceholder();
  if (initialId) {
    openConversation(initialId, true);
  } else if (!isMobile()) {
    const first = listEl.querySelector(".convo");
    if (first) openConversation(first.dataset.id, false);
  }
});
