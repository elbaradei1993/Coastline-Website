/* ══════════════════════════════════════════════════════════════════════
   Coastline Digital Solutions — Main JavaScript
   Navigation, scroll reveals, form logic, stat counters
   ══════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

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
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 60;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
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

    // ── Multi-Step Form ──────────────────────────────────────────────
    const form = document.getElementById('contact-form');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressBar = document.getElementById('progress-bar');
    const formSuccess = document.getElementById('form-success');
    let currentStep = 1;
    const totalSteps = 3;

    // Next buttons
    document.querySelectorAll('.form-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                goToStep(currentStep + 1);
            }
        });
    });

    // Previous buttons
    document.querySelectorAll('.form-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            goToStep(currentStep - 1);
        });
    });

    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // Hide current
        formSteps.forEach(s => s.classList.remove('active'));
        // Show target
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');

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
        const currentFormStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredFields = currentFormStep.querySelectorAll('[required]');
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
            }
        });

        return valid;
    }

    // Form submission via Formspree
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(form);
            const submitBtn = form.querySelector('[type="submit"]');
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
                    formSteps.forEach(s => s.classList.remove('active'));
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
