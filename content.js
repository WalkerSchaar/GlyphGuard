function scanLinks() {
  const links = document.querySelectorAll("a[href]");
  links.forEach(link => {
    try {
      const url = new URL(link.href);
      const domain = url.hostname;

      // Decode punycode (xn--pple-43d.com -> аpple.com)
      const decodedDomain = punycode.toUnicode(domain);

      // Check for non-Latin characters
      if (/[^a-zA-Z0-9.\-]/.test(decodedDomain)) {
        // Highlight the suspicious link
        link.classList.add("homoglyph-suspicious");

        // Add a warning tooltip so users see *why*
        link.title = `Suspicious domain detected: ${decodedDomain}`;

        // Fire a toast alert (but only once per domain per scan cycle)
        if (!document.querySelector(`[data-toast-for="${decodedDomain}"]`)) {
          showToast(`⚠️ Suspicious domain detected: ${decodedDomain}`, decodedDomain);
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });
}

// Initial scan when Gmail loads
scanLinks();

// Keep scanning as Gmail dynamically loads content
const observer = new MutationObserver(scanLinks);
observer.observe(document.body, { childList: true, subtree: true });
