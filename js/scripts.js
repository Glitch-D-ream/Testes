/* ============================================
   SETH VII - Main JavaScript
   Minimal vanilla JS for interactivity
   ============================================ */

// ============================================
// LAZY LOADING
// ============================================

if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
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
    
    images.forEach(img => imageObserver.observe(img));
}

// ============================================
// FADE-IN ANIMATIONS ON SCROLL
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections for fade-in effect
document.querySelectorAll('section, article').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ============================================
// VIDEO MODAL
// ============================================

const playButton = document.getElementById('playButton');

if (playButton) {
    playButton.addEventListener('click', () => {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="Close video">✕</button>
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal on button click
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.remove());
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Close modal on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

// ============================================
// SMOOTH SCROLL FOR ANCHORS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// ============================================
// MOBILE MENU TOGGLE (if needed)
// ============================================

const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        const modal = document.querySelector('.video-modal');
        if (modal) modal.remove();
    }
});

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
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    }

    .modal-content {
        position: relative;
        width: 90%;
        max-width: 900px;
        aspect-ratio: 16 / 9;
        border: 3px solid #ff00ff;
        box-shadow: 0 0 60px rgba(255, 0, 255, 0.5);
        overflow: hidden;
    }

    .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 2px solid #fff700;
        border-radius: 50%;
        color: #fff700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        font-size: 24px;
        transition: all 0.3s ease;
    }

    .modal-close:hover {
        background-color: rgba(255, 255, 0, 0.1);
        box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            border-width: 2px;
        }

        .modal-close {
            width: 40px;
            height: 40px;
            top: 12px;
            right: 12px;
            font-size: 20px;
        }
    }
`;

document.head.appendChild(style);

// ============================================
// CONSOLE MESSAGE
// ============================================

console.log('%c🎨 SETH VII - Digital Art Collective', 'font-size: 20px; color: #ff00ff; font-weight: bold;');
console.log('%cDesigned with passion and cyberpunk aesthetics', 'color: #fff700; font-size: 14px;');
