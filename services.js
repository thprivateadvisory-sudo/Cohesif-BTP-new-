// Cohesif BTP — pages métiers : envoi du formulaire de devis (Formspree)
(function () {
  var form = document.getElementById('devis-form');
  if (!form) return;
  var btn = form.querySelector('button[type="submit"]');
  var label = btn ? btn.textContent : '';
  var ok = document.getElementById('form-success');
  var ko = document.getElementById('form-error');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    ok.classList.remove('show');
    ko.classList.remove('show');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        ok.classList.add('show');
        form.reset();
      })
      .catch(function () { ko.classList.add('show'); })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        (ok.classList.contains('show') ? ok : ko).scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
  });
})();
