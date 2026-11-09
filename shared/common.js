// Demonstration portal helper. Nothing here sends data anywhere:
// every value stays in this browser tab (and localStorage for the sign-in flag).
(function () {
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  window.DemoPortal = {
    init: function (opts) {
      var self = this;
      this.opts = opts;
      this.userKey = opts.key + ':user';
      this.sections = Array.prototype.slice.call(document.querySelectorAll('section[data-step]'));
      window.addEventListener('hashchange', function () { self.route(); });
      document.addEventListener('click', function (e) {
        var go = e.target.closest('[data-go]');
        if (go) { e.preventDefault(); self.go(go.getAttribute('data-go')); }
        var out = e.target.closest('[data-signout]');
        if (out) { e.preventDefault(); self.signOut(); }
      });
      this.route();
    },
    user: function () { return store(this.userKey); },
    signIn: function (name) { store(this.userKey, name); },
    signOut: function () {
      store(this.userKey, null);
      if (this.opts.onSignOut) this.opts.onSignOut();
      this.go('login');
    },
    go: function (id) {
      if (location.hash === '#/' + id) this.route();
      else location.hash = '#/' + id;
    },
    route: function () {
      var id = (location.hash || '').replace(/^#\/?/, '') || '';
      var pub = this.opts.publicSteps;
      var signedIn = !!this.user();
      if (!id) id = signedIn ? this.opts.home : 'login';
      if (!signedIn && pub.indexOf(id) === -1) id = 'login';
      if (id === 'password' && !this.pendingUser) id = signedIn ? this.opts.home : 'login';
      if (signedIn && id === 'login') id = this.opts.home;
      if (!document.querySelector('section[data-step="' + id + '"]')) id = signedIn ? this.opts.home : 'login';
      if (location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id);
      this.show(id);
    },
    show: function (id) {
      var section;
      this.sections.forEach(function (s) {
        var on = s.getAttribute('data-step') === id;
        s.hidden = !on;
        if (on) section = s;
      });
      var who = document.getElementById('who');
      var u = this.user();
      if (who) {
        who.hidden = !u;
        var n = document.getElementById('who-name');
        if (n) n.textContent = u || '';
      }
      var title = section.getAttribute('data-title');
      document.title = (title ? title + ' | ' : '') + this.opts.siteTitle + ' (DEMO)';
      if (this.opts.onShow) this.opts.onShow(id, section);
      window.scrollTo(0, 0);
      var first = section.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select');
      if (first) setTimeout(function () { first.focus(); }, 0);
    }
  };

  // Wire up the two-page sign-in (username page, then password page).
  window.DemoPortal.wireSignIn = function () {
    var self = this;
    var uForm = document.getElementById('username-form');
    var pForm = document.getElementById('password-form');
    uForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = uForm.username.value.trim();
      var err = uForm.querySelector('.error');
      if (!v) { err.textContent = 'Enter a username to continue.'; return; }
      err.textContent = '';
      self.pendingUser = v;
      document.getElementById('pw-user').textContent = v;
      pForm.username.value = v;
      self.go('password');
    });
    pForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = pForm.querySelector('.error');
      if (!pForm.password.value) { err.textContent = 'Enter a password to continue.'; return; }
      err.textContent = '';
      // Demo only: any password is accepted and it is never stored or sent.
      self.signIn(self.pendingUser);
      self.pendingUser = null;
      pForm.password.value = '';
      self.go(self.opts.home);
    });
  };

  // Generic "save" forms on side pages: show a demo confirmation, send nothing.
  window.DemoPortal.wireDemoForms = function () {
    document.querySelectorAll('form[data-demo-save]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = f.querySelector('.success');
        if (ok) ok.hidden = false;
      });
    });
  };

  window.DemoPortal.download = function (filename, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
})();
