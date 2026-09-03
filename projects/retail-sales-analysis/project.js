document.addEventListener("DOMContentLoaded", () => {
    const chart = document.querySelector("[data-daily-chart]");
    const metricButtons = [...document.querySelectorAll("[data-metric]")];
    const selectedDate = document.querySelector("[data-selected-date]");
    const selectedValue = document.querySelector("[data-selected-value]");
    const selectedDetail = document.querySelector("[data-selected-detail]");

    if (!chart || !selectedDate || !selectedValue || !selectedDetail) return;

    const dailyData = [
        [1, 323.36, 7, 46.19], [2, 656.37, 11, 59.67], [3, 465.05, 11, 42.28],
        [4, 433.90, 6, 72.32], [5, 222.98, 8, 27.87], [6, 539.67, 11, 49.06],
        [7, 558.34, 11, 50.76], [8, 492.48, 10, 49.25], [9, 119.70, 5, 23.94],
        [10, 661.16, 10, 66.12], [11, 506.16, 8, 63.27], [12, 553.40, 8, 69.18],
        [13, 563.17, 13, 43.32], [14, 798.02, 11, 72.55], [15, 535.85, 7, 76.55],
        [16, 298.55, 8, 37.32], [17, 575.42, 12, 47.95], [18, 760.34, 12, 63.36],
        [19, 247.77, 7, 35.40], [20, 241.37, 2, 120.69], [21, 1007.21, 13, 77.48],
        [22, 1147.62, 15, 76.51], [23, 515.32, 10, 51.53], [24, 509.06, 6, 84.84],
        [25, 264.25, 7, 37.75], [26, 476.74, 6, 79.46], [27, 1057.38, 11, 96.13],
        [28, 363.88, 10, 36.39], [29, 232.10, 10, 23.21], [30, 420.73, 11, 38.25]
    ].map(([day, sales, transactions, average]) => ({ day, sales, transactions, average }));

    let metric = "sales";
    let selectedIndex = 21;

    const formatNumber = (value) => value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const updateSummary = (item) => {
        selectedDate.textContent = `${item.day} September`;
        selectedValue.textContent = metric === "sales"
            ? `${formatNumber(item.sales)} total sales`
            : `${item.transactions} transactions`;
        selectedDetail.textContent = metric === "sales"
            ? `${item.transactions} transactions · ${formatNumber(item.average)} average`
            : `${formatNumber(item.sales)} total sales · ${formatNumber(item.average)} average`;
    };

    const renderChart = () => {
        const maximum = Math.max(...dailyData.map((item) => item[metric]));
        chart.replaceChildren();
        chart.setAttribute(
            "aria-label",
            metric === "sales"
                ? "Total sales by day for September 2020"
                : "Transaction count by day for September 2020"
        );

        dailyData.forEach((item, index) => {
            const button = document.createElement("button");
            const bar = document.createElement("i");
            const label = document.createElement("span");
            const value = item[metric];
            const showLabel = item.day === 1 || item.day % 5 === 0;

            button.type = "button";
            button.className = `daily-bar${index === selectedIndex ? " is-selected" : ""}`;
            button.style.setProperty("--bar-height", `${Math.max(3, value / maximum * 100)}%`);
            button.setAttribute("role", "listitem");
            button.setAttribute(
                "aria-label",
                metric === "sales"
                    ? `${item.day} September: ${formatNumber(item.sales)} total sales across ${item.transactions} transactions`
                    : `${item.day} September: ${item.transactions} transactions totalling ${formatNumber(item.sales)}`
            );

            bar.setAttribute("aria-hidden", "true");
            label.textContent = showLabel ? item.day : "";
            label.setAttribute("aria-hidden", "true");
            button.append(bar, label);

            const selectDay = () => {
                selectedIndex = index;
                chart.querySelectorAll(".daily-bar").forEach((candidate) => {
                    candidate.classList.remove("is-selected");
                });
                button.classList.add("is-selected");
                updateSummary(item);
            };

            button.addEventListener("click", selectDay);
            button.addEventListener("focus", selectDay);
            chart.append(button);
        });

        updateSummary(dailyData[selectedIndex]);
    };

    metricButtons.forEach((button) => {
        button.addEventListener("click", () => {
            metric = button.dataset.metric;
            metricButtons.forEach((candidate) => {
                const isActive = candidate === button;
                candidate.classList.toggle("is-active", isActive);
                candidate.setAttribute("aria-pressed", String(isActive));
            });
            renderChart();
        });
    });

    renderChart();
});
