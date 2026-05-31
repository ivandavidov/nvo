/* School search box for the grade pages.
   Lazily loads api/v1/schools-index.json on first focus and navigates to the
   per-school page (/school/{code}/). Grade pages live at /{grade}/, so both the
   API and the school pages are one level up (../). Self-contained — does not
   depend on the other logic-*.js files. */
(function() {
  var wrap = document.getElementById('schoolSearch');
  var input = document.getElementById('schoolSearchInput');
  var results = document.getElementById('schoolSearchResults');
  if (!wrap || !input || !results) {
    return;
  }

  var MAX_RESULTS = 12;
  var schools = null;
  var loading = false;
  var matches = [];
  var activeIndex = -1;

  function normalize(str) {
    return (str || '').toString().toLowerCase().replace(/ё/g, 'е').trim();
  }

  // Relevance of a school name to the query (lower = more relevant):
  //   0 query is a prefix of the name or starts one of its words (strong match)
  //   1 query appears inside a word
  //   2 query is not a contiguous substring of the name (matched only via scattered
  //     terms / the city field)
  // Kept coarse on purpose: all genuine name matches share tier 0 so that within them
  // the city order is preserved, instead of splitting near-identical schools apart.
  function scoreName(name, q) {
    if (!q || !name) {
      return 2;
    }
    var idx = name.indexOf(q);
    if (idx < 0) {
      return 2;
    }
    if (idx === 0 || name.charAt(idx - 1) === ' ') {
      return 0;
    }
    return 1;
  }

  function relevance(s, q) {
    return Math.min(scoreName(s._nf, q), scoreName(s._ns, q));
  }

  function loadIndex() {
    if (schools || loading) {
      return;
    }
    loading = true;
    fetch('../api/v1/schools-index.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        schools = (data && data.schools) ? data.schools : [];
        schools.forEach(function(s) {
          s._nf = normalize(s.fullName);
          s._ns = normalize(s.shortName);
          // include the school code so it can be found by code (e.g. from an API/competitor URL)
          s._h = s._nf + ' ' + s._ns + ' ' + normalize(s.city) + ' ' + (s.code || '');
        });
        if (input.value.trim()) {
          runSearch();
        }
      })
      .catch(function() {
        loading = false;
      });
  }

  function runSearch() {
    var q = normalize(input.value);
    activeIndex = -1;
    if (!schools || q.length < 2) {
      matches = [];
      render();
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    matches = schools.filter(function(s) {
      return terms.every(function(t) { return s._h.indexOf(t) >= 0; });
    });
    // Sort by relevance first (best name match on top), then by the site's city order
    // (cityOrder mirrors Cities.ORDERED), then by name — before limiting to MAX_RESULTS.
    matches.sort(function(a, b) {
      var ra = relevance(a, q), rb = relevance(b, q);
      if (ra !== rb) {
        return ra - rb;
      }
      var ao = a.cityOrder == null ? Infinity : a.cityOrder;
      var bo = b.cityOrder == null ? Infinity : b.cityOrder;
      if (ao !== bo) {
        return ao - bo;
      }
      return (a.fullName || '').localeCompare(b.fullName || '', 'bg');
    });
    matches = matches.slice(0, MAX_RESULTS);
    render();
  }

  function render() {
    results.textContent = '';
    if (!input.value.trim()) {
      results.classList.remove('open');
      return;
    }
    if (matches.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'school-search-empty';
      empty.textContent = schools ? 'Няма намерени училища' : 'Зареждане...';
      results.appendChild(empty);
      results.classList.add('open');
      return;
    }
    matches.forEach(function(s, i) {
      var item = document.createElement('a');
      item.className = 'school-search-item' + (i === activeIndex ? ' active' : '');
      item.href = '../school/' + s.code + '/';
      item.setAttribute('role', 'option');

      var name = document.createElement('span');
      name.className = 'school-search-item-name';
      name.textContent = s.fullName;

      var grades = document.createElement('span');
      grades.className = 'school-search-grades';
      (s.grades || []).forEach(function(g) {
        var b = document.createElement('span');
        b.className = 'school-search-grade';
        b.textContent = g;
        grades.appendChild(b);
      });
      name.appendChild(grades);

      var city = document.createElement('span');
      city.className = 'school-search-item-city';
      city.textContent = s.city || '';

      item.appendChild(name);
      item.appendChild(city);
      results.appendChild(item);
    });
    results.classList.add('open');
  }

  function close() {
    results.classList.remove('open');
    activeIndex = -1;
  }

  input.addEventListener('focus', loadIndex);
  input.addEventListener('input', runSearch);
  input.addEventListener('keydown', function(e) {
    if (!results.classList.contains('open') || matches.length === 0) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = activeIndex < matches.length - 1 ? activeIndex + 1 : 0;
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = activeIndex > 0 ? activeIndex - 1 : matches.length - 1;
      render();
    } else if (e.key === 'Enter') {
      var target = activeIndex >= 0 ? matches[activeIndex] : matches[0];
      if (target) {
        window.location.href = '../school/' + target.code + '/';
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest || !e.target.closest('#schoolSearch')) {
      close();
    }
  });
})();
