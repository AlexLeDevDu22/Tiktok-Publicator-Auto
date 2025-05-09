const ctx1 = document.getElementById("chart1").getContext("2d");
const ctx2 = document.getElementById("chart2").getContext("2d");
const lastDaysChoice = document.getElementById("container-last-days");
const totalRewards = document.getElementById("total-rewards");
const dashboard = document.getElementById("dashboard");

let currentChart = { left: null, right: null };
let glowScore = null;
let currentAccountIndex = 0;

const urlParams = new URLSearchParams(window.location.search);
let statsChoiced = urlParams.get("stat");

if (
  !["views", "likes", "pv", "comments", "shares", "follows"].includes(
    statsChoiced
  )
)
  statsChoiced = "views";

let accounts = [];

const formatNum = (num) => {
  return (
    num >= 1e9
      ? (num / 1e9).toFixed(1) + "B"
      : num >= 1e6
      ? (num / 1e6).toFixed(1) + "M"
      : num >= 1e3
      ? (num / 1e3).toFixed(1) + "K"
      : num
  )
    .toString()
    .replace(".", ",");
};

function selectLastDays(element) {
  document.querySelector(".last-days.selected").classList.remove("selected");
  element.classList.add("selected");

  // refresh the reward chart

  showChart(
    ctx1,
    generateDates(lastDaysChoice.value),
    initChartDatas(accounts[currentAccountIndex].stats.rewards, true),
    "left"
  );
  refreshDisplayStats();
}

function selectStats(statContainer) {
  statsChoiced = statContainer.getAttribute("name");
  document.querySelector(".stat-block-container.on")?.classList.remove("on");
  statContainer.classList.add("on");
  document.getElementById("chart2-title").textContent =
    statContainer.querySelector("h3").textContent;

  const url = new URL(window.location.href);
  url.searchParams.set("stat", statsChoiced);
  window.history.pushState({}, "", url);
  refreshDisplayStats();
}

function setGlowScore() {
  const lastNDays = 3;
  const previousNDays = 5;

  // Coefficients arbitraires (tu peux les ajuster à ta guise)
  const weights = {
    likes: 1.0,
    views: 0.8,
    follows: 1.2,
    shares: 1.0,
    comments: 0.9,
    pv: 0.7,
    rewards: 1.5,
  };

  function average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  function computeTrend(key) {
    const data = accounts[currentAccountIndex].stats[key] || [];
    const recentAvg = average(data.slice(-lastNDays));
    const pastAvg = average(
      data.slice(-(lastNDays + previousNDays), -lastNDays)
    );
    return (recentAvg - pastAvg) / (pastAvg || 1);
  }

  // Calcul du glowScore total pondéré
  glowScore = 0;
  for (const key in weights) {
    const trend = computeTrend(key);
    glowScore += trend * weights[key];
  }

  const comparisonPercentage = document.getElementById(
    "header-comparison-percentage"
  );
  const comparisonSVG = document.getElementById("svg-icon-comparison");

  comparisonPercentage.textContent =
    formatNum(parseInt(glowScore * 100)) + " %";

  if (glowScore > 0) {
    comparisonPercentage.style.color = "green";
    comparisonSVG.setAttribute("fill", "green");
    comparisonPercentage.style.bottom = "0px";
  } else if (glowScore < 0) {
    comparisonPercentage.style.color = "red";
    comparisonPercentage.style.top = "0px";
    comparisonSVG.setAttribute("fill", "red");
    comparisonSVG.style.transform = "scaleY(-1)";
  }
  comparisonSVG.style.opacity = 1;
}

async function initDisplayAccount() {
  try {
    if (!accounts[currentAccountIndex].stats) {
      // getting stats
      let response = await fetch(
        "/stats?account=" + accounts[currentAccountIndex].id
      );
      accounts[currentAccountIndex].stats = await response.json();
    }

    // convert rewards to euros
    response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    accounts[currentAccountIndex].stats.rewards = accounts[
      currentAccountIndex
    ].stats.rewards.map((reward) =>
      parseFloat((reward * data.rates.EUR).toFixed(2))
    );

    //show total rewards
    totalRewards.textContent = `${
      formatNum(
        accounts[currentAccountIndex].stats.rewards.reduce((a, b) => a + b, 0)
      ) || 0
    } €`;
    setTimeout(() => {
      totalRewards.style.opacity = 1;
    }, 600);

    setGlowScore();

    // init last day choice
    Array.from(document.querySelectorAll(".last-days")).forEach((element) => {
      element.addEventListener("click", () => {
        selectLastDays(element);
      });
      if (element.value == document) {
        selectLastDays(element);
      }
    });
    // init the stats choiced
    document.querySelectorAll(".stat-block-container").forEach((elem) => {
      elem.addEventListener("click", () => {
        selectStats(elem);
      });
      if (elem.getAttribute("name") == statsChoiced) {
        selectStats(elem);
      }
    });

    // init the reward chart
    showChart(
      ctx1,
      generateDates(lastDaysChoice.value),
      initChartDatas(accounts[currentAccountIndex].stats.rewards, true),
      "left"
    );

    refreshDisplayStats();
  } catch (error) {
    console.error("Failed to load stats:", error);
    dashboard.innerHTML = "<p>Error loading stats</p>";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Fetch the accounts first
  let response = await fetch("/accounts");
  accounts = await response.json();

  initDisplayAccount();
});
document.getElementById("container-profil").addEventListener("click", () => {
  currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
  initDisplayAccount();
});

function refreshDisplayStats() {
  ["views", "likes", "pv", "comments", "shares", "follows"].forEach((key) => {
    const realStat = [...accounts[currentAccountIndex].stats[key]];
    if (realStat.length > 0) {
      realStat[realStat.length - 1] =
        realStat[realStat.length - 1][realStat[realStat.length - 1].length - 1];
      const num = realStat
        .slice(-lastDaysChoice.value)
        .reduce((a, b) => a + (b || 0), 0);

      const statContainer = document.querySelector(
        '.stat-block-container[name="' + key + '"]'
      );
      statContainer.querySelector("h2").textContent = formatNum(num);

      showChart(
        ctx2,
        generateDates(lastDaysChoice.value),
        initChartDatas(accounts[currentAccountIndex].stats[statsChoiced]),
        "right"
      );
    }
  });
}

const generateDates = (input) => {
  const now = new Date();

  if (input === 1) {
    // Génère les heures de la journée
    return Array.from(
      { length: 24 },
      (_, i) => String(i).padStart(2, "0") + "h"
    );
  }

  if (input == -1)
    input = accounts[currentAccountIndex].stats[statsChoiced].length;

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "short" };
    return date.toLocaleDateString("en-GB", options);
  };

  const dates = [];

  for (let i = 1; i <= input; i++) {
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - i);
    dates.push(
      formatDate(pastDate) + (input >= 365 ? " " + pastDate.getFullYear() : "")
    );
  }

  return dates.reverse();
};

function initChartDatas(stat, isReward = false) {
  let newData = [...stat];
  if (lastDaysChoice.value != -1) newData = stat.slice(-lastDaysChoice.value);
  //newData[newData.length - 1] =
  //newData[newData.length - 1][newData[newData.length - 1].length - 1];
  if (isReward) {
    newData = newData.reduce((acc, value, i) => {
      if (i > 0) {
        acc.push(acc[i - 1] + value);
      } else {
        acc.push(value);
      }
      return acc;
    }, []);
  }
  return newData;
}

function showChart(ctx, labels, datas, side) {
  //console.log(datas);
  if (currentChart[side]) currentChart[side].destroy();
  // Création du dégradé linéaire plus accentué sous la courbe
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(
    0,
    side == "right" ? "rgba(75, 192, 192, 0.5)" : "rgba(192, 75, 85, 0.5)"
  ); // Couleur au début
  gradient.addColorStop(
    1,
    side == "right" ? "rgba(75, 192, 192, 0.1)" : "rgba(192, 75, 85, 0.1)"
  ); // Couleur plus claire en bas
  currentChart[side] = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: datas,
          backgroundColor: gradient, // Application du dégradé sous la courbe
          borderColor:
            side == "right" ? "rgba(75, 192, 192, 1)" : "rgba(192, 75, 75, 1)",
          borderWidth: 2,
          tension: side == "right" ? 0.5 : 0.2,
          pointBackgroundColor:
            side == "right" ? "rgba(54, 162, 235, 1)" : "rgba(235, 54, 70, 1)",
          pointRadius: datas.length < 100 ? 2 : 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor:
            side == "right"
              ? "rgba(175, 234, 244, 1)"
              : "rgba(244, 175, 181, 1)",
          fill: true, // Important pour afficher la zone remplie
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(0,0,0,0.7)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderWidth: 1,
          borderColor: "#ddd",
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "rgba(60, 60, 60, 1)",
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        y: {
          grid: {
            color: "rgba(30, 30, 30, 0.5)",
          },
          min: Math.min(0, Math.min.apply(Math, datas)),
          ticks: {
            color: "rgba(60, 60, 60, 1)",
            font: {
              size: 14,
              weight: "bold",
            },
            callback: function (value) {
              return formatNum(value);
            },
          },
          position: "right",
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}
