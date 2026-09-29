"use strict";

const canvas = document.getElementById("plane");
const ctx = canvas.getContext("2d");
const C = 200, U = 120;            // центр и размер R в пикселях
const KEY = "lab1_12702";
let results = [];

// координаты в долях R -> пиксели
const px = u => C + u * U;
const py = u => C - u * U;

// рисуем область, оси и точки
function draw() {
  ctx.clearRect(0, 0, 400, 400);

  ctx.fillStyle = "rgba(22, 181, 181, 0.30)";
  ctx.beginPath();                                      // треугольник
  ctx.moveTo(px(0), py(0)); ctx.lineTo(px(1), py(0)); ctx.lineTo(px(0), py(1));
  ctx.fill();
  ctx.beginPath();                                      // четверть круга
  ctx.moveTo(C, C); ctx.arc(C, C, U, Math.PI, 1.5 * Math.PI); ctx.fill();
  ctx.beginPath();                                      // прямоугольник
  ctx.moveTo(px(0), py(0)); ctx.lineTo(px(1), py(0));
  ctx.lineTo(px(1), py(-1)); ctx.lineTo(px(0), py(-1)); ctx.fill();

  ctx.strokeStyle = ctx.fillStyle = "#7a2447";         // оси
  ctx.beginPath();
  ctx.moveTo(0, C); ctx.lineTo(400, C); ctx.moveTo(C, 0); ctx.lineTo(C, 400);
  ctx.stroke();
  ctx.font = "12px Arial";
  ctx.fillText("x", 388, C + 14); ctx.fillText("y", C + 5, 12);
  [["R", 1], ["R/2", 0.5], ["-R/2", -0.5], ["-R", -1]].forEach(([t, u]) => {
    ctx.fillText(t, px(u) - 8, C + 16);                // подписи по X
    ctx.fillText(t, C + 6, py(u) + 4);                 // подписи по Y
  });

  results.forEach(r => {                               // точки (нормируем на R)
    ctx.beginPath();
    ctx.arc(px(r.x / r.r), py(r.y / r.r), 4, 0, 2 * Math.PI);
    ctx.fillStyle = r.hit ? "#2e7d32" : "#b3121f";
    ctx.fill();
  });
}

// попадание точки в область
function isHit(x, y, r) {
  return (x >= 0 && y >= 0 && x + y <= r) ||             // треугольник
         (x <= 0 && y >= 0 && x * x + y * y <= r * r) || // четверть круга
         (x >= 0 && y <= 0 && x <= r && y >= -r);        // прямоугольник
}

// дата в русском формате и поясе устройства
function fmt(ts) {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

// добавить строку в таблицу
function addRow(r) {
  const tr = document.getElementById("results-body").insertRow();
  tr.insertCell().textContent = r.x;
  tr.insertCell().textContent = r.y;
  tr.insertCell().textContent = r.r;
  const res = tr.insertCell();
  res.textContent = r.hit ? "Попадание" : "Промах";
  res.setAttribute("data-hit", r.hit ? "yes" : "no");
  tr.insertCell().textContent = fmt(r.ts);
}

// выбор значения в группе кнопок (X или R)
function pickGroup(groupId, inputId) {
  const group = document.getElementById(groupId);
  group.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    group.querySelectorAll("button").forEach(b => b.removeAttribute("data-active"));
    e.target.setAttribute("data-active", "true");
    document.getElementById(inputId).value = e.target.dataset.value;
  });
}

// показать фото на весь экран, само скроется через 2.5 с
let hideTimer;
function showHit() {
  const overlay = document.getElementById("hit-overlay");
  overlay.setAttribute("data-show", "true");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => overlay.removeAttribute("data-show"), 2500);
}

window.addEventListener("DOMContentLoaded", () => {
  pickGroup("x-buttons", "x-value");
  pickGroup("r-buttons", "r-value");

  results = JSON.parse(localStorage.getItem(KEY) || "[]");  // загрузка из памяти
  results.forEach(addRow);
  draw();

  const err = document.getElementById("error-box");

  document.getElementById("point-form").addEventListener("submit", e => {
    e.preventDefault();                                     // без перезагрузки
    const x = document.getElementById("x-value").value;
    const r = document.getElementById("r-value").value;
    const yRaw = document.getElementById("y-value").value.trim().replace(",", ".");

    if (x === "") return err.textContent = "Выберите X.";   // проверка ввода
    if (r === "") return err.textContent = "Выберите R.";
    if (!/^-?\d+(\.\d+)?$/.test(yRaw)) return err.textContent = "Y должно быть числом.";
    const y = parseFloat(yRaw);
    if (y < -3 || y > 5) return err.textContent = "Y должно быть от -3 до 5.";
    err.textContent = "";

    const rec = { x: +x, y, r: +r, hit: isHit(+x, y, +r), ts: Date.now() };
    results.push(rec);
    localStorage.setItem(KEY, JSON.stringify(results));     // сохранение
    addRow(rec);
    draw();
    if (rec.hit) showHit();                                 // попали — показываем фото
  });

  // клик по фото закрывает его сразу
  document.getElementById("hit-overlay").addEventListener("click", e => {
    e.currentTarget.removeAttribute("data-show");
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    results = [];
    localStorage.removeItem(KEY);
    document.getElementById("results-body").innerHTML = "";
    draw();
  });
});
