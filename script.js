const body = document.body;
const themeBtn = document.getElementById('themeBtn');
const exprEl = document.getElementById('expr');
const outEl = document.getElementById('output');

let expression = '';
let result = null;

// Loaading theme
const savedTheme = localStorage.getItem('calc-theme') || 'light';
body.setAttribute('data-theme', savedTheme);
themeBtn.setAttribute('aria-pressed', String(savedTheme === 'dark'));

// Theme-toggle
themeBtn.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  body.setAttribute('data-theme', nextTheme);
  localStorage.setItem('calc-theme', nextTheme);
  themeBtn.setAttribute('aria-pressed', String(nextTheme === 'dark'));
});

// Updates display
function updateDisplay() {
  exprEl.textContent = expression || '\u00A0';
  outEl.textContent = (result === null) ? (expression || '0') : String(result);
}

// Safe evluation
function safeEval(expr) {
  try {
    // Handle percentage
    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    
    const result = Function('return (' + expr + ')')();
    
    if (!isFinite(result)) {
      throw new Error('Invalid result');
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

// This handle number and operator input
function pressValue(v) {
  // Prevent multiple leading zeros
  if(v === '.' && /\.[0-9]*$/.test(expression)) return;
  
  // Prevent consecutive operators (except for negative numbers)
  if(/[+\-*/]$/.test(expression) && /[+\-*/]/.test(v)) {
    if (v === '-' && !expression.endsWith('-')) {
      expression += v;
    } else if (v !== '-') {
      return;
    }
  } else {
    expression += v;
  }
  
  result = null;
  updateDisplay();
}

// calculator actions
function handleAction(action) {
  switch(action) {
    case 'clear':
      expression = '';
      result = null;
      break;
    case 'back':
      expression = expression.slice(0, -1);
      break;
    case 'percent':
      if (expression && !expression.endsWith('%')) {
        expression += '%';
      }
      break;
    case 'equals':
      if (!expression.trim()) return;
      
      try {
        result = safeEval(expression);
        // Round to avoid floating point errors
        if (typeof result === 'number') {
          result = Math.round((result + Number.EPSILON) * 1e12) / 1e12;
        }
        expression = String(result);
      } catch(e) {
        result = 'Error';
        expression = '';
        // Auto-clear error after 2 seconds
        setTimeout(() => {
          if (result === 'Error') {
            result = null;
            expression = '';
            updateDisplay();
          }
        }, 2000);
      }
      break;
  }
  updateDisplay();
}

// Button clicks
document.addEventListener('click', (e) => {
  const key = e.target.closest('.key');
  if (!key) return;
  
  const v = key.dataset.value;
  const a = key.dataset.action;
  
  if (a) {
    handleAction(a);
  } else if (v) {
    pressValue(v);
  }
});

// keyboard support
window.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT') return;
  
  const key = ev.key.toLowerCase();
  
  if (key >= '0' && key <= '9') {
    pressValue(key);
    ev.preventDefault();
  } else if (['+', '-', '*', '/', '(', ')', '.'].includes(key)) {
    pressValue(key);
    ev.preventDefault();
  } else if (key === 'enter' || key === '=') {
    handleAction('equals');
    ev.preventDefault();
  } else if (key === 'backspace') {
    handleAction('back');
    ev.preventDefault();
  } else if (key === 'escape') {
    handleAction('clear');
    ev.preventDefault();
  } else if (key === '%') {
    handleAction('percent');
    ev.preventDefault();
  }
});

// Initial or start display
updateDisplay();