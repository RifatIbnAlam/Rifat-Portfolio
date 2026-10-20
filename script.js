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

// Pipeline steps light up in sequence
const steps = [...document.querySelectorAll(".step")];
if (steps.length) {
  let active = 0;
  const light = () => {
    steps.forEach((s, i) => s.classList.toggle("on", i <= active));
    active = (active + 1) % (steps.length + 1);
  };
  light();
  if (!reduceMotion) setInterval(light, 1100);
  else steps.forEach((s) => s.classList.add("on"));
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

// Header border, scroll progress, active nav link
const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const navLinks = [...document.querySelectorAll(".menu a")];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
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
