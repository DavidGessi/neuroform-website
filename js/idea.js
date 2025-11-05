// js/idea.js
(() => {
  const input = document.getElementById('idea-text');
  const addBtn = document.getElementById('idea-add');
  const list = document.getElementById('idea-list');
  const clearBtn = document.getElementById('idea-clear');

  const STORAGE_KEY = 'neuroform_ideas_v1';

  function loadIdeas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse ideas', e);
      return [];
    }
  }

  function saveIdeas(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
  }

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
    items.slice().reverse().forEach(item => {
      const li = document.createElement('li');
      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = item.text;

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = formatTime(item.ts);

      const actions = document.createElement('div');
      const del = document.createElement('button');
      del.className = 'delete';
      del.innerHTML = '✕';
      del.title = 'Delete';
      del.addEventListener('click', () => {
        deleteIdea(item.id);
      });

      actions.appendChild(del);

      li.appendChild(text);
      li.appendChild(meta);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function addIdea(text) {
    if (!text || !text.trim()) return;
    const items = loadIdeas();
    const item = { id: Date.now().toString(36), text: text.trim(), ts: Date.now() };
    items.push(item);
    saveIdeas(items);
    render();
    input.value = '';
    input.focus();
  }

  function deleteIdea(id) {
    const items = loadIdeas().filter(i => i.id !== id);
    saveIdeas(items);
    render();
  }

  function clearAll() {
    if (!confirm('Clear all saved ideas?')) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  addBtn.addEventListener('click', () => addIdea(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addIdea(input.value);
  });
  clearBtn.addEventListener('click', clearAll);

  // initial render
  render();
})();
