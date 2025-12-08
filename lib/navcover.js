/**
 * NavCover Component
 * 
 * Reusable header, cover image, and page icon component
 * that matches the main site's navigation structure.
 * 
 * Used by:
 * - page-generator.js (for generated pages)
 * - build-posts.js (for static blog posts)
 */

const BASE_URL = 'https://99pablos.com';
const DEFAULT_COVER = 'https://cvaujkhxgzrqwqjofgls.supabase.co/storage/v1/object/public/site-images/Gemini_Generated_Image_7cefu7cefu7cefu7_formphotoeditor.com.jpg';
const PROFILE_IMAGE = 'https://99pablos.com/pabs_prof_circle@750.png';
const LINKEDIN_URL = 'https://www.linkedin.com/in/pablo-vizcaino-caballeros/';

/**
 * Generate the NavCover CSS styles
 */
function getNavCoverStyles() {
    return `
        /* ============================================
           NAVCOVER COMPONENT STYLES
           ============================================ */
        
        /* Header / Navigation */
        header {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            font-size: 14px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        body.dark-mode header { background-color: rgba(25, 25, 25, 0.8); }
        body:not(.dark-mode) header { background-color: rgba(255, 255, 255, 0.9); }
        
        .breadcrumbs {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        .crumb {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            transition: background 0.15s;
        }
        .crumb:hover { background: var(--hover-bg); }
        
        .crumb-icon img {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .divider {
            color: var(--fg-light);
            user-select: none;
        }
        
        .header-controls {
            display: flex;
            align-items: center;
            gap: 4px;
            position: relative;
        }
        
        .header-btn {
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s;
        }
        .header-btn:hover { background: var(--hover-bg); }
        
        /* Overflow Menu */
        .overflow-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            min-width: 220px;
            padding: 8px 0;
            display: none;
            z-index: 200;
        }
        .overflow-menu.active { display: block; }
        
        .menu-section-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--fg-light);
            padding: 8px 12px 4px;
            text-transform: uppercase;
        }
        
        .menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            color: var(--fg-color);
            text-decoration: none;
            transition: background 0.15s;
        }
        .menu-item:hover { background: var(--hover-bg); }
        .menu-icon { font-size: 16px; }
        
        /* Cover Image */
        .cover-image {
            width: 100%;
            height: 30vh;
            object-fit: cover;
        }
        
        /* Page Icon */
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
    `;
}

/**
 * Generate the NavCover HTML
 * 
 * @param {Object} options
 * @param {string} options.currentPage - Current page title for breadcrumb
 * @param {string} options.parentPage - Parent page (optional, for nested pages like blog posts)
 * @param {string} options.parentHref - Parent page href (optional)
 * @param {string} options.coverImage - Cover image URL (optional, uses default if not provided)
 * @param {string} options.coverGradient - CSS gradient for cover (optional, overrides coverImage)
 * @param {string} options.pageIcon - Page icon emoji or 'image' for profile pic or 'none' to hide
 * @param {string} options.pageIconImage - Custom image URL for page icon (optional)
 */
function getNavCoverHTML(options = {}) {
    const {
        currentPage = 'Page',
        parentPage = null,
        parentHref = null,
        coverImage = DEFAULT_COVER,
        coverGradient = null,
        pageIcon = 'image',
        pageIconImage = PROFILE_IMAGE
    } = options;

    // Build breadcrumb middle section
    let middleBreadcrumb = '';
    if (parentPage && parentHref) {
        middleBreadcrumb = `
            <span class="divider">/</span>
            <div class="crumb" onclick="window.location.href='${parentHref}'">
                ${parentPage}
            </div>`;
    }

    // Build cover element
    let coverElement;
    if (coverGradient) {
        coverElement = `<div class="cover-image" style="background: ${coverGradient};"></div>`;
    } else {
        coverElement = `<img src="${coverImage}" class="cover-image" alt="Cover">`;
    }

    // Build page icon element
    let pageIconElement = '';
    if (pageIcon === 'image') {
        pageIconElement = `<div class="page-icon"><img src="${pageIconImage}" alt=""></div>`;
    } else if (pageIcon === 'none') {
        pageIconElement = '';
    } else if (pageIcon) {
        pageIconElement = `<div class="page-icon">${pageIcon}</div>`;
    }

    return `
    <!-- NAVCOVER COMPONENT -->
    <header>
        <div class="breadcrumbs">
            <div class="crumb" onclick="window.location.href='${BASE_URL}'">
                <span class="crumb-icon"><img src="${PROFILE_IMAGE}" alt="Pablo"></span> Pablo Vizcaino
            </div>
            ${middleBreadcrumb}
            <span class="divider">/</span>
            <div class="crumb" style="cursor: default;">
                ${currentPage}
            </div>
        </div>
        <div class="header-controls">
            <!-- Theme Toggle -->
            <div class="header-btn" onclick="toggleTheme()" title="Toggle Dark Mode">
                <span id="theme-icon">☀️</span>
            </div>
            
            <!-- Overflow Menu Trigger -->
            <div class="header-btn" onclick="toggleOverflow(event)" title="More options">⋯</div>

            <!-- DROP DOWN MENU -->
            <div id="overflow-menu" class="overflow-menu">
                <div class="menu-section-title">Contact</div>
                <a href="mailto:heythatspablo@gmail.com" class="menu-item">
                    <span class="menu-icon">✉️</span>
                    <span class="menu-label">heythatspablo@gmail.com</span>
                </a>
                
                <div style="height: 1px; background: var(--border-color); margin: 4px 0;"></div>
                
                <div class="menu-section-title">Socials</div>
                <a href="${LINKEDIN_URL}" target="_blank" class="menu-item">
                    <span class="menu-icon">🔗</span>
                    <span class="menu-label">LinkedIn</span>
                </a>
            </div>
        </div>
    </header>

    ${coverElement}
    <!-- END NAVCOVER COMPONENT -->`;
}

/**
 * Generate the NavCover JavaScript
 */
function getNavCoverScript() {
    return `
        // --- THEME TOGGLE ---
        function toggleTheme() {
            const body = document.body;
            const icon = document.getElementById('theme-icon');
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                icon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            } else {
                icon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            }
        }
        
        // --- OVERFLOW MENU LOGIC ---
        function toggleOverflow(e) {
            e.stopPropagation();
            const menu = document.getElementById('overflow-menu');
            menu.classList.toggle('active');
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('overflow-menu');
            const trigger = document.querySelector('.header-btn[title="More options"]');
            
            if (menu && menu.classList.contains('active') && !menu.contains(e.target) && e.target !== trigger) {
                menu.classList.remove('active');
            }
        });

        // Initialize theme from localStorage or default to dark
        (function() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.remove('dark-mode');
                document.getElementById('theme-icon').textContent = '🌙';
            } else {
                document.body.classList.add('dark-mode');
                document.getElementById('theme-icon').textContent = '☀️';
            }
        })();
    `;
}

module.exports = {
    BASE_URL,
    DEFAULT_COVER,
    PROFILE_IMAGE,
    LINKEDIN_URL,
    getNavCoverStyles,
    getNavCoverHTML,
    getNavCoverScript
};
