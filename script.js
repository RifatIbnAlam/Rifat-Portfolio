const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

// Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  if (el.closest(".hero")) el.style.transitionDelay = `${i * 80}ms`;
  revealObserver.observe(el);
});

// Count-up metrics
const formatCount = (el, value) => {
  const { prefix = "", suffix = "" } = el.dataset;
  el.textContent = `${prefix}${Math.round(value).toLocaleString("en-US")}${suffix}`;
};
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      countObserver.unobserve(el);
      const target = Number(el.dataset.to);
      if (reduceMotion) return formatCount(el, target);
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        formatCount(el, target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll(".count").forEach((el) => {
  if (!reduceMotion) formatCount(el, 0);
  countObserver.observe(el);
});

// Pipeline steps light up once, in sequence
const steps = [...document.querySelectorAll(".step")];
if (steps.length) {
  if (reduceMotion) steps.forEach((s) => s.classList.add("on"));
  else steps.forEach((s, i) => setTimeout(() => s.classList.add("on"), 600 + i * 450));
}

// Theme toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle?.addEventListener("click", () => {
  const isDark =
    root.dataset.theme === "dark" ||
    (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = isDark ? "light" : "dark";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch (e) {}
});

// Mobile menu
const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");
const setMenu = (open) => {
  menu.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
};
menuToggle?.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// Header border, active nav link
const header = document.querySelector(".site-header");
const navLinks = [...document.querySelectorAll(".menu a")];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 8);
  let current = -1;
  sections.forEach((s, i) => {
    if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i;
  });
  navLinks.forEach((a, i) => a.classList.toggle("active", i === current));
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Copy email
const toast = document.getElementById("toast");
const showToast = (msg) => {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2000);
};
document.getElementById("copy-email")?.addEventListener("click", async (e) => {
  try {
    await navigator.clipboard.writeText(e.currentTarget.dataset.email);
    showToast("Email copied to clipboard");
  } catch {
    showToast(e.currentTarget.dataset.email);
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

// Savings calculator
const calc = document.getElementById("calc");
if (calc) {
  const WEEKS = 48;
  const FTE_HOURS = 1920;
  const fields = ["people", "hours", "rate", "auto"];
  const val = (k) => Number(document.getElementById(`c-${k}`).value);
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const out = {
    people: (v) => v,
    hours: (v) => v,
    rate: (v) => `$${v}`,
    auto: (v) => `${v}%`,
  };
  const update = () => {
    fields.forEach((k) => {
      document.getElementById(`c-${k}-out`).textContent = out[k](val(k));
    });
    const hours = val("people") * val("hours") * WEEKS * (val("auto") / 100);
    const dollars = hours * val("rate");
    const fte = hours / FTE_HOURS;
    document.getElementById("c-dollars").textContent = `$${fmt(dollars)}`;
    document.getElementById("c-hours-saved").textContent = fmt(hours);
    document.getElementById("c-fte").textContent = fte.toFixed(1);
    const subject = "Automating a manual process";
    const body =
      `Hi Rifat,\n\nI used the calculator on your portfolio. Our process: ` +
      `${val("people")} people spend ${val("hours")} hours/week each, ` +
      `about ${val("auto")}% of it automatable. Your estimate: $${fmt(dollars)} ` +
      `and ${fmt(hours)} hours a year.\n\nCould we talk?\n`;
    document.getElementById("c-mail").href =
      `mailto:rifatibnalam50@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  calc.addEventListener("input", update);
  calc.addEventListener("submit", (e) => e.preventDefault());
  update();
}
