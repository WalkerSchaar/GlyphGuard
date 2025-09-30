/*!
 * Homoglyph Shield - Link Scanner
 * Detects homoglyph phishing attacks in domain names
 * 
 * This extension scans links on web pages for non-Latin characters
 * that may be used in homoglyph attacks (lookalike character substitutions).
 * 
 * Privacy: All scanning happens locally. No data is collected or transmitted.
 * License: MIT
 */

(function() {
  'use strict';
  
  // Prevent multiple injections on the same page
  if (window.homoglyphShieldActive) {
    return;
  }
  window.homoglyphShieldActive = true;

  // Track alerted domains to prevent duplicate toast notifications
  const alertedDomains = new Set();

  /**
   * Inject CSS styles for visual indicators and toast notifications
   */
  function injectStyles() {
    if (document.getElementById('homoglyph-shield-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'homoglyph-shield-styles';
    style.textContent = `
      /* Suspicious link highlighting */
      .homoglyph-suspicious {
        background-color: #fef3c7 !important;
        border: 2px solid #f59e0b !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1) !important;
      }
      
      /* Toast notification container */
      .homoglyph-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2147483647; /* Maximum z-index for visibility */
        max-width: 400px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: homoglyphSlideIn 0.3s ease-out;
        word-wrap: break-word;
      }
      
      /* Close button for toast */
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
        font-weight: bold;
      }
      
      .homoglyph-toast-close:hover {
        opacity: 0.8;
      }
      
      /* Slide-in animation */
      @keyframes homoglyphSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Slide-out animation */
      @keyframes homoglyphSlideOut {
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

  /**
   * Display a toast notification for suspicious domains
   * @param {string} message - The warning message to display
   * @param {string} domainId - Unique identifier for the domain (prevents duplicates)
   */
  function showToast(message, domainId) {
    // Check if toast already exists for this domain
    if (document.querySelector(`[data-toast-for="${CSS.escape(domainId)}"]`)) {
      return;
    }
    
    const toast = document.createElement('div');
    toast.setAttribute('data-toast-for', domainId);
    toast.className = 'homoglyph-toast';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'homoglyph-toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.onclick = () => {
      toast.style.animation = 'homoglyphSlideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    };
    
    // Create message text
    const messageText = document.createElement('div');
    messageText.textContent = message;
    
    toast.appendChild(closeBtn);
    toast.appendChild(messageText);
    document.body.appendChild(toast);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'homoglyphSlideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }
    }, 8000);
  }

  /**
   * Scan all links on the page for homoglyph attacks
   * Checks for non-Latin characters in decoded domain names
   */
  function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      // Skip if already scanned (prevents duplicate processing)
      if (link.hasAttribute('data-homoglyph-scanned')) {
        return;
      }
      link.setAttribute('data-homoglyph-scanned', 'true');
      
      try {
        const url = new URL(link.href);
        const domain = url.hostname;
        
        // Skip local/special URLs
        if (!domain || domain === 'localhost' || domain.startsWith('127.') || domain.startsWith('192.168.')) {
          return;
        }
        
        // Decode punycode-encoded domains (e.g., xn--pple-43d.com -> аpple.com)
        // This reveals hidden non-Latin characters
        const decodedDomain = punycode.toUnicode(domain);
        
        // Check for non-Latin characters using regex
        // Pattern matches anything that's NOT: a-z, A-Z, 0-9, dot, or hyphen
        if (/[^a-zA-Z0-9.\-]/.test(decodedDomain)) {
          // Highlight the suspicious link
          link.classList.add('homoglyph-suspicious');
          
          // Add detailed warning tooltip
          const tooltipText = 
            `⚠️ SUSPICIOUS DOMAIN DETECTED\n\n` +
            `This link contains non-Latin characters that may be used in phishing attacks.\n\n` +
            `Displayed domain: ${domain}\n` +
            `Actual domain: ${decodedDomain}\n\n` +
            `Verify the destination carefully before clicking!`;
          
          link.title = tooltipText;
          
          // Show toast notification (once per unique domain)
          if (!alertedDomains.has(decodedDomain)) {
            alertedDomains.add(decodedDomain);
            showToast(
              `⚠️ Suspicious domain detected: ${decodedDomain}`,
              decodedDomain
            );
          }
        }
      } catch (e) {
        // Ignore invalid URLs or parsing errors
        // Common for relative URLs, javascript:, mailto:, etc.
      }
    });
  }

  /**
   * Initialize the extension
   */
  function initialize() {
    // Only run on HTML pages (skip PDFs, images, etc.)
    if (document.contentType && !document.contentType.includes('html')) {
      return;
    }
    
    // Inject styles first
    injectStyles();
    
    // Run initial scan
    scanLinks();
    
    // Set up observer to scan dynamically loaded content
    // This is essential for single-page apps and infinite scroll
    const observer = new MutationObserver(() => {
      scanLinks();
    });
    
    observer.observe(document.body, {
      childList: true,    // Watch for added/removed nodes
      subtree: true       // Watch entire subtree
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
