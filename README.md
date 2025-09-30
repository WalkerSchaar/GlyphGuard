##Homoglyph Shield 🛡️

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
**Works Everywhere** - Protects you on all websites, including email  
**Privacy First** - Zero data collection, 100% local processing  
**Lightweight** - Minimal performance impact  

## How It Works

1. Scans link URLs on web pages
2. Decodes punycode-encoded domains (xn--...)
3. Detects non-Latin characters in domain names
4. Highlights suspicious links and shows warnings

## Installation

### From Mozilla Add-ons (Recommended)
[Link will be added after approval]

### Manual Installation (Development)
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
