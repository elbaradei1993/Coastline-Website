/* ══════════════════════════════════════════════════════════════════════
   Coastline Digital Solutions — Main JavaScript
   Navigation, scroll reveals, form logic, stat counters
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   SPLASH SCREEN — Time Portal
   Runs once per browser session (sessionStorage gate)
   ══════════════════════════════════════════════════════════════════════ */
(function initSplash() {
    'use strict';

    const splash      = document.getElementById('splash-screen');
    const splashCanvas = document.getElementById('splash-canvas');
    const logoWrap    = document.getElementById('splash-logo-wrap');

    // Skip if elements missing
    if (!splash || !splashCanvas) {
        if (splash) splash.classList.add('splash-hidden');
        return;
    }
    // NOTE: sessionStorage gate temporarily disabled for testing
    // Re-enable by un-commenting the line below:
    // if (sessionStorage.getItem('splashSeen')) { splash.classList.add('splash-hidden'); return; }

    // Lock body scroll while splash is active
    document.body.classList.add('splash-active');

    // ── Warp-speed starfield ─────────────────────────────────────────
    const ctx = splashCanvas.getContext('2d');
    let W = splashCanvas.width  = window.innerWidth;
    let H = splashCanvas.height = window.innerHeight;
    let rafId;
    let splashDone = false;
    let warpLevel  = 0;      // 0 = gentle drift, 1 = full hyperspace
    let warpTarget = 0;      // smoothly animated toward this value

    const STAR_COUNT = 200;
    const stars = [];

    function createStar(nearCenter) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = nearCenter ? Math.random() * 40 : Math.random() * Math.min(W, H) * 0.15;
        return {
            angle : angle,
            dist  : dist,
            prevDist: dist,
            speed : 0.6 + Math.random() * 1.4,
            width : 0.4 + Math.random() * 0.6,
            alpha : 0.35 + Math.random() * 0.45,
        };
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(createStar(true));
    }

    function drawWarpStars() {
        if (splashDone) return;

        // Smooth warp interpolation
        warpLevel += (warpTarget - warpLevel) * 0.04;

        ctx.clearRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy) + 60;

        stars.forEach(function(s) {
            s.prevDist = s.dist;

            // Speed multiplier: slow drift at rest, violent surge during warp
            const distFactor = 0.5 + (s.dist / maxDist) * 1.5;
            const speedMult  = 1 + warpLevel * 18 + distFactor * warpLevel * 6;
            s.dist += s.speed * speedMult;

            // Reset star to center once it flies off screen
            if (s.dist > maxDist) {
                const fresh = createStar(true);
                s.angle    = fresh.angle;
                s.dist     = fresh.dist;
                s.prevDist = fresh.dist;
                s.speed    = fresh.speed;
                s.width    = fresh.width;
                s.alpha    = fresh.alpha;
                return;
            }

            const x1 = cx + Math.cos(s.angle) * s.prevDist;
            const y1 = cy + Math.sin(s.angle) * s.prevDist;
            const x2 = cx + Math.cos(s.angle) * s.dist;
            const y2 = cy + Math.sin(s.angle) * s.dist;

            const brightness = Math.min(1, s.alpha + warpLevel * 0.4);
            const lw = s.width * (1 + warpLevel * 2.5);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = 'rgba(255,255,255,' + brightness + ')';
            ctx.lineWidth = lw;
            ctx.stroke();
        });

        rafId = requestAnimationFrame(drawWarpStars);
    }

    drawWarpStars();

    // Handle resize during splash
    window.addEventListener('resize', function onSplashResize() {
        W = splashCanvas.width  = window.innerWidth;
        H = splashCanvas.height = window.innerHeight;
        if (splashDone) window.removeEventListener('resize', onSplashResize);
    });

    // ── Animation sequence ───────────────────────────────────────────
    // Phase 1 (80 ms)   : Logo fades in over gentle starfield
    // Phase 2 (900 ms)  : Stars begin accelerating toward warp
    // Phase 3 (1600 ms) : Full warp + portal zoom fires
    // Phase 4 (2800 ms) : Overlay removed; hero animations released

    // Phase 1 — logo fade in
    setTimeout(function() {
        logoWrap.classList.add('splash-logo-in');
    }, 80);

    // Phase 2 — begin warp acceleration
    setTimeout(function() {
        warpTarget = 0.35; // pre-warp shimmer
    }, 900);

    // Phase 2b — full warp surge
    setTimeout(function() {
        warpTarget = 1;
    }, 1400);

    // Phase 3 — zoom through the logo
    setTimeout(function() {
        splash.classList.add('portal-zoom');
    }, 1700);

    // Phase 4 — remove splash, unlock page
    setTimeout(function() {
        splashDone = true;
        cancelAnimationFrame(rafId);

        splash.classList.add('splash-hidden');
        document.body.classList.remove('splash-active');

        // Resume hero fade-in animations
        document.querySelectorAll('.fade-in').forEach(function(el) {
            el.style.animationPlayState = 'running';
        });

        // Mark session so splash doesn't replay
        sessionStorage.setItem('splashSeen', '1');
    }, 2850);

})();


(function () {
    'use strict';

    // ── Scroll Progress Bar ──────────────────────────────────────────
    const scrollProgressBar = document.getElementById('scroll-progress-bar');
    
    function updateScrollProgress() {
        if (!scrollProgressBar) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgressBar.style.width = scrollPercent + '%';
    }

    // ── Dot Navigation ───────────────────────────────────────────────
    const dotNav = document.getElementById('dot-nav');
    const dotNavItems = document.querySelectorAll('.dot-nav-item');

    function updateDotNav() {
        if (!dotNav) return;
        
        // Show/hide dot nav based on scroll position
        if (window.scrollY > 300) {
            dotNav.classList.add('visible');
        } else {
            dotNav.classList.remove('visible');
        }

        // Highlight active section
        const scrollPos = window.scrollY + window.innerHeight / 3;
        
        dotNavItems.forEach(item => {
            const sectionId = item.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (!section) return;

            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                dotNavItems.forEach(d => d.classList.remove('active'));
                item.classList.add('active');
            }
        });
    }

    // Dot nav click handling
    dotNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - 60;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    // ── Back to Top Button ───────────────────────────────────────────
    const backToTop = document.getElementById('back-to-top');

    function updateBackToTop() {
        if (!backToTop) return;
        if (window.scrollY > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Combined Scroll Handler ──────────────────────────────────────
    function onScroll() {
        updateScrollProgress();
        updateDotNav();
        updateBackToTop();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on load

    // ── Navigation ───────────────────────────────────────────────────
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    // Scroll effect on navbar
    function handleNavScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // Mobile toggle
    if (navToggle && mobileOverlay) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
        });

        // Close on link click
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 60;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }

            // If clicking a service card "Contact Us" with data-pillar, auto-select pillar
            const pillar = this.getAttribute('data-pillar');
            if (pillar && href === '#contact') {
                setTimeout(() => {
                    selectPillar(pillar);
                }, 600);
            }
        });
    });

    // Active nav link highlight
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

    function highlightNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === '#' + current) {
                link.style.color = '#ffffff';
            }
        });
    }

    window.addEventListener('scroll', highlightNav, { passive: true });

    // ── Scroll Reveal ────────────────────────────────────────────────
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ── Stat Counter Animation ───────────────────────────────────────
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        }

        requestAnimationFrame(update);
    }

    // ── Multi-Step Pillar Form ────────────────────────────────────────
    const form = document.getElementById('contact-form');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressBar = document.getElementById('progress-bar');
    const formSuccess = document.getElementById('form-success');
    const selectedServiceInput = document.getElementById('selected-service');
    let currentStep = 1;
    let selectedPillar = '';
    const totalSteps = 3;

    // ── Pillar Card Selection (Step 1) ────────────────────────────────
    const pillarCards = document.querySelectorAll('.pillar-card');

    pillarCards.forEach(card => {
        card.addEventListener('click', () => {
            const pillar = card.getAttribute('data-pillar');
            selectPillar(pillar);
        });
    });

    function selectPillar(pillar) {
        selectedPillar = pillar;
        selectedServiceInput.value = pillar;

        // Visual feedback: highlight selected card
        pillarCards.forEach(c => c.classList.remove('selected'));
        const targetCard = document.querySelector(`.pillar-card[data-pillar="${pillar}"]`);
        if (targetCard) {
            targetCard.classList.add('selected');
        }

        // Auto-advance to step 2 after short delay
        setTimeout(() => {
            goToStep(2);
        }, 300);
    }

    // ── Next / Previous buttons ───────────────────────────────────────
    document.querySelectorAll('.form-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                goToStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll('.form-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            goToStep(currentStep - 1);
        });
    });

    // Manage required attributes: disable required on hidden pillar steps
    function updateRequiredFields() {
        document.querySelectorAll('.pillar-step').forEach(step => {
            const isActive = step.classList.contains('active');
            step.querySelectorAll('[data-required]').forEach(field => {
                if (isActive) {
                    field.setAttribute('required', '');
                } else {
                    field.removeAttribute('required');
                }
            });
        });
    }

    // On load: convert all required fields in pillar steps to data-required and remove required
    document.querySelectorAll('.pillar-step [required]').forEach(field => {
        field.setAttribute('data-required', 'true');
        field.removeAttribute('required');
    });

    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // Hide all form steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

        if (step === 3) {
            // Show the pillar-specific step 3
            const pillarStep = document.querySelector(`.pillar-step[data-pillar="${selectedPillar}"]`);
            if (pillarStep) {
                pillarStep.classList.add('active');
            }
        } else {
            // Show the generic step (1 or 2)
            const genericStep = document.querySelector(`.form-step[data-step="${step}"]:not(.pillar-step)`);
            if (genericStep) {
                genericStep.classList.add('active');
            }
        }

        // Update required fields based on active pillar
        updateRequiredFields();

        // Update progress indicators
        progressSteps.forEach(ps => {
            const psStep = parseInt(ps.getAttribute('data-step'));
            ps.classList.remove('active', 'completed');
            if (psStep === step) {
                ps.classList.add('active');
            } else if (psStep < step) {
                ps.classList.add('completed');
            }
        });

        // Update progress bar width
        const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = progressPercent + '%';

        currentStep = step;
    }

    function validateStep(step) {
        // Step 1 validation: must have a pillar selected
        if (step === 1) {
            if (!selectedPillar) {
                // Flash the pillar cards to indicate selection needed
                document.querySelector('.pillar-selector').classList.add('shake');
                setTimeout(() => {
                    document.querySelector('.pillar-selector').classList.remove('shake');
                }, 500);
                return false;
            }
            return true;
        }

        // For steps 2 and 3, validate required fields in the active step
        const activeStep = document.querySelector('.form-step.active');
        if (!activeStep) return true;

        const requiredFields = activeStep.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.style.borderBottomColor = '#ff4444';
                field.addEventListener('input', function handler() {
                    if (this.value.trim()) {
                        this.style.borderBottomColor = '';
                        this.removeEventListener('input', handler);
                    }
                });
                field.addEventListener('change', function handler() {
                    if (this.value.trim()) {
                        this.style.borderBottomColor = '';
                        this.removeEventListener('change', handler);
                    }
                });
            }
        });

        return valid;
    }

    // ── Form Submission via Formspree ──────────────────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Only collect fields from the active pillar step + shared steps
            const formData = new FormData();

            // Always include service type
            formData.append('service', selectedPillar);

            // Collect shared Step 2 fields
            const sharedFields = ['name', 'email', 'company', 'type'];
            sharedFields.forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (field && field.value) {
                    formData.append(fieldName, field.value);
                }
            });

            // Collect active pillar step fields
            const activePillarStep = document.querySelector(`.pillar-step[data-pillar="${selectedPillar}"]`);
            if (activePillarStep) {
                const pillarFields = activePillarStep.querySelectorAll('input, select, textarea');
                pillarFields.forEach(field => {
                    if (field.name && field.value) {
                        formData.append(field.name, field.value);
                    }
                });
            }

            const submitBtn = document.querySelector('.form-step.active [type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            fetch('https://formspree.io/f/mgoprylk', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Success — show thank you message
                    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
                    document.querySelector('.form-progress').style.display = 'none';
                    formSuccess.classList.add('active');
                } else {
                    throw new Error('Form submission failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.textContent = 'Error — Try Again';
                submitBtn.disabled = false;
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                }, 3000);
            });
        });
    }

    // ── Keyboard Navigation for Form ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            const activeStep = document.querySelector('.form-step.active');
            if (activeStep) {
                e.preventDefault();
                const nextBtn = activeStep.querySelector('.form-next');
                const submitBtn = activeStep.querySelector('[type="submit"]');
                if (nextBtn) nextBtn.click();
                else if (submitBtn) submitBtn.click();
            }
        }
    });

})();
