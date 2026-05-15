/* ============================================
   추천 알고리즘 편향 분석 실험실 - script.js
   ============================================ */

// ── 데이터 상수 ──────────────────────────────
const ITEMS = [
  "축구",
  "농구",
  "야구",
  "테니스",
  "수영",
  "독서",
  "영화",
  "음악",
  "게임",
  "요리",
  "여행",
  "사진",
];

const ITEM_COLORS = {
  축구: "#4d9ef7",
  농구: "#3ecf8e",
  야구: "#f5a623",
  테니스: "#f56565",
  수영: "#7c6af7",
  독서: "#e879a0",
  영화: "#38bdf8",
  음악: "#a78bfa",
  게임: "#fb923c",
  요리: "#34d399",
  여행: "#60a5fa",
  사진: "#f472b6",
};

const initialUsers = [
  { name: "U1", items: ["축구", "농구", "영화"] },
  { name: "U2", items: ["독서", "음악", "여행"] },
  { name: "U3", items: ["게임", "영화", "요리"] },
  { name: "U4", items: ["축구", "수영", "테니스"] },
  { name: "U5", items: ["음악", "사진", "여행"] },
  { name: "U6", items: ["야구", "농구", "게임"] },
  { name: "U7", items: ["요리", "독서", "사진"] },
  { name: "U8", items: ["수영", "영화", "음악"] },
];

// ── 상태 변수 ─────────────────────────────────
let selectedInterests = [];
let injectedItem = null;
let biasedUsers = JSON.parse(JSON.stringify(initialUsers));
let baseRecResult = null;
let biasedRecResult = null;
let fixedRecResult = null;
let weights = {};
let compareChart = null;
let fixChart = null;
let currentTab = 0;

ITEMS.forEach((it) => (weights[it] = 1.0));

// ── 초기화 ───────────────────────────────────
function init() {
  buildInterestButtons();
  buildInjectButtons();
  renderUserList("user-list", initialUsers, null);
  renderUserList("biased-user-list", biasedUsers, null);
  buildStepIndicator();
}

// ── 단계 표시기 ──────────────────────────────
function buildStepIndicator() {
  const el = document.getElementById("step-indicator");
  el.innerHTML = "";
  ["01", "02", "03", "04"].forEach((n, i) => {
    if (i > 0) {
      const line = document.createElement("div");
      line.className = "step-line";
      el.appendChild(line);
    }
    const dot = document.createElement("div");
    dot.className =
      "step-dot" +
      (i === currentTab ? " active" : i < currentTab ? " done" : "");
    dot.textContent = n;
    dot.onclick = () => switchTab(i);
    el.appendChild(dot);
  });
}

// ── 탭 전환 ──────────────────────────────────
function switchTab(idx) {
  currentTab = idx;
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === idx);
  });
  document.querySelectorAll(".panel").forEach((p, i) => {
    p.classList.toggle("active", i === idx);
  });
  buildStepIndicator();
  if (idx === 2) renderComparison();
  if (idx === 3) {
    buildWeightSliders();
    renderFixChart();
  }
}

// ── 관심사 버튼 생성 ─────────────────────────
function buildInterestButtons() {
  const el = document.getElementById("interest-buttons");
  el.innerHTML = "";
  ITEMS.forEach((it) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = it;
    btn.onclick = () => toggleInterest(it, btn);
    el.appendChild(btn);
  });
}

// ── 편향 삽입 버튼 생성 ──────────────────────
function buildInjectButtons() {
  const el = document.getElementById("inject-buttons");
  el.innerHTML = "";
  ITEMS.forEach((it) => {
    const btn = document.createElement("button");
    btn.className = "tag-btn";
    btn.textContent = it;
    btn.onclick = () => toggleInject(it);
    el.appendChild(btn);
  });
}

// ── 관심사 토글 ──────────────────────────────
function toggleInterest(item, btn) {
  if (selectedInterests.includes(item)) {
    selectedInterests = selectedInterests.filter((x) => x !== item);
    btn.classList.remove("selected");
  } else {
    if (selectedInterests.length >= 4) return;
    selectedInterests.push(item);
    btn.classList.add("selected");
  }
  document.getElementById("sel-count-badge").textContent =
    selectedInterests.length + " / 4";
}

// ── 삽입 항목 토글 ───────────────────────────
function toggleInject(item) {
  document
    .querySelectorAll("#inject-buttons .tag-btn")
    .forEach((b) => b.classList.remove("inject-selected"));
  if (injectedItem === item) {
    injectedItem = null;
    return;
  }
  injectedItem = item;
  document.querySelectorAll("#inject-buttons .tag-btn").forEach((b) => {
    if (b.textContent === item) b.classList.add("inject-selected");
  });
}

// ── 사용자 목록 렌더링 ───────────────────────
function renderUserList(containerId, data, biasedItemArg) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  data.forEach((u) => {
    const row = document.createElement("div");
    row.className = "user-row";

    const nameEl = document.createElement("span");
    nameEl.className = "user-name";
    nameEl.textContent = u.name;
    row.appendChild(nameEl);

    const tags = document.createElement("div");
    tags.className = "user-tags";

    // 중복 제거 후 표시 (편향 항목은 1회만 강조)
    const seen = {};
    u.items.forEach((it) => {
      const isBiased = biasedItemArg && it === biasedItemArg;
      if (!seen[it]) {
        seen[it] = true;
        const t = document.createElement("span");
        t.className = "utag" + (isBiased ? " biased" : "");
        t.textContent =
          it + (isBiased ? ` ×${u.items.filter((x) => x === it).length}` : "");
        tags.appendChild(t);
      }
    });
    row.appendChild(tags);
    el.appendChild(row);
  });
}

// ── Jaccard 유사도 계산 ─────────────────────
function computeSimilarity(userItems, targetItems) {
  const common = userItems.filter((x) => targetItems.includes(x)).length;
  const union = new Set([...userItems, ...targetItems]).size;
  return union === 0 ? 0 : common / union;
}

// ── 추천 알고리즘 (유사도 기반 협업 필터링) ──
function recommend(targetItems, userData, weightMap) {
  const scores = {};
  userData.forEach((u) => {
    const sim = computeSimilarity(targetItems, u.items);
    if (sim === 0) return;
    u.items.forEach((it) => {
      if (!targetItems.includes(it)) {
        const w = weightMap && weightMap[it] != null ? weightMap[it] : 1.0;
        scores[it] = (scores[it] || 0) + sim * w;
      }
    });
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

// ── 추천 결과 렌더링 ─────────────────────────
function renderRecs(containerId, recs, color) {
  const el = document.getElementById(containerId);
  if (!recs || recs.length === 0) {
    el.innerHTML =
      '<div class="empty">관심사를 선택하고 추천을 실행하세요</div>';
    return;
  }
  const maxScore = recs[0][1];
  el.innerHTML = "";
  recs.forEach(([name, score], i) => {
    const div = document.createElement("div");
    div.className = "rec-item";
    div.innerHTML = `
      <span class="rec-rank">#${i + 1}</span>
      <span class="rec-name">${name}</span>
      <div class="rec-bar-wrap">
        <div class="rec-bar" style="width:${Math.round(
          (score / maxScore) * 100
        )}%;background:${color || "#4d9ef7"}"></div>
      </div>
      <span class="rec-score">${score.toFixed(3)}</span>`;
    el.appendChild(div);
  });
}

// ── 1단계: 기본 추천 실행 ───────────────────
function runBaseRec() {
  if (selectedInterests.length < 2) {
    alert("관심사를 최소 2개 이상 선택하세요.");
    return;
  }
  baseRecResult = recommend(selectedInterests, initialUsers, null);
  renderRecs("base-recs", baseRecResult, "#4d9ef7");
}

// ── 2단계: 편향 적용 ─────────────────────────
function applyBias() {
  const strength = parseInt(document.getElementById("bias-strength").value);
  const userCount = parseInt(document.getElementById("bias-users").value);

  biasedUsers = JSON.parse(JSON.stringify(initialUsers));

  if (injectedItem) {
    for (let i = 0; i < Math.min(userCount, biasedUsers.length); i++) {
      // 이미 있는 항목을 제거하고 strength 만큼 반복 추가
      biasedUsers[i].items = biasedUsers[i].items.filter(
        (x) => x !== injectedItem
      );
      for (let b = 0; b < strength; b++) {
        biasedUsers[i].items.push(injectedItem);
      }
    }
    document.getElementById(
      "bias-badge"
    ).textContent = `편향: ${injectedItem} (×${strength}, ${userCount}명)`;
    document.getElementById(
      "bias-alert"
    ).innerHTML = `<div class="alert alert-warning">
        *주의* <strong>"${injectedItem}"</strong> 항목이 ${userCount}명의 데이터에 각각 <strong>${strength}회</strong> 반복 삽입되었습니다.<br>
        이로 인해 알고리즘은 이 항목을 과도하게 선호하는 것처럼 인식합니다.
      </div>`;
  } else {
    document.getElementById("bias-badge").textContent = "편향 없음";
    document.getElementById(
      "bias-alert"
    ).innerHTML = `<div class="alert alert-info">삽입할 항목을 위에서 선택하세요.</div>`;
  }

  renderUserList("biased-user-list", biasedUsers, injectedItem);
}

// ── 2단계: 편향 초기화 ──────────────────────
function resetBias() {
  biasedUsers = JSON.parse(JSON.stringify(initialUsers));
  injectedItem = null;
  document
    .querySelectorAll("#inject-buttons .tag-btn")
    .forEach((b) => b.classList.remove("inject-selected"));
  document.getElementById("bias-badge").textContent = "편향 없음";
  document.getElementById("bias-alert").innerHTML = "";
  document.getElementById("biased-recs").innerHTML =
    '<div class="empty">편향을 적용한 후 추천을 실행하세요</div>';
  renderUserList("biased-user-list", biasedUsers, null);
  biasedRecResult = null;
}

// ── 2단계: 편향 추천 실행 ──────────────────
function runBiasedRec() {
  if (selectedInterests.length < 2) {
    alert("1단계에서 관심사를 먼저 선택하세요.");
    return;
  }
  biasedRecResult = recommend(selectedInterests, biasedUsers, null);
  renderRecs("biased-recs", biasedRecResult, "#f5a623");
}

// ── 3단계: 비교 분석 렌더링 ─────────────────
function renderComparison() {
  if (!baseRecResult || !biasedRecResult) {
    document.getElementById("compare-alert").style.display = "block";
    document.getElementById("compare-alert").textContent =
      "1단계와 2단계에서 추천을 모두 실행한 후 비교 분석이 가능합니다.";
    return;
  }
  document.getElementById("compare-alert").style.display = "none";

  const baseNames = baseRecResult.map((x) => x[0]);
  const biasedNames = biasedRecResult.map((x) => x[0]);
  const overlap = baseNames.filter((x) => biasedNames.includes(x)).length;
  const diversityDrop = Math.round((1 - overlap / baseNames.length) * 100);

  // 편향 강도 판정
  let biasLevel = "낮음";
  if (injectedItem) {
    const rank = biasedNames.indexOf(injectedItem);
    if (rank === 0) biasLevel = "매우 높음";
    else if (rank <= 1) biasLevel = "높음";
    else if (rank <= 3) biasLevel = "중간";
  }

  document.getElementById("stat-overlap").textContent = overlap + "개";
  document.getElementById("stat-diversity").textContent =
    "-" + diversityDrop + "%";
  document.getElementById("stat-bias-score").textContent = biasLevel;

  renderRecs("compare-base", baseRecResult, "#4d9ef7");
  renderRecs("compare-biased", biasedRecResult, "#f5a623");

  // 점수 변화 목록
  const allItems = [...new Set([...baseNames, ...biasedNames])];
  const baseMap = Object.fromEntries(baseRecResult);
  const biasMap = Object.fromEntries(biasedRecResult);

  const dl = document.getElementById("delta-list");
  dl.innerHTML = "";
  allItems.slice(0, 8).forEach((it) => {
    const b = baseMap[it] || 0;
    const bv = biasMap[it] || 0;
    const diff = bv - b;
    const div = document.createElement("div");
    div.className = "delta-row";
    div.innerHTML = `
      <span class="delta-name">${it}</span>
      <span class="delta-val">원본: ${b.toFixed(3)}</span>
      <span class="delta-val">편향: ${bv.toFixed(3)}</span>
      <span class="${diff >= 0 ? "delta-up" : "delta-down"}">${
      diff >= 0 ? "+" : ""
    }${diff.toFixed(3)}</span>`;
    dl.appendChild(div);
  });

  // 비교 차트
  if (compareChart) compareChart.destroy();
  const chartLabels = allItems.slice(0, 8);
  compareChart = new Chart(document.getElementById("compareChart"), {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "원본",
          data: chartLabels.map((it) => +(baseMap[it] || 0).toFixed(3)),
          backgroundColor: "rgba(77,158,247,0.5)",
          borderColor: "#4d9ef7",
          borderWidth: 1,
        },
        {
          label: "편향 후",
          data: chartLabels.map((it) => +(biasMap[it] || 0).toFixed(3)),
          backgroundColor: "rgba(245,166,35,0.5)",
          borderColor: "#f5a623",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#8b93ab", font: { family: "Noto Sans KR" } },
        },
      },
      scales: {
        x: {
          ticks: { color: "#5a6278" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#5a6278", maxTicksLimit: 5 },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
    },
  });
}

// ── 4단계: 가중치 슬라이더 생성 ─────────────
function buildWeightSliders() {
  const el = document.getElementById("weight-sliders");
  el.innerHTML = "";

  // 편향된 추천 결과 항목을 우선 표시, 없으면 기본 항목
  const targets = biasedRecResult
    ? biasedRecResult.map((x) => x[0]).slice(0, 5)
    : ITEMS.slice(0, 5);

  targets.forEach((it) => {
    const safeId = "w-out-" + it;
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <span class="slider-label">${it}</span>
      <input type="range" min="0" max="2" step="0.1" value="${
        weights[it] != null ? weights[it] : 1
      }"
        oninput="weights['${it}']=parseFloat(this.value);document.getElementById('${safeId}').textContent=parseFloat(this.value).toFixed(1)">
      <span class="slider-val" id="${safeId}">${(weights[it] != null
      ? weights[it]
      : 1
    ).toFixed(1)}</span>`;
    el.appendChild(row);
  });
}

// ── 4단계: 개선 추천 실행 ───────────────────
function applyFix() {
  if (selectedInterests.length < 2) {
    alert("1단계에서 관심사를 먼저 선택하세요.");
    return;
  }
  // 균형 조정: 원본 데이터 사용 + 가중치 적용
  fixedRecResult = recommend(selectedInterests, initialUsers, weights);
  renderRecs("fixed-recs", fixedRecResult, "#3ecf8e");
  renderFixChart();
  renderConclusion();
}

// ── 4단계: 개선 초기화 ──────────────────────
function resetFix() {
  ITEMS.forEach((it) => (weights[it] = 1.0));
  fixedRecResult = null;
  buildWeightSliders();
  document.getElementById("fixed-recs").innerHTML =
    '<div class="empty">개선 도구를 적용한 후 결과가 표시됩니다</div>';
  document.getElementById("conclusion").innerHTML =
    '<div class="empty">개선을 적용하면 결론이 표시됩니다</div>';
  if (fixChart) {
    fixChart.destroy();
    fixChart = null;
  }
}

// ── 4단계: 3단계 비교 차트 ──────────────────
function renderFixChart() {
  if (!baseRecResult && !fixedRecResult) return;

  const allItems = [
    ...new Set([
      ...(baseRecResult || []).map((x) => x[0]),
      ...(biasedRecResult || []).map((x) => x[0]),
      ...(fixedRecResult || []).map((x) => x[0]),
    ]),
  ].slice(0, 8);

  const baseMap = Object.fromEntries(baseRecResult || []);
  const biasMap = Object.fromEntries(biasedRecResult || []);
  const fixMap = Object.fromEntries(fixedRecResult || []);

  if (fixChart) fixChart.destroy();
  fixChart = new Chart(document.getElementById("fixChart"), {
    type: "bar",
    data: {
      labels: allItems,
      datasets: [
        {
          label: "원본",
          data: allItems.map((it) => +(baseMap[it] || 0).toFixed(3)),
          backgroundColor: "rgba(77,158,247,0.5)",
          borderColor: "#4d9ef7",
          borderWidth: 1,
        },
        {
          label: "편향 후",
          data: allItems.map((it) => +(biasMap[it] || 0).toFixed(3)),
          backgroundColor: "rgba(245,166,35,0.5)",
          borderColor: "#f5a623",
          borderWidth: 1,
        },
        {
          label: "개선 후",
          data: allItems.map((it) => +(fixMap[it] || 0).toFixed(3)),
          backgroundColor: "rgba(62,207,142,0.5)",
          borderColor: "#3ecf8e",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#8b93ab", font: { family: "Noto Sans KR" } },
        },
      },
      scales: {
        x: {
          ticks: { color: "#5a6278" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#5a6278", maxTicksLimit: 5 },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
    },
  });
}

// ── 4단계: 탐구 결론 렌더링 ─────────────────
function renderConclusion() {
  const el = document.getElementById("conclusion");
  const biasItem = injectedItem || "특정 항목";

  el.innerHTML = `
    <div class="conclusion-item">
      <span class="ci-icon">1</span>
      <div>
        <div class="ci-title">추천 알고리즘은 데이터를 거울처럼 반영합니다</div>
        <div class="ci-body">
          유사도 기반 협업 필터링은 사용자 데이터의 분포를 그대로 학습합니다.
          데이터가 균형 잡혀 있으면 다양한 추천이, 특정 항목에 편향되면 편향된 추천이 나옵니다.
        </div>
      </div>
    </div>
    <div class="conclusion-item">
      <span class="ci-icon">2</span>
      <div>
        <div class="ci-title">편향의 영향: "${biasItem}" 항목의 과추천 현상</div>
        <div class="ci-body">
          "${biasItem}" 항목을 반복 삽입했을 때, 알고리즘은 실제 사용자 선호도가 아닌
          데이터의 빈도를 선호도로 착각하여 해당 항목을 상위에 추천했습니다.
          이것이 바로 <strong>필터 버블</strong>의 형성 원리입니다.
        </div>
      </div>
    </div>
    <div class="conclusion-item">
      <span class="ci-icon">3</span>
      <div>
        <div class="ci-title">개선 방법: 가중치 조절 + 데이터 균형 복원</div>
        <div class="ci-body">
          편향된 항목의 가중치를 낮추고, 원본 데이터 분포로 복원했을 때
          추천 결과가 다시 다양해지는 것을 확인할 수 있습니다.
          이는 실제 AI 시스템의 편향 완화 기법과 동일한 원리입니다.
        </div>
      </div>
    </div>
    <div class="conclusion-item">
      <span class="ci-icon">4</span>
      <div>
        <div class="ci-title">데이터 설계의 책임</div>
        <div class="ci-body">
          AI는 스스로 판단하지 않습니다. 입력된 데이터의 구조가 곧 AI의 판단 기준이 됩니다.
          따라서 데이터를 수집하고 설계하는 과정에서의 윤리적 책임이 매우 중요합니다.
        </div>
      </div>
    </div>`;
}

// ── 실행 ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
// api key 입력받아야함
