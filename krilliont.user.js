// ==UserScript==
// @name         krillion't
// @author       naujaan
// @namespace    krilliont
// @version      1.3
// @description  Shows ones in the krillion.
// @match        https://krillion.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(async function () {
  'use strict';

  const host = document.createElement('div');
  host.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 2147483647;
    width: min(340px, calc(100vw - 48px));
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      .panel {
        background: #101d33;
        color: #e8f1ff;
        font-family: "VT323", monospace;
        font-weight: 400;
        box-shadow:
          0 0 0 3px #050a14,
          0 0 0 6px #4de3ff,
          0 6px 0 6px #123048;
      }

      h2 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 0;
        padding: 13px 18px 11px;
        border-bottom: 2px solid #4de3ff;
        font-size: 28px;
        font-weight: 400;
        letter-spacing: .14em;
        text-transform: uppercase;
      }

      .toggle {
        padding: 0 4px;
        border: none;
        background: transparent;
        color: #4de3ff;
        font: inherit;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      .toggle:hover {
        color: #e8f1ff;
      }

      .toggle:focus-visible {
        outline: 2px solid #4de3ff;
        outline-offset: 4px;
      }

      .panel.collapsed h2 {
        border-bottom: none;
      }

      .answers[hidden] {
        display: none;
      }

      .answers {
        max-height: calc(80vh - 60px);
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #1b3050 #050a14;
      }

      .answer {
        padding: 14px 18px;
        border-bottom: 1px solid #1b3050;
      }

      .answer:last-child {
        border-bottom: none;
      }

      .question {
        margin: 0 0 5px;
        color: #7d93b8;
        font-size: 19px;
        line-height: 1.15;
      }

      .word {
        margin: 0;
        color: #ffd166;
        font-size: 25px;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }

      .status {
        margin: 0;
        padding: 14px 18px;
        font-size: 20px;
        overflow-wrap: anywhere;
      }
    </style>

    <section class="panel" aria-label="Krillion't answers">
      <h2>
        krillion't
        <button
          type="button"
          class="toggle"
          aria-label="Collapse answers"
          aria-expanded="true"
          aria-controls="krilliont-answers"
        >▲</button>
      </h2>
      <div id="krilliont-answers" class="answers" aria-live="polite">
        <p class="status">Loading answers…</p>
      </div>
    </section>
  `;

  document.body.appendChild(host);

  const panel = shadow.querySelector('.panel');
  const content = shadow.querySelector('.answers');
  const toggle = shadow.querySelector('.toggle');

  toggle.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('collapsed');

    content.hidden = collapsed;
    toggle.textContent = collapsed ? '▼' : '▲';
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute(
      'aria-label',
      collapsed ? 'Expand answers' : 'Collapse answers'
    );
  });

  async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  try {
    const today = await getJSON('/api/today');
    const reveal = await getJSON(
      `/api/reveal?date=${encodeURIComponent(today.date)}`
    );

    if (!Array.isArray(reveal.prompts)) {
      throw new Error('No prompts returned');
    }

    content.replaceChildren();

    for (const prompt of reveal.prompts) {
      const best = (prompt.answers ?? []).reduce(
        (best, answer) =>
          !best || answer.score > best.score ? answer : best,
        null
      );

      const row = document.createElement('div');
      row.className = 'answer';

      const question = document.createElement('p');
      question.className = 'question';
      question.textContent = prompt.text;

      const word = document.createElement('p');
      word.className = 'word';
      word.textContent = best?.answer ?? 'No answer found';

      row.append(question, word);
      content.appendChild(row);
    }
  } catch (error) {
    const status = document.createElement('p');
    status.className = 'status';
    status.textContent = `Could not load answers: ${error.message}`;

    content.replaceChildren(status);
    console.error("krillion't:", error);
  }
})();
