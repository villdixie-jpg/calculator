/*DOM ELEMENTS
 Cache frequently accessed DOM elements*/
const display = document.getElementById("display");
const buttons = document.querySelectorAll(".btn");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const themeToggle = document.getElementById("themeToggle");

/*API CONFIGURATION
Base URL for the MathJS API*/
const BASE_URL = "https://api.mathjs.org/v4/";

/*APPLICATION STATE
Store the current input/expression*/
let rawExpression = "";

/*THEME TOGGLE
Switch between light and dark mode*/
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

/*FORMAT DISPLAY
Add commas to numbers for readability*/
function formatDisplay(expr) {
  return expr.replace(/\d+(\.\d+)?/g, (num) => {
    const parts = num.split(".");
    parts[0] = Number(parts[0]).toLocaleString("en-US");
    return parts.join(".");
  });
}

/*UI HELPERS
Update display and control loading state*/
function updateDisplay() {
  display.textContent = rawExpression ? formatDisplay(rawExpression) : "0";
}

function showLoading() {
  loading.classList.remove("hidden");
  buttons.forEach(btn => btn.disabled = true);
}

function hideLoading() {
  loading.classList.add("hidden");
  buttons.forEach(btn => btn.disabled = false);
}

/*API CALL
Send expression to MathJS API and return result*/
async function calculateAPI(expr) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expr })
  });

  if (!response.ok) throw new Error("Failed API call");
  return response.json();
}

/*BUTTON EVENT HANDLER
Handle input, clear, backspace, and calculation*/
buttons.forEach(button => {
  button.addEventListener("click", async () => {
    errorDiv.textContent = "";
    const value = button.dataset.value;

    // CLEAR button
    if (value === "C") {
      rawExpression = "";
      updateDisplay();
      return;
    }

    // BACKSPACE button
    if (value === "⌫") {
      rawExpression = rawExpression.slice(0, -1);
      updateDisplay();
      return;
    }

    // EQUALS button
    if (value === "=") {
      if (!rawExpression) {
        errorDiv.textContent = "Invalid input.";
        return;
      }

      try {
        showLoading();
        const data = await calculateAPI(rawExpression);

        if (!data.result) {
          errorDiv.textContent = "No results found.";
          return;
        }

        rawExpression = data.result.toString();
        updateDisplay();

      } catch (err) {
        errorDiv.textContent = err.message;
      } finally {
        hideLoading();
      }
      return;
    }

    // Prevent consecutive operators
    if (/[\+\-\*\/]$/.test(rawExpression) && /[\+\-\*\/]/.test(value)) {
      return;
    }

    // Append value to expression and update display
    rawExpression += value;
    updateDisplay();
  });
});
