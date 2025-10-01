### GlyphGuard 🛡️

Protect yourself from homoglyph phishing attacks that use lookalike characters!


Attackers use non-Latin characters that look identical to Latin letters. For example:
- `pаypal.com` (Cyrillic 'а' instead of Latin 'a')
- `аpple.com` (Cyrillic 'а' instead of Latin 'a')
- `gооgle.com` (Cyrillic 'о' instead of Latin 'o')

These domains look legitimate but lead to phishing sites.

## Features

**Automatic Detection** - Scans all links on every webpage  
**Real-Time Alerts** - Toast notifications for suspicious domains  
**Visual Warnings** - Highlights dangerous links in yellow
**Sender Name Protection** - Catches fake display names
**Body Text Analysis** - Identifies brand impersonation
**Privacy First** - Zero data collection, 100% local processing  
**Lightweight** - Minimal performance impact  

## How It Works

### 1. Link Scanning
- Scans all `<a href>` tags
- Decodes punycode domains
- Detects non-Latin characters
- Highlights suspicious links

### 2. Text Scanning
- Monitors email subjects, sender names, and body text
- Checks for security-related keywords (e.g., "urgent", "verify", "confidential")
- Checks for brand names (e.g., "PayPal", "Apple", "Google")
- Only flags when keywords contain non-Latin characters
- Minimal false positives

### 3. Visual Alerts
- Yellow highlighting for suspicious links
- Red highlighting for suspicious text
- Warning banners above flagged content
- Toast notifications in top-right corner


### Manual Installation 
1. Clone this repository
2. Download `punycode.js` from the CDN (see instructions)
3. Open Firefox → `about:debugging` → Load Temporary Add-on
4. Select `manifest.json`

## Privacy

**This extension collects ZERO data.**
- No browsing history
- No personal information  
- No external connections
- All scanning happens locally
