# Mid-Mortem: Iframe Rendering Issue

**Date:** 2026-01-06  
**Issue:** Iframe HTML renders in blog editor preview but displays as escaped text on live site  
**Status:** UNRESOLVED - Multiple attempted fixes have failed

---

## Problem Statement

User pasted this iframe code into blog post markdown:
```html
<div style="position:relative;height:0;width:100%;padding-bottom:62.5%">
  <iframe src="https://sendspark.com/embed/xo7qei8kuqv1gjygaw98sjlajify63ll" 
          frameBorder="0" 
          style="position:absolute;width:100%;height:100%;border-radius:6px;left:0;top:0" 
          allowfullscreen="">
  </iframe>
</div>
```

**Expected:** Iframe renders as video player  
**Actual:** HTML displays as escaped text: `&lt;div style=...`

---

## Root Cause Analysis

### What We Know:
1. **Preview works** - Blog editor (`0s9d-2l3j-kj2h31-12kn.html:615`) uses `marked.parse()` and renders correctly
2. **Frontend fails** - Live site (`index.html:1370`) uses same `marked.parse()` but escapes HTML
3. **Marked.js version** - Site loads v15.0.12 from CDN
4. **Deployment** - Netlify auto-deploys from GitHub main branch

### What's Happening:
- Marked.js v15 **does NOT sanitize HTML by default** (confirmed from docs)
- The HTML is being **escaped during markdown parsing**, not sanitization
- Marked treats inline HTML as literal text unless it's in a proper HTML block format
- In markdown, HTML blocks need blank lines before/after to be recognized as raw HTML

### The Real Issue:
**Markdown HTML block rules:** For HTML to be rendered (not escaped), it must:
1. Start at the beginning of a line
2. Have blank lines before and after
3. Not be indented
4. Be a block-level element

The user's iframe div is likely **not formatted as a proper markdown HTML block** in the database.

---

## Attempted Fixes (All Failed)

### Fix #1: Configure marked with `sanitize: false`
- **Commit:** 467cfa9
- **Result:** FAILED - `sanitize` option is deprecated/ignored in v15

### Fix #2: Use `marked.use()` with custom renderer
- **Commit:** 8013777
- **Result:** FAILED - Custom HTML renderer not being called

### Fix #3: Simplify to `marked.setOptions()`
- **Commit:** 22549b5, b97d7b0
- **Result:** FAILED - Options not affecting HTML escaping

### Fix #4: HTML block protection regex workaround
- **Commit:** 1895cb4
- **Pattern:** `/^(<[^>]+>.*?<\/[^>]+>)$/gm`
- **Result:** UNKNOWN - May be causing browser crashes
- **Problem:** Regex may not match multi-line HTML blocks

---

## Deployment Issues

### Cache Problems:
- Browser caching aggressive (1 year cache on JS files)
- Hard refresh not working consistently
- User not seeing latest deployments
- Console logs with timestamps not appearing

### Verification Needed:
- Confirm deployments are actually reaching Netlify
- Check if Netlify build is succeeding
- Verify cache-busting is working

---

## Next Steps (Priority Order)

### IMMEDIATE:
1. **Revert breaking change** - Remove regex workaround causing crashes
2. **Check actual database content** - See exact format of stored HTML
3. **Test in local environment** - Reproduce issue without cache problems

### ROOT FIX:
4. **Fix at source** - Ensure HTML is stored with proper markdown formatting:
   ```markdown
   
   <div style="...">
     <iframe ...></iframe>
   </div>
   
   ```
   (Note blank lines before/after)

5. **Alternative approach** - Use a custom markdown extension or bypass marked entirely for HTML blocks

### VERIFICATION:
6. **Add cache-busting** - Version query params on index.html
7. **Check Netlify deploy logs** - Confirm builds are succeeding
8. **Test in incognito** - Eliminate cache as variable

---

## Technical Debt Created

- Multiple failed marked.js configurations in codebase
- Console logging pollution for debugging
- Potential regex workaround causing instability
- No proper HTML block handling strategy

---

## Lessons Learned (So Far)

1. **Marked.js v15 changed significantly** - Old configuration patterns don't work
2. **Markdown HTML block rules are strict** - Inline HTML gets escaped
3. **Aggressive caching breaks iteration speed** - Can't verify fixes quickly
4. **Need local testing environment** - Can't rely on live deployments for debugging

---

## Questions to Answer

1. What is the EXACT content stored in Supabase `posts.content` field?
2. Is the HTML on a single line or multiple lines?
3. Are there blank lines before/after the HTML in the database?
4. Why isn't the preview having the same issue?
5. Is the latest code actually deployed or is cache blocking it?

---

## Recommended Path Forward

**STOP trying configuration fixes.** They're not working.

**START with data inspection:**
1. Query Supabase directly to see raw content
2. Test marked.parse() locally with exact database content
3. Understand why preview works but frontend doesn't
4. Fix the data format, not the parser configuration
