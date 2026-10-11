/*
 Student Market Place
 Purpose: Reference data (categories, campuses, conditions), demo seed data
          and project data used by the front-end prototype.
 Technology: Vanilla JavaScript

 All people and listings here are fictional demo content.
*/

const CATEGORIES = [
  { name: "Textbooks",        icon: "book",      blurb: "Course books & notes" },
  { name: "Electronics",      icon: "laptop",    blurb: "Laptops, phones, audio" },
  { name: "Clothing",         icon: "shirt",     blurb: "TUT gear & fashion" },
  { name: "Furniture",        icon: "sofa",      blurb: "Desks, chairs, storage" },
  { name: "Accommodation",    icon: "building",  blurb: "Rooms near campus" },
  { name: "Student Services", icon: "briefcase", blurb: "Tutoring, printing" },
  { name: "Stationery",       icon: "pen",       blurb: "Pens, files, paper" },
  { name: "Study Equipment",  icon: "calculator",blurb: "Calculators, lamps" },
  { name: "Other",            icon: "box",       blurb: "Everything else" }
];

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Service"];

const CAMPUSES = [
  "Pretoria Campus",
  "Arcadia Campus",
  "Arts Campus",
  "Soshanguve South",
  "Soshanguve North",
  "Ga-Rankuwa Campus",
  "eMalahleni Campus",
  "Mbombela Campus",
  "Polokwane Campus"
];

const CONTACT_PREFERENCES = ["Marketplace inbox", "Inbox, then meet on campus", "Inbox only"];

/* Demo passwords (shown on the login page):
   demo@tut4life.ac.za      -> Demo@1234
   lerato.m@tut4life.ac.za  -> Lerato@1234
   all other seed sellers   -> Student@1234 */
const SEED_USERS = [
  { id: "u_demo",   firstName: "Kagiso",  lastName: "Ndlovu",   studentNumber: "221045678", email: "demo@tut4life.ac.za",        password: "Demo@1234",    campus: "Soshanguve South",  bio: "3rd year Computer Science student. I sell books and tech I no longer need.", createdAt: "2025-02-10T09:00:00" },
  { id: "u_lerato", firstName: "Lerato",  lastName: "Mahlangu", studentNumber: "220318842", email: "lerato.m@tut4life.ac.za",    password: "Lerato@1234",  campus: "Soshanguve South",  bio: "Electrical Engineering student. Quick replies, meet-ups at the library.", createdAt: "2024-08-02T09:00:00" },
  { id: "u_sipho",  firstName: "Sipho",   lastName: "Nkosi",    studentNumber: "219552301", email: "sipho.n@tut4life.ac.za",     password: "Student@1234", campus: "Pretoria Campus",   bio: "Mechanical Engineering. Upgrading my gear, selling the old stuff.", createdAt: "2024-03-14T09:00:00" },
  { id: "u_naledi", firstName: "Naledi",  lastName: "Khumalo",  studentNumber: "222101457", email: "naledi.k@tut4life.ac.za",    password: "Student@1234", campus: "Soshanguve South",  bio: "Interior Design student moving out of res – furniture going cheap.", createdAt: "2025-01-20T09:00:00" },
  { id: "u_tshepo", firstName: "Tshepo",  lastName: "Maluleke", studentNumber: "220774109", email: "tshepo.m@tut4life.ac.za",    password: "Student@1234", campus: "Soshanguve North",  bio: "Maths & Physics tutor. Helping first years pass since 2023.", createdAt: "2023-09-05T09:00:00" },
  { id: "u_ayanda", firstName: "Ayanda",  lastName: "Zulu",     studentNumber: "221630925", email: "ayanda.z@tut4life.ac.za",    password: "Student@1234", campus: "Ga-Rankuwa Campus", bio: "Nursing student. Selling res essentials after graduation.", createdAt: "2024-05-11T09:00:00" },
  { id: "u_karabo", firstName: "Karabo",  lastName: "Molefe",   studentNumber: "223004512", email: "karabo.m@tut4life.ac.za",    password: "Student@1234", campus: "Arcadia Campus",    bio: "IT student and gadget fan.", createdAt: "2025-03-01T09:00:00" },
  { id: "u_palesa", firstName: "Palesa",  lastName: "Dlamini",  studentNumber: "222887310", email: "palesa.d@tut4life.ac.za",    password: "Student@1234", campus: "Pretoria Campus",   bio: "Fashion Design student. Clothing and printing services.", createdAt: "2024-10-18T09:00:00" }
];

/* daysAgo is converted into a real date when the data is first seeded,
   so the listings always look recent during a demo. */
const SEED_PRODUCTS = [
  { id: "p01", sellerId: "u_lerato", title: "Casio fx-991ZA Plus Scientific Calculator", category: "Study Equipment", price: 250,  condition: "Like New", campus: "Soshanguve South",  art: "calculator", daysAgo: 1,  description: "Approved for TUT exams. Used for one semester only, all functions working. Comes with the original slide cover." },
  { id: "p02", sellerId: "u_sipho",  title: "Engineering Mathematics – K.A. Stroud (8th Edition)", category: "Textbooks", price: 450, condition: "Good", campus: "Pretoria Campus", art: "book", daysAgo: 2, description: "Prescribed for Engineering Maths 1 and 2. A few highlighted pages, no torn pages. Saves you more than R600 compared to a new copy." },
  { id: "p03", sellerId: "u_sipho",  title: "Lenovo IdeaPad 3 – Core i5, 8GB RAM, 512GB SSD", category: "Electronics", price: 5800, condition: "Good", campus: "Pretoria Campus", art: "laptop", daysAgo: 3, description: "15.6\" laptop with Windows 11, battery lasts about 5 hours. Small scratch on the lid. Charger included. Perfect for coding and assignments." },
  { id: "p04", sellerId: "u_tshepo", title: "HP 65W Laptop Charger (Blue Tip)", category: "Electronics", price: 250, condition: "Good", campus: "Soshanguve North", art: "charger", daysAgo: 4, description: "Original HP charger, fits most HP laptops with the blue 4.5mm tip. Tested and working." },
  { id: "p05", sellerId: "u_naledi", title: "Study Desk with Drawer", category: "Furniture", price: 650, condition: "Fair", campus: "Soshanguve South", art: "desk", daysAgo: 5, description: "Sturdy desk (120 x 60 cm) with one drawer. Some wear on the top. Buyer must collect from res near Soshanguve South." },
  { id: "p06", sellerId: "u_naledi", title: "Ergonomic Study Chair", category: "Furniture", price: 480, condition: "Good", campus: "Soshanguve South", art: "chair", daysAgo: 5, description: "Adjustable height, mesh back, comfortable for long study sessions. Selling because I'm moving out of res." },
  { id: "p07", sellerId: "u_karabo", title: "Waterproof Laptop Backpack", category: "Other", price: 300, condition: "Like New", campus: "Arcadia Campus", art: "backpack", daysAgo: 6, description: "Fits a 15.6\" laptop, USB charging port, lots of pockets. Used for two months." },
  { id: "p08", sellerId: "u_ayanda", title: "Residence Bar Fridge (90L)", category: "Electronics", price: 1200, condition: "Good", campus: "Ga-Rankuwa Campus", art: "fridge", daysAgo: 7, description: "Defy bar fridge with small freezer section. Energy efficient and quiet – ideal for res rooms." },
  { id: "p09", sellerId: "u_karabo", title: "JBL Tune 510BT Wireless Headphones", category: "Electronics", price: 450, condition: "Like New", campus: "Arcadia Campus", art: "headphones", daysAgo: 2, description: "Bluetooth, around 40 hours battery life. In the original box with charging cable." },
  { id: "p10", sellerId: "u_palesa", title: "TUT Branded Hoodie – Navy (Size L)", category: "Clothing", price: 220, condition: "Like New", campus: "Pretoria Campus", art: "shirt", daysAgo: 8, description: "Warm fleece hoodie with TUT print. Washed once, no fading." },
  { id: "p11", sellerId: "u_tshepo", title: "Accounting 1 Summarised Study Notes", category: "Textbooks", price: 80, condition: "New", campus: "Soshanguve North", art: "notes", daysAgo: 9, description: "45 pages of neat summarised notes with worked examples for every chapter. Printed and bound." },
  { id: "p12", sellerId: "u_palesa", title: "Printing & Binding Service (up to 50 pages)", category: "Student Services", price: 60, condition: "Service", campus: "Pretoria Campus", art: "printer", daysAgo: 1, description: "Black & white printing plus comb binding for assignments and portfolios. Same-day turnaround on weekdays." },
  { id: "p13", sellerId: "u_tshepo", title: "Maths & Physics Tutoring – 1 Hour Session", category: "Student Services", price: 150, condition: "Service", campus: "Soshanguve North", art: "tutor", daysAgo: 3, description: "One-on-one tutoring for first and second year Maths and Physics. Sessions at the library or online." },
  { id: "p14", sellerId: "u_ayanda", title: "Shared Room near Soshanguve South (per month)", category: "Accommodation", price: 2500, condition: "Good", campus: "Soshanguve South", art: "bed", daysAgo: 10, description: "Furnished shared room, 5 minutes walk to campus. Wi-Fi and water included. Available from next month." },
  { id: "p15", sellerId: "u_lerato", title: "A4 Stationery Bundle (books, pens, highlighters)", category: "Stationery", price: 120, condition: "New", campus: "Soshanguve South", art: "pen", daysAgo: 4, description: "5 x A4 hardcover books, 10 pens, 6 highlighters and a pencil case. Bought too much at the start of the year." },
  { id: "p16", sellerId: "u_lerato", title: "LED Desk Lamp with USB Port", category: "Study Equipment", price: 150, condition: "Good", campus: "Soshanguve South", art: "lamp", daysAgo: 6, description: "Three brightness levels, flexible neck, USB charging port for your phone." },
  { id: "p17", sellerId: "u_karabo", title: "Chemistry: The Central Science (14th Edition)", category: "Textbooks", price: 550, condition: "Fair", campus: "Arcadia Campus", art: "book", daysAgo: 12, description: "Brown, LeMay et al. Cover is worn but all pages intact. Used for Chemistry 1." },
  { id: "p18", sellerId: "u_demo",   title: "Python Programming Textbook (Zelle, 3rd Edition)", category: "Textbooks", price: 300, condition: "Good", campus: "Soshanguve South", art: "book", daysAgo: 2, description: "Great intro to programming for Development Software 1. Some pencil notes in the margins." },
  { id: "p19", sellerId: "u_demo",   title: "Logitech Wireless Mouse", category: "Electronics", price: 120, condition: "Good", campus: "Soshanguve South", art: "mouse", daysAgo: 14, status: "sold", buyerId: "u_karabo", description: "Logitech M185 wireless mouse with USB receiver." },
  { id: "p20", sellerId: "u_sipho",  title: "Engineering Drawing Set & A3 Board", category: "Study Equipment", price: 350, condition: "Good", campus: "Pretoria Campus", art: "ruler", daysAgo: 11, status: "sold", buyerId: "u_demo", description: "A3 drawing board with T-square, compass set and scale rulers." }
];

const SEED_REVIEWS = [
  { sellerId: "u_lerato", reviewerId: "u_sipho",  productTitle: "Graphing calculator", rating: 5, text: "Item exactly as described and Lerato was on time at the library.", daysAgo: 30 },
  { sellerId: "u_lerato", reviewerId: "u_karabo", productTitle: "Physics textbook",    rating: 5, text: "Friendly seller, quick replies. Would buy again.", daysAgo: 45 },
  { sellerId: "u_lerato", reviewerId: "u_ayanda", productTitle: "Lab coat",            rating: 4, text: "Good condition, small stain that she told me about upfront.", daysAgo: 60 },
  { sellerId: "u_sipho",  reviewerId: "u_naledi", productTitle: "Monitor",             rating: 5, text: "Works perfectly. Sipho even helped me carry it to the taxi rank.", daysAgo: 20 },
  { sellerId: "u_sipho",  reviewerId: "u_palesa", productTitle: "Statics textbook",    rating: 4, text: "Fair price, a bit late to the meeting point.", daysAgo: 50 },
  { sellerId: "u_naledi", reviewerId: "u_lerato", productTitle: "Bookshelf",           rating: 5, text: "Beautiful shelf and very honest seller.", daysAgo: 15 },
  { sellerId: "u_naledi", reviewerId: "u_demo",   productTitle: "Curtains",            rating: 5, text: "Exactly like the photos. Smooth handover at res.", daysAgo: 40 },
  { sellerId: "u_tshepo", reviewerId: "u_ayanda", productTitle: "Maths tutoring",      rating: 5, text: "I went from 42% to 68% in my semester test. Highly recommended!", daysAgo: 25 },
  { sellerId: "u_tshepo", reviewerId: "u_karabo", productTitle: "Physics tutoring",    rating: 4, text: "Explains concepts clearly. Sessions sometimes run over time.", daysAgo: 70 },
  { sellerId: "u_ayanda", reviewerId: "u_naledi", productTitle: "Kettle",              rating: 4, text: "Works well, collected at Ga-Rankuwa gate.", daysAgo: 35 },
  { sellerId: "u_karabo", reviewerId: "u_sipho",  productTitle: "Power bank",          rating: 5, text: "Brand new as promised. Great communication.", daysAgo: 12 },
  { sellerId: "u_karabo", reviewerId: "u_demo",   productTitle: "USB flash drive",     rating: 5, text: "Quick and friendly. The flash drive was brand new.", daysAgo: 13 },
  { sellerId: "u_palesa", reviewerId: "u_lerato", productTitle: "Printing service",    rating: 5, text: "Portfolio printed and bound the same day. Neat work.", daysAgo: 18 },
  { sellerId: "u_demo",   reviewerId: "u_karabo", productTitle: "Logitech Wireless Mouse", rating: 5, text: "Smooth transaction, met at the Soshanguve library.", daysAgo: 12 },
  { sellerId: "u_demo",   reviewerId: "u_lerato", productTitle: "Data Structures notes",   rating: 4, text: "Helpful notes, a few pages were out of order.", daysAgo: 55 }
];

/* minutesAgo becomes a timestamp when seeded. readByDemo controls
   whether the demo student has already read the conversation. */
const SEED_CONVERSATIONS = [
  {
    id: "c01", productId: "p01", buyerId: "u_demo", sellerId: "u_lerato",
    messages: [
      { senderId: "u_demo",   text: "Hi Lerato, is the Casio calculator still available?", minutesAgo: 190 },
      { senderId: "u_lerato", text: "Hi Kagiso! Yes it is. It's approved for exams too.", minutesAgo: 182 },
      { senderId: "u_demo",   text: "Great. Would you take R220?", minutesAgo: 175 },
      { senderId: "u_lerato", text: "I can do R230. We can meet at the Soshanguve South library tomorrow at 12:00?", minutesAgo: 25 }
    ],
    readByDemo: false
  },
  {
    id: "c02", productId: "p18", buyerId: "u_naledi", sellerId: "u_demo",
    messages: [
      { senderId: "u_naledi", text: "Hello! Is the Python textbook still for sale? Would you accept R260?", minutesAgo: 70 }
    ],
    readByDemo: false
  },
  {
    id: "c03", productId: "p20", buyerId: "u_demo", sellerId: "u_sipho",
    messages: [
      { senderId: "u_demo",  text: "Hi Sipho, I'm interested in the drawing set.", minutesAgo: 60 * 24 * 12 },
      { senderId: "u_sipho", text: "Sure! I'm at Pretoria Campus every day until 3pm.", minutesAgo: 60 * 24 * 12 - 20 },
      { senderId: "u_demo",  text: "Perfect, see you at the main entrance on Thursday.", minutesAgo: 60 * 24 * 11 - 30 },
      { senderId: "u_sipho", text: "Thanks for buying! Good luck with Engineering Drawing.", minutesAgo: 60 * 24 * 11 }
    ],
    readByDemo: true
  }
];

const SEED_PURCHASES = [
  { id: "pur01", productId: "p20", buyerId: "u_demo",   sellerId: "u_sipho", price: 350, daysAgo: 11, reviewed: false },
  { id: "pur02", productId: "p19", buyerId: "u_karabo", sellerId: "u_demo",  price: 120, daysAgo: 13, reviewed: true }
];

const TEAM_MEMBERS = [
  { name: "Nkgai Sedibeng", role: "Group Leader" },
  { name: "Rasebotsa Antoinette", role: "Team Member" },
  { name: "Mahonga Mapula", role: "Team Member" },
  { name: "Tjie Mmatshepo", role: "Team Member" },
  { name: "Bululu Sinesipho", role: "Team Member" },
  { name: "Hlahla Motlatso", role: "Team Member" },
  { name: "Letsatsi Gift", role: "Team Member" },
  { name: "Mmurwa Pabalelo", role: "Team Member" },
  { name: "Mokomane Saviour", role: "Team Member" }
];

/* Year 1 financial computations from the project spreadsheet.
   These are PROJECTIONS for the academic project – not real business results.
   Profit, margin and cash flow are calculated in services.js. */
const PROJECT_FINANCIALS = {
  startupCost: 5000,
  projectedRevenue: 30000,
  openingBalance: 0,
  startupItems: ["Domain & hosting", "Development tools", "Marketing", "Equipment"],
  revenueSources: ["Listing fees", "Premium accounts", "Featured placements", "Advertising"],
  benefits: ["Affordable second-hand goods", "Safer student-only marketplace", "Students can earn extra income", "Campus-focused platform"],
  costs: ["Development and hosting", "Marketing", "Maintenance", "Startup investment"]
};

/* Competitor research summary (from the project's field research). */
const COMPETITOR_RESEARCH = [
  { name: "Facebook Marketplace", strength: "Free listings, large user base, local pick-up", gap: "No student verification; scams and no-shows are a common complaint" },
  { name: "Takealot", strength: "Wide product range, delivery and pick-up points", gap: "Retail store, not peer-to-peer trading between students" },
  { name: "Incredible", strength: "Electronics specialist with in-store collection", gap: "Sells new stock only – no second-hand student trading" },
  { name: "Loot", strength: "Strong book and media catalogue", gap: "Online retailer with no campus-based collection" },
  { name: "Amazon", strength: "Huge catalogue and trusted fulfilment", gap: "High seller fees; not focused on local student exchange" }
];
