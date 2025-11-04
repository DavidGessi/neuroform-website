// gradient.js
(() => {
  const color1 = document.getElementById('g-color-1');
  const color2 = document.getElementById('g-color-2');
  const angle = document.getElementById('g-angle');
  const preview = document.getElementById('g-preview');
  const cssBox = document.getElementById('g-css');
  const copyBtn = document.getElementById('copy-css');

  function update() {
    const a = angle.value;
    const c1 = color1.value;
    const c2 = color2.value;
    const css = `background: linear-gradient(${a}deg, ${c1}, ${c2});`;
    preview.style.background = `linear-gradient(${a}deg, ${c1}, ${c2})`;
    cssBox.textContent = css;
  }

  color1.addEventListener('input', update);
  color2.addEventListener('input', update);
  angle.addEventListener('input', update);

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cssBox.textContent);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => copyBtn.textContent = 'Copy CSS', 1400);
    } catch (e) {
      copyBtn.textContent = 'Copy';
    }
  });

  update();
})();
