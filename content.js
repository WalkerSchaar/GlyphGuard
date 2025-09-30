// Homoglyph Shield - Link Scanner
// Detects homoglyph attacks in domain names

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.homoglyphShieldActive) {
    return;
  }
  window.homoglyphShieldActive = true;

  // Track alerted domains to prevent duplicate toasts
  const alertedDomains = new Set();

  // Inject styles for visual indicators
  function injectStyles() {
    if (document.getElementById('homoglyph-shield-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'homoglyph-shield-styles';
    style.textContent = `
      .homoglyph-suspicious {
        background-color: #fef3c7 !important;
        border: 2px solid #f59e0b !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
      }
      
      .homoglyph-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        max-width: 400px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: slideIn 0.3s ease-out;
      }
      
      .homoglyph-toast-close {
        background: transparent;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: 12px;
        line-height: 1;
        float: right;
      }
      
      .homoglyph-toast-close:hover {
        opacity: 0.8;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Show toast notification
  function showToast(message, domainId) {
    // Check if toast already exists for this domain
    if (document.querySelector(`[data-toast-for="${domainId}"]`)) {
      return;
    }
    
    const toast = document.createElement('div');
    toast.setAttribute('data-toast-for', domainId);
    toast.className = 'homoglyph-toast';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'homoglyph-toast-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    };
    
    const messageText = document.createElement('div');
    messageText.textContent = message;
    
    toast.appendChild(closeBtn);
    toast.appendChild(messageText);
    document.body.appendChild(toast);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }
    }, 8000);
  }

  // Main scanning function
  function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      // Skip if already scanned
      if (link.hasAttribute('data-homoglyph-scanned')) {
        return;
      }
      link.setAttribute('data-homoglyph-scanned', 'true');
      
      try {
        const url = new URL(link.href);
        const domain = url.hostname;
        
        // Decode punycode (xn--pple-43d.com -> аpple.com)
        const decodedDomain = punycode.toUnicode(domain);
        
        // Check for non-Latin characters
        if (/[^a-zA-Z0-9.\-]/.test(decodedDomain)) {
          // Highlight the suspicious link
          link.classList.add('homoglyph-suspicious');
          
          // Add a warning tooltip
          link.title = `⚠️ SUSPICIOUS DOMAIN DETECTED\n\nThis link contains non-Latin characters that may be used in phishing attacks.\n\nActual domain: ${decodedDomain}\n\nHover carefully and verify before clicking!`;
          
          // Fire a toast alert (but only once per domain)
          if (!alertedDomains.has(decodedDomain)) {
            alertedDomains.add(decodedDomain);
            showToast(`⚠️ Suspicious domain detected: ${decodedDomain}`, decodedDomain);
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  }

  // Initialize
  function initialize() {
    // Only run on actual HTML pages
    if (document.contentType && !document.contentType.includes('html')) {
      return;
    }
    
    injectStyles();
    scanLinks();
    
    // Keep scanning as content loads dynamically
    const observer = new MutationObserver(() => {
      scanLinks();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🛡️ Homoglyph Shield active');
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
