/* theme.js: modo claro / oscuro con transición. Se guarda en localStorage y se aplica antes de pintar la página. */
(function () {
  var KEY = 'batterylab-theme', root = document.documentElement;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  // Por defecto arranca en oscuro (como el diseño); si la persona eligió claro, se respeta
  root.setAttribute('data-theme', read() === 'light' ? 'light' : 'dark');

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeBtn');
    if (!btn) return;

    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
      btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      btn.title = dark ? 'Modo claro' : 'Modo oscuro';
    }
    function apply(next) {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
    }

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Chrome / Edge / Safari: el nuevo tema se revela como un círculo desde el botón
      if (document.startViewTransition && !reduce) {
        var r = btn.getBoundingClientRect(),
            x = r.left + r.width / 2, y = r.top + r.height / 2,
            end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        var t = document.startViewTransition(function () { apply(next); });
        t.ready.then(function () {
          root.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
          );
        });
        return;
      }

      // Respaldo: fundido de colores
      root.classList.add('theme-anim');
      apply(next);
      setTimeout(function () { root.classList.remove('theme-anim'); }, 700);
    });
    paint();
  });
})();