const STORAGE_KEY = "love-calculator-history";
const HISTORY_PASSWORD_KEY = "love-calculator-history-password";
const MIN_PASSWORD_LENGTH = 4;

const loveForm = document.getElementById("loveForm");
const firstNameInput = document.getElementById("firstName");
const secondNameInput = document.getElementById("secondName");
const feedback = document.getElementById("feedback");
const resultPair = document.getElementById("resultPair");
const resultScore = document.getElementById("resultScore");
const historyList = document.getElementById("historyList");
const historyStatus = document.getElementById("historyStatus");
const historyFeedback = document.getElementById("historyFeedback");
const passwordSetupForm = document.getElementById("passwordSetupForm");
const newHistoryPasswordInput = document.getElementById("newHistoryPassword");
const unlockForm = document.getElementById("unlockForm");
const unlockPasswordInput = document.getElementById("unlockPassword");
const lockHistoryButton = document.getElementById("lockHistory");
const clearHistoryButton = document.getElementById("clearHistory");

let historyItems = loadHistory();
let historyPasswordHash = loadHistoryPasswordHash();
let isHistoryUnlocked = false;

initializeHistoryAccess();
renderHistory();

loveForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstName = normalizeName(firstNameInput.value);
  const secondName = normalizeName(secondNameInput.value);

  if (!firstName || !secondName) {
    feedback.textContent = "Please enter both names before calculating.";
    return;
  }

  const percentage = calculateLovePercentage(firstName, secondName);
  const pairLabel = `${firstName} + ${secondName}`;

  resultPair.textContent = pairLabel;
  resultScore.textContent = percentage;
  feedback.textContent = getFeedbackMessage(percentage);

  const historyEntry = {
    id: Date.now(),
    firstName,
    secondName,
    percentage,
    createdAt: new Date().toLocaleString(),
  };

  historyItems = [historyEntry, ...historyItems].slice(0, 12);
  saveHistory(historyItems);
  renderHistory();
  loveForm.reset();
  firstNameInput.focus();
});

passwordSetupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = newHistoryPasswordInput.value.trim();

  if (password.length < MIN_PASSWORD_LENGTH) {
    historyFeedback.textContent = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    return;
  }

  historyPasswordHash = hashPassword(password);
  saveHistoryPasswordHash(historyPasswordHash);
  isHistoryUnlocked = true;
  newHistoryPasswordInput.value = "";
  historyFeedback.textContent = "History password saved. Your memory box is now unlocked.";
  updateHistoryAccessUi();
  renderHistory();
});

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = unlockPasswordInput.value.trim();

  if (hashPassword(password) !== historyPasswordHash) {
    historyFeedback.textContent = "Incorrect password. Only authorized people can open this memory box.";
    return;
  }

  isHistoryUnlocked = true;
  unlockPasswordInput.value = "";
  historyFeedback.textContent = "History unlocked successfully.";
  updateHistoryAccessUi();
  renderHistory();
});

lockHistoryButton.addEventListener("click", () => {
  isHistoryUnlocked = false;
  historyFeedback.textContent = "History locked again.";
  updateHistoryAccessUi();
  renderHistory();
});

clearHistoryButton.addEventListener("click", () => {
  if (!isHistoryUnlocked) {
    historyFeedback.textContent = "Unlock the history before clearing saved names.";
    return;
  }

  historyItems = [];
  saveHistory(historyItems);
  renderHistory();
  feedback.textContent = "Saved couples cleared from your memory box.";
  historyFeedback.textContent = "Saved couples removed from the protected memory box.";
  resultPair.textContent = "Your match will appear here";
  resultScore.textContent = "--";
});

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function calculateLovePercentage(firstName, secondName) {
  const normalizedPair = [firstName.toLowerCase(), secondName.toLowerCase()].sort().join("|");
  let hash = 0;

  for (let index = 0; index < normalizedPair.length; index += 1) {
    hash = (hash * 31 + normalizedPair.charCodeAt(index)) % 101;
  }

  return Math.max(20, hash);
}

function getFeedbackMessage(percentage) {
  if (percentage >= 90) {
    return "An iconic match. The stars are definitely paying attention.";
  }

  if (percentage >= 75) {
    return "Strong chemistry. This pair has very sweet energy.";
  }

  if (percentage >= 55) {
    return "A promising connection with plenty of spark.";
  }

  if (percentage >= 35) {
    return "There is some potential here. A little charm can go a long way.";
  }

  return "Low score, but every great love story starts somewhere.";
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Unable to read saved love history.", error);
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadHistoryPasswordHash() {
  return localStorage.getItem(HISTORY_PASSWORD_KEY);
}

function saveHistoryPasswordHash(hash) {
  localStorage.setItem(HISTORY_PASSWORD_KEY, hash);
}

function initializeHistoryAccess() {
  if (!historyPasswordHash) {
    historyStatus.textContent = "Set a password to protect your saved couples before viewing the memory box.";
    passwordSetupForm.classList.remove("hidden");
    unlockForm.classList.add("hidden");
    clearHistoryButton.classList.add("hidden");
    lockHistoryButton.classList.add("hidden");
    return;
  }

  isHistoryUnlocked = false;
  updateHistoryAccessUi();
}

function updateHistoryAccessUi() {
  if (!historyPasswordHash) {
    historyStatus.textContent = "Set a password to protect your saved couples before viewing the memory box.";
    passwordSetupForm.classList.remove("hidden");
    unlockForm.classList.add("hidden");
    clearHistoryButton.classList.add("hidden");
    lockHistoryButton.classList.add("hidden");
    return;
  }

  if (isHistoryUnlocked) {
    historyStatus.textContent = "History unlocked. Only this browser session can see the saved couples right now.";
    passwordSetupForm.classList.add("hidden");
    unlockForm.classList.add("hidden");
    clearHistoryButton.classList.remove("hidden");
    lockHistoryButton.classList.remove("hidden");
    return;
  }

  historyStatus.textContent = "This memory box is locked. Enter the password to view the saved names.";
  passwordSetupForm.classList.add("hidden");
  unlockForm.classList.remove("hidden");
  clearHistoryButton.classList.add("hidden");
  lockHistoryButton.classList.add("hidden");
}

function renderHistory() {
  if (!historyPasswordHash) {
    historyList.innerHTML = '<p class="empty-state">Your saved couples are hidden until you create a history password.</p>';
    return;
  }

  if (!isHistoryUnlocked) {
    historyList.innerHTML = '<p class="empty-state">History is locked. Authorized viewers can unlock it to see saved names.</p>';
    return;
  }

  if (historyItems.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No couples saved yet. Your matches will appear here.</p>';
    return;
  }

  historyList.innerHTML = historyItems.map((item) => `
    <article class="history-item">
      <p class="history-names">${escapeHtml(item.firstName)} + ${escapeHtml(item.secondName)}</p>
      <p class="history-meta">
        <span>${escapeHtml(item.createdAt)}</span>
        <span class="history-score">${item.percentage}% match</span>
      </p>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hashPassword(password) {
  const saltedPassword = `love-lock:${password}:memory-box`;
  let hash = 5381;

  for (let index = 0; index < saltedPassword.length; index += 1) {
    hash = (hash * 33) ^ saltedPassword.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}
