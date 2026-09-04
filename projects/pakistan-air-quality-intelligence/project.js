document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-forecast-form]");
    const dateInput = document.querySelector("#observation-date");
    const currentPM = document.querySelector("[data-current-pm]");
    const predictedPM = document.querySelector("[data-predicted-pm]");
    const predictedChange = document.querySelector("[data-predicted-change]");
    const forecastDate = document.querySelector("[data-forecast-date]");
    const errorLabel = document.querySelector("[data-error-label]");
    const message = document.querySelector("[data-console-message]");
    const comparisonTrack = document.querySelector("[data-comparison-track]");
    const forecastMarker = document.querySelector("[data-forecast-marker]");
    const actualMarker = document.querySelector("[data-actual-marker]");

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

    const formatDate = (dateString) => new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(`${dateString}T00:00:00Z`));

    const renderForecast = (record) => {
        const scaleMaximum = Math.max(record.current, record.predicted, record.actual);
        const predictedPosition = Math.min((record.predicted / scaleMaximum) * 100, 100);
        const actualPosition = Math.min((record.actual / scaleMaximum) * 100, 100);

        currentPM.textContent = record.current.toFixed(2);
        predictedPM.textContent = record.predicted.toFixed(2);
        predictedChange.textContent = `${record.change >= 0 ? "+" : ""}${record.change.toFixed(2)}`;
        forecastDate.textContent = `Forecast for ${formatDate(record.forecastDate)}`;
        errorLabel.textContent = `${record.error.toFixed(2)} absolute error`;
        forecastMarker.style.setProperty("--position", `${predictedPosition.toFixed(1)}%`);
        actualMarker.style.setProperty("--position", `${actualPosition.toFixed(1)}%`);
        forecastMarker.querySelector("span").textContent = record.predicted.toFixed(2);
        actualMarker.querySelector("span").textContent = `${record.actual.toFixed(2)} actual`;
        comparisonTrack.setAttribute(
            "aria-label",
            `Predicted PM2.5 ${record.predicted.toFixed(2)} compared with actual PM2.5 ${record.actual.toFixed(2)}`
        );
        message.textContent = "Historical model replay generated. Walk-forward validation results below remain the out-of-sample performance evidence.";

        predictedPM.closest("article").classList.remove("prediction-flash");
        window.requestAnimationFrame(() => predictedPM.closest("article").classList.add("prediction-flash"));
    };

    const loadForecasts = async () => {
        try {
            const response = await fetch("forecast-data.json?v=1");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = await response.json();
            const availableDates = Object.keys(payload.records || {});
            if (!availableDates.length) throw new Error("No forecast records found");

            forecastRecords = payload.records;
            dateInput.min = availableDates[0];
            dateInput.max = availableDates[availableDates.length - 1];
            message.textContent = `${availableDates.length.toLocaleString()} model-ready observation dates loaded. Choose a date and generate its next-day replay.`;
        } catch (error) {
            console.error("Unable to load forecast history:", error);
            message.textContent = "The full date history could not be loaded. The latest verified replay remains available.";
        }
    };

    if (form && dateInput) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const record = forecastRecords[dateInput.value];

            if (!record) {
                message.textContent = "No model-ready observation exists for this date because the required pollution history was unavailable. Choose another date.";
                return;
            }

            renderForecast(record);
        });

        loadForecasts();
    }

    const tabs = Array.from(document.querySelectorAll("[data-dashboard-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-dashboard-panel]"));

    const activatePanel = (selectedTab) => {
        const selectedPanelId = selectedTab.dataset.dashboardTab;

        tabs.forEach((tab) => {
            const isSelected = tab === selectedTab;
            tab.classList.toggle("is-active", isSelected);
            tab.setAttribute("aria-selected", String(isSelected));
        });

        panels.forEach((panel) => {
            const isSelected = panel.id === selectedPanelId;
            panel.hidden = !isSelected;
            panel.classList.toggle("is-active", isSelected);

            if (isSelected) {
                panel.classList.remove("panel-enter");
                window.requestAnimationFrame(() => panel.classList.add("panel-enter"));
            }
        });
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activatePanel(tab));
        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            activatePanel(tabs[nextIndex]);
        });
    });
});
