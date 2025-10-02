// scanner.js

const scripts = {
  Latin: /[\u0041-\u007A\u00C0-\u00FF]/,
  Greek: /[\u0370-\u03FF]/,
  Cyrillic: /[\u0400-\u04FF]/,
  Armenian: /[\u0530-\u058F]/,
  Hebrew: /[\u0590-\u05FF]/,
  Arabic: /[\u0600-\u06FF]/
};

function detectScripts(str) {
  const found = new Set();
  if (!str) return found;
  for (const [name, re] of Object.entries(scripts)) {
    if (re.test(str)) found.add(name);
  }
  return found;
}

function highlightLink(link) {
  link.style.border = "2px solid red";
  link.title = "Mixed-script link detected";
}

// Toast container
const toastContainer = document.createElement("div");
toastContainer.style.position = "fixed";
toastContainer.style.top = "40%";
toastContainer.style.right = "20px";
toastContainer.style.display = "flex";
toastContainer.style.flexDirection = "column";
toastContainer.style.gap = "10px";
toastContainer.style.zIndex = 2147483647;
document.body.appendChild(toastContainer);

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.backgroundColor = "#ff4d4d";
  toast.style.color = "#fff";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  toast.style.minWidth = "250px";
  toast.style.maxWidth = "400px";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 10000);
}

function getRawHref(link) {
  try {
    return link.getAttribute("href");
  } catch (e) {
    return null;
  }
}

function punycodeToUnicode(input) {
  if (!input || input.indexOf("xn--") !== 0) return input;
  const decode = (input) => {
    const output = [];
    const base = 36, tmin = 1, tmax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = 0x2D;
    let n = initialN, i = 0, bias = initialBias;
    const b = input.lastIndexOf(String.fromCharCode(delimiter));
    if (b > -1) for (let j = 0; j < b; ++j) output.push(input.charCodeAt(j));
    input = b > -1 ? input.slice(b + 1) : input;
    const basic = output;
    while (input.length) {
      let oldi = i, w = 1;
      for (let k = base;; k += base) {
        if (input.length === 0) return String.fromCharCode(...basic);
        const cp = input.charCodeAt(0);
        input = input.slice(1);
        let digit;
        if (cp - 48 < 10) digit = cp - 22;
        else if (cp - 65 < 26) digit = cp - 65;
        else if (cp - 97 < 26) digit = cp - 97;
        else digit = base;
        i += digit * w;
        const t = k <= bias ? tmin : (k >= bias + tmax ? tmax : k - bias);
        if (digit < t) break;
        w *= (base - t);
      }
      const outLen = basic.length + 1;
      bias = adapt(i - oldi, outLen, oldi === 0);
      n += Math.floor(i / outLen);
      i = i % outLen;
      basic.splice(i, 0, n);
      i++;
    }
    function adapt(delta, numPoints, firstTime) {
      delta = firstTime ? Math.floor(delta / damp) : (delta >> 1);
      delta += Math.floor(delta / numPoints);
      let k = 0;
      while (delta > ((base - tmin) * tmax) / 2) {
        delta = Math.floor(delta / (base - tmin));
        k += base;
      }
      return Math.floor(k + (((base - tmin + 1) * delta) / (delta + skew)));
    }
    return String.fromCharCode(...basic);
  };
  try {
    const ascii = input.slice(4);
    return decode(ascii);
  } catch (e) {
    return input;
  }
}

function getHostnameUnicode(href) {
  try {
    const u = new URL(href, window.location.href);
    const host = u.hostname;
    if (host.startsWith("xn--")) {
      const parts = host.split(".");
      return parts.map(p => p.startsWith("xn--") ? punycodeToUnicode(p) : p).join(".");
    }
    return host;
  } catch (e) {
    return null;
  }
}

const seenLinks = new WeakSet();

function inspectLink(link) {
  if (!(link instanceof HTMLAnchorElement)) return;
  if (seenLinks.has(link)) return;

  const raw = getRawHref(link) || "";
  const text = (link.textContent || "") + " " + (link.innerText || "");
  const resolvedHref = (() => { try { return link.href || ""; } catch (e) { return ""; } })();

  const checks = [];
  if (raw) checks.push(raw);
  if (text) checks.push(text);
  if (resolvedHref) {
    const hostname = getHostnameUnicode(resolvedHref);
    if (hostname) checks.push(hostname);
    checks.push(resolvedHref);
  }

  const combined = checks.join(" ");
  const found = detectScripts(combined);
  if (found.size > 1) {
    highlightLink(link);
    showToast("Mixed-script link detected: " + (resolvedHref || raw || text));
    seenLinks.add(link);
  }
}

function scanAll() {
  document.querySelectorAll("a").forEach(inspectLink);
}

const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    if (m.type === "childList") {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches("a")) inspectLink(node);
        node.querySelectorAll && node.querySelectorAll("a").forEach(inspectLink);
      });
    } else if (m.type === "attributes" && m.target && m.target.matches && m.target.matches("a")) {
      inspectLink(m.target);
    }
  }
});

function start() {
  scanAll();
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"]
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  start();
} else {
  window.addEventListener("DOMContentLoaded", start);
}
