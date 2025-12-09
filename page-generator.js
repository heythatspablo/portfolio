#!/usr/bin/env node

/**
 * Notion-Style Page Generator
 * 
 * Generates static HTML pages following Notion design principles.
 * 
 * Usage:
 *   node page-generator.js <config-file.json>
 *   node page-generator.js --example  (outputs example config)
 * 
 * Config file defines page structure using Notion-style blocks.
 */

const fs = require('fs');
const path = require('path');

// Import NavCover component
const { 
    BASE_URL,
    DEFAULT_COVER,
    getNavCoverStyles, 
    getNavCoverHTML, 
    getNavCoverScript 
} = require('./lib/navcover');

// ============================================================================
// NOTION BLOCK RENDERERS
// ============================================================================

const BlockRenderers = {
    
    // Cover Image (full-width banner)
    cover: (block) => {
        if (block.gradient) {
            return `<div class="cover-image" style="background: ${block.gradient}; height: 30vh;"></div>`;
        }
        return `<img src="${block.src}" class="cover-image" alt="${block.alt || ''}">`;
    },

    // Page Icon (emoji or image)
    icon: (block) => {
        if (block.type === 'none') return '';
        if (block.type === 'image') {
            return `<div class="page-icon"><img src="${block.src}" alt=""></div>`;
        }
        return `<div class="page-icon">${block.emoji}</div>`;
    },

    // Heading 1 (Page Title)
    h1: (block) => {
        const style = block.style ? ` style="${block.style}"` : '';
        return `<h1 class="page-title"${style}>${block.text}</h1>`;
    },

    // Heading 2 (Section Header)
    h2: (block) => {
        const style = block.style ? ` style="${block.style}"` : '';
        return `<h2${style}>${block.text}</h2>`;
    },

    // Heading 3 (Subheader)
    h3: (block) => {
        const style = block.style ? ` style="${block.style}"` : '';
        return `<h3${style}>${block.text}</h3>`;
    },

    // Paragraph
    paragraph: (block) => {
        const style = block.style ? ` style="${block.style}"` : '';
        return `<p${style}>${processInlineFormatting(block.text)}</p>`;
    },

    // Callout Block
    callout: (block) => {
        const icon = block.icon ? `<div class="callout-icon">${block.icon}</div>` : '';
        const bgStyle = block.background ? ` style="background: ${block.background};"` : '';
        const content = Array.isArray(block.content) 
            ? block.content.map(renderBlock).join('\n')
            : `<div class="callout-content">${processInlineFormatting(block.content)}</div>`;
        return `<div class="callout"${bgStyle}>${icon}${content}</div>`;
    },

    // Bullet List
    bulletList: (block) => {
        const items = block.items.map(item => {
            if (typeof item === 'string') {
                return `<li>${processInlineFormatting(item)}</li>`;
            }
            // Item with bold lead-in
            return `<li><strong>${item.lead}</strong>${item.text ? ' — ' + item.text : ''}</li>`;
        }).join('\n');
        return `<ul>\n${items}\n</ul>`;
    },

    // Numbered List
    numberedList: (block) => {
        const items = block.items.map(item => {
            if (typeof item === 'string') {
                return `<li>${processInlineFormatting(item)}</li>`;
            }
            return `<li><strong>${item.lead}</strong>${item.text ? ' — ' + item.text : ''}</li>`;
        }).join('\n');
        return `<ol>\n${items}\n</ol>`;
    },

    // Quote Block
    quote: (block) => {
        const attribution = block.attribution ? `<cite>— ${block.attribution}</cite>` : '';
        return `<blockquote>${processInlineFormatting(block.text)}${attribution}</blockquote>`;
    },

    // Divider
    divider: () => '<hr>',

    // Two-Column Layout
    columns: (block) => {
        const cols = block.columns.map(col => {
            const content = col.blocks.map(renderBlock).join('\n');
            const style = col.style ? ` style="${col.style}"` : '';
            return `<div class="notion-col"${style}>\n${content}\n</div>`;
        }).join('\n');
        return `<div class="notion-row">\n${cols}\n</div>`;
    },

    // Three-Column Layout
    threeColumns: (block) => {
        const cols = block.columns.map(col => {
            const content = col.blocks.map(renderBlock).join('\n');
            return `<div class="notion-col-3">\n${content}\n</div>`;
        }).join('\n');
        return `<div class="notion-row-3">\n${cols}\n</div>`;
    },

    // Toggle (Collapsible)
    toggle: (block) => {
        const content = Array.isArray(block.content)
            ? block.content.map(renderBlock).join('\n')
            : `<p>${processInlineFormatting(block.content)}</p>`;
        return `
<details class="notion-toggle">
    <summary>
        <div class="toggle-triangle">▶</div>
        <span>${block.title}</span>
    </summary>
    <div class="toggle-content">
        ${content}
    </div>
</details>`;
    },

    // Numbered Toggle (for process steps)
    numberedToggle: (block) => {
        const content = Array.isArray(block.content)
            ? block.content.map(renderBlock).join('\n')
            : `<p>${processInlineFormatting(block.content)}</p>`;
        return `
<details class="notion-toggle numbered-toggle">
    <summary>
        <div class="toggle-number">${block.number}</div>
        <span>${block.title}</span>
    </summary>
    <div class="toggle-content">
        ${content}
    </div>
</details>`;
    },

    // Button (CTA)
    button: (block) => {
        const style = block.style || 'primary';
        return `<a href="${block.href}" class="notion-button ${style}" target="${block.target || '_self'}">${block.text}</a>`;
    },

    // Link (inline text link)
    link: (block) => {
        return `<a href="${block.href}" class="text-link">${block.text}</a>`;
    },

    // Code Block
    code: (block) => {
        return `<div class="code-block">${escapeHtml(block.code)}</div>`;
    },

    // Image
    image: (block) => {
        const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : '';
        return `<figure class="notion-image"><img src="${block.src}" alt="${block.alt || ''}">${caption}</figure>`;
    },

    // Gallery Grid
    gallery: (block) => {
        const cards = block.cards.map(card => `
<div class="gallery-card"${card.href ? ` onclick="window.location='${card.href}'"` : ''}>
    ${card.cover ? `<img class="gallery-cover" src="${card.cover}" alt="${card.title}">` : ''}
    <div class="gallery-content">
        <div class="gallery-title">${card.icon || ''} ${card.title}</div>
        ${card.subtitle ? `<div class="gallery-subtitle">${card.subtitle}</div>` : ''}
        ${card.description ? `<div class="gallery-description">${card.description}</div>` : ''}
    </div>
</div>`).join('\n');
        return `<div class="gallery-grid">\n${cards}\n</div>`;
    },

    // Table of Contents
    toc: (block) => {
        return `<nav class="notion-toc"><div class="toc-title">On this page</div><div id="toc-links"></div></nav>`;
    },

    // Spacer
    spacer: (block) => {
        const height = block.height || '24px';
        return `<div style="height: ${height};"></div>`;
    },

    // Centered container
    centered: (block) => {
        const content = block.blocks.map(renderBlock).join('\n');
        return `<div class="centered-block">\n${content}\n</div>`;
    },

    // Raw HTML (escape hatch)
    html: (block) => block.content
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function processInlineFormatting(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-link">$1</a>');
}

function renderBlock(block) {
    const renderer = BlockRenderers[block.type];
    if (!renderer) {
        console.warn(`Unknown block type: ${block.type}`);
        return `<!-- Unknown block type: ${block.type} -->`;
    }
    return renderer(block);
}

// ============================================================================
// PAGE TEMPLATE
// ============================================================================

function generatePage(config) {
    const blocks = config.blocks.map(renderBlock).join('\n\n');
    
    // Determine cover image/gradient
    let coverImage = DEFAULT_COVER;
    let coverGradient = null;
    if (config.cover) {
        if (config.cover.gradient) {
            coverGradient = config.cover.gradient;
        } else if (config.cover.src) {
            coverImage = config.cover.src;
        }
    }
    
    // Determine page icon
    let pageIcon = 'image'; // default to profile image
    let pageIconImage = null;
    if (config.icon) {
        if (config.icon.type === 'none') {
            pageIcon = null;
        } else if (config.icon.emoji) {
            pageIcon = config.icon.emoji;
        } else if (config.icon.type === 'image' && config.icon.src) {
            pageIcon = 'image';
            pageIconImage = config.icon.src;
        }
    }
    
    // Generate NavCover HTML
    const navCoverHtml = getNavCoverHTML({
        currentPage: config.breadcrumb || config.title,
        parentPage: config.parentPage || null,
        parentHref: config.parentHref || null,
        coverImage: coverImage,
        coverGradient: coverGradient,
        pageIcon: pageIcon,
        pageIconImage: pageIconImage
    });
    
    // Generate page icon for content area (if not using profile image)
    let iconHtml = '';
    if (config.icon && config.icon.type !== 'none') {
        if (config.icon.emoji) {
            iconHtml = `<div class="page-icon">${config.icon.emoji}</div>`;
        }
    }

    const tocScript = config.toc ? `
        // Generate TOC
        document.addEventListener('DOMContentLoaded', () => {
            const headings = document.querySelectorAll('h2');
            const tocLinks = document.getElementById('toc-links');
            if (tocLinks && headings.length) {
                headings.forEach((h, i) => {
                    const id = 'section-' + i;
                    h.id = id;
                    tocLinks.innerHTML += '<a href="#' + id + '">' + h.textContent + '</a>';
                });
            }
        });` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - Pablo Vizcaino</title>
    
    <!-- SEO -->
    <meta name="description" content="${config.description || ''}">
    <meta name="author" content="Pablo F. Vizcaino">
    <link rel="canonical" href="${BASE_URL}/${config.slug}.html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config.title}">
    <meta property="og:description" content="${config.description || ''}">
    <meta property="og:image" content="${config.ogImage || BASE_URL + '/li-pv2-small.png'}">
    <meta property="og:url" content="${BASE_URL}/${config.slug}.html">
    <meta property="og:type" content="website">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${config.title}">
    <meta name="twitter:description" content="${config.description || ''}">
    
    <style>
        /* ============================================
           NOTION DESIGN SYSTEM - CORE VARIABLES
           ============================================ */
        :root {
            /* Light Mode */
            --bg-color: #FFFFFF;
            --fg-color: #37352F;
            --fg-light: #9B9A97;
            --border-color: #E9E9E7;
            --hover-bg: rgba(55, 53, 47, 0.08);
            --callout-bg: #F1F1EF;
            --code-bg: #F7F6F3;
            --card-shadow: rgba(15, 15, 15, 0.1);
            --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif;
            --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
        }
        
        /* Dark Mode */
        body.dark-mode {
            --bg-color: #191919;
            --fg-color: rgba(255, 255, 255, 0.9);
            --fg-light: rgba(255, 255, 255, 0.443);
            --border-color: rgba(255, 255, 255, 0.094);
            --hover-bg: rgba(255, 255, 255, 0.055);
            --callout-bg: #2F2F2F;
            --code-bg: #262626;
        }
        
        /* ============================================
           BASE STYLES
           ============================================ */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: var(--font-main);
            background: var(--bg-color);
            color: var(--fg-color);
            line-height: 1.5;
            font-size: 16px;
        }
        
        .cover-image {
            width: 100%;
            height: 30vh;
            object-fit: cover;
        }
        
        .main-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 96px 100px;
        }
        
        @media (max-width: 768px) {
            .main-container { padding: 0 24px 60px; }
        }
        
        /* ============================================
           PAGE ICON & TITLE
           ============================================ */
        .page-icon {
            font-size: 78px;
            margin-top: -42px;
            margin-bottom: 4px;
            position: relative;
            z-index: 10;
        }
        .page-icon img { 
            width: 78px; 
            height: 78px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        h1.page-title {
            font-weight: 700;
            font-size: 40px;
            line-height: 1.2;
            margin-bottom: 24px;
        }
        
        /* When no icon, title overlaps cover */
        .no-icon h1.page-title {
            margin-top: -42px;
            padding-top: 60px;
            background: linear-gradient(to bottom, transparent 0%, var(--bg-color) 42px);
        }
        
        /* ============================================
           TYPOGRAPHY
           ============================================ */
        h2 {
            font-size: 1.875em;
            font-weight: 600;
            margin: 32px 0 16px;
        }
        
        h3 {
            font-size: 1.25em;
            font-weight: 600;
            margin: 24px 0 12px;
            color: var(--fg-light);
        }
        
        p {
            margin-bottom: 16px;
            line-height: 1.6;
        }
        
        strong { font-weight: 600; }
        em { font-style: italic; }
        code {
            font-family: var(--font-mono);
            background: var(--callout-bg);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        /* ============================================
           LISTS
           ============================================ */
        ul, ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        li { margin-bottom: 8px; }
        
        /* ============================================
           CALLOUT
           ============================================ */
        .callout {
            display: flex;
            background: var(--callout-bg);
            padding: 16px;
            border-radius: 4px;
            margin: 16px 0;
        }
        .callout-icon {
            font-size: 1.2em;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .callout-content { flex: 1; }
        .callout p:last-child { margin-bottom: 0; }
        
        /* ============================================
           QUOTE
           ============================================ */
        blockquote {
            border-left: 3px solid var(--fg-color);
            padding-left: 16px;
            margin: 24px 0;
            font-style: italic;
            color: var(--fg-light);
        }
        blockquote cite {
            display: block;
            margin-top: 8px;
            font-style: normal;
            font-size: 14px;
        }
        
        /* ============================================
           DIVIDER
           ============================================ */
        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 32px 0;
        }
        
        /* ============================================
           COLUMNS
           ============================================ */
        .notion-row {
            display: flex;
            gap: 24px;
            margin: 24px 0;
        }
        .notion-col { flex: 1; }
        
        .notion-row-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin: 24px 0;
        }
        .notion-col-3 { }
        
        @media (max-width: 768px) {
            .notion-row { flex-direction: column; }
            .notion-row-3 { grid-template-columns: 1fr; }
        }
        
        /* ============================================
           TOGGLE
           ============================================ */
        details.notion-toggle {
            margin: 8px 0;
        }
        .notion-toggle summary {
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 8px 0;
            font-weight: 500;
            list-style: none;
        }
        .notion-toggle summary::-webkit-details-marker { display: none; }
        .toggle-triangle {
            margin-right: 8px;
            transition: transform 0.2s;
            font-size: 12px;
            color: var(--fg-light);
        }
        .notion-toggle[open] .toggle-triangle {
            transform: rotate(90deg);
        }
        .toggle-content {
            padding-left: 24px;
            padding-bottom: 8px;
        }
        
        /* Numbered Toggle */
        .numbered-toggle .toggle-number {
            width: 24px;
            height: 24px;
            background: var(--fg-color);
            color: var(--bg-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
        }
        
        /* ============================================
           BUTTON
           ============================================ */
        .notion-button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
        }
        .notion-button.primary {
            background: var(--fg-color);
            color: var(--bg-color);
        }
        .notion-button.primary:hover {
            opacity: 0.85;
        }
        .notion-button.secondary {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--fg-color);
        }
        .notion-button.secondary:hover {
            background: var(--hover-bg);
        }
        
        /* ============================================
           LINKS
           ============================================ */
        .text-link {
            color: var(--fg-color);
            text-decoration: none;
            border-bottom: 1px solid var(--fg-light);
            transition: border-color 0.2s;
        }
        .text-link:hover {
            border-color: var(--fg-color);
        }
        
        /* ============================================
           CODE BLOCK
           ============================================ */
        .code-block {
            background: var(--code-bg);
            font-family: var(--font-mono);
            font-size: 14px;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre;
            margin: 16px 0;
        }
        
        /* ============================================
           IMAGE
           ============================================ */
        .notion-image {
            margin: 24px 0;
        }
        .notion-image img {
            max-width: 100%;
            border-radius: 4px;
        }
        .notion-image figcaption {
            font-size: 14px;
            color: var(--fg-light);
            text-align: center;
            margin-top: 8px;
        }
        
        /* ============================================
           GALLERY GRID
           ============================================ */
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;
            margin: 24px 0;
        }
        .gallery-card {
            background: var(--bg-color);
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
        .gallery-content { padding: 12px 16px; }
        .gallery-title { font-weight: 500; }
        .gallery-subtitle {
            font-size: 12px;
            color: var(--fg-light);
            margin-top: 4px;
        }
        .gallery-description {
            font-size: 13px;
            color: var(--fg-light);
            margin-top: 8px;
        }
        
        /* ============================================
           TABLE OF CONTENTS
           ============================================ */
        .notion-toc {
            position: sticky;
            top: 20px;
            padding: 16px;
            background: var(--callout-bg);
            border-radius: 4px;
            margin-bottom: 24px;
        }
        .toc-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--fg-light);
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .notion-toc a {
            display: block;
            color: var(--fg-color);
            text-decoration: none;
            padding: 4px 0;
            font-size: 14px;
        }
        .notion-toc a:hover {
            background: var(--hover-bg);
        }
        
        /* ============================================
           CENTERED BLOCK
           ============================================ */
        .centered-block {
            text-align: center;
            max-width: 600px;
            margin: 32px auto;
        }
        
        /* ============================================
           BACK LINK
           ============================================ */
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
        
        /* NavCover Component Styles */
        ${getNavCoverStyles()}
    </style>
</head>
<body class="dark-mode">
    ${navCoverHtml}
    
    <main class="main-container${!iconHtml ? ' no-icon' : ''}">
        ${iconHtml}
        
${blocks}

        ${config.backLink !== false ? `<a href="${BASE_URL}" class="back-link">← Back to Portfolio</a>` : ''}
    </main>
    
    <script>
        ${getNavCoverScript()}
        ${tocScript}
    </script>
</body>
</html>`;
}

// ============================================================================
// EXAMPLE CONFIG
// ============================================================================

const exampleConfig = {
    slug: "work-with-pablo",
    title: "Work With Pablo",
    description: "Build smarter. Move faster. Make better decisions.",
    
    // Optional: cover image or gradient
    cover: {
        gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
    },
    
    // Optional: page icon (emoji or type: "none" to hide)
    icon: {
        emoji: "🫡"
    },
    
    // Enable table of contents
    toc: false,
    
    // Page blocks
    blocks: [
        // Hero Section
        { type: "h1", text: "WORK WITH PABLO" },
        { type: "h3", text: "Build smarter. Move faster. Make better decisions.", style: "color: var(--fg-light); margin-top: -16px;" },
        { type: "spacer", height: "16px" },
        { 
            type: "callout",
            content: "One conversation can replace months of spinning wheels. I help founders, operators, and creators cut through noise, build leverage, and move with clarity."
        },
        
        { type: "divider" },
        
        // Value Proposition - Two Columns
        { type: "h2", text: "What I Help You Do" },
        {
            type: "columns",
            columns: [
                {
                    blocks: [
                        {
                            type: "bulletList",
                            items: [
                                { lead: "Make Better Decisions", text: "Frameworks for clarity under uncertainty" },
                                { lead: "Build High-Leverage Systems", text: "Automate the repeatable, focus on the irreplaceable" },
                                { lead: "Modernize Your Stack", text: "AI-native workflows that actually ship" },
                                { lead: "Elevate Personal Performance", text: "Mental models for sustainable output" }
                            ]
                        }
                    ]
                },
                {
                    blocks: [
                        {
                            type: "callout",
                            icon: "⚡",
                            content: "**The goal isn't more work—it's sharper work.** I help you find the 20% that drives 80% of results, then systematize it."
                        }
                    ]
                }
            ]
        },
        
        { type: "divider" },
        
        // How We Work Together - Numbered Toggles
        { type: "h2", text: "How We Work Together" },
        {
            type: "numberedToggle",
            number: "1",
            title: "One Conversation",
            content: "We start with a single focused session. You bring your challenge—strategy, systems, stack, or personal performance. I bring frameworks, pattern recognition, and direct feedback. Most people leave with immediate clarity."
        },
        {
            type: "numberedToggle",
            number: "2",
            title: "A Flexible Model That Fits You",
            content: "Engagements scale with your needs. One-off advisory calls. Monthly retainers. Project-based sprints. Whatever creates the most leverage for your situation."
        },
        {
            type: "numberedToggle",
            number: "3",
            title: "Immediate, Practical Output",
            content: [
                { type: "bulletList", items: [
                    "Decision frameworks you can use tomorrow",
                    "AI prompts and workflows tailored to your context",
                    "System designs ready for implementation",
                    "Clear next actions, not vague advice"
                ]}
            ]
        },
        
        { type: "divider" },
        
        // Who This Is For - Three Columns
        { type: "h2", text: "Who This Is For" },
        {
            type: "threeColumns",
            columns: [
                {
                    blocks: [
                        { type: "bulletList", items: [
                            "Founders building momentum",
                            "Operators tightening systems"
                        ]}
                    ]
                },
                {
                    blocks: [
                        { type: "bulletList", items: [
                            "Creators shaping products",
                            "Teams experimenting with AI"
                        ]}
                    ]
                },
                {
                    blocks: [
                        { type: "bulletList", items: [
                            "Professionals leveling up",
                            "Anyone seeking clarity + speed"
                        ]}
                    ]
                }
            ]
        },
        
        { type: "divider" },
        
        // What You Get - Icon Callouts
        { type: "h2", text: "What You Get" },
        {
            type: "columns",
            columns: [
                {
                    blocks: [
                        { type: "callout", icon: "📘", content: "**Proprietary playbooks** — Battle-tested frameworks" },
                        { type: "callout", icon: "⚙️", content: "**AI prompt libraries** — Ready-to-use workflows" },
                        { type: "callout", icon: "🧠", content: "**Mental models** — Decision-making shortcuts" }
                    ]
                },
                {
                    blocks: [
                        { type: "callout", icon: "🧩", content: "**Operational frameworks** — Systems that scale" },
                        { type: "callout", icon: "🎯", content: "**Strategy sessions** — Focused guidance" },
                        { type: "callout", icon: "📊", content: "**Benchmarks & analytics** — Data-driven insights" }
                    ]
                }
            ]
        },
        
        { type: "divider" },
        
        // Testimonial
        { type: "quote", text: "One conversation with Pablo replaced months of spinning wheels.", attribution: "Founder, Series A Startup" },
        
        { type: "divider" },
        
        // CTA
        { type: "h2", text: "Simple Next Step" },
        {
            type: "callout",
            content: [
                { type: "button", text: "Book a Quick Call →", href: "https://calendly.com/heythatspablo", style: "primary" },
                { type: "spacer", height: "12px" },
                { type: "paragraph", text: "Or [send a message](mailto:heythatspablo@gmail.com)—whatever is easiest.", style: "margin-bottom: 0; font-size: 14px;" }
            ]
        },
        
        { type: "spacer", height: "32px" },
        
        // Closing
        {
            type: "centered",
            blocks: [
                {
                    type: "callout",
                    background: "var(--callout-bg)",
                    content: "**You bring the ambition.** I help you sharpen it, systematize it, and make it real."
                }
            ]
        }
    ]
};

// ============================================================================
// CLI
// ============================================================================

function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--example')) {
        console.log(JSON.stringify(exampleConfig, null, 2));
        return;
    }
    
    if (args.includes('--help') || args.length === 0) {
        console.log(`
Notion-Style Page Generator

Usage:
  node page-generator.js <config.json>     Generate page from config
  node page-generator.js --example         Output example config JSON
  node page-generator.js --build-example   Build the example page

Config Structure:
  {
    "slug": "page-url-slug",
    "title": "Page Title",
    "description": "Meta description",
    "cover": { "gradient": "..." } or { "src": "image.jpg" },
    "icon": { "emoji": "🚀" } or { "type": "none" },
    "toc": true/false,
    "blocks": [ ... ]
  }

Block Types:
  h1, h2, h3, paragraph, callout, bulletList, numberedList,
  quote, divider, columns, threeColumns, toggle, numberedToggle,
  button, link, code, image, gallery, toc, spacer, centered, html
`);
        return;
    }
    
    if (args.includes('--build-example')) {
        const html = generatePage(exampleConfig);
        const outputPath = path.join(__dirname, `${exampleConfig.slug}.html`);
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Generated: ${exampleConfig.slug}.html`);
        return;
    }
    
    // Load config file
    const configPath = args[0];
    if (!fs.existsSync(configPath)) {
        console.error(`❌ Config file not found: ${configPath}`);
        process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const html = generatePage(config);
    const outputPath = path.join(__dirname, `${config.slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`✅ Generated: ${config.slug}.html`);
}

main();

module.exports = { generatePage, BlockRenderers, exampleConfig };
