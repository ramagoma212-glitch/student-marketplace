/*
 Student Market Place
 Purpose: About page – aims, link to the project overview, demo reset
 Technology: Vanilla JavaScript
*/
App.ready(() => {
  const { icon, esc } = App;

  const aims = [
    ["coins", "Affordable items", "Help students find textbooks, tech and essentials at student-friendly prices."],
    ["trending", "Extra income", "Let students sell things they no longer need and offer services."],
    ["leaf", "Unused items, useful again", "Give items a second life instead of letting them go to waste."],
    ["message", "Direct communication", "A student-focused space where buyers and sellers talk directly."]
  ];
  document.getElementById("aims").innerHTML = aims.map(([ic, title, text]) =>
    `<div class="card aim-card"><span class="aim-icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p></div>`).join("");

  document.querySelector(".project-link .aim-icon").innerHTML = icon("file");

  document.getElementById("reset-demo").addEventListener("click", () => {
    App.confirm({
      title: "Reset all demo data?",
      message: "All new accounts, listings, messages, purchases, reviews and reports in this browser will be removed and the original demo data restored.",
      confirmLabel: "Reset data",
      danger: true,
      iconName: "refresh"
    }).then(ok => {
      if (!ok) return;
      App.resetDemoData();
      App.flash("Demo data has been reset.");
      window.location.href = "index.html";
    });
  });
});
