document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-forecast-form]");
    const dateInput = document.querySelector("#observation-date");
    const currentPM = document.querySelector("[data-current-pm]");
    const predictedPM = document.querySelector("[data-predicted-pm]");
    const predictedChange = document.querySelector("[data-predicted-change]");
    const actualPM = document.querySelector("[data-actual-pm]");
    const forecastDate = document.querySelector("[data-forecast-date]");
    const errorLabel = document.querySelector("[data-error-label]");
    const message = document.querySelector("[data-console-message]");
    const historyChart = document.querySelector("[data-history-chart]");
    const observedPath = document.querySelector("[data-observed-path]");
    const forecastSegment = document.querySelector("[data-forecast-segment]");
    const currentPoint = document.querySelector("[data-current-point]");
    const forecastPoint = document.querySelector("[data-forecast-point]");
    const actualPoint = document.querySelector("[data-actual-point]");
    const chartHigh = document.querySelector("[data-chart-high]");
    const chartStart = document.querySelector("[data-chart-start]");
    const chartEnd = document.querySelector("[data-chart-end]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fallbackForecasts = {
        "2025-02-17": {
            current: 143.00,
            predicted: 165.04,
            change: 22.04,
            actual: 227.00,
            error: 61.96,
            forecastDate: "2025-02-18"
        }
    };

    let forecastRecords = fallbackForecasts;
    let availableDates = Object.keys(fallbackForecasts);

    const parseDate = (dateString) => new Date(`${dateString}T00:00:00Z`);
    const formatDate = (dateString) => new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(parseDate(dateString));

    const renderHistoryChart = (observationDate, record) => {
        if (!historyChart || !observedPath || !forecastSegment || !record) return;

        const selectedTime = parseDate(observationDate).getTime();
        const firstTime = selectedTime - (29 * 86400000);
        let history = availableDates
            .filter((date) => {
                const time = parseDate(date).getTime();
                return time >= firstTime && time <= selectedTime;
            })
            .map((date) => ({ date, time: parseDate(date).getTime(), value: forecastRecords[date].current }));

        if (history.length < 2) {
            const selectedIndex = availableDates.indexOf(observationDate);
            history = availableDates
                .slice(Math.max(0, selectedIndex - 14), selectedIndex + 1)
                .map((date) => ({ date, time: parseDate(date).getTime(), value: forecastRecords[date].current }));
        }

        const forecastTime = parseDate(record.forecastDate).getTime();
        const timelineStart = history[0].time;
        const timelineSpan = Math.max(forecastTime - timelineStart, 86400000);
        const values = [...history.map((item) => item.value), record.predicted, record.actual];
        const maximum = Math.max(50, Math.ceil(Math.max(...values) / 50) * 50);
        const x = (time) => 40 + (((time - timelineStart) / timelineSpan) * 550);
        const y = (value) => 144 - ((value / maximum) * 124);

        let path = "";
        history.forEach((item, index) => {
            const previous = history[index - 1];
            const gapDays = previous ? (item.time - previous.time) / 86400000 : 0;
            const command = index === 0 || gapDays > 2 ? "M" : "L";
            path += `${command}${x(item.time).toFixed(1)} ${y(item.value).toFixed(1)} `;
        });

        const currentX = x(selectedTime);
        const currentY = y(record.current);
        const nextX = x(forecastTime);
        const predictedY = y(record.predicted);
        const actualY = y(record.actual);

        observedPath.setAttribute("d", path.trim());
        forecastSegment.setAttribute("d", `M${currentX.toFixed(1)} ${currentY.toFixed(1)} L${nextX.toFixed(1)} ${predictedY.toFixed(1)}`);
        currentPoint.setAttribute("cx", currentX.toFixed(1));
        currentPoint.setAttribute("cy", currentY.toFixed(1));
        forecastPoint.setAttribute("cx", nextX.toFixed(1));
        forecastPoint.setAttribute("cy", predictedY.toFixed(1));
        actualPoint.setAttribute("cx", nextX.toFixed(1));
        actualPoint.setAttribute("cy", actualY.toFixed(1));
        chartHigh.textContent = maximum.toFixed(0);
        chartStart.textContent = formatDate(history[0].date);
        chartEnd.textContent = formatDate(record.forecastDate);
        historyChart.setAttribute(
            "aria-label",
            `Observed PM2.5 history from ${formatDate(history[0].date)} to ${formatDate(observationDate)}, followed by a ${record.predicted.toFixed(2)} forecast and ${record.actual.toFixed(2)} observed value for ${formatDate(record.forecastDate)}.`
        );

        observedPath.classList.remove("is-drawing");
        if (!reducedMotion) window.requestAnimationFrame(() => observedPath.classList.add("is-drawing"));
    };

    const renderForecast = (observationDate, record) => {
        currentPM.textContent = record.current.toFixed(2);
        predictedPM.textContent = record.predicted.toFixed(2);
        predictedChange.textContent = `${record.change >= 0 ? "+" : ""}${record.change.toFixed(2)}`;
        actualPM.textContent = record.actual.toFixed(2);
        errorLabel.textContent = record.error.toFixed(2);
        forecastDate.textContent = `Forecast for ${formatDate(record.forecastDate)}`;
        message.textContent = "Historical replay generated from the final fitted model. Chronological validation below provides the out-of-sample evidence.";
        renderHistoryChart(observationDate, record);
    };

    const loadForecasts = async () => {
        try {
            const response = await fetch("forecast-data.json?v=1");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            const dates = Object.keys(payload.records || {});
            if (!dates.length) throw new Error("No forecast records found");

            forecastRecords = payload.records;
            availableDates = dates;
            dateInput.min = dates[0];
            dateInput.max = dates[dates.length - 1];
            renderHistoryChart(dateInput.value, forecastRecords[dateInput.value]);
            message.textContent = `${dates.length.toLocaleString()} model-ready historical dates are available for replay.`;
        } catch (error) {
            console.error("Unable to load forecast history:", error);
            renderHistoryChart(dateInput.value, fallbackForecasts[dateInput.value]);
            message.textContent = "The full prediction history could not be loaded. The latest verified replay remains available.";
        }
    };

    if (form && dateInput) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const record = forecastRecords[dateInput.value];
            if (!record) {
                message.textContent = "This date is not model-ready because the required pollution history was unavailable. Choose another date.";
                return;
            }
            renderForecast(dateInput.value, record);
        });
        loadForecasts();
    }

    const initialiseAirfield = () => {
        const canvas = document.querySelector("[data-airfield]");
        const stage = canvas?.closest(".forecast-stage");
        const context = canvas?.getContext("2d");
        if (!canvas || !stage || !context) return;

        let width = 0;
        let height = 0;
        let particles = [];
        let animationFrame = 0;

        const createParticles = () => {
            const count = Math.min(38, Math.max(20, Math.round(width / 42)));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 0.6 + (Math.random() * 1.4),
                speed: 0.1 + (Math.random() * 0.22),
                drift: (Math.random() - 0.5) * 0.07,
                alpha: 0.16 + (Math.random() * 0.34)
            }));
        };

        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = stage.clientWidth;
            height = stage.clientHeight;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            createParticles();
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            particles.forEach((particle, index) => {
                for (let next = index + 1; next < particles.length; next += 1) {
                    const other = particles[next];
                    const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
                    if (distance < 125) {
                        context.beginPath();
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(other.x, other.y);
                        context.strokeStyle = `rgba(73, 226, 207, ${(1 - (distance / 125)) * 0.065})`;
                        context.lineWidth = 0.7;
                        context.stroke();
                    }
                }

                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(121, 226, 225, ${particle.alpha})`;
                context.fill();

                if (!reducedMotion) {
                    particle.x += particle.speed;
                    particle.y += particle.drift;
                    if (particle.x > width + 8) particle.x = -8;
                    if (particle.y > height + 8) particle.y = -8;
                    if (particle.y < -8) particle.y = height + 8;
                }
            });

            if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
        };

        resize();
        draw();
        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
    };

    initialiseAirfield();

    const animatedEvidence = document.querySelectorAll(".fold-chart, .model-results");
    if (reducedMotion || !("IntersectionObserver" in window)) {
        animatedEvidence.forEach((element) => element.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add("is-visible");
            });
        }, { threshold: 0.25 });
        animatedEvidence.forEach((element) => observer.observe(element));
    }
});
