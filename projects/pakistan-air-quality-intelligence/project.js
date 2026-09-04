document.addEventListener("DOMContentLoaded", () => {
    const foldChart = document.querySelector("[data-fold-chart]");
    const metricButtons = [...document.querySelectorAll("[data-validation-metric]")];
    const foldLabel = document.querySelector("[data-fold-label]");
    const foldValue = document.querySelector("[data-fold-value]");
    const foldDetail = document.querySelector("[data-fold-detail]");
    const axisHigh = document.querySelector("[data-axis-high]");
    const axisMid = document.querySelector("[data-axis-mid]");

    const folds = [
        { fold: 1, model: 25.15, baseline: 26.63, improvement: 5.54 },
        { fold: 2, model: 32.03, baseline: 33.81, improvement: 5.26 },
        { fold: 3, model: 37.57, baseline: 41.71, improvement: 9.92 },
        { fold: 4, model: 33.00, baseline: 34.28, improvement: 3.74 },
        { fold: 5, model: 33.04, baseline: 35.99, improvement: 8.22 }
    ];

    let validationMetric = "model";
    let selectedFold = 2;

    const metricName = {
        model: "model mean absolute error",
        baseline: "persistence baseline mean absolute error",
        improvement: "percentage improvement over persistence"
    };

    const updateFoldSummary = (item) => {
        if (!foldLabel || !foldValue || !foldDetail) return;
        foldLabel.textContent = `Fold ${item.fold}`;
        foldValue.textContent = validationMetric === "improvement"
            ? `${item.improvement.toFixed(2)}% improvement over baseline`
            : `${item[validationMetric].toFixed(2)} µg/m³ ${validationMetric === "model" ? "model" : "baseline"} MAE`;
        foldDetail.textContent = `${item.model.toFixed(2)} model MAE · ${item.baseline.toFixed(2)} baseline MAE · ${item.improvement.toFixed(2)}% improvement`;
    };

    const renderFoldChart = () => {
        if (!foldChart) return;
        const values = folds.map((item) => item[validationMetric]);
        const increment = validationMetric === "improvement" ? 2 : 5;
        const maximum = Math.ceil(Math.max(...values) / increment) * increment;

        foldChart.replaceChildren();
        foldChart.setAttribute("aria-label", `${metricName[validationMetric]} across five chronological validation folds`);
        if (axisHigh) axisHigh.textContent = validationMetric === "improvement" ? `${maximum}%` : String(maximum);
        if (axisMid) axisMid.textContent = validationMetric === "improvement" ? `${maximum / 2}%` : String(maximum / 2);

        folds.forEach((item, index) => {
            const button = document.createElement("button");
            const bar = document.createElement("i");
            const label = document.createElement("span");
            const valueLabel = document.createElement("small");
            const value = item[validationMetric];

            button.type = "button";
            button.className = `aq-fold-bar${index === selectedFold ? " is-selected" : ""}`;
            button.style.setProperty("--bar-height", `${Math.max(4, value / maximum * 100)}%`);
            button.setAttribute("role", "listitem");
            button.setAttribute(
                "aria-label",
                `Fold ${item.fold}: ${item.model.toFixed(2)} model MAE, ${item.baseline.toFixed(2)} baseline MAE, ${item.improvement.toFixed(2)} percent improvement`
            );

            label.textContent = `Fold ${item.fold}`;
            valueLabel.textContent = validationMetric === "improvement" ? `${value.toFixed(2)}%` : value.toFixed(2);
            bar.setAttribute("aria-hidden", "true");
            label.setAttribute("aria-hidden", "true");
            valueLabel.setAttribute("aria-hidden", "true");
            button.append(bar, label, valueLabel);

            const selectFold = () => {
                selectedFold = index;
                foldChart.querySelectorAll(".aq-fold-bar").forEach((candidate) => candidate.classList.remove("is-selected"));
                button.classList.add("is-selected");
                updateFoldSummary(item);
            };

            button.addEventListener("click", selectFold);
            button.addEventListener("focus", selectFold);
            foldChart.append(button);
        });

        updateFoldSummary(folds[selectedFold]);
    };

    metricButtons.forEach((button) => {
        button.addEventListener("click", () => {
            validationMetric = button.dataset.validationMetric;
            metricButtons.forEach((candidate) => {
                const active = candidate === button;
                candidate.classList.toggle("is-active", active);
                candidate.setAttribute("aria-pressed", String(active));
            });
            renderFoldChart();
        });
    });

    renderFoldChart();

    const modelButtons = [...document.querySelectorAll("[data-model-index]")];
    const modelNote = document.querySelector("[data-model-note]");
    const modelNotes = [
        "The persistence baseline predicts that tomorrow will equal today. Its average MAE of 34.48 is the minimum standard every learned model must beat.",
        "The direct-target Random Forest reduced average MAE to 33.20, a 2.84% improvement, but it did not beat persistence in the first fold.",
        "Predicting the next-day change instead of the raw level lowered average MAE to 32.34 and improved on persistence by 6.12%.",
        "The enhanced change model adds short-term pollution and weather momentum plus annual seasonality. It delivered the lowest average MAE."
    ];

    modelButtons.forEach((button) => {
        const selectModel = () => {
            modelButtons.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === button));
            if (modelNote) modelNote.textContent = modelNotes[Number(button.dataset.modelIndex)];
        };
        button.addEventListener("click", selectModel);
        button.addEventListener("focus", selectModel);
    });

    const featureChart = document.querySelector("[data-feature-chart]");
    const featureButtons = [...document.querySelectorAll("[data-feature-view]")];
    const featureViews = {
        groups: [
            ["PM2.5 history", 83.3],
            ["Weather", 16.7]
        ],
        features: [
            ["3-day PM2.5 mean", 39.93],
            ["Current PM2.5", 30.78],
            ["PM2.5 lag 1", 6.89],
            ["Temperature", 5.90],
            ["Wind speed", 5.39],
            ["7-day PM2.5 mean", 3.66],
            ["Humidity", 3.19],
            ["Precipitation", 2.21],
            ["PM2.5 lag 3", 1.13],
            ["PM2.5 lag 2", 0.94]
        ]
    };

    const renderFeatures = (view) => {
        if (!featureChart) return;
        const values = featureViews[view];
        const maximum = Math.max(...values.map((item) => item[1]));
        featureChart.replaceChildren();

        values.forEach(([label, value]) => {
            const row = document.createElement("div");
            const name = document.createElement("span");
            const track = document.createElement("i");
            const fill = document.createElement("b");
            const number = document.createElement("strong");

            row.className = "aq-feature-row";
            row.style.setProperty("--feature-width", `${value / maximum * 100}%`);
            name.textContent = label;
            number.textContent = `${value.toFixed(view === "groups" ? 1 : 2)}%`;
            track.setAttribute("aria-hidden", "true");
            track.append(fill);
            row.append(name, track, number);
            featureChart.append(row);
        });
    };

    featureButtons.forEach((button) => {
        button.addEventListener("click", () => {
            featureButtons.forEach((candidate) => {
                const active = candidate === button;
                candidate.classList.toggle("is-active", active);
                candidate.setAttribute("aria-pressed", String(active));
            });
            renderFeatures(button.dataset.featureView);
        });
    });

    renderFeatures("groups");
});
