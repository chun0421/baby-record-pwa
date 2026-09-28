(() => {
  "use strict";

  let queued = false;
  const $ = selector => document.querySelector(selector);

  function syncMilkCards() {
    const target = $("#milkTarget");
    const weight = $("#weightValue");
    if (!target || !weight) return;

    const text = target.textContent || "";
    const match = text.match(/（\s*([\d.]+)\s*kg/);
    if (match) {
      const nextWeight = `${match[1]} kg`;
      const nextTarget = text.replace(/\s*（.*?）\s*/g, "").trim();
      if (weight.textContent !== nextWeight) weight.textContent = nextWeight;
      if (target.textContent !== nextTarget) target.textContent = nextTarget;
    } else if (text.includes("尚無") && weight.textContent !== "尚無紀錄") {
      weight.textContent = "尚無紀錄";
    }
  }

  function totalFromTitle(title) {
    const numbers = [...title.matchAll(/([\d.]+)\s*cc/g)].map(item => Number(item[1]));
    const total = numbers.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    return Math.round(total * 10) / 10;
  }

  function syncFeedingChartLabels() {
    const chart = $("#feedingChart");
    const active = $("#feedingPeriod button.active");
    if (!chart || !active) return;

    const showValues = active.dataset.days === "7";
    chart.classList.toggle("show-values", showValues);

    chart.querySelectorAll(".chart-column").forEach(column => {
      const stack = column.querySelector(".bar-stack");
      if (!stack) return;

      if (!stack.dataset.baseHeight) stack.dataset.baseHeight = stack.style.height || "";
      const valueNode = column.querySelector(".bar-value");

      if (!showValues) {
        if (valueNode) valueNode.remove();
        if (stack.dataset.baseHeight && stack.style.height !== stack.dataset.baseHeight) {
          stack.style.height = stack.dataset.baseHeight;
        }
        return;
      }

      const base = Number.parseFloat(stack.dataset.baseHeight || stack.style.height || "0");
      if (Number.isFinite(base)) {
        const scaled = `${Math.max(2, base * 0.76)}%`;
        if (stack.style.height !== scaled) stack.style.height = scaled;
      }

      const total = totalFromTitle(stack.title || "");
      const label = `${total} cc`;
      if (valueNode) {
        if (valueNode.textContent !== label) valueNode.textContent = label;
        return;
      }

      const next = document.createElement("strong");
      next.className = "bar-value";
      next.textContent = label;
      column.insertBefore(next, stack);
    });
  }

  function syncPreviewDashboard() {
    queued = false;
    syncMilkCards();
    syncFeedingChartLabels();
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(syncPreviewDashboard);
  }

  document.addEventListener("DOMContentLoaded", () => {
    queueSync();
    const app = $("#app") || document.body;
    new MutationObserver(queueSync).observe(app, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
})();
