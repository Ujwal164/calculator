(function(){
  // Cache DOM elements for better performance
  const body = document.body;
  const themeBtn = document.getElementById('themeBtn');
  const exprEl = document.getElementById('expr');
  const outEl = document.getElementById('output');
  const keys = document.querySelectorAll('button.key');

  // State management
  let expression = '';
  let result = null;
  let isCalculating = false;

  // Load theme from localStorage with fallback
  const saved = localStorage.getItem('calc-theme') || 'light';
  body.setAttribute('data-theme', saved);
  themeBtn.setAttribute('aria-pressed', String(saved === 'dark'));

  // Theme toggle with smooth transition
  themeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('calc-theme', nextTheme);
    themeBtn.setAttribute('aria-pressed', String(nextTheme === 'dark'));
  });

  // Debounced display update for better performance
  let updateTimeout;
  function updateDisplay(){
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      exprEl.textContent = expression || '\u00A0';
      outEl.textContent = (result === null) ? (expression || '0') : String(result);
    }, 10);
  }

  // Enhanced safe evaluation with better error handling
  function safeEval(expr){
    try {
      // More comprehensive validation
      if(!/^[0-9+\-*/(). %]+$/.test(expr)) {
        throw new Error('Invalid characters detected');
      }
      
      // Prevent division by zero
      if(/\/0(?!\.)/.test(expr)) {
        throw new Error('Division by zero');
      }
      
      // Handle percentage conversion
      expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
      
      // Use Function constructor for safer evaluation
      const result = Function('return (' + expr + ')')();
      
      // Check for valid number
      if (!isFinite(result)) {
        throw new Error('Invalid result');
      }
      
      return result;
    } catch (error) {
      console.warn('Calculation error:', error.message);
      throw error;
    }
  }

  // Enhanced value input with better validation
  function pressValue(v){
    if (isCalculating) return;
    
    // Prevent multiple leading zeros
    if(v === '.' && /\.[0-9]*$/.test(expression)) return;
    
    // Prevent consecutive operators (except for negative numbers)
    if(/[+\-*/]$/.test(expression) && /[+\-*/]/.test(v)) {
      // Allow negative numbers after operators
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

  // Enhanced action handling
  function handleAction(action){
    if (isCalculating) return;
    
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
        
        isCalculating = true;
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
        } finally {
          isCalculating = false;
        }
        break;
    }
    updateDisplay();
  }

  // Event delegation for better performance
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

  // Enhanced keyboard support with better key handling
  window.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT') return; // Don't interfere with form inputs
    
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

  // Initial display
  updateDisplay();
  
  // Register service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
})();