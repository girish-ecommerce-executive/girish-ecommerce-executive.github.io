/* ==========================================================
   Girish Kumar Gupta – Portfolio Script
   Layout inspiration: https://manish-data-analyst.github.io/
   ========================================================== */
(function () {
  "use strict";

  // Enable reveal animations only when JS is running
  document.documentElement.classList.add("js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Loader ---------- */
  const loader = $("#loader");
  const hideLoader = () => loader && loader.classList.add("hide");
  window.addEventListener("load", () => setTimeout(hideLoader, 350));
  setTimeout(hideLoader, 3000); // safety net if a CDN is slow

  /* ---------- Header shadow on scroll + back-to-top ---------- */
  const header = $("#header");
  const backToTop = $("#back-to-top");
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 20);
    backToTop.classList.toggle("show", y > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Mobile menu ---------- */
  const toggle = $("#nav-toggle");
  const menu = $("#nav-menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$(".nav-link").forEach((l) => l.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) setMenu(false); });

  /* ---------- Active nav link while scrolling ---------- */
  const links = $$(".nav-link");
  const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) =>
              l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    // small stagger for items inside the same grid
    reveals.forEach((el) => {
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal")) : [];
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 90 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- "View Project" placeholder links ---------- */
  // Replace href="#" in index.html with real links, then this handler stops applying to them.
  $$("[data-project]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.getAttribute("href") === "#") e.preventDefault();
    });
  });

  /* ---------- Contact form: validation + optional Formspree ---------- */
  const form = $("#contact-form");
  const statusEl = $("#form-status");
  const rules = {
    name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
    subject: (v) => (v.trim().length < 3 ? "Please enter a subject." : ""),
    message: (v) => (v.trim().length < 10 ? "Message should be at least 10 characters." : ""),
  };

  function validateField(input) {
    const group = input.closest(".form-group");
    const msg = rules[input.name](input.value);
    group.classList.toggle("invalid", !!msg);
    $(".error", group).textContent = msg;
    return !msg;
  }

  $$("input, textarea", form).forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.closest(".form-group").classList.contains("invalid")) validateField(input);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.className = "form-status";
    statusEl.textContent = "";

    const fields = $$("input, textarea", form);
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      statusEl.classList.add("fail");
      statusEl.textContent = "Please fix the highlighted fields.";
      const firstBad = $(".invalid input, .invalid textarea", form);
      if (firstBad) firstBad.focus();
      return;
    }

    const endpoint = form.dataset.endpoint.trim(); // set data-endpoint in index.html (Formspree URL)
    const btn = $("button[type=submit]", form);
    btn.disabled = true;

    if (!endpoint) {
      // No backend connected yet – demo success message
      setTimeout(() => {
        statusEl.classList.add("success");
        statusEl.textContent = "Thanks! (Demo mode – connect Formspree in index.html to receive messages.)";
        form.reset();
        btn.disabled = false;
      }, 600);
      return;
    }

    try {
      const isGoogleScript = endpoint.indexOf("script.google.com") !== -1;
      if (isGoogleScript) {
        // Google Apps Script (saves to Google Sheet): browser cannot read its reply,
        // so use no-cors. If the request itself fails, it still lands in catch().
        await fetch(endpoint, { method: "POST", mode: "no-cors", body: new FormData(form) });
      } else {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error("Request failed");
      }
      statusEl.classList.add("success");
      statusEl.textContent = "Message sent successfully. Thank you!";
      form.reset();
    } catch (err) {
      statusEl.classList.add("fail");
      statusEl.textContent = "Something went wrong. Please try again or email me directly.";
    } finally {
      btn.disabled = false;
    }
  });
})();
