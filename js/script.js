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

    document.querySelectorAll("[data-tilt]").forEach((item) => {
        if (!finePointer.matches || reducedMotion.matches) return;

        item.addEventListener("pointermove", (event) => {
            const bounds = item.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            item.style.setProperty("--tilt-x", `${y * -2.4}deg`);
            item.style.setProperty("--tilt-y", `${x * 3}deg`);
        });

        item.addEventListener("pointerleave", () => {
            item.style.setProperty("--tilt-x", "0deg");
            item.style.setProperty("--tilt-y", "0deg");
        });
    });

    const timeline = document.querySelector("[data-timeline]");

    if (timeline) {
        if (reducedMotion.matches || !("IntersectionObserver" in window)) {
            timeline.classList.add("timeline-active");
        } else {
            const timelineObserver = new IntersectionObserver(
                (entries, observer) => {
                    if (!entries.some((entry) => entry.isIntersecting)) return;
                    timeline.classList.add("timeline-active");
                    observer.disconnect();
                },
                { threshold: 0.08, rootMargin: "0px 0px -60px" }
            );

            timelineObserver.observe(timeline);
        }
    }

    const personalNetworkCanvas = document.querySelector(".personal-network-canvas");

    if (personalNetworkCanvas) {
        const context = personalNetworkCanvas.getContext("2d");
        const hero = personalNetworkCanvas.closest(".personal-hero");
        const clusterCenters = [
            [0.055, 0.18],
            [0.38, 0.09],
            [0.76, 0.16],
            [0.92, 0.43],
            [0.16, 0.68],
            [0.52, 0.82],
            [0.86, 0.76]
        ];
        let width = 0;
        let height = 0;
        let animationFrame = 0;
        let pointerX = 0;
        let pointerY = 0;
        let targetX = 0;
        let targetY = 0;
        let seed = 93817;

        const random = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };

        const clusters = clusterCenters.map((center, clusterIndex) => {
            const nodeCount = 4 + (clusterIndex % 3);
            const nodes = Array.from({ length: nodeCount }, (_, nodeIndex) => ({
                x: (random() - 0.5) * (95 + clusterIndex * 4),
                y: (random() - 0.5) * 82,
                z: (random() - 0.5) * 125,
                radius: 1.6 + random() * 2.1,
                tone: nodeIndex % 3 === 0 ? "bronze" : "plum"
            }));
            const edges = nodes.map((_, index) => [index, (index + 1) % nodes.length]);

            if (nodes.length > 4) edges.push([0, 3]);
            if (nodes.length > 5) edges.push([1, 4]);

            return {
                center,
                nodes,
                edges,
                phase: random() * Math.PI * 2,
                direction: clusterIndex % 2 === 0 ? 1 : -1
            };
        });

        const resizeNetwork = () => {
            if (!hero || !context) return;
            const bounds = hero.getBoundingClientRect();
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            width = Math.max(1, bounds.width);
            height = Math.max(1, bounds.height);
            personalNetworkCanvas.width = Math.round(width * pixelRatio);
            personalNetworkCanvas.height = Math.round(height * pixelRatio);
            personalNetworkCanvas.style.width = `${width}px`;
            personalNetworkCanvas.style.height = `${height}px`;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const projectCluster = (cluster, time) => {
            const angleY = time * 0.00011 * cluster.direction + cluster.phase + pointerX * 0.2;
            const angleX = Math.sin(time * 0.00016 + cluster.phase) * 0.2 + pointerY * 0.15;
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);
            const responsiveScale = Math.min(1, Math.max(0.62, width / 1250));
            const centerX = cluster.center[0] * width + pointerX * 17 * cluster.direction;
            const centerY = cluster.center[1] * height + pointerY * 12;

            return cluster.nodes.map((node) => {
                const rotatedX = node.x * cosY - node.z * sinY;
                const firstZ = node.x * sinY + node.z * cosY;
                const rotatedY = node.y * cosX - firstZ * sinX;
                const rotatedZ = node.y * sinX + firstZ * cosX;
                const perspective = 390 / (390 + rotatedZ);

                return {
                    x: centerX + rotatedX * perspective * responsiveScale,
                    y: centerY + rotatedY * perspective * responsiveScale + Math.sin(time * 0.00055 + cluster.phase) * 5,
                    z: rotatedZ,
                    radius: node.radius * perspective,
                    tone: node.tone
                };
            });
        };

        const drawNetwork = (time = 0) => {
            if (!context || !width || !height) return;
            context.clearRect(0, 0, width, height);
            pointerX += (targetX - pointerX) * 0.035;
            pointerY += (targetY - pointerY) * 0.035;

            clusters.forEach((cluster) => {
                const projected = projectCluster(cluster, time);

                cluster.edges.forEach(([from, to]) => {
                    const first = projected[from];
                    const second = projected[to];
                    const depthAlpha = Math.max(0.1, Math.min(0.3, 0.2 - (first.z + second.z) / 1500));
                    const gradient = context.createLinearGradient(first.x, first.y, second.x, second.y);
                    gradient.addColorStop(0, `rgba(141, 64, 88, ${depthAlpha})`);
                    gradient.addColorStop(1, `rgba(173, 112, 73, ${depthAlpha * 0.75})`);
                    context.beginPath();
                    context.moveTo(first.x, first.y);
                    context.lineTo(second.x, second.y);
                    context.strokeStyle = gradient;
                    context.lineWidth = 1;
                    context.stroke();
                });

                [...projected]
                    .sort((first, second) => second.z - first.z)
                    .forEach((node) => {
                        const alpha = Math.max(0.34, Math.min(0.84, 0.62 - node.z / 430));
                        context.beginPath();
                        context.arc(node.x, node.y, Math.max(1.6, node.radius), 0, Math.PI * 2);
                        context.fillStyle = node.tone === "bronze"
                            ? `rgba(173, 112, 73, ${alpha})`
                            : `rgba(141, 64, 88, ${alpha})`;
                        context.fill();

                        if (node.radius > 2.5) {
                            context.beginPath();
                            context.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
                            context.strokeStyle = `rgba(141, 64, 88, ${alpha * 0.14})`;
                            context.lineWidth = 3;
                            context.stroke();
                        }
                    });
            });
        };

        const animateNetwork = (time) => {
            drawNetwork(time);
            animationFrame = window.requestAnimationFrame(animateNetwork);
        };

        hero?.addEventListener("pointermove", (event) => {
            if (!finePointer.matches || reducedMotion.matches) return;
            const bounds = hero.getBoundingClientRect();
            targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
            targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
        });

        hero?.addEventListener("pointerleave", () => {
            targetX = 0;
            targetY = 0;
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                window.cancelAnimationFrame(animationFrame);
                return;
            }
            if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(animateNetwork);
        });

        resizeNetwork();

        if ("ResizeObserver" in window && hero) {
            new ResizeObserver(resizeNetwork).observe(hero);
        } else {
            window.addEventListener("resize", resizeNetwork);
        }

        if (reducedMotion.matches) {
            drawNetwork(0);
        } else {
            animationFrame = window.requestAnimationFrame(animateNetwork);
        }
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
