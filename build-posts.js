#!/usr/bin/env node

/**
 * Static Blog Post Generator
 * Fetches posts from Supabase and generates static HTML files
 * Run: node build-posts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Import NavCover component
const { 
    BASE_URL, 
    getNavCoverStyles, 
    getNavCoverHTML, 
    getNavCoverScript 
} = require('./lib/navcover');

// Supabase config
const SUPABASE_URL = 'https://cvaujkhxgzrqwqjofgls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YXVqa2h4Z3pycXdxam9mZ2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTM3NDYsImV4cCI6MjA4MDM2OTc0Nn0.qbmIu3luDquk734FXko7I2m1qaY6MPA0r6quFJlEmSw';

const BLOG_DIR = path.join(__dirname, 'blog');

// Simple markdown to HTML converter (basic implementation)
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
        // Ordered lists
        .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
        // Blockquotes
        .replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>')
        // Horizontal rules
        .replace(/^---$/gim, '<hr>')
        // Paragraphs (double newlines)
        .replace(/\n\n/g, '</p><p>')
        // Single newlines to <br> within paragraphs
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<h/g, '<h');
    html = html.replace(/<\/h(\d)>\s*<\/p>/g, '</h$1>');
    html = html.replace(/<p>\s*<hr>\s*<\/p>/g, '<hr>');
    html = html.replace(/<p>\s*<pre>/g, '<pre>');
    html = html.replace(/<\/pre>\s*<\/p>/g, '</pre>');
    html = html.replace(/<p>\s*<blockquote>/g, '<blockquote>');
    html = html.replace(/<\/blockquote>\s*<\/p>/g, '</blockquote>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    return html;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
}

function generatePostHtml(post) {
    const renderedContent = markdownToHtml(post.content);
    const wordCount = (post.content || '').trim().split(/\s+/).filter(w => w.length > 0).length;
    const postUrl = `${BASE_URL}/blog/${post.slug}.html`;
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": postUrl,
        "mainEntityOfPage": postUrl,
        "headline": post.title,
        "description": post.excerpt || '',
        "articleBody": post.content || '',
        "datePublished": post.created_at,
        "dateModified": post.updated_at || post.created_at,
        "author": {
            "@type": "Person",
            "name": "Pablo F. Vizcaino",
            "url": BASE_URL
        },
        "publisher": {
            "@type": "Person",
            "name": "Pablo F. Vizcaino",
            "url": BASE_URL
        },
        "image": post.cover_image ? [post.cover_image] : [],
        "inLanguage": "en",
        "wordCount": wordCount
    };

    // Generate NavCover HTML
    const navCoverHtml = getNavCoverHTML({
        currentPage: post.title,
        parentPage: 'Blog',
        parentHref: `${BASE_URL}/#blog`,
        coverImage: post.cover_image || 'https://cvaujkhxgzrqwqjofgls.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_lxos6elxos6elxos_formphotoeditor.com.jpg',
        pageIcon: post.icon || '📝'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - Pablo Vizcaino</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="${(post.excerpt || '').replace(/"/g, '&quot;')}">
    <meta name="author" content="Pablo F. Vizcaino">
    <link rel="canonical" href="${postUrl}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${(post.excerpt || '').replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${post.cover_image || BASE_URL + '/li-pv2-small.png'}">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="${post.created_at}">
    <meta property="article:author" content="Pablo F. Vizcaino">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="twitter:description" content="${(post.excerpt || '').replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${post.cover_image || BASE_URL + '/li-pv2-small.png'}">
    
    <!-- JSON-LD Schema -->
    <script type="application/ld+json">
${JSON.stringify(schema, null, 4)}
    </script>
    
    <style>
        /* ============================================
           NOTION DESIGN SYSTEM - CORE VARIABLES
           ============================================ */
        :root {
            --bg-color: #FFFFFF;
            --fg-color: #37352F;
            --fg-light: #9B9A97;
            --border-color: #E9E9E7;
            --hover-bg: rgba(55, 53, 47, 0.08);
            --callout-bg: #F1F1EF;
            --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        /* Dark Mode */
        body.dark-mode {
            --bg-color: #191919;
            --fg-color: rgba(255, 255, 255, 0.9);
            --fg-light: rgba(255, 255, 255, 0.443);
            --border-color: rgba(255, 255, 255, 0.094);
            --hover-bg: rgba(255, 255, 255, 0.055);
            --callout-bg: #2F2F2F;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: var(--font-main);
            background: var(--bg-color);
            color: var(--fg-color);
            line-height: 1.6;
        }
        
        /* NavCover Styles */
        ${getNavCoverStyles()}
        
        /* Main Container */
        .main-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 96px 100px;
        }
        
        @media (max-width: 768px) {
            .main-container { padding: 0 24px 60px; }
        }
        
        /* Page Title */
        h1.page-title {
            font-weight: 700;
            font-size: 40px;
            line-height: 1.2;
            margin-bottom: 16px;
        }
        
        .meta {
            font-size: 14px;
            color: var(--fg-light);
            margin-bottom: 8px;
        }
        
        .excerpt {
            font-size: 1.1em;
            color: var(--fg-light);
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
        }
        
        /* Content Styles */
        .content h2 {
            font-size: 1.5em;
            font-weight: 600;
            margin: 32px 0 16px;
        }
        
        .content h3 {
            font-size: 1.25em;
            font-weight: 600;
            margin: 24px 0 12px;
        }
        
        .content p {
            margin-bottom: 16px;
        }
        
        .content ul, .content ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        
        .content li {
            margin-bottom: 8px;
        }
        
        .content blockquote {
            border-left: 3px solid var(--fg-color);
            padding-left: 16px;
            margin: 16px 0;
            color: var(--fg-light);
        }
        
        .content code {
            font-family: var(--font-mono);
            background: var(--callout-bg);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        .content pre {
            background: var(--callout-bg);
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 16px 0;
        }
        
        .content pre code {
            background: none;
            padding: 0;
        }
        
        .content a {
            color: var(--fg-color);
            text-decoration: underline;
        }
        
        .content hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 32px 0;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 40px;
            color: var(--fg-light);
            text-decoration: none;
            border-bottom: 1px solid var(--fg-light);
        }
        
        .back-link:hover {
            color: var(--fg-color);
        }
    </style>
</head>
<body class="dark-mode">
    ${navCoverHtml}
    
    <main class="main-container">
        <div class="page-icon">${post.icon || '📝'}</div>
        <p class="meta">${formatDate(post.created_at)}</p>
        <h1 class="page-title">${post.title}</h1>
        ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
        
        <article class="content">
${renderedContent}
        </article>
        
        <a href="${BASE_URL}/#blog" class="back-link">← Back to Blog</a>
    </main>
    
    <script>
        ${getNavCoverScript()}
    </script>
</body>
</html>`;
}

function fetchPosts() {
    return new Promise((resolve, reject) => {
        const url = `${SUPABASE_URL}/rest/v1/posts?published=eq.true&select=*`;
        
        const options = {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function build() {
    console.log('🔨 Building static blog posts...\n');
    
    // Create blog directory if it doesn't exist
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
        console.log('📁 Created /blog directory');
    }
    
    // Fetch posts from Supabase
    console.log('📡 Fetching posts from Supabase...');
    const posts = await fetchPosts();
    
    if (!posts || posts.length === 0) {
        console.log('📭 No published posts found.');
        return;
    }
    
    console.log(`📝 Found ${posts.length} published post(s)\n`);
    
    // Generate HTML for each post
    for (const post of posts) {
        const filename = `${post.slug}.html`;
        const filepath = path.join(BLOG_DIR, filename);
        const html = generatePostHtml(post);
        
        fs.writeFileSync(filepath, html);
        console.log(`✅ Generated: /blog/${filename}`);
    }
    
    // Generate blog index
    const indexHtml = generateBlogIndex(posts);
    fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHtml);
    console.log('✅ Generated: /blog/index.html');
    
    console.log('\n🎉 Build complete!');
    console.log(`   ${posts.length} post(s) generated in /blog/`);
}

function generateBlogIndex(posts) {
    const postCards = posts.map(post => `
        <a href="/blog/${post.slug}.html" class="post-card">
            ${post.cover_image ? `<img src="${post.cover_image}" alt="${post.title}" class="post-cover">` : ''}
            <div class="post-info">
                <span class="post-icon">${post.icon || '📝'}</span>
                <h2>${post.title}</h2>
                <p class="post-date">${formatDate(post.created_at)}</p>
                ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
            </div>
        </a>
    `).join('\n');

    // Generate NavCover HTML for blog index
    const navCoverHtml = getNavCoverHTML({
        currentPage: 'Blog',
        coverImage: 'https://cvaujkhxgzrqwqjofgls.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_lxos6elxos6elxos_formphotoeditor.com.jpg',
        pageIcon: '📝'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Pablo Vizcaino</title>
    <meta name="description" content="Blog posts by Pablo F. Vizcaino on product management, design systems, and operational excellence.">
    <link rel="canonical" href="${BASE_URL}/blog/">
    
    <style>
        /* ============================================
           NOTION DESIGN SYSTEM - CORE VARIABLES
           ============================================ */
        :root {
            --bg-color: #FFFFFF;
            --fg-color: #37352F;
            --fg-light: #9B9A97;
            --border-color: #E9E9E7;
            --hover-bg: rgba(55, 53, 47, 0.08);
            --callout-bg: #F1F1EF;
            --card-shadow: rgba(15, 15, 15, 0.1);
            --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
        
        /* Dark Mode */
        body.dark-mode {
            --bg-color: #191919;
            --fg-color: rgba(255, 255, 255, 0.9);
            --fg-light: rgba(255, 255, 255, 0.443);
            --border-color: rgba(255, 255, 255, 0.094);
            --hover-bg: rgba(255, 255, 255, 0.055);
            --callout-bg: #2F2F2F;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: var(--font-main);
            background: var(--bg-color);
            color: var(--fg-color);
            line-height: 1.6;
        }
        
        /* NavCover Styles */
        ${getNavCoverStyles()}
        
        /* Main Container */
        .main-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 96px 100px;
        }
        
        @media (max-width: 768px) {
            .main-container { padding: 0 24px 60px; }
        }
        
        /* Page Title */
        h1.page-title {
            font-weight: 700;
            font-size: 40px;
            line-height: 1.2;
            margin-bottom: 32px;
        }
        
        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
        }
        
        .post-card {
            text-decoration: none;
            color: inherit;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }
        
        .post-card:hover {
            box-shadow: 0 4px 12px var(--card-shadow);
        }
        
        .post-cover {
            width: 100%;
            height: 160px;
            object-fit: cover;
        }
        
        .post-info {
            padding: 16px;
        }
        
        .post-icon {
            font-size: 24px;
        }
        
        .post-info h2 {
            font-size: 1.1em;
            margin: 8px 0;
        }
        
        .post-date {
            font-size: 12px;
            color: var(--fg-light);
        }
        
        .post-excerpt {
            font-size: 13px;
            color: var(--fg-light);
            margin-top: 8px;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 40px;
            color: var(--fg-light);
            text-decoration: none;
            border-bottom: 1px solid var(--fg-light);
        }
        .back-link:hover {
            color: var(--fg-color);
        }
    </style>
</head>
<body class="dark-mode">
    ${navCoverHtml}
    
    <main class="main-container">
        <div class="page-icon">📝</div>
        <h1 class="page-title">Blog</h1>
        
        <div class="posts-grid">
${postCards}
        </div>
        
        <a href="${BASE_URL}" class="back-link">← Back to Portfolio</a>
    </main>
    
    <script>
        ${getNavCoverScript()}
    </script>
</body>
</html>`;
}

build().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
