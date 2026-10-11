/*
 Student Market Place
 Purpose: Sell an item / edit a listing (sell.html, sell.html?edit=p01)
 Technology: Vanilla JavaScript

 Seller flow: Dashboard → Sell Item → Set Price & Details → Publish Listing
 IPO: title, price, description, photo → createListing() → live listing
*/
App.ready(() => {
  const { icon, esc, data, setFieldError } = App;
  const me = App.currentUser();
  const f = id => document.getElementById(id);
  const form = f("sell-form");
  let imageData = ""; // uploaded photo as a compressed data URL (stored in localStorage)

  // Fill select / option lists from the shared reference data
  CATEGORIES.forEach(c => f("category").insertAdjacentHTML("beforeend", `<option value="${esc(c.name)}">${esc(c.name)}</option>`));
  CAMPUSES.forEach(c => f("campus").insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));
  CONTACT_PREFERENCES.forEach(c => f("contact").insertAdjacentHTML("beforeend", `<option value="${esc(c)}">${esc(c)}</option>`));
  f("condition-options").innerHTML = CONDITIONS.map((c, i) => `
    <div class="option-card"><input type="radio" name="condition" id="cond-${i}" value="${esc(c)}"><label for="cond-${i}">${esc(c)}</label></div>`).join("");
  f("campus").value = me.campus || "";

  /* ----- Edit mode ----- */
  const editId = App.param("edit");
  let editing = null;
  if (editId) {
    editing = data.product(editId);
    if (!editing || editing.sellerId !== me.id) {
      f("sell-root").innerHTML = `<div class="card">${App.emptyState({ iconName: "lock", title: "You can't edit this listing", text: "Only the seller who created a listing can edit it.", actionLabel: "My listings", actionHref: "dashboard.html#listings" })}</div>`;
      return;
    }
    document.title = "Edit listing | Student Market Place";
    f("page-title").textContent = "Edit listing";
    f("crumb").textContent = "Edit listing";
    f("page-lead").textContent = "Update the details of your listing.";
    f("submit-btn").textContent = "Save changes";
    f("title").value = editing.title;
    f("category").value = editing.category;
    f("description").value = editing.description;
    f("price").value = editing.price;
    f("campus").value = editing.campus;
    f("contact").value = editing.contactPreference || CONTACT_PREFERENCES[0];
    const cond = form.querySelector(`input[name="condition"][value="${editing.condition}"]`);
    if (cond) cond.checked = true;
    imageData = editing.image || "";
    if (imageData) showUploadPreview("Current photo");
  }

  /* ----- Live preview ----- */
  function currentValues() {
    const condition = form.querySelector('input[name="condition"]:checked');
    return {
      title: f("title").value.trim(),
      category: f("category").value,
      description: f("description").value.trim(),
      price: f("price").value,
      condition: condition ? condition.value : "",
      campus: f("campus").value,
      contactPreference: f("contact").value
    };
  }

  function updatePreview() {
    const v = currentValues();
    f("title-count").textContent = f("title").value.length;
    f("desc-count").textContent = f("description").value.length;
    const previewProduct = {
      id: editing ? editing.id : "preview",
      sellerId: me.id,
      title: v.title || "Your product title",
      category: v.category || "Other",
      price: Number(v.price) > 0 ? Number(v.price) : 0,
      condition: v.condition || "Condition",
      campus: v.campus || "Campus",
      image: imageData,
      art: editing && !imageData ? editing.art : "",
      status: "active",
      createdAt: new Date().toISOString()
    };
    f("preview-card").innerHTML = App.productCard(previewProduct, { preview: true, actions: false });
  }
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);

  /* ----- Image upload (drag & drop styled; uses a normal file input) ----- */
  const dropzone = f("dropzone");
  ["dragenter", "dragover"].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach(evt => dropzone.addEventListener(evt, () => dropzone.classList.remove("dragover")));
  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  f("image").addEventListener("change", e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

  function handleFile(file) {
    const input = f("image");
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      setFieldError(input, "Please upload a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldError(input, "That image is larger than 5MB. Please choose a smaller photo.");
      return;
    }
    setFieldError(input, "");
    const reader = new FileReader();
    reader.onload = () => {
      // Shrink the photo with a canvas so it fits comfortably in localStorage
      const img = new Image();
      img.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        imageData = canvas.toDataURL("image/jpeg", 0.78);
        showUploadPreview(file.name);
        updatePreview();
      };
      img.onerror = () => setFieldError(input, "We couldn't read that image. Please try another file.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function showUploadPreview(name) {
    f("upload-preview").innerHTML = `
      <div class="upload-preview">
        <img src="${esc(imageData)}" alt="Selected product photo">
        <div class="grow" style="flex:1;min-width:0"><strong class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</strong><span class="small muted">Ready to upload</span></div>
        <button type="button" class="btn btn-sm btn-danger-soft" id="remove-image">${icon("trash")}Remove</button>
      </div>`;
    f("remove-image").addEventListener("click", () => {
      imageData = "";
      f("image").value = "";
      f("upload-preview").innerHTML = "";
      updatePreview();
    });
  }

  /* ----- Validation & submit (rules are in validateListing() in services.js) ----- */
  form.addEventListener("submit", e => {
    e.preventDefault();
    const values = { ...currentValues(), image: imageData };
    const result = editing ? updateListing(editing.id, me.id, values) : createListing(me.id, values);
    showErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;
    showSuccess(result.product);
  });

  function showErrors(errors) {
    ["title", "category", "description", "price", "campus", "contact"].forEach(id => setFieldError(f(id), errors[id] || ""));
    const conditionField = f("condition-field");
    const condMsg = conditionField.querySelector(".field-msg");
    if (errors.condition && !condMsg) {
      conditionField.insertAdjacentHTML("beforeend", `<div class="field-msg error mt-8" role="alert">${icon("alert")}<span>${errors.condition}</span></div>`);
    } else if (!errors.condition && condMsg) condMsg.remove();

    const first = Object.keys(errors)[0];
    if (!first) { f("form-alert").innerHTML = ""; return; }
    f("form-alert").innerHTML = `<div class="alert alert-error mb-16" role="alert">${icon("alert")}<div><strong>Some product information is missing</strong><p>Please complete the highlighted fields before publishing.</p></div></div>`;
    if (first === "condition") conditionField.querySelector("input").focus();
    else if (f(first)) f(first).focus();
  }

  function showSuccess(product) {
    App.toast(editing ? "Listing updated successfully." : "Listing published successfully.", "success");
    f("sell-root").innerHTML = `
      <div class="card success-panel" style="max-width:640px;margin:0 auto">
        <div class="success-icon">${icon("check")}</div>
        <h2>${editing ? "Listing updated" : "Listing published successfully"}</h2>
        <p class="muted">${editing ? "Your changes are now live." : "Your item is now visible in the Marketplace and under My Listings. When a buyer sends an enquiry it will appear in your Messages."}</p>
        <div style="max-width:260px;margin:24px auto">${App.productCard(product, { actions: false })}</div>
        <div class="row row-wrap" style="justify-content:center">
          <a class="btn btn-primary" href="product.html?id=${encodeURIComponent(product.id)}">View listing</a>
          <a class="btn btn-outline" href="marketplace.html?sort=newest">See it in Marketplace</a>
          <a class="btn btn-ghost" href="dashboard.html#listings">My listings</a>
          ${editing ? "" : '<a class="btn btn-ghost" href="sell.html">List another item</a>'}
        </div>
      </div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updatePreview();
});
