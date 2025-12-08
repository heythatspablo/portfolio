# Technical Specifications

> Portfolio & Blog Platform — Static Site with Dynamic CMS

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Pages                              │
│                    (Static File Hosting)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   index.html          /blog/*.html         0s9d-2l3j-*.html     │
│   (SPA Portfolio)     (Static Posts)       (Admin Panel)         │
│                                                                  │
└──────────────┬────────────────┬────────────────┬─────────────────┘
               │                │                │
               ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Supabase                                  │
│              (PostgreSQL + REST API + Storage)                    │
├──────────────────────────────────────────────────────────────────┤
│   posts table          blog-images bucket                         │
│   - slug               - cover images                             │
│   - title              - inline images                            │
│   - content (md)                                                  │
│   - excerpt                                                       │
│   - icon                                                          │
│   - published                                                     │
│   - created_at                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Notion Design System

This site replicates Notion's visual language and component library. All styling is custom CSS designed to match Notion's aesthetic.

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Minimalism** | Clean whitespace, no decorative elements |
| **Typography-first** | Content hierarchy via font size/weight only |
| **Subtle interactions** | Light hover states, no flashy animations |
| **Content density** | Compact spacing, scannable layouts |
| **Neutral palette** | Grays + one accent color per context |

### Color System

```css
/* Light Mode (Notion Default) */
--bg-color: #FFFFFF;           /* Page background */
--fg-color: #37352F;           /* Primary text */
--fg-light: #9B9A97;           /* Secondary text, metadata */
--border-color: #E9E9E7;       /* Dividers, borders */
--hover-bg: rgba(55,53,47,0.08); /* Hover states */
--selection: rgba(35,131,226,0.28); /* Text selection */
--callout-bg: #F1F1EF;         /* Callout/code backgrounds */
--code-bg: #F7F6F3;            /* Code block background */

/* Dark Mode */
--bg-color: #191919;
--fg-color: rgba(255,255,255,0.9);
--fg-light: rgba(255,255,255,0.443);
--border-color: rgba(255,255,255,0.094);
--hover-bg: rgba(255,255,255,0.055);
--callout-bg: #2F2F2F;
--code-bg: #262626;
```

### Typography

```css
/* Font Stack (matches Notion exactly) */
--font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, 
             "Apple Color Emoji", Arial, sans-serif;
--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, 
             Courier, monospace;

/* Scale */
Page Title:     40px, weight 700, line-height 1.2
Section Header: 1.875em (h2), weight 600
Subheader:      1.25em (h3), weight 600
Body:           16px, weight 400, line-height 1.5
Metadata:       14px, color var(--fg-light)
Small:          12px
```

---

### Available Components

#### 1. Page Icon

Large emoji or image above page title.

```html
<div class="page-icon">🆔</div>
<div class="page-icon"><img src="avatar.png" alt=""></div>
```

```css
.page-icon {
    font-size: 78px;
    margin-top: -42px;  /* Overlaps cover image */
    margin-bottom: 4px;
}
```

#### 2. Page Title

```html
<h1 class="page-title">Your Title Here</h1>
```

```css
.page-title {
    font-weight: 700;
    font-size: 40px;
    line-height: 1.2;
    margin-bottom: 24px;
}
```

#### 3. Callout Block

Highlighted info box with icon.

```html
<div class="callout">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
        Your callout text here.
    </div>
</div>
```

```css
.callout {
    display: flex;
    background: var(--callout-bg);
    padding: 16px;
    border-radius: 4px;
    margin: 8px 0;
}
.callout-icon {
    font-size: 1.2em;
    margin-right: 12px;
}
```

#### 4. Toggle List (Collapsible)

```html
<details class="notion-toggle">
    <summary>
        <div class="toggle-triangle">▶</div>
        Toggle Header
    </summary>
    <div class="toggle-content">
        Hidden content here.
    </div>
</details>
```

```css
details.notion-toggle { margin: 2px 0; }
.notion-toggle summary {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px 0;
}
.notion-toggle[open] .toggle-triangle {
    transform: rotate(90deg);
}
.toggle-content {
    padding-left: 24px;
}
```

#### 5. Gallery Grid (Cards)

```html
<div class="gallery-grid">
    <div class="gallery-card" onclick="navigateTo('view')">
        <img class="gallery-cover" src="cover.jpg" alt="">
        <div class="gallery-content">
            <div class="gallery-title">Card Title</div>
            <div style="font-size: 12px; color: var(--fg-light);">
                Subtitle
            </div>
        </div>
    </div>
</div>
```

```css
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
}
.gallery-card {
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px var(--card-shadow);
    cursor: pointer;
    transition: box-shadow 0.2s;
}
.gallery-card:hover {
    box-shadow: 0 4px 12px var(--card-shadow);
}
.gallery-cover {
    width: 100%;
    height: 140px;
    object-fit: cover;
}
```

#### 6. Code Block

```html
<div class="code-block">
const example = "code here";
</div>
```

```css
.code-block {
    background: var(--code-bg);
    font-family: var(--font-mono);
    font-size: 14px;
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre;
}
```

#### 7. Divider (Horizontal Rule)

```html
<hr>
```

```css
hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 24px 0;
}
```

#### 8. Two-Column Layout

```html
<div class="notion-row">
    <div class="notion-col">Column 1</div>
    <div class="notion-col">Column 2</div>
</div>
```

```css
.notion-row {
    display: flex;
    gap: 16px;
    margin: 16px 0;
}
.notion-col {
    flex: 1;
}
```

#### 9. Text Link

```html
<a href="#" class="text-link">Link Text →</a>
```

```css
.text-link {
    color: var(--fg-color);
    text-decoration: none;
    border-bottom: 1px solid var(--fg-light);
}
.text-link:hover {
    border-color: var(--fg-color);
}
```

#### 10. Cover Image

Full-width banner at top of page.

```html
<img src="cover.jpg" class="cover-image" alt="">
```

```css
.cover-image {
    width: 100%;
    height: 30vh;
    object-fit: cover;
}
```

#### 11. Breadcrumb Navigation

```html
<div class="breadcrumbs">
    <div class="crumb" onclick="navigateTo('home')">
        <span class="crumb-icon"><img src="avatar.png"></span> 
        Name
    </div>
    <span class="divider">/</span>
    <div class="crumb">Current Page</div>
</div>
```

#### 12. Blockquote

```html
<blockquote>
    Quoted text here.
</blockquote>
```

```css
blockquote {
    border-left: 3px solid var(--fg-color);
    padding-left: 16px;
    margin: 16px 0;
    color: var(--fg-light);
}
```

---

### Component Usage Guidelines

1. **Spacing** — Use multiples of 4px (4, 8, 16, 24, 32, 40)
2. **Border radius** — Always 4px (Notion standard)
3. **Shadows** — Subtle only: `0 1px 3px rgba(0,0,0,0.1)`
4. **Icons** — Prefer emoji over icon fonts
5. **Hover states** — Background change only, no color shifts
6. **Transitions** — 0.2s ease for all interactions
7. **Max width** — Content container: 900px

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Hosting** | GitHub Pages | Static file serving, CDN |
| **Frontend** | Vanilla HTML/CSS/JS | Zero build dependencies |
| **Database** | Supabase (PostgreSQL) | Blog post storage |
| **Storage** | Supabase Storage | Image hosting |
| **Markdown** | Marked.js | Client-side MD rendering |
| **Charts** | Mermaid.js | Gantt charts, diagrams |
| **Build Tool** | Node.js script | Static page generation |

---

## File Structure

```
/
├── index.html                    # Main SPA (portfolio + dynamic blog)
├── 0s9d-2l3j-kj2h31-12kn.html   # Admin panel (obfuscated URL)
├── build-posts.js                # Static blog generator script
├── FEATURES.md                   # This file
│
├── /blog/                        # Static blog posts (SEO/LLM friendly)
│   ├── index.html                # Blog listing page
│   ├── [slug].html               # Individual post pages
│   └── ...
│
├── /images/                      # Static assets
│   ├── pabs_prof_circle@750.png  # Profile headshot
│   ├── li-pv2-small.png          # LinkedIn/OG image
│   ├── port-exp-*.png            # Portfolio thumbnails
│   └── ...
│
└── /Users/...                    # (gitignored local paths)
```

---

## Core Features

### 1. Single Page Application (SPA)

**File:** `index.html`

- Client-side routing via `navigateTo(viewId)` function
- Hash-based navigation (`/#blog`, `/#about`, etc.)
- View sections toggled via CSS class `.active`
- No framework dependencies

**Views:**
- `home-view` — Portfolio homepage
- `about-view` — Bio and experience
- `blog-view` — Dynamic blog listing
- `blogpost-view` — Individual post (dynamic)
- `casestudy-view` — Unfamiliar.id case study
- `outliant-view` — Outliant case study
- `goliath-view` — Goliath case study
- `bloomreach-view` — Bloomreach case study
- `contact-view` — Contact information

---

### 2. Blog System

#### Dynamic Blog (Client-Side)

**Location:** `index.html` (JavaScript section)

```javascript
// Fetches posts from Supabase
const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
```

- Posts fetched on-demand from Supabase REST API
- Markdown rendered client-side via `marked.parse()`
- Requires JavaScript execution

#### Static Blog (Pre-rendered)

**Location:** `/blog/*.html`

**Generator:** `build-posts.js`

```bash
node build-posts.js
```

**Process:**
1. Fetches all published posts from Supabase via HTTPS
2. Converts Markdown to HTML (custom parser)
3. Generates individual `.html` files with full content
4. Creates `/blog/index.html` listing page
5. Embeds JSON-LD schema in each page

**Benefits:**
- SEO crawlable
- LLM readable (no JS required)
- Fast initial load
- Works without JavaScript

---

### 3. Admin Panel

**File:** `0s9d-2l3j-kj2h31-12kn.html`

**Access:** Password protected (client-side)

**Features:**
- Create/Edit/Delete blog posts
- Markdown editor with live preview
- Image upload to Supabase Storage
- Publish/Unpublish toggle
- Post filtering (All/Published/Drafts)

**Authentication:**
- Simple password check (stored in JS constant)
- Session stored in `sessionStorage`
- No server-side auth (Supabase anon key)

**Database Operations:**
```javascript
// Create
await supabase.from('posts').insert({ ... });

// Update
await supabase.from('posts').update({ ... }).eq('id', id);

// Delete
await supabase.from('posts').delete().eq('id', id);
```

---

### 4. Database Schema

**Platform:** Supabase (PostgreSQL)

**Table:** `posts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `slug` | text | URL-friendly identifier |
| `title` | text | Post title |
| `content` | text | Markdown content |
| `excerpt` | text | Short description |
| `icon` | text | Emoji icon |
| `cover_image` | text | URL to cover image |
| `published` | boolean | Publication status |
| `created_at` | timestamp | Creation date |
| `updated_at` | timestamp | Last modified |

**Storage Bucket:** `blog-images`
- Public read access
- Used for cover images and inline images

---

### 5. SEO & Structured Data

#### Meta Tags

```html
<meta name="description" content="...">
<meta name="author" content="Pablo F. Vizcaino">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
<meta name="twitter:card" content="summary_large_image">
```

#### JSON-LD Schema (Homepage)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Person", ... },
    { "@type": "WebSite", ... },
    { "@type": "ProfilePage", ... }
  ]
}
```

#### JSON-LD Schema (Blog Posts)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "author": { "@type": "Person", ... },
  "datePublished": "...",
  "wordCount": 1234
}
```

---

### 6. Theming

**Default:** Dark mode

**Implementation:**
```javascript
// Set on page load
document.body.classList.add('dark-mode');
```

**Toggle:**
```javascript
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}
```

**CSS Variables:**
```css
:root {
    --bg-color: #FFFFFF;
    --fg-color: #37352F;
    /* ... */
}

body.dark-mode {
    --bg-color: #191919;
    --fg-color: rgba(255, 255, 255, 0.9);
    /* ... */
}
```

---

### 7. Deployment Workflow

#### GitHub Pages

**Repository:** `heythatspablo/portfolio`

**Branch:** `main`

**Auto-deploy:** On push to `main`

#### Workflow

```
1. Edit content locally
2. Run `node build-posts.js` (if blog posts changed)
3. git add -A
4. git commit -m "message"
5. git push
6. GitHub Pages auto-deploys (~1-2 min)
```

#### Domain

- **Custom domain:** `99pablos.com`
- **SSL:** Provided by GitHub Pages

---

## External Dependencies

### CDN Libraries

| Library | Version | CDN |
|---------|---------|-----|
| Supabase JS | v2 | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` |
| Marked.js | latest | `cdn.jsdelivr.net/npm/marked/marked.min.js` |
| Mermaid.js | latest | `cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js` |

### Supabase Configuration

```javascript
const SUPABASE_URL = 'https://cvaujkhxgzrqwqjofgls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...'; // Public anon key
```

---

## Security Considerations

| Aspect | Implementation | Notes |
|--------|----------------|-------|
| Admin URL | Obfuscated path | Not `/admin` |
| Admin Auth | Client-side password | Not secure for sensitive data |
| Supabase Key | Anon (public) key | Row-level security recommended |
| Image Upload | Public bucket | Anyone with URL can view |

**Recommendations for Production:**
- Implement Supabase Row Level Security (RLS)
- Use Supabase Auth for admin panel
- Move admin password to environment variable
- Add rate limiting on Supabase

---

## Performance

| Metric | Value |
|--------|-------|
| Main HTML | ~50KB (uncompressed) |
| Static blog post | ~10-15KB each |
| External JS | ~100KB (CDN cached) |
| Images | Varies (Supabase CDN) |

**Optimizations:**
- No build step required
- CDN-hosted dependencies
- Static blog pages for instant load
- CSS variables for theming (no reflow)

---

## Browser Support

- Modern browsers (ES6+)
- Chrome, Firefox, Safari, Edge
- Mobile responsive (CSS media queries)
- Dark mode respects `prefers-color-scheme` in static pages

---

## Local Development

```bash
# Clone repository
git clone git@github.com:heythatspablo/portfolio.git
cd portfolio

# Serve locally (any static server)
python -m http.server 8000
# or
npx serve .

# Regenerate static blog posts
node build-posts.js

# Deploy
git add -A && git commit -m "Update" && git push
```

---

## Future Enhancements

- [ ] RSS feed generation
- [ ] Sitemap.xml generation
- [ ] Search functionality
- [ ] Comments system (Supabase or third-party)
- [ ] Analytics integration
- [ ] Automated build via GitHub Actions
- [ ] Image optimization pipeline
