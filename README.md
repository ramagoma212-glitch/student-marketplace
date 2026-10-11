# Student Market Place

**BUY. SELL. SAVE.**

Student Market Place is a digital platform designed to help **Tshwane University of Technology (TUT)** students buy, sell and exchange affordable products and services within their student community.

It was built as an academic prototype by **Code & Canvas** using only HTML, CSS and vanilla JavaScript, so it runs as a static website and can be hosted free on GitHub Pages.

> **This is an academic front-end prototype** – the website component of the Student Market Place project. It is not an official service of, or endorsed by, Tshwane University of Technology.
>
> A production version would require: **server-side authentication, database storage, real email verification, secure password handling, server-side security, real multi-user messaging**, and **payment security** if payments were ever introduced. This prototype stores demo data in the browser's localStorage only.
>
> This website does not replace the project's separate **Java implementation phase**.

---

## Project team

| Name | Role |
|------|------|
| Nkgai Sedibeng | Group Leader |
| Rasebotsa Antoinette | Team Member |
| Mahonga Mapula | Team Member |
| Tjie Mmatshepo | Team Member |
| Bululu Sinesipho | Team Member |
| Hlahla Motlatso | Team Member |
| Letsatsi Gift | Team Member |
| Mmurwa Pabalelo | Team Member |
| Mokomane Saviour | Team Member |

---

## Features

- **TUT-only registration** – only emails ending exactly in `@tut4life.ac.za` are accepted (live inline validation)
- **Login / logout** with "Remember me" and a demo "Forgot password" flow
- **Verified TUT Student** badge on every account
- **Student dashboard** – stats, quick actions, recent activity, recent messages, recommended items and platform statistics
- **Marketplace** – 20 realistic seeded listings with live search, category, price range, condition and campus filters, and sorting
- **Product page** – details, seller card and rating, seller's other listings, reviews and safety tips
- **Sell an item** – validated listing form with image upload (drag & drop styled), live preview card
- **My listings** – view, edit, delete (with confirmation) and mark as sold
- **Inbox / messaging** – buyer-to-seller conversations linked to a product, unread counts, read ticks, mobile chat view
- **Purchase flow** – confirmation modal (no real payment is taken), saved to *My Purchases*
- **Ratings & reviews** – 1–5 stars plus a comment, average rating on profiles
- **Report listing** – fake listing, scam, inappropriate, incorrect info, other
- **Favourites** – save listings with the heart button
- **Student profiles** – public information only (email and student number are never shown)
- **Project Overview page** (`project.html`, linked from the footer) – purpose, problem & solution, flowchart, IPO table, benefits, Year 1 financial projection, research, live prototype analytics and the team
- **About and Terms & Conditions** pages
- **Live statistics** – dashboard and project analytics are calculated from stored data, never hardcoded
- **Responsive** – desktop, tablet and mobile (hamburger menu, bottom navigation, filter drawer)
- **Accessible** – semantic HTML, labels, keyboard navigation, visible focus states, ARIA live regions

## Technology used

- HTML5
- CSS3 (custom design system with CSS variables, no frameworks)
- Vanilla JavaScript (ES2020)
- Browser `localStorage` as a demo database
- Inter font from Google Fonts (falls back to the system font when offline)

No frameworks, build tools, backend or npm packages.

## Folder structure

```
student-marketplace/
├── index.html          Home page
├── marketplace.html    Browse, search and filter
├── product.html        Product details (product.html?id=p01)
├── login.html          Log in
├── register.html       Sign up (TUT email only)
├── dashboard.html      Student dashboard (#overview, #listings, #purchases, #reviews, #saved)
├── sell.html           Sell / edit a listing (sell.html?edit=p01)
├── messages.html       Inbox
├── profile.html        Student profile (profile.html?id=u_lerato)
├── about.html          About Student Market Place
├── project.html        Academic Project Overview (flow, IPO, financials, research, team)
├── terms.html          Terms & Conditions
├── css/style.css       Shared design system
├── js/
│   ├── data.js         Categories, campuses and demo seed data
│   ├── app.js          Storage helpers, session, header/footer, modals, toasts, shared flows
│   ├── services.js     Core logic – the IPO functions listed below
│   ├── project.js      Project Overview page
│   ├── auth.js         Registration + login + TUT email validation
│   ├── home.js         Home page
│   ├── marketplace.js  Search, filters, sorting
│   ├── product.js      Product details
│   ├── sell.js         Create / edit listing
│   ├── messages.js     Inbox
│   ├── dashboard.js    Dashboard views
│   ├── profile.js      Profiles
│   └── about.js        About page
├── favicon.ico         Favicon made from the logo mark
└── assets/images/      logo.png (full logo), logo-mark.png (cart icon), apple-touch-icon.png,
                        Student-Marketplace-Logo.jpeg (original), students-collaborating.jpg
```

## Demo login details

| Account | Email | Password |
|---------|-------|----------|
| Main demo student (Kagiso) | `demo@tut4life.ac.za` | `Demo@1234` |
| Second seller (Lerato) | `lerato.m@tut4life.ac.za` | `Lerato@1234` |

The login page also has **Use** buttons that fill these in. The demo student already has unread messages, a listing, a sale and a purchase waiting for a review.

## How to run locally

Option 1: double-click `index.html` to open it in Chrome, Edge or Firefox.

Option 2 (recommended): use a local web server, e.g. the **Live Server** extension in VS Code (right-click `index.html` → *Open with Live Server*).

## Suggested presentation flow

1. Open the home page.
2. **Sign up** – try `example@gmail.com` (rejected), then `example@tut4life.ac.za` (accepted).
3. Log out, then log in with the demo account.
4. View the **dashboard**.
5. **Browse** the marketplace, **search** for "calculator", try the **filters**.
6. Open a product and click **Message Seller** – send a message (the seller auto-replies once for the demo).
7. **Sell** a new item and find it in the marketplace.
8. Open another product, **Confirm Purchase**, then **Leave a review**.
9. **Report** a listing.
10. View a **profile**, then **log out**.

Use **About → Reset demo data** to restore the original data before presenting.

## Program logic (js/services.js)

Each operation from the project's IPO table is a small, named function:

| Operation | Input | Processing | Output | Functions |
|-----------|-------|------------|--------|-----------|
| Registration | Name, student number, TUT email, password | Validate and store details | Student account | `validateTutEmail()`, `registerUser()` |
| Login | Email, password | Check credentials | Logged-in session | `loginUser()`, `getCurrentUser()`, `logoutUser()` |
| Product listing | Title, price, description, photo | Create and publish listing | Live listing | `createListing()`, `updateListing()`, `deleteListing()`, `markListingSold()` |
| Search & filter | Keywords, category, price range | Search, filter, sort | Matching products | `searchProducts()`, `filterProducts()`, `sortProducts()` |
| Availability | Selected product | "Is item available?" decision | Available / sold | `checkAvailability()` |
| Messaging | Buyer message | Save and route to the seller's thread | Seller notification (unread count) | `sendMessage()`, `markMessageRead()`, `countUnread()` |
| Purchase | Buyer's confirmation | Save transaction, mark listing sold | Entry in My Purchases | `confirmPurchase()` |
| Reviews | Star rating, feedback | Store review, recalculate average | Updated seller rating | `submitReview()`, `calculateAverageRating()` |
| Reports | Reason, details | Store report | Confirmation | `reportListing()` |
| Statistics | Stored data | Count and average | Dashboard and project analytics | `calculateUserStats()`, `calculateProjectStats()`, `calculateFinancialProjection()` |

Prices are stored as numbers (`450`) and formatted for display with `Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" })` as **R450**, **R1,200**.

## Financial projection

`project.html` shows the team's **Year 1 Project Projection**: startup cost R5,000 and projected revenue R30,000 (inputs in `js/data.js`). Profit (R25,000), margin (83%) and net cash flow are calculated in JavaScript. These are estimates for the academic project, not real business results, and the prototype itself charges no fees.

## How the TUT email validation works

In `js/auth.js`, `validateTutEmail()`:

1. Rejects empty input.
2. Checks the general email format (`name@domain.tld`).
3. Requires the address to **end exactly** with `@tut4life.ac.za`. Anything else, such as `@gmail.com`, `@yahoo.com`, `@icloud.com`, `@hotmail.com` or `@outlook.com`, shows *"Please use your official TUT student email ending in @tut4life.ac.za."*
4. Checks that the part before the `@` contains only letters, numbers, dots, underscores or hyphens. This also stops tricks like `name@tut4life.ac.za.evil.com`.

The check runs live while the student types (red error, or a green "TUT email accepted" message), and again when the form is submitted.

The "Verified TUT Student" badge in this prototype means only that the account registered with an accepted `@tut4life.ac.za` address. Real verification would need a server that emails a confirmation link to that address.

## localStorage data model

| Key | Contents |
|-----|----------|
| `smp_users` | Registered students (id, name, student number, email, password hash, campus, bio) |
| `smp_current_user` | Logged-in session (also `sessionStorage` when "Remember me" is off) |
| `smp_products` | Listings |
| `smp_messages` | Conversations with their messages and read state |
| `smp_purchases` | Confirmed purchases |
| `smp_reviews` | Ratings and reviews |
| `smp_reports` | Reported listings |
| `smp_favourites` | Saved listing IDs per student |

All reading and writing goes through `App.read()` / `App.write()` in `js/app.js`.

## Limitations of a static HTML/JavaScript site

- **No real security.** Data lives in the browser's `localStorage`, which anyone using the browser can read or change. Passwords are only scrambled with a simple demo hash, not securely hashed. A real system needs a backend, a database, server-side password hashing (e.g. bcrypt) and HTTPS sessions.
- **No real email verification.** The site checks the email *format and domain* only, and cannot confirm the student owns the inbox. "Forgot password" is a demonstration.
- **Data is per browser.** Listings and messages are not shared between devices or users. Two people can only chat if they use the same browser, for example two demo accounts in one browser.
- **Simulated replies.** To demonstrate the inbox with one account, a seller replies once automatically to a new conversation.
- **No payments.** Purchases are records of an agreement; payment and collection happen in person.
- **Storage size.** Browsers allow roughly 5MB of `localStorage`, so uploaded photos are resized to about 900px before saving.
- **Placeholder logo and images.** `assets/images/logo.svg` is a placeholder in the team's colours. Replace it with the official Student Marketplace logo using the same file name. Seed products use generated illustrations so the demo works offline.

## Scope

This website is the **web prototype component** of the project. The project's Java implementation phase is a separate deliverable and is not part of this repository.

## Deploying to GitHub Pages

1. Create a new **public** repository on GitHub, e.g. `student-marketplace`.
2. In a terminal inside this folder:

   ```bash
   git init
   git add .
   git commit -m "Student Market Place prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/student-marketplace.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
5. After a minute or two the site is live at:

   ```
   https://<your-username>.github.io/student-marketplace/
   ```

All links and assets use relative paths (e.g. `css/style.css`, never `/css/style.css`), so the site works inside the repository sub-folder.
