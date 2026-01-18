/**
 * SETH VII - Advanced Animations
 * Usando GSAP, PixiJS, Proton.js e Anime.js para efeitos sofisticados
 */

// ============================================
// GSAP TIMELINE ANIMATIONS
// ============================================

class GSAPAnimations {
    constructor() {
        this.tl = gsap.timeline({ repeat: -1 });
    }

    // Glitch Text avançado com múltiplas camadas
    glitchTextAdvanced(element) {
        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        
        tl.to(element, {
            duration: 0.1,
            x: gsap.utils.random(-5, 5),
            y: gsap.utils.random(-5, 5),
            skewX: gsap.utils.random(-10, 10),
            textShadow: '0 0 20px rgba(0, 255, 0, 0.8), -2px 0 #ff00ff, 2px 0 #00ffff',
            ease: 'none'
        }, 0)
        .to(element, {
            duration: 0.1,
            x: gsap.utils.random(-3, 3),
            y: gsap.utils.random(-3, 3),
            textShadow: '0 0 30px rgba(255, 0, 255, 0.8), 2px 0 #00ff00, -2px 0 #ffff00',
        }, 0.1)
        .to(element, {
            duration: 0.1,
            x: 0,
            y: 0,
            skewX: 0,
            textShadow: '0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 0, 0.5)',
        }, 0.2);

        return tl;
    }

    // Neon glow pulsante com ondas
    neonGlowWave(element) {
        const tl = gsap.timeline({ repeat: -1 });
        
        tl.to(element, {
            duration: 0.5,
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3)',
            ease: 'sine.inOut'
        }, 0)
        .to(element, {
            duration: 0.5,
            boxShadow: '0 0 30px rgba(0, 255, 0, 0.8), 0 0 60px rgba(0, 255, 0, 0.5), inset 0 0 30px rgba(0, 255, 0, 0.2)',
            ease: 'sine.inOut'
        }, 0)
        .to(element, {
            duration: 0.5,
            boxShadow: '0 0 50px rgba(0, 255, 0, 1), 0 0 100px rgba(0, 255, 0, 0.6), inset 0 0 50px rgba(0, 255, 0, 0.3)',
            ease: 'sine.inOut'
        }, 0.5);

        return tl;
    }

    // Morphing shapes com deformação complexa
    morphShapes(element) {
        const tl = gsap.timeline({ repeat: -1 });
        
        const shapes = [
            '50% 50% 50% 50% / 50% 50% 50% 50%',
            '0% 100% 100% 0% / 0% 0% 100% 100%',
            '100% 0% 0% 100% / 100% 100% 0% 0%',
            '50% 50% 50% 50% / 0% 100% 100% 0%',
            '100% 100% 0% 0% / 50% 50% 50% 50%'
        ];

        shapes.forEach((shape, i) => {
            tl.to(element, {
                duration: 1.5,
                borderRadius: shape,
                ease: 'sine.inOut'
            }, i * 1.5);
        });

        return tl;
    }

    // Rotating gradient com cores dinâmicas
    rotatingGradient(element) {
        const tl = gsap.timeline({ repeat: -1 });
        
        tl.to(element, {
            duration: 4,
            backgroundPosition: '200% 0%',
            ease: 'none'
        });

        return tl;
    }

    // Data stream flowing effect
    dataStreamFlow(element) {
        const tl = gsap.timeline({ repeat: -1 });
        
        tl.to(element, {
            duration: 3,
            backgroundPosition: '0% 100%',
            ease: 'linear'
        });

        return tl;
    }

    // Particle burst animation
    particleBurst(element) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${['#00ff00', '#ff00ff', '#00ffff', '#ffff00'][Math.floor(Math.random() * 4)]};
                border-radius: 50%;
                pointer-events: none;
            `;
            element.appendChild(particle);
            particles.push(particle);
        }

        const tl = gsap.timeline({ repeat: -1 });
        
        particles.forEach((particle, i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const distance = 150;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            tl.to(particle, {
                duration: 1.5,
                x: x,
                y: y,
                opacity: 0,
                ease: 'power2.out'
            }, 0);
        });

        return tl;
    }

    // Staggered wave animation
    staggeredWave(elements) {
        const tl = gsap.timeline({ repeat: -1 });
        
        tl.to(elements, {
            duration: 0.6,
            y: -20,
            opacity: 1,
            stagger: 0.1,
            ease: 'sine.inOut'
        }, 0)
        .to(elements, {
            duration: 0.6,
            y: 0,
            ease: 'sine.inOut'
        }, 0.6);

        return tl;
    }
}

// ============================================
// PIXI.JS PARTICLE EFFECTS
// ============================================

class PixiParticleEffects {
    constructor(canvasId) {
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x111111,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });
        
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.appendChild(this.app.view);
        }

        this.particles = [];
    }

    // Neon particle system
    createNeonParticles(count = 100) {
        const colors = [0x00ff00, 0xff00ff, 0x00ffff, 0xffff00];
        
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(colors[Math.floor(Math.random() * colors.length)]);
            particle.drawCircle(0, 0, 2);
            particle.endFill();
            
            particle.x = Math.random() * this.app.screen.width;
            particle.y = Math.random() * this.app.screen.height;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.alpha = Math.random() * 0.5 + 0.5;
            
            this.app.stage.addChild(particle);
            this.particles.push(particle);
        }

        // Animation loop
        this.app.ticker.add(() => {
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > this.app.screen.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > this.app.screen.height) particle.vy *= -1;
                
                // Glow effect
                particle.alpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
            });
        });
    }

    // Glitch effect with scanlines
    createGlitchEffect() {
        const graphics = new PIXI.Graphics();
        
        this.app.ticker.add(() => {
            graphics.clear();
            
            // Random scanlines
            for (let i = 0; i < 100; i++) {
                const y = Math.random() * this.app.screen.height;
                const height = Math.random() * 20;
                const color = [0x00ff00, 0xff00ff, 0x00ffff][Math.floor(Math.random() * 3)];
                
                graphics.beginFill(color);
                graphics.drawRect(0, y, this.app.screen.width, height);
                graphics.endFill();
                graphics.alpha = 0.1;
            }
        });
        
        this.app.stage.addChild(graphics);
    }

    // Flowing data stream
    createDataStream() {
        const lines = [];
        
        for (let i = 0; i < 5; i++) {
            const line = new PIXI.Graphics();
            line.lineStyle(2, [0x00ff00, 0xff00ff, 0x00ffff, 0xffff00][Math.floor(Math.random() * 4)]);
            
            let x = 0;
            let y = (i / 5) * this.app.screen.height;
            
            for (let j = 0; j < 50; j++) {
                x += 20;
                y += Math.sin(j * 0.1) * 10;
                line.lineTo(x, y);
            }
            
            this.app.stage.addChild(line);
            lines.push({ line, offset: 0 });
        }

        this.app.ticker.add(() => {
            lines.forEach(({ line }) => {
                line.x -= 2;
                if (line.x < -200) line.x = this.app.screen.width;
            });
        });
    }
}

// ============================================
// ANIME.JS COMPLEX TIMELINES
// ============================================

class AnimeTimelines {
    // Cascading text reveal
    static cascadingTextReveal(selector) {
        const elements = document.querySelectorAll(selector);
        
        anime.timeline({
            loop: true
        })
        .add({
            targets: elements,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutQuad'
        })
        .add({
            targets: elements,
            opacity: [1, 0],
            translateY: [0, -20],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeInQuad'
        }, 2000);
    }

    // Rotating polygon animation
    static rotatingPolygon(selector) {
        anime.timeline({
            loop: true
        })
        .add({
            targets: selector,
            rotate: 360,
            duration: 4000,
            easing: 'linear'
        })
        .add({
            targets: selector,
            scale: [1, 1.2, 1],
            duration: 2000,
            easing: 'easeInOutQuad'
        }, 0);
    }

    // Blur and focus effect
    static blurFocusEffect(selector) {
        anime.timeline({
            loop: true
        })
        .add({
            targets: selector,
            filter: ['blur(0px)', 'blur(10px)', 'blur(0px)'],
            duration: 2000,
            easing: 'easeInOutQuad'
        })
        .add({
            targets: selector,
            opacity: [1, 0.5, 1],
            duration: 2000,
            easing: 'easeInOutQuad'
        }, 0);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize GSAP animations
    const gsapAnim = new GSAPAnimations();
    
    // Glitch text on h1
    const h1 = document.querySelector('h1');
    if (h1) {
        gsapAnim.glitchTextAdvanced(h1);
    }

    // Neon glow on video frame
    const videoFrame = document.querySelector('.video-frame');
    if (videoFrame) {
        gsapAnim.neonGlowWave(videoFrame);
    }

    // Morphing shapes on team members
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach((member, i) => {
        setTimeout(() => {
            gsapAnim.morphShapes(member);
        }, i * 200);
    });

    // Staggered wave on process articles
    const processArticles = document.querySelectorAll('.process-article');
    if (processArticles.length > 0) {
        gsapAnim.staggeredWave(processArticles);
    }

    // Anime.js cascading text
    AnimeTimelines.cascadingTextReveal('.metadata-value');
    
    // Anime.js rotating polygon
    AnimeTimelines.rotatingPolygon('.tag');

    // Initialize PixiJS effects
    const pixiContainer = document.createElement('div');
    pixiContainer.id = 'pixi-container';
    pixiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    document.body.appendChild(pixiContainer);

    const pixiEffects = new PixiParticleEffects('pixi-container');
    pixiEffects.createNeonParticles(50);
    pixiEffects.createGlitchEffect();
    pixiEffects.createDataStream();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.pixiEffects) {
        window.pixiEffects.app.renderer.resize(window.innerWidth, window.innerHeight);
    }
});
