/**
 * BITE ME MORE PLS - Main JavaScript
 * Vanilla ES6+ - No dependencies
 */

// ============================================
// MOBILE MENU TOGGLE
// ============================================

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', 
            menuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
        );
    });

    // Close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            navMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ============================================
// PLAY BUTTON FUNCTIONALITY
// ============================================

const playButton = document.getElementById('playButton');

if (playButton) {
    playButton.addEventListener('click', () => {
        // Create modal for video
        const modal = createVideoModal();
        document.body.appendChild(modal);
        
        // Add animation
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeVideoModal(modal);
            }
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal(modal);
            }
        });
    });
}

function createVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="video-modal-close" aria-label="Close video">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
    `;
    
    const closeBtn = modal.querySelector('.video-modal-close');
    closeBtn.addEventListener('click', () => closeVideoModal(modal));
    
    return modal;
}

function closeVideoModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

// ============================================
// INTERSECTION OBSERVER - FADE IN ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all process articles and team members
document.querySelectorAll('.process-article, .team-member, .partners-grid').forEach(el => {
    observer.observe(el);
});

// ============================================
// SMOOTH SCROLL BEHAVIOR
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// LAZY LOAD IMAGES
// ============================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================

const header = document.getElementById('header');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        header.style.borderBottomColor = 'rgba(0, 255, 0, 0.2)';
    } else {
        header.style.borderBottomColor = 'rgba(255, 255, 255, 0.1)';
    }
    
    lastScrollTop = scrollTop;
});

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener('keydown', (e) => {
    // Skip to main content
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        document.querySelector('main').focus();
    }
});

// ============================================
// PERFORMANCE MONITORING
// ============================================

if ('PerformanceObserver' in window) {
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`${entry.name}: ${entry.duration}ms`);
            }
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (e) {
        console.warn('PerformanceObserver not supported');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('BITE ME MORE PLS - Site loaded');
    
    // Add loaded class to body
    document.body.classList.add('loaded');
    
    // Initialize any additional features
    initializeAnimations();
});

function initializeAnimations() {
    // Add staggered animation to process articles
    const articles = document.querySelectorAll('.process-article');
    articles.forEach((article, index) => {
        article.style.animationDelay = `${index * 0.1}s`;
        article.classList.add('fade-in-up');
    });
}

// ============================================
// VIDEO MODAL STYLES (Injected)
// ============================================

const style = document.createElement('style');
style.textContent = `
    .video-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 300ms ease-in-out;
        backdrop-filter: blur(5px);
    }

    .video-modal.active {
        opacity: 1;
    }

    .video-modal-content {
        position: relative;
        width: 90%;
        max-width: 1000px;
        aspect-ratio: 16 / 9;
        border: 3px solid #00ff00;
        border-radius: 12px;
        box-shadow: 0 0 60px rgba(0, 255, 0, 0.5);
        overflow: hidden;
        animation: scaleIn 300ms ease-out;
    }

    @keyframes scaleIn {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    .video-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 2px solid #00ff00;
        border-radius: 50%;
        color: #00ff00;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        transition: all 300ms ease-in-out;
    }

    .video-modal-close:hover {
        background-color: rgba(0, 255, 0, 0.1);
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        transform: scale(1.1);
    }

    .video-modal-close svg {
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
    }

    @media (max-width: 768px) {
        .video-modal-content {
            width: 95%;
            max-width: 100%;
            border-width: 2px;
        }

        .video-modal-close {
            width: 40px;
            height: 40px;
            top: 12px;
            right: 12px;
        }

        .video-modal-close svg {
            width: 24px;
            height: 24px;
        }
    }
`;

document.head.appendChild(style);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        isInViewport
    };
}
