/*
 Student Market Place
 Purpose: Core marketplace logic for the front-end prototype.
          Each function follows the project's IPO table:
          Input → Processing → Output.
 Technology: Vanilla JavaScript + localStorage (no backend)

 The page scripts (auth.js, sell.js, messages.js, …) only handle the
 screen. All rules and calculations live here so they are easy to
 find and explain.
*/

/* =====================================================
   1. STUDENT REGISTRATION & LOGIN
   Input:  name, student number, TUT email, password
   Processing: validate and store details
   Output: student account (email accepted as a TUT address)
   ===================================================== */

const TUT_DOMAIN = "@tut4life.ac.za";

/* Returns an error message, or "" when the email is an accepted TUT address. */
function validateTutEmail(rawEmail) {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) return "Please enter your TUT email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address, e.g. student@tut4life.ac.za.";
  // The address must END exactly in @tut4life.ac.za – gmail, yahoo, icloud, etc. are rejected
  if (!email.endsWith(TUT_DOMAIN)) return "Please use your official TUT student email ending in @tut4life.ac.za.";
  // Only one "@" and safe characters before it (blocks tricks like name@tut4life.ac.za.evil.com)
  if (!/^[a-z0-9._-]+@tut4life\.ac\.za$/.test(email)) return "Please enter a valid email address, e.g. student@tut4life.ac.za.";
  return "";
}

/* Checks every registration field. Returns { fieldName: "error message" }. */
function validateRegistration(values) {
  const users = App.data.users();
  const errors = {};
  const namePattern = /^[A-Za-z' -]{2,}$/;

  if (!values.firstName) errors.firstName = "Please enter your first name.";
  else if (!namePattern.test(values.firstName)) errors.firstName = "Please use letters only (at least 2).";
  if (!values.lastName) errors.lastName = "Please enter your last name.";
  else if (!namePattern.test(values.lastName)) errors.lastName = "Please use letters only (at least 2).";

  if (!values.studentNumber) errors.studentNumber = "Please enter your student number.";
  else if (!/^\d{9}$/.test(values.studentNumber)) errors.studentNumber = "Your TUT student number should be 9 digits.";
  else if (users.some(u => u.studentNumber === values.studentNumber)) errors.studentNumber = "An account with this student number already exists.";

  const emailError = validateTutEmail(values.email);
  if (emailError) errors.email = emailError;
  else if (users.some(u => u.email === values.email.toLowerCase())) errors.email = "An account with this email already exists. Try logging in instead.";

  if (!values.password) errors.password = "Please create a password.";
  else if (values.password.length < 8) errors.password = "Password must be at least 8 characters long.";
  if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (values.password && values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";

  if (!values.acceptedTerms) errors.terms = "Please accept the Terms & Conditions to continue.";
  return errors;
}

/* Validates and stores a new student. Returns { ok, errors, user }. */
function registerUser(values) {
  const errors = validateRegistration(values);
  if (Object.keys(errors).length) return { ok: false, errors };

  const capitalise = name => name.replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
  const user = {
    id: App.uid("u"),                      // unique account ID
    firstName: capitalise(values.firstName),
    lastName: capitalise(values.lastName),
    studentNumber: values.studentNumber,
    email: values.email.toLowerCase(),
    // Never stored as plain text and never displayed. NOTE: a real system must hash
    // passwords on a secure server – this demo hash only avoids showing the text.
    passwordHash: App.hashPassword(values.password),
    campus: "Pretoria Campus",
    bio: "",
    createdAt: new Date().toISOString()
  };
  const users = App.data.users();
  users.push(user);
  if (!App.data.saveUsers(users)) return { ok: false, errors: { form: "Could not save your account." } };
  App.startSession(user.id, true);
  return { ok: true, errors: {}, user };
}

/* Checks credentials against stored accounts. Returns { ok, error, user }. */
function loginUser(email, password, remember) {
  const emailError = validateTutEmail(email);
  if (emailError) return { ok: false, field: "email", error: emailError };
  if (!password) return { ok: false, field: "password", error: "Please enter your password." };

  const user = App.data.users().find(u => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== App.hashPassword(password)) {
    return { ok: false, field: "form", error: "Invalid email or password." };
  }
  App.startSession(user.id, remember);
  return { ok: true, user };
}

function getCurrentUser() {
  return App.currentUser();
}

function logoutUser() {
  App.endSession();
}

/* =====================================================
   2. PRODUCT LISTINGS
   Input:  title, price, description, photo (+ category, condition, campus)
   Processing: create and publish listing
   Output: live marketplace listing
   ===================================================== */

/* Returns { fieldName: "error message" } for a listing form. */
function validateListing(values) {
  const errors = {};
  if (!values.title) errors.title = "Please enter a product title.";
  else if (values.title.length < 3) errors.title = "The title should be at least 3 characters.";
  if (!values.category) errors.category = "Please choose a category.";
  if (!values.description) errors.description = "Please add a description of the item.";
  else if (values.description.length < 10) errors.description = "Please write a slightly longer description (at least 10 characters).";
  if (values.price === "" || values.price === null || values.price === undefined) errors.price = "Please enter a price.";
  else if (!(Number(values.price) > 0)) errors.price = "Price must be greater than R0.";
  else if (Number(values.price) > 200000) errors.price = "Please enter a realistic student price.";
  if (!values.condition) errors.condition = "Please choose the item's condition.";
  if (!values.campus) errors.campus = "Please choose a campus or collection area.";
  if (!values.contactPreference) errors.contact = "Please choose a contact preference.";
  return errors;
}

/* Creates a listing owned by sellerId. Price is stored as a NUMBER (e.g. 450), never "R450". */
function createListing(sellerId, values) {
  const errors = validateListing(values);
  if (Object.keys(errors).length) return { ok: false, errors };
  const product = {
    id: App.uid("p"),
    sellerId,
    title: values.title,
    category: values.category,
    description: values.description,
    price: Number(values.price),
    condition: values.condition,
    campus: values.campus,
    contactPreference: values.contactPreference,
    image: values.image || "",
    art: App.categoryIcon(values.category),
    status: "active",
    createdAt: new Date().toISOString(),
    soldAt: null
  };
  const products = App.data.products();
  products.push(product);
  if (!App.data.saveProducts(products)) return { ok: false, errors: { form: "Could not save the listing." } };
  return { ok: true, product };
}

/* Updates a listing – only its seller may do this. */
function updateListing(productId, sellerId, values) {
  const existing = App.data.product(productId);
  if (!existing || existing.sellerId !== sellerId) return { ok: false, errors: { form: "You can only edit your own listings." } };
  const errors = validateListing(values);
  if (Object.keys(errors).length) return { ok: false, errors };
  const changes = {
    title: values.title, category: values.category, description: values.description,
    price: Number(values.price), condition: values.condition, campus: values.campus,
    contactPreference: values.contactPreference, image: values.image || ""
  };
  App.data.updateProduct(productId, changes);
  return { ok: true, product: App.data.product(productId) };
}

function deleteListing(productId, sellerId) {
  const products = App.data.products();
  const product = products.find(p => p.id === productId);
  if (!product || product.sellerId !== sellerId) return { ok: false, error: "You can only delete your own listings." };
  App.data.saveProducts(products.filter(p => p.id !== productId));
  return { ok: true };
}

/* Status change: "active" → "sold" (buyerId is optional for sales made outside the platform). */
function markListingSold(productId, sellerId, buyerId = null) {
  const product = App.data.product(productId);
  if (!product || product.sellerId !== sellerId) return { ok: false, error: "You can only update your own listings." };
  App.data.updateProduct(productId, { status: "sold", soldAt: new Date().toISOString(), buyerId });
  return { ok: true };
}

/* Flowchart decision "Is item available?" */
function checkAvailability(productId) {
  const product = App.data.product(productId);
  if (!product) return { available: false, message: "This listing no longer exists." };
  if (product.status !== "active") return { available: false, message: "This item has already been sold." };
  return { available: true, message: "This item is available." };
}

/* Number of buyers who have messaged the seller about a listing ("Receive buyer enquiry"). */
function countEnquiries(productId) {
  return App.data.conversations().filter(c => c.productId === productId && c.messages.length).length;
}

/* =====================================================
   3. SEARCH AND FILTER
   Input:  keywords, category, price range (+ condition, campus)
   Processing: search, filter and sort products
   Output: matching product list
   ===================================================== */

/* Keeps products whose title, description or category contain EVERY keyword typed. */
function searchProducts(products, keywords) {
  const words = String(keywords || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return products;
  return products.filter(product => {
    const text = (product.title + " " + product.description + " " + product.category).toLowerCase();
    return words.every(word => text.includes(word));
  });
}

/* filters = { category, minPrice, maxPrice, conditions: [], campus, includeSold } */
function filterProducts(products, filters) {
  return products.filter(product => {
    if (!filters.includeSold && product.status !== "active") return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.conditions && filters.conditions.length && !filters.conditions.includes(product.condition)) return false;
    if (filters.campus && product.campus !== filters.campus) return false;
    if (filters.minPrice !== "" && filters.minPrice !== undefined && product.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice !== "" && filters.maxPrice !== undefined && product.price > Number(filters.maxPrice)) return false;
    return true;
  });
}

/* sortKey: "newest" | "price-asc" | "price-desc" */
function sortProducts(products, sortKey) {
  const sorted = products.slice();
  if (sortKey === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (sortKey === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return sorted;
}

/* =====================================================
   4. MESSAGING
   Input:  buyer message
   Processing: save and route the message to the seller's thread
   Output: seller receives the message (unread notification)

   A conversation ("thread") = one buyer + one seller + one product:
   { id, productId, buyerId, sellerId, messages: [], lastRead: { userId: date } }
   ===================================================== */

function findConversation(productId, buyerId) {
  return App.data.conversations().find(c => c.productId === productId && c.buyerId === buyerId) || null;
}

/* Builds a new (unsaved) thread – it is saved when the first message is sent. */
function newConversation(productId, buyerId) {
  const product = App.data.product(productId);
  return {
    id: App.uid("c"), productId, buyerId, sellerId: product.sellerId,
    messages: [], lastRead: { [buyerId]: new Date().toISOString() }, autoReplied: false
  };
}

function saveConversation(convo) {
  const list = App.data.conversations();
  const index = list.findIndex(c => c.id === convo.id);
  if (index === -1) list.push(convo); else list[index] = convo;
  App.data.saveConversations(list);
}

/* Adds a message to a thread and saves it. Empty messages are rejected (IPO: "Empty message"). */
function sendMessage(convo, senderId, rawText) {
  const text = String(rawText || "").trim();
  if (!text) return { ok: false, error: "Please type a message before sending." };
  const message = { id: App.uid("m"), senderId, text, createdAt: new Date().toISOString() };
  convo.messages.push(message);
  convo.lastRead = convo.lastRead || {};
  convo.lastRead[senderId] = message.createdAt; // the sender has obviously read their own message
  saveConversation(convo);
  return { ok: true, message };
}

/* Everything in the thread up to now counts as read for this user. */
function markMessageRead(convo, userId) {
  convo.lastRead = convo.lastRead || {};
  convo.lastRead[userId] = new Date().toISOString();
  saveConversation(convo);
}

/* Unread = messages from the other person newer than my lastRead time. */
function countUnread(convo, userId) {
  if (convo.buyerId !== userId && convo.sellerId !== userId) return 0;
  const lastRead = (convo.lastRead && convo.lastRead[userId]) || "";
  return convo.messages.filter(m => m.senderId !== userId && m.createdAt > lastRead).length;
}

/* =====================================================
   5. PURCHASE (prototype transaction confirmation)
   Buyer contacts seller → both agree → buyer confirms →
   transaction saved → listing marked sold → buyer can review.
   No payment or card details are ever collected.
   ===================================================== */

function confirmPurchase(productId, buyerId) {
  const product = App.data.product(productId);
  const availability = checkAvailability(productId);
  if (!availability.available) return { ok: false, error: availability.message };
  if (product.sellerId === buyerId) return { ok: false, error: "You cannot buy your own listing." };

  const purchase = {
    id: App.uid("pur"), productId, buyerId, sellerId: product.sellerId,
    price: product.price, createdAt: new Date().toISOString(), reviewed: false
  };
  const purchases = App.data.purchases();
  purchases.push(purchase);
  App.data.savePurchases(purchases);
  // State change: the listing is no longer available
  App.data.updateProduct(productId, { status: "sold", buyerId, soldAt: purchase.createdAt });
  return { ok: true, purchase };
}

/* =====================================================
   6. RATINGS AND REVIEWS
   Input:  star rating (1–5), written feedback
   Processing: store review and calculate average rating
   Output: updated seller rating / reputation
   ===================================================== */

/* Average = sum of ratings ÷ number of reviews, rounded to 1 decimal. */
function calculateAverageRating(reviews) {
  const valid = reviews.filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5);
  if (!valid.length) return 0;
  const sum = valid.reduce((total, r) => total + Number(r.rating), 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

function submitReview(purchaseId, reviewerId, rating, rawText) {
  const text = String(rawText || "").trim();
  const errors = {};
  if (!(rating >= 1 && rating <= 5)) errors.rating = "Please choose a rating between 1 and 5 stars.";
  if (!text) errors.text = "Please write a short review before submitting.";
  if (Object.keys(errors).length) return { ok: false, errors };

  const purchase = App.data.purchases().find(p => p.id === purchaseId);
  if (!purchase || purchase.buyerId !== reviewerId) return { ok: false, errors: { form: "You can only review your own purchases." } };
  if (purchase.reviewed) return { ok: false, errors: { form: "You have already reviewed this purchase." } };

  const product = App.data.product(purchase.productId);
  const review = {
    id: App.uid("r"), sellerId: purchase.sellerId, reviewerId, productId: purchase.productId,
    productTitle: product ? product.title : "Marketplace item",
    rating: Number(rating), text, createdAt: new Date().toISOString()
  };
  const reviews = App.data.reviews();
  reviews.push(review);
  App.data.saveReviews(reviews);
  App.data.savePurchases(App.data.purchases().map(p => p.id === purchaseId ? { ...p, reviewed: true } : p));
  return { ok: true, review, newAverage: calculateAverageRating(reviews.filter(r => r.sellerId === purchase.sellerId)) };
}

/* =====================================================
   7. REPORT LISTING
   ===================================================== */

const REPORT_REASONS = ["Fake listing", "Scam / suspicious behaviour", "Inappropriate product", "Incorrect information", "Other"];

function reportListing(productId, reporterId, reason, rawDetails) {
  const details = String(rawDetails || "").trim();
  if (!REPORT_REASONS.includes(reason)) return { ok: false, field: "reason", error: "Please choose a reason for your report." };
  if (reason === "Other" && !details) return { ok: false, field: "details", error: "Please describe the problem when choosing \"Other\"." };
  const reports = App.data.reports();
  reports.push({ id: App.uid("rep"), productId, reporterId, reason, details, status: "Pending review", createdAt: new Date().toISOString() });
  App.data.saveReports(reports);
  return { ok: true };
}

/* =====================================================
   8. STATISTICS (project variables)
   Number of users, products listed, product prices,
   daily sales, user ratings, messages sent.
   Everything is calculated from localStorage – nothing is hardcoded.
   ===================================================== */

function calculateProjectStats() {
  const products = App.data.products();
  const purchases = App.data.purchases();
  const reviews = App.data.reviews();
  const today = new Date().toDateString();
  const totalPrice = products.reduce((sum, p) => sum + Number(p.price), 0);
  return {
    registeredUsers: App.data.users().length,
    totalListings: products.length,
    activeListings: products.filter(p => p.status === "active").length,
    soldListings: products.filter(p => p.status === "sold").length,
    averagePrice: products.length ? totalPrice / products.length : 0,
    completedPurchases: purchases.length,
    dailySales: purchases.filter(p => new Date(p.createdAt).toDateString() === today).length,
    messagesSent: App.data.conversations().reduce((sum, c) => sum + c.messages.length, 0),
    averageRating: calculateAverageRating(reviews),
    totalReviews: reviews.length,
    reports: App.data.reports().length
  };
}

function calculateUserStats(userId) {
  const mine = App.data.products().filter(p => p.sellerId === userId);
  const conversations = App.data.conversations().filter(c => c.buyerId === userId || c.sellerId === userId);
  const reviews = App.data.reviews().filter(r => r.sellerId === userId);
  return {
    activeListings: mine.filter(p => p.status === "active").length,
    itemsSold: mine.filter(p => p.status === "sold").length,
    purchases: App.data.purchases().filter(p => p.buyerId === userId).length,
    pendingReviews: App.data.purchases().filter(p => p.buyerId === userId && !p.reviewed).length,
    conversations: conversations.filter(c => c.messages.length).length,
    unreadMessages: conversations.reduce((sum, c) => sum + countUnread(c, userId), 0),
    averageRating: calculateAverageRating(reviews),
    reviewCount: reviews.length
  };
}

/* Year 1 projection from the project's financial computations (estimates, not real results). */
function calculateFinancialProjection() {
  const { startupCost, projectedRevenue, openingBalance } = PROJECT_FINANCIALS;
  const projectedProfit = projectedRevenue - startupCost;               // R30,000 − R5,000
  const profitMargin = Math.round((projectedProfit / projectedRevenue) * 100); // 25,000 ÷ 30,000 ≈ 83%
  const netCashFlow = openingBalance + projectedRevenue - startupCost;
  return { startupCost, projectedRevenue, projectedProfit, profitMargin, openingBalance, expenses: startupCost, netCashFlow };
}
