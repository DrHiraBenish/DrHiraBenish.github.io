document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const header = document.querySelector(".site-header");
    const nav = document.querySelector(".primary-nav");
    const navToggle = document.querySelector(".nav-toggle");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    body.classList.add("nav-enhanced");

    const currentPage = body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
        if (link.dataset.nav === currentPage) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
        }
    });

    const updateHeader = () => {
        header?.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    const closeNavigation = () => {
        if (!nav || !navToggle) return;
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.querySelector(".sr-only").textContent = "Open navigation";
        body.classList.remove("nav-open");
    };

    navToggle?.addEventListener("click", () => {
        if (!nav) return;
        const isOpen = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.querySelector(".sr-only").textContent = isOpen ? "Close navigation" : "Open navigation";
        body.classList.toggle("nav-open", isOpen);
    });

    nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeNavigation();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeNavigation();
    });

    const revealItems = [...document.querySelectorAll("[data-reveal]")];

    revealItems.forEach((item) => {
        const delay = Number(item.dataset.delay || 0);
        item.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px" }
        );

        revealItems.forEach((item) => revealObserver.observe(item));
        body.classList.add("motion-ready");
    }

    const heroVisual = document.querySelector(".hero-visual");
    const heroVisualWrap = document.querySelector(".hero-visual-wrap");
    const finePointer = window.matchMedia("(pointer: fine)");

    if (heroVisual && heroVisualWrap && finePointer.matches && !reducedMotion.matches) {
        heroVisualWrap.addEventListener("pointermove", (event) => {
            const bounds = heroVisualWrap.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            heroVisual.style.setProperty("--rx", `${y * -5}deg`);
            heroVisual.style.setProperty("--ry", `${x * 6}deg`);
        });

        heroVisualWrap.addEventListener("pointerleave", () => {
            heroVisual.style.setProperty("--rx", "0deg");
            heroVisual.style.setProperty("--ry", "0deg");
        });
    }

    const filterControls = [...document.querySelectorAll("[data-filter-control]")];
    const filterItems = [...document.querySelectorAll("[data-filter-item]")];

    filterControls.forEach((control) => {
        control.addEventListener("click", () => {
            const selected = control.dataset.filterControl;

            filterControls.forEach((button) => {
                const active = button === control;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-pressed", String(active));
            });

            filterItems.forEach((item) => {
                const categories = (item.dataset.filterItem || "").split(" ");
                const show = selected === "all" || categories.includes(selected);
                item.hidden = !show;
            });
        });
    });

    document.querySelectorAll("[data-current-year]").forEach((item) => {
        item.textContent = String(new Date().getFullYear());
    });
});
