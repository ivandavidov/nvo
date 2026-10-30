// nvo balove - минималните и максималните балове след 7 клас (както страниците /7/balove/):
// хъбът с градовете, "Топ паралелки" за град и детайлът за училище / паралелка.
// Данните са от api/v1/balove/ - същото, което е в js/ruo-{град}.js на страниците.

import { SCHOOL_TYPES, schoolType, typeKeyFromApi } from '../../core/school-types.js';
import { searchKey, expandAbbreviations } from '../../ui/search-text.js';
import { defineSub, NvoError, link, PATHS, parseTypes } from './core.js';
import { baloveIndex, baloveCity, resolveCity, searchIndex } from './data.js';
import { renderTable, outputMode, printJson, spark } from './format.js';

const YEARS_TO_SHOW = 4;
const OVERVIEW_YEARS = 3;
const KLASS = ['1-во', '2-ро', '3-то', '4-то'];

/** Бал с два знака - като на страницата (0 и липса → "-"). */
function fmt(v) {
  return v !== null && v !== undefined && v !== 0 ? Number(v).toFixed(2) : '-';
}

/**
 * Редът на училищата и паралелките като на страницата: там са ключове на JS обект, а такъв обект
 * подрежда ключовете-числа възходящо (кодовете), останалите - в реда на добавяне.
 */
function objectKeyOrder(items, key) {
  const isIndex = (k) => /^(0|[1-9]\d*)$/.test(k) && Number(k) < 4294967295;
  const ints = items.filter((x) => isIndex(key(x))).sort((a, b) => Number(key(a)) - Number(key(b)));
  return ints.concat(items.filter((x) => !isIndex(key(x))));
}

/** Данните на паралелка за показаните години: [ [4 × {min,max,…}|null] | null ] (по годините). */
function profileYears(profile, years) {
  return years.map((y) => profile.years[y] || null);
}

const val = (e, key) => (e && e[key] ? e[key] : 0);

/** "Всички паралелки" - като aggregateAllProfiles: най-малкият минимум и най-големият максимум. */
function aggregate(school, years) {
  return years.map((y) => {
    const out = [];
    for (let k = 0; k < 4; k++) {
      const entries = school.profiles.map((p) => (p.years[y] ? p.years[y][k] : null)).filter(Boolean);
      if (!entries.length) {
        out.push(null);
        continue;
      }
      const mins = (key) => {
        const v = entries.map((e) => val(e, key)).filter((x) => x > 0);
        return v.length ? Math.min(...v) : 0;
      };
      const maxs = (key) => {
        const v = entries.map((e) => val(e, key)).filter((x) => x > 0);
        return v.length ? Math.max(...v) : 0;
      };
      out.push({ min: mins('min'), minMale: mins('minMale'), minFemale: mins('minFemale'), max: maxs('max'), maxMale: maxs('maxMale'), maxFemale: maxs('maxFemale') });
    }
    return out;
  });
}

async function cityDoc(arg) {
  const city = await resolveCity(arg);
  const idx = await baloveIndex();
  if (!idx.cities.some((c) => c.slug === city.slug)) throw new NvoError('няма балове за ' + city.name + ' (nvo balove изрежда градовете)');
  return baloveCity(city.slug);
}

function schoolHay(s) {
  return searchKey(s.name + ' ' + s.fullName + ' ' + s.code + ' ' + expandAbbreviations(s.name + ' ' + s.fullName));
}

/** Училище в документа за града: код или част от името (като полето "Училище" на страницата). */
function findSchool(doc, arg) {
  const q = String(arg).trim();
  const byCode = doc.schools.find((s) => s.code === q);
  if (byCode) return byCode;
  const terms = searchKey(q).split(' ').filter(Boolean);
  const found = doc.schools.filter((s) => terms.every((t) => schoolHay(s).includes(t)));
  if (found.length === 1) return found[0];
  const key = searchKey(q);
  const exact = found.filter((s) => searchKey(s.name) === key || searchKey(s.fullName) === key);
  if (exact.length === 1) return exact[0];
  if (!found.length) throw new NvoError("няма училище '" + q + "' с балове в " + doc.city.name);
  throw new NvoError("'" + q + "' съвпада с " + found.length + ' училища в ' + doc.city.name + ':\n' + found.slice(0, 12).map((s) => '  ' + s.code.padEnd(8) + s.name).join('\n') + (found.length > 12 ? '\n  ... и още ' + (found.length - 12) : ''));
}

function findProfile(school, arg) {
  const q = String(arg).trim();
  const canon = q.replace(/^0+(?=.)/, '');
  const byCode = school.profiles.find((p) => p.code === q || p.code === canon);
  if (byCode) return byCode;
  const terms = searchKey(q).split(' ').filter(Boolean);
  const found = school.profiles.filter((p) => terms.every((t) => searchKey(p.name).includes(t)));
  if (found.length === 1) return found[0];
  if (!found.length) throw new NvoError("няма паралелка '" + q + "' в " + school.name + ' (nvo balove ГРАД УЧИЛИЩЕ изрежда паралелките)');
  throw new NvoError("'" + q + "' съвпада с " + found.length + ' паралелки:\n' + found.map((p) => '  ' + p.code.padEnd(8) + p.name).join('\n'));
}

async function hub(ctx, opts) {
  const idx = await baloveIndex();
  const sindex = await searchIndex();
  const tier = Object.fromEntries(sindex.cities.map((c) => [c.slug, c.order]));
  renderTable(ctx, {
    mode: outputMode(opts),
    wide: opts.wide || opts.w,
    title: 'Балове след 7 клас - ' + idx.cities.length + ' града, ' + idx.years[0] + '-' + idx.years[idx.years.length - 1],
    rows: idx.cities,
    notes: ['nvo balove ГРАД - топ паралелките; nvo balove ГРАД УЧИЛИЩЕ - баловете по класирания', link(PATHS.balove())],
    columns: [
      { key: 'name', label: 'Град', get: (c) => c.name, flex: true },
      { key: 'slug', label: 'slug', get: (c) => c.slug, color: (t) => ctx.c.cyan(t) },
      { key: 'tier', label: 'Вид', get: (c) => (tier[c.slug] && tier[c.slug] <= 2 ? 'областен' : 'друг'), drop: 1 },
      { key: 'years', label: 'Години', get: (c) => (c.years.length ? c.years[0] + '-' + c.years[c.years.length - 1] : ''), drop: 2 },
      { key: 'schools', label: 'Училища', align: 'right', get: (c) => c.schools },
      { key: 'profiles', label: 'Паралелки', align: 'right', get: (c) => c.profiles },
    ],
  });
  return 0;
}

async function overview(ctx, opts, doc) {
  const years = doc.years.slice(-YEARS_TO_SHOW);
  const latest = years.length - 1;
  const first = Math.max(0, latest - (OVERVIEW_YEARS - 1));
  const shown = [];
  for (let k = latest; k >= first; k--) shown.push(k);
  let rows = [];
  for (const s of objectKeyOrder(doc.schools, (x) => x.code)) {
    for (const p of objectKeyOrder(s.profiles, (x) => x.code)) {
      const mins = profileYears(p, years).map((yd) => (yd && yd[0] ? yd[0].min : null));
      const cur = mins[latest] ?? null;
      const prev = latest >= 1 ? mins[latest - 1] ?? null : null;
      let trend = '';
      if (cur !== null && prev !== null) trend = cur > prev + 0.5 ? 'up' : cur < prev - 0.5 ? 'down' : 'same';
      rows.push({ code: s.code, pcode: p.code, school: s.name, schoolFull: s.fullName, profile: p.name, mins, trend, type: typeKeyFromApi(s.financing, s.isPrivate),
        hay: searchKey(s.name + ' ' + s.fullName + ' ' + p.name + ' ' + expandAbbreviations(s.name + ' ' + s.fullName)) });
    }
  }
  if (opts.q) {
    const terms = searchKey(opts.q).split(' ').filter(Boolean);
    rows = rows.filter((r) => terms.every((t) => r.hay.includes(t)));
  }
  const types = parseTypes(opts.t);
  if (types) rows = rows.filter((r) => types.includes(r.type));
  // Подредбата като на страницата: по колона, празните - най-отдолу.
  const col = String(opts.s || 'min').toLowerCase();
  let get;
  if (col === 'school' || col === 'училище') get = (r) => r.school;
  else if (col === 'profile' || col === 'паралелка') get = (r) => r.profile;
  else {
    const m = /^min(\d{2})?$/.exec(col);
    if (!m) throw new NvoError("непозната колона '" + opts.s + "' - min, min" + String(doc.years[doc.years.length - 1]).slice(2) + ', school, profile', 2);
    const yi = m[1] ? years.findIndex((y) => String(y).slice(2) === m[1]) : latest;
    if (yi < 0) throw new NvoError('няма година ' + m[1], 2);
    get = (r) => r.mins[yi] ?? null;
  }
  const dir = opts.asc ? 1 : opts.desc ? -1 : -1;
  rows = rows.slice().sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === 'string') return dir * va.localeCompare(vb, 'bg');
    return dir * (va - vb);
  });
  const total = rows.length;
  if (!total && outputMode(opts) === 'table') throw new NvoError('няма паралелки' + (opts.q ? " за '" + opts.q + "'" : '') + ' в ' + doc.city.name);
  if (opts.n) rows = rows.slice(0, Number(opts.n));
  rows = rows.map((r, i) => ({ ...r, n: i + 1 }));
  const arrows = { up: '↑', down: '↓', same: '→' };
  const columns = [
    { key: 'n', label: '№', align: 'right', get: (r) => r.n },
    { key: 'school', label: 'Училище', get: (r) => r.school, drop: 0 },
    { key: 'profile', label: 'Паралелка', get: (r) => r.profile, flex: true },
    ...shown.map((k, i) => ({ key: 'min' + years[k], label: 'Мин. ' + String(years[k]).slice(2), align: 'right', get: (r) => r.mins[k] ?? null, text: (v) => fmt(v), drop: i ? 10 - i : 0 })),
    { key: 'trend', label: 'Тренд', get: (r) => arrows[r.trend] || '', color: (t, r) => (r.trend === 'up' ? ctx.c.green(t) : r.trend === 'down' ? ctx.c.red(t) : t), drop: 5 },
  ];
  if (opts.spark) columns.push({ key: 'spark', label: 'Години', get: (r) => spark(r.mins), drop: 20 });
  renderTable(ctx, {
    mode: outputMode(opts),
    wide: opts.wide || opts.w,
    title: 'Балове след 7 клас - ' + doc.city.name + ' - топ паралелки (' + total + ')',
    rows,
    notes: ['Минималният бал от 1-во класиране. Тренд: спрямо предходната година (±0.5). nvo balove ' + doc.city.slug + ' КОД - детайлите', link(PATHS.balove(doc.city.slug))],
    columns,
    json: (list) => list.map((r) => ({ n: r.n, school: r.code, schoolName: r.school, profile: r.pcode, profileName: r.profile, mins: Object.fromEntries(years.map((y, k) => [y, r.mins[k] ?? null])), trend: r.trend || null })),
  });
  return 0;
}

async function detail(ctx, opts, doc, schoolArg) {
  const s = findSchool(doc, schoolArg);
  const years = doc.years.slice(-YEARS_TO_SHOW);
  const profile = opts.p ? findProfile(s, opts.p) : null;
  const data = profile ? profileYears(profile, years) : aggregate(s, years);
  const label = profile ? profile.name : 'Всички паралелки';
  const url = link(PATHS.balove(doc.city.slug, s.code, profile ? profile.code : null, !!opts.gender));
  const mode = outputMode(opts);
  if (mode === 'json') {
    printJson(ctx, { city: doc.city, school: { code: s.code, name: s.name, fullName: s.fullName }, profile: profile ? { code: profile.code, name: profile.name } : null, years: Object.fromEntries(years.map((y, k) => [y, data[k]])), url });
    return 0;
  }
  const c = ctx.c;
  const sindex = await searchIndex();
  const onSite = sindex.schools.some((x) => x.code === s.code);
  const type = typeKeyFromApi(s.financing, s.isPrivate);
  if (ctx.isTTY) {
    ctx.out(c.bold(s.fullName) + c.muted(' - ' + doc.city.name + ' · ' + s.code + (type ? ' · ' + schoolType(type).lower : '')) + '\n' +
      c.muted('Паралелка: ') + label + (onSite ? c.muted(' · профил: ') + c.link(link(PATHS.school(s.code))) : '') + '\n\n');
  }
  const notes = [];
  years.forEach((y) => {
    const cv = doc.coverage[y];
    if (!cv) notes.push(y + ': няма данни за града');
    else if (cv.rankings.length < 4 || !cv.gender) notes.push(y + ': класирания ' + cv.rankings.join(', ') + (cv.gender ? '' : '; без разбивка по пол'));
  });
  notes.push(url);
  if (opts.gender) {
    const k = years.length - 1;
    const y = years[k];
    if (!doc.coverage[y] || !doc.coverage[y].gender) notes.unshift(y + ': РУО не е дало разбивка по пол');
    renderTable(ctx, {
      mode, wide: opts.wide || opts.w,
      title: 'Балове по класирания - ' + y + ' - по пол',
      rows: KLASS.map((name, ki) => ({ name, e: data[k] ? data[k][ki] : null })),
      notes,
      columns: [
        { key: 'klasirane', label: 'Класиране', get: (r) => r.name },
        ...[['min', 'Мин'], ['minMale', 'Мин М'], ['minFemale', 'Мин Ж'], ['max', 'Макс'], ['maxMale', 'Макс М'], ['maxFemale', 'Макс Ж']].map(([key, lab]) => ({ key, label: lab, align: 'right', get: (r) => (r.e ? r.e[key] : null), text: (v) => fmt(v) })),
      ],
    });
  } else {
    const order = years.map((y, k) => k).reverse();
    const columns = [{ key: 'klasirane', label: 'Класиране', get: (r) => r.name }];
    order.forEach((k, i) => {
      const yy = String(years[k]).slice(2);
      columns.push({ key: 'min' + years[k], label: 'Мин ' + yy, align: 'right', get: (r) => (data[k] && data[k][r.ki] ? data[k][r.ki].min : null), text: (v) => fmt(v), drop: i ? 10 - i * 2 : 0 });
      columns.push({ key: 'max' + years[k], label: 'Макс ' + yy, align: 'right', get: (r) => (data[k] && data[k][r.ki] ? data[k][r.ki].max : null), text: (v) => fmt(v), drop: i ? 11 - i * 2 : 0 });
    });
    renderTable(ctx, {
      mode, wide: opts.wide || opts.w,
      title: 'Балове по класирания (мин - макс)',
      rows: KLASS.map((name, ki) => ({ name, ki })),
      notes,
      columns,
    });
  }
  if (!profile && mode === 'table') {
    // Паралелките на училището - за -p (по код или част от името).
    ctx.out('\n');
    const latest = years.length - 1;
    renderTable(ctx, {
      title: 'Паралелки (' + s.profiles.length + ') - nvo balove ' + doc.city.slug + ' ' + s.code + ' -p КОД',
      rows: objectKeyOrder(s.profiles, (x) => x.code),
      wide: opts.wide || opts.w,
      columns: [
        { key: 'code', label: 'Код', get: (p) => p.code, color: (t) => c.cyan(t) },
        { key: 'name', label: 'Паралелка', get: (p) => p.name, flex: true },
        { key: 'min', label: 'Мин. ' + String(years[latest]).slice(2), align: 'right', get: (p) => (p.years[years[latest]] && p.years[years[latest]][0] ? p.years[years[latest]][0].min : null), text: (v) => fmt(v) },
      ],
    });
  }
  return 0;
}

defineSub({
  name: 'balove',
  aliases: ['bal'],
  summary: 'балове след 7 клас: градове, топ паралелки, класирания по училище',
  usage: 'nvo balove\n       nvo balove ГРАД [-q ТЕКСТ] [-t ВИДОВЕ] [-s КОЛОНА] [--asc] [-n N]\n       nvo balove ГРАД УЧИЛИЩЕ [-p ПАРАЛЕЛКА] [--gender]',
  description: 'Без аргументи - градовете с данни (хъбът /7/balove/).\nС град - "Топ паралелки": минималният бал от 1-во класиране за последните 3 години и тенденцията, подредени по последната година.\nС град и училище (код или част от името) - баловете по класирания (мин и макс) за последните 4 години: за всички паралелки заедно или за една (-p). --gender - по пол за последната година.',
  options: [['-q ТЕКСТ', 'филтър по училище или паралелка (като полето за търсене)'], ['-t ВИДОВЕ', 'само училищата от тези видове'], ['-s КОЛОНА', 'min (последната година), min25, school, profile'], ['--asc / --desc', 'посока'], ['-p ПАРАЛЕЛКА', 'код или част от името на паралелката'], ['--gender', 'по пол (момчета/момичета) за последната година'], ['--spark', 'колона с тенденцията на минимума']],
  examples: [['nvo balove', ''], ['nvo balove sofia -n 20', ''], ['nvo balove plovdiv -q математика', ''], ['nvo balove sofia 2216306', 'всички паралелки на СМГ'], ['nvo balove sofia смг -p информатика --gender', ''], ['nvo balove varna --tsv | sort -t$\'\\t\' -k4 -n | head', '']],
  opts: { short: 'q:t:s:p:', long: ['asc', 'desc', 'gender'] },
  positional: ['city', 'school'],
  async run(ctx, opts, rest) {
    if (!rest.length) return hub(ctx, opts);
    const doc = await cityDoc(rest[0]);
    if (rest.length === 1) return overview(ctx, opts, doc);
    return detail(ctx, opts, doc, rest.slice(1).join(' '));
  },
  complete: async ({ word, pos, prev, args }) => {
    if (prev === '-t') return SCHOOL_TYPES.map((t) => t.letter.toLowerCase());
    if (prev === '-s') return ['min', 'school', 'profile'];
    if (pos === 0) {
      const idx = await baloveIndex();
      return idx.cities.map((c) => ({ value: c.slug, desc: c.name }));
    }
    try {
      const doc = await cityDoc(args[0]);
      if (prev === '-p' && args[1]) return findSchool(doc, args.slice(1).join(' ')).profiles.map((p) => ({ value: p.code, desc: p.name }));
      if (pos === 1) return doc.schools.map((s) => ({ value: s.code, desc: s.name }));
    } catch {
      return [];
    }
    return [];
  },
});

