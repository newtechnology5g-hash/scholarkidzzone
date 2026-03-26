/**
 * ================================================================
 * Scholar Kidz Zone — Main JavaScript
 * ================================================================
 * Sections:
 *  1. CONFIG            — Web3Forms access key & gallery image list
 *  2. sanitizeInput()   — XSS helper
 *  3. Gallery           — Dynamically render gallery items
 *  4. Enquiry form      — Validation + Web3Forms submission
 *  5. Navigation        — Hamburger, sticky header, active links
 *  6. Back-to-top       — Show/hide + scroll handler
 *  7. Scroll animations — IntersectionObserver fade-in
 * ================================================================
 *
 * SECURITY NOTES (OWASP)
 * - All user input is sanitized via sanitizeInput() before being
 *   inserted into the DOM (prevents XSS).
 * - Web3Forms access key is public by design — emails only go to
 *   the registered inbox, cannot be redirected by third parties.
 * - Form fields have both HTML maxlength attributes and JS
 *   length/pattern validation.
 * - The form is submitted over HTTPS via Web3Forms — no server-side
 *   code or direct mail server credentials are exposed.
 * ================================================================
 */

'use strict';

/* ================================================================
   1. CONFIGURATION
   ================================================================
   Web3Forms access key — public by design.
   Emails are always delivered to the inbox registered at
   https://web3forms.com — it cannot be redirected by anyone else.
   ─────────────────────────────────────────────────────────────
   Gallery setup guide:
     1. Add photo files to /assets/gallery/
     2. Add each filename + alt text to the images array below.
        Static sites cannot auto-enumerate directories, so files
        must be listed manually here.
   ================================================================ */
var CONFIG = {
    web3forms: {
        accessKey: '52bc861b-a821-4eb7-bf45-eb51c06d856e'
    },

    gallery: {
        folder: 'assets/gallery/',
        images: [
            { file: 'activity (1).jpeg',  alt: 'Scholar Kidz Zone Photo 1'  },
            { file: 'activity (2).jpeg',  alt: 'Scholar Kidz Zone Photo 2'  },
            { file: 'activity (3).jpeg',  alt: 'Scholar Kidz Zone Photo 3'  },
            { file: 'activity (4).jpeg',  alt: 'Scholar Kidz Zone Photo 4'  },
            { file: 'activity (5).jpeg',  alt: 'Scholar Kidz Zone Photo 5'  },
            { file: 'activity (6).jpeg',  alt: 'Scholar Kidz Zone Photo 6'  },
            { file: 'activity (7).jpeg',  alt: 'Scholar Kidz Zone Photo 7'  },
            { file: 'activity (8).jpeg',  alt: 'Scholar Kidz Zone Photo 8'  },
            { file: 'activity (9).jpeg',  alt: 'Scholar Kidz Zone Photo 9'  },
            { file: 'activity (10).jpeg', alt: 'Scholar Kidz Zone Photo 10' },
            { file: 'activity (11).jpeg', alt: 'Scholar Kidz Zone Photo 11' },
            { file: 'activity (12).jpeg', alt: 'Scholar Kidz Zone Photo 12' },
            { file: 'activity (13).jpeg', alt: 'Scholar Kidz Zone Photo 13' },
            { file: 'activity (14).jpeg', alt: 'Scholar Kidz Zone Photo 14' },
            { file: 'activity (15).jpeg', alt: 'Scholar Kidz Zone Photo 15' },
            { file: 'activity (16).jpeg', alt: 'Scholar Kidz Zone Photo 16' },
            { file: 'activity (17).jpeg', alt: 'Scholar Kidz Zone Photo 17' },
            { file: 'activity (18).jpeg', alt: 'Scholar Kidz Zone Photo 18' },
            { file: 'activity (19).jpeg', alt: 'Scholar Kidz Zone Photo 19' },
            { file: 'activity (20).jpeg', alt: 'Scholar Kidz Zone Photo 20' }
        ]
    }
};

/* ================================================================
   2. UTILITY — sanitizeInput
   Escapes HTML entities to prevent XSS when user-supplied text
   is rendered to the DOM.
   @param  {string} str  Raw string (e.g. from an input field)
   @return {string}      HTML-entity-encoded string
   ================================================================ */
function sanitizeInput(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

/* ================================================================
   4. GALLERY — Dynamic rendering
   ================================================================
   Iterates CONFIG.gallery.images, creates <div.gallery-item>
   elements with lazy-loaded <img> tags and a hover overlay.
   If an image file is missing (404), onerror replaces it with a
   colourful CSS placeholder so the grid never looks broken.
   ================================================================ */
(function initGallery() {
    var grid = document.getElementById('galleryGrid');
    var note = document.getElementById('galleryNote');
    if (!grid) return;

    var folder = CONFIG.gallery.folder;
    var images = CONFIG.gallery.images;

    /* No images configured yet — show a developer hint */
    if (!images || images.length === 0) {
        grid.innerHTML =
            '<div class="gallery-placeholder">' +
            '  <span style="font-size:3rem">📷</span>' +
            '  <p>Photos coming soon!<br>Add images to <code>' + sanitizeInput(folder) + '</code> ' +
            'and list them in <code>js/script.js → CONFIG.gallery.images</code>.</p>' +
            '</div>';
        return;
    }

    /* Colour palette for CSS placeholder tiles (used when image is missing) */
    var placeholderColors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
        '#6C5CE7', '#FD79A8', '#FDCB6E', '#55efc4'
    ];

    images.forEach(function (imgCfg, index) {
        /* --- Outer wrapper --- */
        var item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.setAttribute('role', 'listitem');

        /* --- Sanitize alt text before DOM use --- */
        var safeAlt  = sanitizeInput(imgCfg.alt  || 'Gallery photo');
        var safeFile = sanitizeInput(imgCfg.file || '');

        /* --- Image element --- */
        var img   = document.createElement('img');
        img.src   = folder + imgCfg.file;   // raw path — not injected to innerHTML
        img.alt   = safeAlt;
        img.loading = 'lazy';               // native browser lazy-load

        /**
         * Fallback placeholder when an image file is missing.
         * Renders a coloured tile with the alt text and filename.
         * This keeps the grid layout intact during development.
         */
        img.onerror = (function (capturedItem, capturedAlt, capturedFile, capturedIndex) {
            return function () {
                var color = placeholderColors[capturedIndex % placeholderColors.length];
                capturedItem.style.background = 'linear-gradient(135deg, ' + color + '33, ' + color + '88)';
                capturedItem.style.border     = '3px solid ' + color;
                this.style.display = 'none';  // hide the broken img tag

                var ph = document.createElement('div');
                ph.style.cssText =
                    'display:flex;flex-direction:column;align-items:center;' +
                    'justify-content:center;height:100%;padding:20px;text-align:center;';

                /* Build placeholder content without innerHTML to avoid XSS */
                var icon = document.createElement('span');
                icon.style.fontSize = '2.5rem';
                icon.textContent = '🖼️';

                var label = document.createElement('span');
                label.style.cssText = 'font-size:.84rem;font-weight:700;color:#555;margin-top:8px;';
                label.textContent = capturedAlt;

                var hint = document.createElement('span');
                hint.style.cssText = 'font-size:.74rem;color:#888;margin-top:4px;';
                hint.textContent = 'Add: ' + capturedFile;

                ph.appendChild(icon);
                ph.appendChild(label);
                ph.appendChild(hint);
                capturedItem.appendChild(ph);
            };
        }(item, safeAlt, safeFile, index));

        item.appendChild(img);
        grid.appendChild(item);
    });

}());

/* ================================================================
   4. ENQUIRY FORM — Validation + Web3Forms submission
   ================================================================ */
(function initForm() {
    var form      = document.getElementById('enquiryForm');
    if (!form) return;

    /* ----------------------------------------------------------
       Submission lock: prevent resubmission after success.
       Stored in localStorage so it persists across page reloads.
    ---------------------------------------------------------- */
    var SUBMITTED_KEY = 'skz_enquiry_submitted';
    var formMsg = document.getElementById('formMessage');

    if (localStorage.getItem(SUBMITTED_KEY)) {
        form.innerHTML =
            '<div class="form-message success" role="status" style="margin:0">' +
            '✅ You have already submitted an enquiry. We will contact you soon!<br>' +
            '<small style="opacity:.75">Call us at <a href="tel:+917411771299">+91 7411771299</a> for urgent queries.</small>' +
            '</div>';
        return;
    }

    /* Field refs */
    var fields = {
        name:    { el: document.getElementById('name'),    err: document.getElementById('nameError')    },
        email:   { el: document.getElementById('email'),   err: document.getElementById('emailError')   },
        phone:   { el: document.getElementById('phone'),   err: document.getElementById('phoneError')   },
        message: { el: document.getElementById('message'), err: document.getElementById('messageError') }
    };

    var submitBtn = document.getElementById('submitBtn');
    var btnText   = document.getElementById('btnText');
    var btnLoader = document.getElementById('btnLoader');
    formMsg = document.getElementById('formMessage');

    /* ----------------------------------------------------------
       Validation rules
       Each returns an error string, or '' when value is valid.
    ---------------------------------------------------------- */
    var validators = {
        name: function (val) {
            val = val.trim();
            if (!val)            return 'Name is required.';
            if (val.length < 2)  return 'Name must be at least 2 characters.';
            if (val.length > 100) return 'Name is too long (max 100 characters).';
            /* Allow letters (incl. accented), spaces, hyphens, apostrophes, dots */
            if (!/^[\p{L}\s'\-\.]+$/u.test(val)) return 'Please enter a valid name.';
            return '';
        },

        email: function (val) {
            val = val.trim();
            if (!val)             return 'Email is required.';
            if (val.length > 150) return 'Email is too long.';
            /* Standard email pattern */
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
            return '';
        },

        phone: function (val) {
            val = val.trim();
            if (!val) return 'Phone number is required.';
            /* Allow +, digits, spaces, hyphens, parentheses; 7–15 digits */
            if (!/^[+]?[\d\s\-()]{7,15}$/.test(val)) return 'Please enter a valid phone number (7–15 digits).';
            return '';
        },

        message: function (val) {
            val = val.trim();
            if (!val)              return 'Message is required.';
            if (val.length < 10)   return 'Message must be at least 10 characters.';
            if (val.length > 1000) return 'Message is too long (max 1000 characters).';
            return '';
        }
    };

    /* ----------------------------------------------------------
       Helper: show or clear a field's inline error
    ---------------------------------------------------------- */
    function setFieldError(key, msg) {
        var f = fields[key];
        f.el.classList.toggle('error', msg.length > 0);
        f.err.textContent = msg;
    }

    /* ----------------------------------------------------------
       Validate a single field; returns true when valid
    ---------------------------------------------------------- */
    function validateField(key) {
        var msg = validators[key](fields[key].el.value);
        setFieldError(key, msg);
        return msg === '';
    }

    /* ----------------------------------------------------------
       Validate all fields; returns true when all pass
    ---------------------------------------------------------- */
    function validateAll() {
        return Object.keys(validators).reduce(function (allOk, key) {
            /* evaluate every field (no short-circuit) to show all errors at once */
            return validateField(key) && allOk;
        }, true);
    }

    /* ----------------------------------------------------------
       Live validation: re-validate on blur and while correcting
    ---------------------------------------------------------- */
    Object.keys(fields).forEach(function (key) {
        /* Validate when focus leaves the field */
        fields[key].el.addEventListener('blur', function () {
            validateField(key);
        });
        /* Clear error as soon as the user starts correcting it */
        fields[key].el.addEventListener('input', function () {
            if (fields[key].el.classList.contains('error')) {
                validateField(key);
            }
        });
    });

    /* ----------------------------------------------------------
       Form submit handler
    ---------------------------------------------------------- */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateAll()) return;

        /* Show loading state */
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        formMsg.className = 'form-message hidden';

        /* Build form data for Web3Forms using FormData so that
           the hCaptcha response token is automatically included */
        var formData = new FormData(form);
        formData.set('access_key', CONFIG.web3forms.accessKey);
        formData.set('subject', 'New Enquiry from Scholar Kidz Zone Website');

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    localStorage.setItem(SUBMITTED_KEY, '1');
                    showFormMessage('success',
                        '🎉 Thank you! Your enquiry has been sent successfully. We will contact you soon!'
                    );
                    form.reset();
                    Object.keys(fields).forEach(function (key) {
                        fields[key].el.classList.remove('error');
                        fields[key].err.textContent = '';
                    });
                } else {
                    console.error('Web3Forms rejected:', data);
                    showFormMessage('error',
                        '😕 Something went wrong. Please try again or call us at +91 7411771299.'
                    );
                }
            })
            .catch(function (err) {
                console.error('Web3Forms error:', err);
                showFormMessage('error',
                    '😕 Something went wrong. Please try again or call us at +91 7411771299.'
                );
            })
            .finally(function () {
                resetBtn();
            });
    });

    /* ----------------------------------------------------------
       Helpers: show form-level message, reset submit button
    ---------------------------------------------------------- */
    function showFormMessage(type, msg) {
        formMsg.textContent = msg;
        formMsg.className   = 'form-message ' + (type === 'success' ? 'success' : 'form-error');
        formMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetBtn() {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}());

/* ================================================================
   6. NAVIGATION
   ================================================================
   - Hamburger toggle (mobile)
   - Close nav on link click or outside click
   - Sticky header shadow on scroll
   - Highlight the active nav link based on scroll position
   ================================================================ */
(function initNav() {
    var hamburger = document.getElementById('hamburger');
    var navLinks  = document.getElementById('navLinks');
    var header    = document.getElementById('header');
    if (!hamburger || !navLinks || !header) return;

    /* --- Toggle mobile menu --- */
    hamburger.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    /* --- Close when any nav link is clicked --- */
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    /* --- Close when clicking outside the header --- */
    document.addEventListener('click', function (e) {
        if (!header.contains(e.target)) closeMenu();
    });

    function closeMenu() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    /* --- Sticky header: add shadow class after scrolling 50px --- */
    window.addEventListener('scroll', function () {
        header.classList.toggle('scrolled', window.scrollY > 50);
        updateActiveLink();
    }, { passive: true });

    /* --- Active nav-link highlight based on scroll position --- */
    var sections   = document.querySelectorAll('section[id]');
    var navAnchors = navLinks.querySelectorAll('a[href^="#"]');

    function updateActiveLink() {
        var scrollPos = window.scrollY + 120; /* offset for sticky header */
        sections.forEach(function (sec) {
            var top    = sec.offsetTop;
            var bottom = top + sec.offsetHeight;
            if (scrollPos >= top && scrollPos < bottom) {
                navAnchors.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + sec.id);
                });
            }
        });
    }
    updateActiveLink(); /* run once on load */
}());

/* ================================================================
   7. BACK-TO-TOP BUTTON
   ================================================================ */
(function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}());

/* ================================================================
   8. SCROLL ANIMATIONS — IntersectionObserver fade-in
   ================================================================
   Adds '.visible' to every '.fade-in' element when it enters the
   viewport. Sibling elements get a small staggered delay for a
   cascading entrance effect. Each element animates only once.
   ================================================================ */
(function initScrollAnimations() {
    var fadeEls = document.querySelectorAll('.fade-in');
    if (!fadeEls.length) return;

    /* Check for browser support; fall back to instant visibility */
    if (!('IntersectionObserver' in window)) {
        fadeEls.forEach(function (el) { el.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            /* Calculate stagger delay by counting siblings */
            var siblings = entry.target.parentElement.querySelectorAll('.fade-in');
            var idx = 0;
            siblings.forEach(function (sib, i) {
                if (sib === entry.target) idx = i;
            });

            setTimeout(function () {
                entry.target.classList.add('visible');
            }, idx * 90); /* 90 ms stagger between siblings */

            observer.unobserve(entry.target); /* fire once only */
        });
    }, {
        threshold:  0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    fadeEls.forEach(function (el) { observer.observe(el); });
}());

/* ================================================================
   9. GALLERY LIGHTBOX
   ================================================================
   Opens a full-screen lightbox when a gallery image is clicked.
   Supports keyboard navigation (← → Esc) and prev/next buttons.
   ================================================================ */
(function initLightbox() {
    var lightbox      = document.getElementById('galleryLightbox');
    var lightboxImg   = document.getElementById('lightboxImg');
    var lightboxCap   = document.getElementById('lightboxCaption');
    var lightboxCtr   = document.getElementById('lightboxCounter');
    var closeBtn      = document.getElementById('lightboxClose');
    var prevBtn       = document.getElementById('lightboxPrev');
    var nextBtn       = document.getElementById('lightboxNext');
    var overlay       = document.getElementById('lightboxOverlay');
    var grid          = document.getElementById('galleryGrid');

    if (!lightbox || !grid) return;

    var galleryImages = []; /* { src, alt } — only real loaded images */
    var currentIdx    = 0;

    function buildList() {
        galleryImages = [];
        var items = grid.querySelectorAll('.gallery-item');
        items.forEach(function (item) {
            var img = item.querySelector('img');
            if (img && img.style.display !== 'none' && img.src) {
                galleryImages.push({ src: img.src, alt: img.alt || '' });
            }
        });
    }

    function show(idx) {
        var entry = galleryImages[idx];
        lightboxImg.src = entry.src;
        lightboxImg.alt = entry.alt;
        lightboxCap.textContent = entry.alt;
        lightboxCtr.textContent = (idx + 1) + ' / ' + galleryImages.length;
        prevBtn.style.display = galleryImages.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = galleryImages.length > 1 ? 'flex' : 'none';
    }

    function open(clickedSrc) {
        buildList();
        if (!galleryImages.length) return;
        currentIdx = 0;
        for (var i = 0; i < galleryImages.length; i++) {
            if (galleryImages[i].src === clickedSrc) { currentIdx = i; break; }
        }
        show(currentIdx);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function close() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    function prev() {
        currentIdx = (currentIdx - 1 + galleryImages.length) % galleryImages.length;
        show(currentIdx);
    }

    function next() {
        currentIdx = (currentIdx + 1) % galleryImages.length;
        show(currentIdx);
    }

    /* Click on any gallery item */
    grid.addEventListener('click', function (e) {
        var item = e.target.closest('.gallery-item');
        if (!item) return;
        var img = item.querySelector('img');
        if (!img || img.style.display === 'none') return;
        open(img.src);
    });

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  prev();
        if (e.key === 'ArrowRight') next();
    });
}());
