/**
 * AI Job Displacement Counter - Frontend
 * Minimal counter with company attribution breakdown
 */

(function() {
  'use strict';

  const state = {
    connected: false,
    ws: null,
    counter: 0,
    counterDecimal: 0,
    targetCounter: 0,
    perSecond: 0,
    perDay: 0,
    perDayLow: 0,
    perDayHigh: 0,
    lastTick: Date.now(),
    animating: false,
    companiesRendered: false
  };

  const el = {
    status: document.getElementById('status'),
    counter: document.querySelector('#counter .counter-digits'),
    perDay: document.getElementById('per-day'),
    rangeLow: document.getElementById('range-low'),
    rangeHigh: document.getElementById('range-high'),
    companiesList: document.getElementById('companies-list'),
    companiesTotal: document.getElementById('companies-total')
  };

  function fmt(n) {
    return Math.floor(n).toLocaleString('en-US');
  }

  // WebSocket connection
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    state.ws = new WebSocket(`${protocol}//${location.host}`);
    
    state.ws.onopen = () => {
      state.connected = true;
      if (el.status) {
        el.status.classList.add('connected');
        el.status.querySelector('.status-text').textContent = 'LIVE';
      }
      if (!state.animating) {
        state.animating = true;
        animate();
      }
    };
    
    state.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'init' || msg.type === 'tick') {
          handleData(msg.data);
        }
      } catch (err) {
        console.error('Parse error:', err);
      }
    };
    
    state.ws.onclose = () => {
      state.connected = false;
      if (el.status) {
        el.status.classList.remove('connected');
        el.status.querySelector('.status-text').textContent = 'RECONNECTING';
      }
      setTimeout(connect, 2000);
    };
  }

  function handleData(data) {
    state.targetCounter = data.counterDecimal || data.counter;
    state.perSecond = data.perSecond || 0;
    state.perDay = data.perDay || 0;
    state.perDayLow = data.perDayLow || 0;
    state.perDayHigh = data.perDayHigh || 0;
    state.lastTick = Date.now();
    
    // Initialize on first data
    if (state.counter === 0 && data.counter > 0) {
      state.counter = data.counter;
      state.counterDecimal = data.counterDecimal || data.counter;
      
      // Render companies list once we have the total
      if (!state.companiesRendered) {
        renderCompanies(data.counter);
        state.companiesRendered = true;
      }
    }
    
    // Update static elements
    if (el.perDay) el.perDay.textContent = fmt(state.perDay);
    if (el.rangeLow) el.rangeLow.textContent = fmt(state.perDayLow);
    if (el.rangeHigh) el.rangeHigh.textContent = fmt(state.perDayHigh);
  }

  function animate() {
    if (!state.animating) return;
    
    const now = Date.now();
    const elapsed = (now - state.lastTick) / 1000;
    
    // Smooth interpolation toward target
    const diff = state.targetCounter - state.counterDecimal;
    if (Math.abs(diff) > 0.0001) {
      state.counterDecimal += diff * 0.12;
    }
    
    // Continue counting between updates
    if (elapsed > 0.2 && state.perSecond > 0) {
      const extrapolated = state.targetCounter + (state.perSecond * elapsed * 0.5);
      state.counterDecimal = Math.max(state.counterDecimal, extrapolated);
    }
    
    updateDisplay();
    requestAnimationFrame(animate);
  }

  function updateDisplay() {
    if (!el.counter) return;
    
    const integer = Math.floor(state.counterDecimal);
    const decimal = Math.floor((state.counterDecimal - integer) * 100);
    const html = `${fmt(integer)}<span class="decimal">.${decimal.toString().padStart(2, '0')}</span>`;
    
    if (el.counter.innerHTML !== html) {
      el.counter.innerHTML = html;
      
      // Flash on whole number change
      if (integer > state.counter) {
        state.counter = integer;
        const counterValue = document.querySelector('.counter-value');
        if (counterValue) {
          counterValue.classList.add('flash');
          setTimeout(() => counterValue.classList.remove('flash'), 150);
        }
      }
    }
  }

  // Render companies list with methodology-based attribution
  function renderCompanies(totalDisplacement) {
    if (!el.companiesList || !window.AI_COMPANIES || !window.calculateDisplacementScores) {
      console.error('Companies data not loaded');
      if (el.companiesList) {
        el.companiesList.innerHTML = '<div class="loading">Error loading company data</div>';
      }
      return;
    }
    
    console.log('Calculating displacement attribution for total:', totalDisplacement.toLocaleString());
    
    const companies = window.calculateDisplacementScores(window.AI_COMPANIES, totalDisplacement);
    
    // Verify totals
    const calculatedTotal = companies.reduce((sum, c) => sum + c.displacement, 0);
    console.log('Calculated total:', calculatedTotal.toLocaleString());
    console.log('Difference:', (totalDisplacement - calculatedTotal).toLocaleString());
    
    // Render list
    el.companiesList.innerHTML = companies.map(company => {
      let topClass = '';
      if (company.rank === 1) topClass = 'top-1';
      else if (company.rank === 2) topClass = 'top-2';
      else if (company.rank === 3) topClass = 'top-3';
      
      // Get category name for tooltip
      const categoryInfo = window.DISPLACEMENT_CATEGORIES?.[company.category];
      const categoryName = categoryInfo?.name || company.category;
      
      return `
        <div class="company-row ${topClass}" title="Factors: ${JSON.stringify(company.factors || {})}">
          <span class="col-rank">${company.rank}</span>
          <span class="col-name" title="${company.name}">${company.name}</span>
          <span class="col-industry" title="${categoryName}">${company.industry}</span>
          <span class="col-share">${company.percentage}%</span>
          <span class="col-jobs">${fmt(company.displacement)}</span>
        </div>
      `;
    }).join('');
    
    // Update total
    if (el.companiesTotal) {
      el.companiesTotal.textContent = fmt(calculatedTotal);
    }
    
    // Log methodology verification
    console.log('Top 10 companies:');
    companies.slice(0, 10).forEach(c => {
      console.log(`  ${c.rank}. ${c.name}: ${c.displacement.toLocaleString()} (${c.percentage}%)`);
    });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
