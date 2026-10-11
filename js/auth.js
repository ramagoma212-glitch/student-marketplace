/*
 Student Market Place
 Purpose: Registration and login screens (register.html, login.html)
 Technology: Vanilla JavaScript

 The rules live in services.js: validateTutEmail(), registerUser(), loginUser().
 This file only reads the form, shows messages and redirects.

 NOTE: this is a front-end prototype. Production authentication would need a
 secure backend (server-side password hashing, HTTPS sessions and a real
 confirmation email sent to the student's TUT address).
*/
App.ready(() => {
  const { icon, setFieldError, setFieldSuccess } = App;
  const page = document.body.dataset.page;
  const f = id => document.getElementById(id);

  // Already logged in? Go straight to the dashboard.
  if (getCurrentUser()) {
    window.location.replace(App.safeNext(App.param("next")));
    return;
  }

  renderAsidePoints();
  setupPasswordToggles();
  if (page === "register") setupRegister();
  if (page === "login") setupLogin();

  function renderAsidePoints() {
    const points = f("aside-points");
    if (!points) return;
    points.innerHTML = [
      ["verified", "Only @tut4life.ac.za student emails accepted"],
      ["message", "Chat with sellers in your inbox"],
      ["coins", "Save money on books and tech"],
      ["shieldCheck", "Ratings, reviews and reporting"]
    ].map(([ic, text]) => `<li><span class="li-icon">${icon(ic)}</span>${text}</li>`).join("");
  }

  function setupPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach(btn => {
      const input = f(btn.dataset.togglePassword);
      btn.innerHTML = icon("eye");
      btn.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.innerHTML = icon(show ? "eyeOff" : "eye");
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  }

  function showAlert(type, title, text) {
    f("form-alert").innerHTML = `<div class="alert alert-${type} mb-16" role="alert">${icon(type === "error" ? "alert" : "checkCircle")}<div><strong>${title}</strong><p>${text}</p></div></div>`;
  }

  /* ---------------- Registration ---------------- */
  function setupRegister() {
    const email = f("email");

    // Live check while typing: red error for other domains, green message when accepted
    function liveEmailCheck(force) {
      const value = email.value.trim();
      if (!value || (!force && !value.includes("@"))) { setFieldError(email, ""); return; }
      const error = validateTutEmail(value);
      if (error) setFieldError(email, error);
      else setFieldSuccess(email, "TUT email accepted");
    }
    email.addEventListener("input", () => liveEmailCheck(false));
    email.addEventListener("blur", () => liveEmailCheck(true));

    f("password").addEventListener("input", e => updateStrengthMeter(e.target.value));
    f("studentNumber").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, ""); });

    f("register-form").addEventListener("submit", e => {
      e.preventDefault();
      f("form-alert").innerHTML = "";
      const result = registerUser({
        firstName: f("firstName").value.trim(),
        lastName: f("lastName").value.trim(),
        studentNumber: f("studentNumber").value.trim(),
        email: email.value.trim(),
        password: f("password").value,
        confirmPassword: f("confirmPassword").value,
        acceptedTerms: f("terms").checked
      });

      ["firstName", "lastName", "studentNumber", "password", "confirmPassword", "terms"].forEach(id => setFieldError(f(id), result.errors[id] || ""));
      if (result.errors.email) setFieldError(email, result.errors.email);
      else if (email.value.trim()) setFieldSuccess(email, "TUT email accepted");

      if (!result.ok) {
        showAlert("error", "Please fix the highlighted fields", "Check the details below and try again.");
        const firstError = Object.keys(result.errors)[0];
        if (f(firstError)) f(firstError).focus();
        return;
      }
      App.flash(`Welcome to Student Market Place, ${result.user.firstName}! Your student email was accepted.`);
      window.location.href = "dashboard.html";
    });
  }

  function updateStrengthMeter(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    const colours = ["#c8312b", "#e08a00", "#1f6fd1", "#0f7a55"];
    document.querySelectorAll(".password-strength span").forEach((bar, i) => { bar.style.background = i < score ? colours[score - 1] : ""; });
    f("strength-label").textContent = value
      ? ["Weak password", "Fair password", "Good password", "Strong password"][Math.max(score - 1, 0)]
      : "Use 8+ characters with a mix of letters, numbers and symbols.";
  }

  /* ---------------- Login ---------------- */
  function setupLogin() {
    const email = f("email");
    const password = f("password");

    document.querySelectorAll("[data-demo]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [demoEmail, demoPassword] = btn.dataset.demo.split("|");
        email.value = demoEmail;
        password.value = demoPassword;
        setFieldError(email, "");
        setFieldError(password, "");
        f("form-alert").innerHTML = "";
        f("login-form").querySelector('button[type="submit"]').focus();
      });
    });

    f("login-form").addEventListener("submit", e => {
      e.preventDefault();
      f("form-alert").innerHTML = "";
      setFieldError(email, "");
      setFieldError(password, "");
      const result = loginUser(email.value, password.value, f("remember").checked);

      if (!result.ok) {
        if (result.field === "email") { setFieldError(email, result.error); email.focus(); }
        else if (result.field === "password") { setFieldError(password, result.error); password.focus(); }
        else {
          showAlert("error", "Invalid email or password", "The details you entered don't match a registered student account. Please try again.");
          password.value = "";
          password.focus();
        }
        return;
      }
      App.flash(`Welcome back, ${result.user.firstName}!`);
      window.location.href = App.safeNext(App.param("next"));
    });

    f("forgot-link").addEventListener("click", () => openForgotPassword(email.value));
  }

  /* Forgot password is demonstrated with a modal – no email is actually sent. */
  function openForgotPassword(prefill) {
    App.modal({
      title: "Reset your password",
      subtitle: "Enter your TUT email and we'll send you a reset link.",
      iconName: "lock",
      body: `<div class="field"><label for="reset-email">TUT email</label><input class="input" id="reset-email" type="email" placeholder="student@tut4life.ac.za" value="${App.esc(prefill)}"></div>`,
      actions: [
        { label: "Cancel", className: "btn-outline" },
        {
          label: "Send reset link", className: "btn-primary", onClick: (close, root) => {
            const input = root.querySelector("#reset-email");
            const error = validateTutEmail(input.value);
            setFieldError(input, error);
            if (error) return false;
            setTimeout(() => App.modal({
              title: "Check your TUT inbox",
              subtitle: `If an account exists for ${input.value.trim().toLowerCase()}, a password reset link would normally be sent to that TUT student email.`,
              iconName: "mail", iconType: "success",
              body: `<div class="alert">${icon("info")}<div><strong>Need to log in now?</strong><p>Use one of the test accounts shown on the login page.</p></div></div>`,
              actions: [{ label: "Back to login", className: "btn-primary" }]
            }), 220);
          }
        }
      ]
    });
  }
});
