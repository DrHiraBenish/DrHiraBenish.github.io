/* =========================================
   DR. HIRA BENISH — PORTFOLIO INTERACTIONS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       1. HEADER SCROLL EFFECT
    ===================================== */

    const header = document.querySelector(".site-header");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 30) {
            header?.classList.add("header-scrolled");
        } else {
            header?.classList.remove("header-scrolled");
        }
    });


    /* =====================================
       2. SCROLL REVEAL
    ===================================== */

    const revealElements = document.querySelectorAll(
    ".about-grid, " +
    ".focus-heading, " +
    ".focus-card, " +
    ".research-heading, " +
    ".research-preview-item, " +
    ".projects-heading, " +
    ".preview-card, " +
    ".teaching-intro, " +
    ".course-item, " +
    ".engagement-heading, " +
    ".engagement-card, " +
    ".connect-main, " +
    ".connect-card"
);

    revealElements.forEach((element) => {
        element.classList.add("reveal");
    });
   revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${(index % 4) * 0.08}s`;
});

    const revealObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-visible");
                    revealObserver.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.12
        }
    );

    revealElements.forEach((element) => {
        revealObserver.observe(element);
    });


    /* =====================================
       3. 3D CARD TILT
    ===================================== */

    const tiltCards = document.querySelectorAll(
    ".focus-card, " +
    ".research-preview-item, " +
    ".preview-card, " +
    ".engagement-card, " +
    ".course-item, " +
    ".connect-card"
);

    tiltCards.forEach((card) => {

        card.classList.add("tilt-card");

        card.addEventListener("mousemove", (event) => {

            if (window.innerWidth < 900) return;

            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;

            card.style.transform =
                `perspective(900px)
                 rotateX(${rotateX}deg)
                 rotateY(${rotateY}deg)
                 translateY(-6px)`;

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform =
                "perspective(900px) rotateX(0deg) rotateY(0deg)";

        });

    });


    /* =====================================
       4. HERO NETWORK / GRAPH ANIMATION
    ===================================== */

    const hero = document.querySelector(".hero");

    if (hero) {

        const canvas = document.createElement("canvas");

        canvas.id = "network-canvas";
        canvas.setAttribute("aria-hidden", "true");

        hero.prepend(canvas);

        const ctx = canvas.getContext("2d");

        let width;
        let height;
        let nodes = [];

        const mouse = {
            x: null,
            y: null
        };


        function resizeCanvas() {

            width = hero.offsetWidth;
            height = hero.offsetHeight;

            const ratio = window.devicePixelRatio || 1;

            canvas.width = width * ratio;
            canvas.height = height * ratio;

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";

            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

            createNodes();
        }


        function createNodes() {

            nodes = [];

            let nodeCount;

            if (window.innerWidth < 700) {
                nodeCount = 28;
            } else if (window.innerWidth < 1100) {
                nodeCount = 40;
            } else {
                nodeCount = 55;
            }

            for (let i = 0; i < nodeCount; i++) {

                nodes.push({

                    x: Math.random() * width,
                    y: Math.random() * height,

                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,

                    radius: Math.random() * 1.5 + 1

                });

            }
        }


        hero.addEventListener("mousemove", (event) => {

            const rect = hero.getBoundingClientRect();

            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;

        });


        hero.addEventListener("mouseleave", () => {

            mouse.x = null;
            mouse.y = null;

        });


        function drawNetwork() {

            ctx.clearRect(0, 0, width, height);


            /* Move nodes */

            nodes.forEach((node) => {

                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 0 || node.x > width) {
                    node.vx *= -1;
                }

                if (node.y < 0 || node.y > height) {
                    node.vy *= -1;
                }


                /* Mouse interaction */

                if (mouse.x !== null) {

                    const dx = mouse.x - node.x;
                    const dy = mouse.y - node.y;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 140 && distance > 0) {

                        node.x -= dx * 0.0015;
                        node.y -= dy * 0.0015;

                    }

                }

            });


            /* Connections */

            for (let i = 0; i < nodes.length; i++) {

                for (let j = i + 1; j < nodes.length; j++) {

                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 145) {

                        const opacity =
                            (1 - distance / 145) * 0.20;

                        ctx.beginPath();

                        ctx.moveTo(
                            nodes[i].x,
                            nodes[i].y
                        );

                        ctx.lineTo(
                            nodes[j].x,
                            nodes[j].y
                        );

                        ctx.strokeStyle =
                            `rgba(37, 99, 235, ${opacity})`;

                        ctx.lineWidth = 1;

                        ctx.stroke();

                    }

                }

            }


            /* Draw nodes */

            nodes.forEach((node, index) => {

                ctx.beginPath();

                ctx.arc(
                    node.x,
                    node.y,
                    node.radius,
                    0,
                    Math.PI * 2
                );

                if (index % 3 === 0) {

                    ctx.fillStyle =
                        "rgba(20, 184, 166, 0.55)";

                } else if (index % 5 === 0) {

                    ctx.fillStyle =
                        "rgba(124, 58, 237, 0.45)";

                } else {

                    ctx.fillStyle =
                        "rgba(37, 99, 235, 0.50)";

                }

                ctx.fill();

            });


            requestAnimationFrame(drawNetwork);

        }


        resizeCanvas();

        window.addEventListener(
            "resize",
            resizeCanvas
        );

        drawNetwork();
    }


    /* =====================================
       5. HERO MOUSE PARALLAX
    ===================================== */

    const heroContent =
        document.querySelector(".hero-content");

    if (hero && heroContent) {

        hero.addEventListener("mousemove", (event) => {

            if (window.innerWidth < 900) return;

            const rect = hero.getBoundingClientRect();

            const x =
                (event.clientX - rect.left) / rect.width - 0.5;

            const y =
                (event.clientY - rect.top) / rect.height - 0.5;

            heroContent.style.transform =
                `translate3d(
                    ${x * 5}px,
                    ${y * 4}px,
                    0
                )`;

        });


        hero.addEventListener("mouseleave", () => {

            heroContent.style.transform =
                "translate3d(0,0,0)";

        });

    }

});
