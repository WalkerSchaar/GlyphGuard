/*!
 * GlyphGuard - Comprehensive Homoglyph Detection
 * Protects against phishing attacks using lookalike characters
 * 
 * Features:
 * - Link URL scanning
 * - Email subject line scanning
 * - Sender name scanning
 * - Email body text scanning
 * 
 * Privacy: All scanning happens locally. No data is collected or transmitted.
 * License: MIT
 */

(function() {
  'use strict';
  
  // Prevent multiple injections on the same page
  if (window.glyphGuardActive) {
    return;
  }
  window.glyphGuardActive = true;

  // Track alerted domains/text to prevent duplicate toast notifications
  const alertedItems = new Set();

  // High-value words commonly used in phishing emails
  const SUSPICIOUS_KEYWORDS = [
    'confidential', 'urgent', 'verify', 'account', 'security', 'alert',
    'statement', 'invoice', 'payment', 'suspended', 'locked', 'expire',
    'document', 'ticket', 'notification', 'action required', 'confirm',
    'update', 'billing', 'password', 'login', 'signin', 'verify',
    'unusual', 'activity', 'review', 'important', 'immediate'
  ];

  // Major brands/platforms often impersonated in phishing
  const BRAND_NAMES = [
    'paypal', 'apple', 'google', 'microsoft', 'amazon', 'facebook',
    'docusign', 'adobe', 'dropbox', 'wetransfer', 'hellosign',
    'instagram', 'twitter', 'linkedin', 'netflix', 'spotify',
    'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'usbank'
  ];

  /**
   * Inject CSS styles for visual indicators and toast notifications
   */
  function injectStyles() {
    if (document.getElementById('glyphguard-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'glyphguard-styles';
    style.textContent = `
      /* Suspicious link highlighting */
      .glyphguard-suspicious-link {
        background-color: #fef3c7 !important;
        border: 2px solid #f59e0b !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1) !important;
      }
      
      /* Suspicious text highlighting */
      .glyphguard-suspicious-text {
        background-color: #fee2e2 !important;
        border: 2px solid #dc2626 !important;
        border-radius: 4px !important;
        padding: 8px !important;
        margin: 4px 0 !important;
      }
      
      /* Warning banner above suspicious content */
      .glyphguard-warning-banner {
        background: #dc2626 !important;
        color: white !important;
        padding: 12px 16px !important;
        margin: 8px 0 !important;
        border-radius: 4px !important;
        font-weight: bold !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
      
      /* Toast notification container */
      .glyphguard-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2147483647;
        max-width: 400px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: glyphguardSlideIn 0.3s ease-out;
        word-wrap: break-word;
      }
      
      /* Toast severity levels */
      .glyphguard-toast-critical {
        background: #991b1b;
        border: 2px solid #dc2626;
      }
      
      .glyphguard-toast-high {
        background: #dc2626;
      }
      
      .glyphguard-toast-medium {
        background: #ea580c;
      }
      
      /* Close button for toast */
      .glyphguard-toast-close {
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
      
      .glyphguard-toast-close:hover {
        opacity: 0.8;
      }
      
      /* Slide-in animation */
      @keyframes glyphguardSlideIn {
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
      @keyframes glyphguardSlideOut {
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
   * Display a toast notification
   * @param {string} message - The warning message to display
   * @param {string} itemId - Unique identifier (prevents duplicates)
   * @param {string} severity - 'critical', 'high', or 'medium'
   */
  function showToast(message, itemId, severity = 'high') {
    // Check if toast already exists for this item
    if (document.querySelector(`[data-toast-for="${CSS.escape(itemId)}"]`)) {
      return;
    }
    
    const toast = document.createElement('div');
    toast.setAttribute('data-toast-for', itemId);
    toast.className = `glyphguard-toast glyphguard-toast-${severity}`;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'glyphguard-toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.onclick = () => {
      toast.style.animation = 'glyphguardSlideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    };
    
    // Create message text
    const messageText = document.createElement('div');
    messageText.textContent = message;
    
    toast.appendChild(closeBtn);
    toast.appendChild(messageText);
    document.body.appendChild(toast);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'glyphguardSlideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Check if text contains suspicious keywords or brand names
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  function containsSuspiciousKeywords(text) {
    const lowerText = text.toLowerCase();
    return SUSPICIOUS_KEYWORDS.some(keyword => lowerText.includes(keyword)) ||
           BRAND_NAMES.some(brand => lowerText.includes(brand));
  }

  /**
   * Find words in text that contain homoglyphs
   * @param {string} text - Text to analyze
   * @returns {Array} Array of suspicious words
   */
  function findSuspiciousWords(text) {
    const words = text.split(/\s+/);
    const suspicious = [];
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      
      // Check if this word matches a suspicious keyword/brand
      const matchesKeyword = SUSPICIOUS_KEYWORDS.some(k => lowerWord.includes(k)) ||
                            BRAND_NAMES.some(b => lowerWord.includes(b));
      
      // If it matches AND contains non-Latin characters, flag it
      if (matchesKeyword && /[^a-zA-Z0-9.\-\s,;:!?'"()[\]{}]/.test(word)) {
        suspicious.push(word);
      }
    });
    
    return suspicious;
  }

  /**
   * Scan and flag suspicious text content
   * @param {Element} element - DOM element to check
   * @param {string} location - Description of where this text appears
   */
  function checkTextForHomoglyphs(element, location) {
    if (!element || !element.textContent) return;
    
    const text = element.textContent.trim();
    if (!text) return;
    
    // Skip if already scanned
    if (element.hasAttribute('data-glyphguard-scanned')) {
      return;
    }
    element.setAttribute('data-glyphguard-scanned', 'true');
    
    // First check: Does it contain suspicious keywords/brands?
    if (!containsSuspiciousKeywords(text)) {
      return;
    }
    
    // Second check: Do those keywords contain non-Latin characters?
    const suspiciousWords = findSuspiciousWords(text);
    
    if (suspiciousWords.length > 0) {
      // Highlight the element
      element.classList.add('glyphguard-suspicious-text');
      
      // Add warning banner before the element
      const warning = document.createElement('div');
      warning.className = 'glyphguard-warning-banner';
      warning.textContent = `⚠️ GLYPHGUARD WARNING: Suspicious characters detected in ${location}`;
      element.insertAdjacentElement('beforebegin', warning);
      
      // Create unique ID for this alert
      const alertId = `text-${location}-${suspiciousWords.join('-')}`;
      
      // Show toast if not already alerted
      if (!alertedItems.has(alertId)) {
        alertedItems.add(alertId);
        showToast(
          `🚨 PHISHING WARNING: ${location} contains suspicious homoglyph characters!\n\nSuspicious words: ${suspiciousWords.join(', ')}`,
          alertId,
          'critical'
        );
      }
    }
  }

  /**
   * Scan email subject lines for homoglyphs
   */
  function scanEmailSubjects() {
    // Common selectors for email subjects across different platforms
    const subjectSelectors = [
      'h2[data-legacy-subject]', // Gmail
      '.iw > h2', // Gmail
      'h1.subject', // Outlook
      '.subject', // Generic
      '[role="heading"][aria-label*="Subject"]',
      '[data-subject]',
      '.email-subject',
      '.message-subject'
    ];
    
    subjectSelectors.forEach(selector => {
      const subjects = document.querySelectorAll(selector);
      subjects.forEach(subject => {
        checkTextForHomoglyphs(subject, 'EMAIL SUBJECT');
      });
    });
  }

  /**
   * Scan sender names/display names for homoglyphs
   */
  function scanSenderNames() {
    // Common selectors for sender names
    const senderSelectors = [
      '.gD', // Gmail sender name
      '.sender-name',
      '.from-name',
      '[data-sender]',
      '.message-author',
      '.email-sender',
      'span[email]' // Gmail
    ];
    
    senderSelectors.forEach(selector => {
      const senders = document.querySelectorAll(selector);
      senders.forEach(sender => {
        checkTextForHomoglyphs(sender, 'SENDER NAME');
      });
    });
  }

  /**
   * Scan email body text for homoglyphs (first paragraph only)
   */
  function scanEmailBody() {
    // Common selectors for email body
    const bodySelectors = [
      '.a3s.aiL', // Gmail message body
      '.ii.gt', // Gmail expanded message
      '.email-body',
      '.message-body',
      '.mail-body',
      '[role="article"]',
      '.message-content'
    ];
    
    bodySelectors.forEach(selector => {
      const bodies = document.querySelectorAll(selector);
      bodies.forEach(body => {
        if (body.hasAttribute('data-glyphguard-body-scanned')) {
          return;
        }
        body.setAttribute('data-glyphguard-body-scanned', 'true');
        
        // Only scan first paragraph to avoid false positives in long emails
        const firstParagraph = body.querySelector('p') || body.querySelector('div');
        if (firstParagraph) {
          checkTextForHomoglyphs(firstParagraph, 'EMAIL BODY');
        }
      });
    });
  }

  /**
   * Scan all links on the page for homoglyph domains
   */
  function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      // Skip if already scanned
      if (link.hasAttribute('data-glyphguard-link-scanned')) {
        return;
      }
      link.setAttribute('data-glyphguard-link-scanned', 'true');
      
      try {
        const url = new URL(link.href);
        const domain = url.hostname;
        
        // Skip local/special URLs
        if (!domain || domain === 'localhost' || domain.startsWith('127.') || 
            domain.startsWith('192.168.') || domain.startsWith('10.')) {
          return;
        }
        
        // Decode punycode-encoded domains (e.g., xn--pple-43d.com → аpple.com)
        const decodedDomain = punycode.toUnicode(domain);
        
        // Check for non-Latin characters
        if (/[^a-zA-Z0-9.\-]/.test(decodedDomain)) {
          // Highlight the suspicious link
          link.classList.add('glyphguard-suspicious-link');
          
          // Add detailed warning tooltip
          const tooltipText = 
            `⚠️ GLYPHGUARD: SUSPICIOUS DOMAIN DETECTED\n\n` +
            `This link contains non-Latin characters that may be used in phishing attacks.\n\n` +
            `Displayed domain: ${domain}\n` +
            `Actual domain: ${decodedDomain}\n\n` +
            `Verify the destination carefully before clicking!`;
          
          link.title = tooltipText;
          
          // Show toast notification (once per unique domain)
          if (!alertedItems.has(decodedDomain)) {
            alertedItems.add(decodedDomain);
            showToast(
              `⚠️ Suspicious link detected: ${decodedDomain}`,
              decodedDomain,
              'high'
            );
          }
        }
      } catch (e) {
        // Ignore invalid URLs or parsing errors
      }
    });
  }

  /**
   * Run all scanning functions
   */
  function runAllScans() {
    scanLinks();
    scanEmailSubjects();
    scanSenderNames();
    scanEmailBody();
  }

  /**
   * Initialize GlyphGuard
   */
  function initialize() {
    // Only run on HTML pages
    if (document.contentType && !document.contentType.includes('html')) {
      return;
    }
    
    // Inject styles first
    injectStyles();
    
    // Run initial scan
    runAllScans();
    
    // Set up observer to scan dynamically loaded content
    const observer = new MutationObserver(() => {
      runAllScans();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🛡️ GlyphGuard active - Comprehensive homoglyph protection enabled');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
