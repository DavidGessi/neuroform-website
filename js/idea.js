// js/idea.js (robust: sanitize legacy items, edit uses visible textDiv)
(() => {
  const input = document.getElementById('idea-text');
  const addBtn = document.getElementById('idea-add');
  const list = document.getElementById('idea-list');
  const clearBtn = document.getElementById('idea-clear');
  const exportJsonBtn = document.getElementById('idea-export-json');
  const exportCsvBtn = document.getElementById('idea-export-csv');

  const STORAGE_KEY = 'neuroform_ideas_v1';

  // --- Helpers for sanitizing legacy data ---
  function stripTrailingDate(text) {
    if (typeof text !== 'string') return String(text || '');
    // common date patterns like "5.11.2025, 18:29:52" or ISO dates
    // remove a trailing comma/space + date/time patterns
    // we try several regex patterns; if matched, strip from that position
    const patterns = [
      // e.g. "Added 5.11.2025, 18:29:52" or just "5.11.2025, 18:29:52"
      /\s*\d{1,2}\.\d{1,2}\.\d{2,4},\s*\d{1,2}:\d{2}(:\d{2})?$/,
      // e.g. ISO 2025-11-05T18:29:52Z or 2025-11-05 18:29:52
      /\s*\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?Z?$/,
      // trailing "Added 5.11.2025, 18:29:52" or "Edited 05/11/2025 18:29"
      /\b(Added|Edited)\b.*\d{1,2}[:.\/\-\d\s,]+$/,
    ];
    for (const rx of patterns) {
      const m = text.match(rx);
      if (m && m.index !== undefined) {
        return text.slice(0, m.index).trim();
      }
    }
    return text;
  }

  function sanitizeItem(raw) {
    // ensure fields exist and types are consistent
    const id = raw && raw.id ? String(raw.id) : Date.now().toString(36);
    // If raw.text is an object or contains weird parts, try to extract the visible text
    let text = '';
    if (raw && typeof raw.text === 'string') {
      text = raw.text.trim();
    } else if (raw && raw.text != null) {
      text = String(raw.text);
    } else {
      text = '';
    }
    // strip trailing date-like patterns often appended by older code/bugs
    text = stripTrailingDate(text);
    const ts = raw && raw.ts ? Number(raw.ts) || Date.now() : Date.now();
    const done = !!(raw && raw.done);
    const updated = !!(raw && raw.updated);
    return { id, text, ts, done, updated };
  }

  // load and sanitize all stored ideas
  function loadIdeas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      // sanitize each item and return cleaned list
      return arr.map(sanitizeItem);
    } catch (e) {
      console.error('Failed to parse ideas', e);
      return [];
    }
  }

  // save (and normalize again)
  function saveIdeas(items) {
    const cleaned = (items || []).map((i) => sanitizeItem(i));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  function formatTime(ts) {
    const d = new Date(Number(ts) || Date.now());
    return d.toLocaleString();
  }

  // render list
  function render() {
    const items = loadIdeas();
    list.innerHTML = '';
    if (items.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No ideas yet — add your first one!';
      li.style.opacity = '0.6';
      list.appendChild(li);
      return;
    }

    items
      .slice()
      .reverse()
      .forEach((item) => {
        const li = document.createElement('li');
        li.dataset.id = item.id;

        const left = document.createElement('div');
        left.className = 'idea-item-left';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = !!item.done;
        chk.title = 'Mark as done';
        chk.addEventListener('change', () => toggleDone(item.id, chk.checked));

        const textDiv = document.createElement('div');
        textDiv.className = 'text' + (item.done ? ' done' : '');
        textDiv.textContent =
          typeof item.text === 'string' ? item.text : String(item.text || '');

        left.appendChild(chk);
        left.appendChild(textDiv);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent =
          (item.updated ? 'Edited ' : 'Added ') + formatTime(item.ts);

        const actions = document.createElement('div');

        const editBtn = document.createElement('button');
        editBtn.className = 'icon';
        editBtn.innerHTML = '✎';
        editBtn.title = 'Edit';
        editBtn.addEventListener('click', () =>
          startEdit(item.id, textDiv, editBtn)
        );

        const delBtn = document.createElement('button');
        delBtn.className = 'icon';
        delBtn.innerHTML = '✕';
        delBtn.title = 'Delete';
        delBtn.addEventListener('click', () => deleteIdea(item.id));

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(meta);
        li.appendChild(actions);

        list.appendChild(li);
      });
  }

  // add new idea (sanitized)
  function addIdea(text) {
    const cleanedText =
      typeof text === 'string' ? text.trim() : String(text || '');
    if (!cleanedText) return;
    const items = loadIdeas();
    const item = {
      id: Date.now().toString(36),
      text: cleanedText,
      ts: Date.now(),
      done: false,
      updated: false,
    };
    items.push(item);
    saveIdeas(items);
    render();
    input.value = '';
    input.focus();
  }

  function deleteIdea(id) {
    const items = loadIdeas().filter((i) => i.id !== id);
    saveIdeas(items);
    render();
  }

  function clearAll() {
    if (!confirm('Clear all saved ideas?')) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  function toggleDone(id, done) {
    const items = loadIdeas().map((i) => (i.id === id ? { ...i, done } : i));
    saveIdeas(items);
    render();
  }

  // FIXED startEdit: use visible textDiv content for the input value (robust)
  function startEdit(id, textDiv, editBtn) {
    const items = loadIdeas();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const inputEl = document.createElement('input');
    inputEl.className = 'idea-edit-input';
    // IMPORTANT: use the textDiv content (what user actually sees)
    // as the initial input value—this avoids dates or legacy suffixes coming from stored item.text
    inputEl.value =
      textDiv && typeof textDiv.textContent === 'string'
        ? textDiv.textContent.trim()
        : typeof item.text === 'string'
        ? item.text
        : String(item.text || '');

    textDiv.replaceWith(inputEl);
    inputEl.focus();
    inputEl.select();

    const li = editBtn.closest('li');
    const actions = editBtn.parentElement;

    editBtn.innerHTML = '✓';
    editBtn.title = 'Save';

    const cancel = document.createElement('button');
    cancel.className = 'icon';
    cancel.innerHTML = '↺';
    cancel.title = 'Cancel';
    actions.insertBefore(cancel, editBtn.nextSibling);

    function cleanup() {
      cancel.remove();
      editBtn.innerHTML = '✎';
      editBtn.title = 'Edit';
      render();
    }

    cancel.addEventListener('click', cleanup);

    function saveHandler() {
      const newText = (inputEl.value || '').trim();
      if (!newText) {
        alert('Text cannot be empty.');
        inputEl.focus();
        return;
      }
      const updated = items.map((i) => {
        if (i.id === id) {
          return { ...i, text: newText, ts: Date.now(), updated: true };
        }
        return i;
      });
      saveIdeas(updated);
      cleanup();
    }

    editBtn.onclick = saveHandler;

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveHandler();
      if (e.key === 'Escape') cleanup();
    });
  }

  // export helpers
  function download(filename, text) {
    const el = document.createElement('a');
    el.setAttribute(
      'href',
      'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(text)
    );
    el.setAttribute('download', filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    el.remove();
  }

  function exportJSON() {
    const items = loadIdeas();
    download('neuroform-ideas.json', JSON.stringify(items, null, 2));
  }

  function exportCSV() {
    const items = loadIdeas();
    const rows = [['id', 'text', 'ts', 'done']];
    items.forEach((i) =>
      rows.push([
        i.id,
        `"${String(i.text).replace(/"/g, '""')}"`,
        i.ts,
        i.done ? '1' : '0',
      ])
    );
    const csv = rows.map((r) => r.join(',')).join('\n');
    download('neuroform-ideas.csv', csv);
  }

  // handlers
  addBtn.addEventListener('click', () => addIdea(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addIdea(input.value);
  });
  clearBtn.addEventListener('click', clearAll);
  exportJsonBtn.addEventListener('click', exportJSON);
  exportCsvBtn.addEventListener('click', exportCSV);

  // initial render
  render();
})();
