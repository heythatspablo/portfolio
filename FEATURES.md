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
