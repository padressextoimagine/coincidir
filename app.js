/* Coincidir — encontrar el mejor horario para un grupo.
   Sin dependencias. Datos en Supabase (o localStorage en modo demo). */
(function () {
  "use strict";

  // ---------- Traducciones ----------
  const I18N = {
    es: {
      demoBanner: "Modo demo: los datos se guardan solo en este navegador. Configura Supabase en config.js para compartir con el equipo.",
      createTitle: "Nueva reunión",
      createSubtitle: "Elige las fechas posibles y el rango horario. Después comparte el link y cada persona marca cuándo puede.",
      eventName: "Nombre de la reunión",
      eventNamePh: "Ej.: Reunión de equipo",
      pickDates: "Fechas posibles (toca o arrastra para elegir)",
      clear: "Limpiar",
      datesSelected: (n) => n === 1 ? "1 fecha elegida" : `${n} fechas elegidas`,
      from: "Desde",
      to: "Hasta",
      slotSize: "Bloques de",
      timezone: "Zona horaria",
      createBtn: "Crear y obtener link",
      errName: "Escribe un nombre para la reunión.",
      errDates: "Elige al menos una fecha.",
      errHours: "La hora de fin debe ser posterior a la de inicio.",
      errSave: "No se pudo guardar. Revisa la conexión o la configuración.",
      shareLink: "Comparte este link con el equipo:",
      copy: "Copiar",
      copied: "¡Copiado!",
      waText: (name, url) => `Marca cuándo puedes para "${name}": ${url}`,
      yourName: "Tu nombre",
      yourNamePh: "Ej.: Ana",
      start: "Marcar mi disponibilidad",
      change: "Cambiar",
      nameHint: "Si ya respondiste, escribe el mismo nombre para editar tus respuestas.",
      viewTz: "Ver horarios en zona:",
      myAvail: "Tu disponibilidad",
      paintHint: "Haz clic y arrastra (o desliza con el dedo) sobre los horarios en que PUEDES.",
      legendYes: "Puedo",
      legendNo: "No puedo",
      enterNameFirst: "Escribe tu nombre arriba para empezar a marcar.",
      groupAvail: "Disponibilidad del grupo",
      groupHint: "Más oscuro = más gente puede. Pasa el mouse o toca un horario para ver quién.",
      responses: (n) => n === 1 ? "1 respuesta" : `${n} respuestas`,
      saving: "Guardando…",
      saved: "Guardado ✓",
      saveError: "Error al guardar ✗",
      canGo: "Pueden",
      cantGo: "No pueden",
      nobody: "nadie",
      bestTitle: "Mejores horarios",
      duration: "Duración:",
      anyDuration: (m) => `${m} min`,
      bestEmpty: "Todavía no hay horarios de esa duración en los que alguien pueda. Prueba con una duración más corta.",
      missing: "Faltan:",
      everyone: "¡Pueden todos!",
      participants: "Participantes",
      notFound: "No encontramos esta reunión.",
      createNew: "Crear una nueva",
      newEvent: "Crear otra reunión",
      tzLocal: "(tu zona)",
      tzEvent: "(zona de la reunión)",
    },
    en: {
      demoBanner: "Demo mode: data is stored only in this browser. Set up Supabase in config.js to share with your team.",
      createTitle: "New meeting",
      createSubtitle: "Pick the possible dates and time range. Then share the link and everyone marks when they're free.",
      eventName: "Meeting name",
      eventNamePh: "e.g. Team meeting",
      pickDates: "Possible dates (tap or drag to select)",
      clear: "Clear",
      datesSelected: (n) => n === 1 ? "1 date selected" : `${n} dates selected`,
      from: "From",
      to: "To",
      slotSize: "Slots of",
      timezone: "Time zone",
      createBtn: "Create and get link",
      errName: "Please enter a meeting name.",
      errDates: "Pick at least one date.",
      errHours: "End time must be after start time.",
      errSave: "Couldn't save. Check your connection or configuration.",
      shareLink: "Share this link with your team:",
      copy: "Copy",
      copied: "Copied!",
      waText: (name, url) => `Mark when you're free for "${name}": ${url}`,
      yourName: "Your name",
      yourNamePh: "e.g. Ana",
      start: "Mark my availability",
      change: "Change",
      nameHint: "If you already answered, type the same name to edit your answers.",
      viewTz: "Show times in:",
      myAvail: "Your availability",
      paintHint: "Click and drag (or swipe) over the times you CAN make it.",
      legendYes: "Available",
      legendNo: "Unavailable",
      enterNameFirst: "Enter your name above to start.",
      groupAvail: "Group availability",
      groupHint: "Darker = more people available. Hover or tap a slot to see who.",
      responses: (n) => n === 1 ? "1 response" : `${n} responses`,
      saving: "Saving…",
      saved: "Saved ✓",
      saveError: "Save failed ✗",
      canGo: "Available",
      cantGo: "Unavailable",
      nobody: "nobody",
      bestTitle: "Best times",
      duration: "Duration:",
      anyDuration: (m) => `${m} min`,
      bestEmpty: "No time slots of that length work for anyone yet. Try a shorter duration.",
      missing: "Missing:",
      everyone: "Everyone can make it!",
      participants: "Participants",
      notFound: "We couldn't find this meeting.",
      createNew: "Create a new one",
      newEvent: "Create another meeting",
      tzLocal: "(your zone)",
      tzEvent: "(meeting zone)",
    },
  };

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  let lang = LS.get("coincidir:lang", (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es");
  const t = (key, ...args) => { const v = I18N[lang][key]; return typeof v === "function" ? v(...args) : v; };

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
    $("lang-toggle").textContent = lang === "es" ? "EN" : "ES";
  }

  // ---------- Almacenamiento ----------
  const CFG = window.COINCIDIR_CONFIG || {};
  const REMOTE = !!(CFG.supabaseUrl && CFG.supabaseKey);
  const API = REMOTE ? CFG.supabaseUrl.replace(/\/+$/, "") + "/rest/v1" : "";
  const HEADERS = REMOTE ? { apikey: CFG.supabaseKey, "Content-Type": "application/json" } : {};

  async function rest(path, opts = {}) {
    const res = await fetch(API + path, { ...opts, headers: { ...HEADERS, ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  }

  const store = REMOTE ? {
    async getEvent(id) {
      const rows = await rest(`/events?id=eq.${encodeURIComponent(id)}&select=*`);
      return rows && rows[0] ? rows[0] : null;
    },
    async createEvent(ev) {
      await rest("/events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(ev) });
    },
    async getResponses(id) {
      return (await rest(`/responses?event_id=eq.${encodeURIComponent(id)}&select=name,slots,updated_at&order=updated_at.asc`)) || [];
    },
    async saveResponse(eventId, name, slots) {
      await rest("/responses?on_conflict=event_id,name", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ event_id: eventId, name, slots, updated_at: new Date().toISOString() }),
      });
    },
  } : {
    async getEvent(id) { return LS.get("coincidir:events", {})[id] || null; },
    async createEvent(ev) { const all = LS.get("coincidir:events", {}); all[ev.id] = ev; LS.set("coincidir:events", all); },
    async getResponses(id) { return Object.values(LS.get("coincidir:resp:" + id, {})); },
    async saveResponse(eventId, name, slots) {
      const all = LS.get("coincidir:resp:" + eventId, {});
      all[name] = { name, slots, updated_at: new Date().toISOString() };
      LS.set("coincidir:resp:" + eventId, all);
    },
  };

  // ---------- Fechas y zonas horarias ----------
  const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const fmtCache = new Map();
  function partsIn(utc, tz) {
    let f = fmtCache.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
      fmtCache.set(tz, f);
    }
    const p = {};
    for (const x of f.formatToParts(new Date(utc))) p[x.type] = x.value;
    const h = +p.hour % 24;
    return { date: `${p.year}-${p.month}-${p.day}`, min: h * 60 + +p.minute, y: +p.year, m: +p.month, d: +p.day, h, mi: +p.minute };
  }
  function tzOffset(utc, tz) {
    const p = partsIn(utc, tz);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(utc / 60000) * 60000;
  }
  function zonedToUtc(dateStr, minutes, tz) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const guess = Date.UTC(y, m - 1, d, 0, minutes);
    const o1 = tzOffset(guess, tz);
    let ts = guess - o1;
    const o2 = tzOffset(ts, tz);
    if (o2 !== o1) ts = guess - o2;
    return ts;
  }
  const pad = (n) => String(n).padStart(2, "0");
  const minToHHMM = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const localDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function fmtDay(utc, tz) {
    return new Intl.DateTimeFormat(lang, { timeZone: tz, weekday: "short", day: "numeric", month: "numeric" }).format(new Date(utc));
  }
  function fmtTime(utc, tz) {
    return new Intl.DateTimeFormat(lang, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(utc));
  }
  function fmtRange(a, b, tz) {
    const sameDay = partsIn(a, tz).date === partsIn(b - 1, tz).date;
    return `${fmtDay(a, tz)}, ${fmtTime(a, tz)}–${sameDay ? "" : fmtDay(b, tz) + " "}${fmtTime(b, tz)}`;
  }

  function allTimeZones() {
    let list = [];
    try { list = Intl.supportedValuesOf("timeZone"); } catch { list = []; }
    for (const z of [LOCAL_TZ, "UTC", "America/Montevideo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"]) {
      if (!list.includes(z)) list.push(z);
    }
    return list.sort();
  }
  function fillTzSelect(sel, selected, extraLabels = {}) {
    sel.innerHTML = "";
    for (const z of allTimeZones()) {
      const o = el("option", null, z.replace(/_/g, " ") + (extraLabels[z] ? " " + extraLabels[z] : ""));
      o.value = z;
      if (z === selected) o.selected = true;
      sel.appendChild(o);
    }
  }

  // ---------- Vista: crear ----------
  function initCreate() {
    $("view-create").hidden = false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);
    const selected = new Set();
    let viewY = today.getFullYear(), viewM = today.getMonth();
    let drag = null;

    function renderCal() {
      const title = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(new Date(viewY, viewM, 1));
      $("cal-title").textContent = title;
      const g = $("cal-grid");
      g.innerHTML = "";
      const dowFmt = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
      for (let i = 0; i < 7; i++) g.appendChild(el("div", "cal-dow", dowFmt.format(new Date(2024, 0, 1 + i)))); // 1/1/2024 = lunes
      const first = new Date(viewY, viewM, 1);
      const lead = (first.getDay() + 6) % 7;
      for (let i = 0; i < lead; i++) g.appendChild(el("div"));
      const days = new Date(viewY, viewM + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const key = `${viewY}-${pad(viewM + 1)}-${pad(d)}`;
        const b = el("button", "cal-day", String(d));
        b.type = "button";
        b.dataset.key = key;
        if (key < todayKey) b.disabled = true;
        if (key === todayKey) b.classList.add("today");
        if (selected.has(key)) b.classList.add("sel");
        g.appendChild(b);
      }
      $("cal-count").textContent = t("datesSelected", selected.size);
    }
    function setDay(key, on) {
      if (on) selected.add(key); else selected.delete(key);
      const b = $("cal-grid").querySelector(`[data-key="${key}"]`);
      if (b) b.classList.toggle("sel", on);
      $("cal-count").textContent = t("datesSelected", selected.size);
    }
    const g = $("cal-grid");
    g.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".cal-day");
      if (!b || b.disabled) return;
      e.preventDefault();
      drag = !selected.has(b.dataset.key);
      setDay(b.dataset.key, drag);
    });
    g.addEventListener("pointermove", (e) => {
      if (drag === null) return;
      const n = document.elementFromPoint(e.clientX, e.clientY);
      const b = n && n.closest && n.closest(".cal-day");
      if (b && !b.disabled && g.contains(b)) setDay(b.dataset.key, drag);
    });
    window.addEventListener("pointerup", () => { drag = null; });
    $("cal-prev").onclick = () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCal(); };
    $("cal-next").onclick = () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCal(); };
    $("cal-clear").onclick = () => { selected.clear(); renderCal(); };

    const s = $("ev-start"), en = $("ev-end");
    for (let h = 0; h < 24; h++) { const o = el("option", null, minToHHMM(h * 60)); o.value = h * 60; s.appendChild(o); }
    for (let h = 1; h <= 24; h++) { const o = el("option", null, h === 24 ? "24:00" : minToHHMM(h * 60)); o.value = h * 60; en.appendChild(o); }
    s.value = 9 * 60; en.value = 20 * 60;
    fillTzSelect($("ev-tz"), LOCAL_TZ);

    renderCal();
    rerenderCreate = renderCal;

    $("create-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("create-error");
      const name = $("ev-name").value.trim();
      const start = +s.value, end = +en.value;
      let msg = "";
      if (!name) msg = t("errName");
      else if (!selected.size) msg = t("errDates");
      else if (end <= start) msg = t("errHours");
      if (msg) { err.textContent = msg; err.hidden = false; return; }
      err.hidden = true;
      const ev = {
        id: randomId(),
        name,
        dates: [...selected].sort(),
        start_min: start,
        end_min: end,
        slot_min: +$("ev-slot").value,
        tz: $("ev-tz").value,
      };
      const btn = e.submitter || $("create-form").querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await store.createEvent(ev);
        location.href = `${location.pathname}?e=${ev.id}`;
      } catch (ex) {
        console.error(ex);
        err.textContent = t("errSave"); err.hidden = false; btn.disabled = false;
      }
    });
  }

  function randomId() {
    const a = "abcdefghijkmnpqrstuvwxyz23456789";
    const r = new Uint8Array(10);
    crypto.getRandomValues(r);
    return [...r].map((x) => a[x % a.length]).join("");
  }

  // ---------- Vista: evento ----------
  async function initEvent(id) {
    let ev;
    try { ev = await store.getEvent(id); } catch (e) { console.error(e); }
    if (!ev) { $("view-error").hidden = false; return; }
    $("view-event").hidden = false;
    document.title = `${ev.name} · Coincidir`;
    $("ev-title").textContent = ev.name;

    const url = `${location.origin}${location.pathname}?e=${ev.id}`;
    $("share-url").value = url;
    $("copy-btn").onclick = async () => {
      try { await navigator.clipboard.writeText(url); } catch { $("share-url").select(); document.execCommand("copy"); }
      $("copy-btn").textContent = t("copied");
      setTimeout(() => { $("copy-btn").textContent = t("copy"); }, 1500);
    };
    const updateWa = () => { $("wa-btn").href = "https://wa.me/?text=" + encodeURIComponent(t("waText", ev.name, url)); };
    updateWa();

    // Todos los bloques en UTC (ms)
    const SLOT_MS = ev.slot_min * 60000;
    const slots = [];
    for (const d of ev.dates) for (let m = ev.start_min; m < ev.end_min; m += ev.slot_min) slots.push(zonedToUtc(d, m, ev.tz));
    const slotSet = new Set(slots);
    const sortedSlots = [...slotSet].sort((a, b) => a - b);

    let viewTz = LS.get("coincidir:viewtz:" + ev.id, LOCAL_TZ);
    const labels = { [LOCAL_TZ]: t("tzLocal") };
    labels[ev.tz] = (labels[ev.tz] ? labels[ev.tz] + " " : "") + t("tzEvent");
    fillTzSelect($("view-tz"), viewTz, labels);
    $("view-tz").onchange = () => { viewTz = $("view-tz").value; LS.set("coincidir:viewtz:" + ev.id, viewTz); renderAll(); };

    // Estado
    let responses = [];           // [{name, slots:Set}]
    let me = null;                // nombre
    let mySel = new Set();
    let dirty = false, saveTimer = null, painting = false;

    const nameKey = (n) => n.trim().replace(/\s+/g, " ").toLocaleLowerCase();

    async function loadResponses() {
      try {
        const rows = await store.getResponses(ev.id);
        responses = rows.map((r) => ({ name: r.name, slots: new Set((r.slots || []).map(Number).filter((x) => slotSet.has(x))) }));
      } catch (e) { console.error(e); }
    }

    function groupData() {
      // Respuestas con mi selección actual (sin esperar a que se guarde)
      const list = responses.filter((r) => !me || nameKey(r.name) !== nameKey(me));
      if (me) list.push({ name: me, slots: mySel });
      return list.filter((r) => r.slots.size > 0 || (me && nameKey(r.name) === nameKey(me)));
    }

    // ----- Layout de grilla en la zona de visualización -----
    let layout = null;
    function buildLayout() {
      const cols = [], rows = new Set(), cell = new Map(), colFirst = new Map();
      for (const u of sortedSlots) {
        const p = partsIn(u, viewTz);
        if (!colFirst.has(p.date)) { colFirst.set(p.date, u); cols.push(p.date); }
        rows.add(p.min);
        cell.set(`${p.date}|${p.min}`, u);
      }
      cols.sort();
      layout = { cols, rows: [...rows].sort((a, b) => a - b), cell, colFirst };
    }

    function renderGrid(container, kind) {
      const { cols, rows, cell, colFirst } = layout;
      container.innerHTML = "";
      container.style.gridTemplateColumns = `auto repeat(${cols.length}, minmax(42px, 1fr))`;
      container.appendChild(el("div", "hdr"));
      for (const c of cols) {
        const h = el("div", "hdr");
        const [wd, ...rest] = fmtDay(colFirst.get(c), viewTz).split(/[ ,]+/);
        h.appendChild(el("div", null, wd));
        h.appendChild(el("div", null, rest.join(" ")));
        container.appendChild(h);
      }
      rows.forEach((m, ri) => {
        const isHour = m % 60 === 0;
        container.appendChild(el("div", "tl", isHour || ri === 0 ? minToHHMM(m) : ""));
        cols.forEach((c, ci) => {
          const u = cell.get(`${c}|${m}`);
          const d = el("div", "c");
          if (isHour) d.classList.add("hour");
          if (ci === 0) d.classList.add("first-col");
          if (u === undefined) d.classList.add("void");
          else { d.dataset.u = u; d.dataset.r = ri; d.dataset.c = ci; }
          container.appendChild(d);
        });
      });
      container.dataset.kind = kind;
    }

    function paintMine() {
      $("my-grid").querySelectorAll(".c[data-u]").forEach((d) => d.classList.toggle("on", mySel.has(+d.dataset.u)));
    }

    function paintGroup() {
      const data = groupData();
      const total = data.length;
      const counts = new Map();
      for (const r of data) for (const u of r.slots) counts.set(u, (counts.get(u) || 0) + 1);
      let max = 0;
      counts.forEach((v) => { if (v > max) max = v; });
      $("group-grid").querySelectorAll(".c[data-u]").forEach((d) => {
        const n = counts.get(+d.dataset.u) || 0;
        d.style.background = n ? `rgba(var(--heat), ${0.12 + 0.88 * (n / Math.max(total, 1))})` : "#fff";
        d.classList.toggle("all", total > 1 && n === total);
      });
      $("heat-min").textContent = `0/${total}`;
      $("heat-max").textContent = `${total}/${total}`;
      $("resp-count").textContent = t("responses", total);
      renderPeople(data);
      renderBest(data);
    }

    function renderPeople(data) {
      const box = $("people");
      box.innerHTML = "";
      for (const r of data) {
        const c = el("span", "chip", r.name);
        if (me && nameKey(r.name) === nameKey(me)) c.classList.add("me");
        box.appendChild(c);
      }
    }

    // ----- Celda: quién puede -----
    let activeCell = null;
    function showCell(d) {
      if (activeCell) activeCell.classList.remove("active");
      activeCell = d;
      d.classList.add("active");
      const u = +d.dataset.u;
      const data = groupData();
      const yes = data.filter((r) => r.slots.has(u)).map((r) => r.name);
      const no = data.filter((r) => !r.slots.has(u)).map((r) => r.name);
      const box = $("cell-info");
      box.innerHTML = "";
      box.appendChild(el("div", "when", fmtRange(u, u + SLOT_MS, viewTz))).style.fontWeight = "600";
      const a = el("div", "ok"); a.textContent = `${t("canGo")} (${yes.length}): ${yes.join(", ") || t("nobody")}`;
      const b = el("div", "ko"); b.textContent = `${t("cantGo")} (${no.length}): ${no.join(", ") || t("nobody")}`;
      box.appendChild(a); box.appendChild(b);
      box.hidden = false;
    }
    const gg = $("group-grid");
    gg.addEventListener("mouseover", (e) => { const d = e.target.closest(".c[data-u]"); if (d) showCell(d); });
    gg.addEventListener("click", (e) => { const d = e.target.closest(".c[data-u]"); if (d) showCell(d); });

    // ----- Mejores horarios -----
    const durSel = $("dur-select");
    const durations = [ev.slot_min, 30, 45, 60, 90, 120, 180].filter((v, i, a) => v >= ev.slot_min && v % ev.slot_min === 0 && a.indexOf(v) === i && v <= ev.end_min - ev.start_min).sort((a, b) => a - b);
    let dur = LS.get("coincidir:dur:" + ev.id, durations.includes(60) ? 60 : durations[0]);
    if (!durations.includes(dur)) dur = durations[0];
    function fillDur() {
      durSel.innerHTML = "";
      for (const v of durations) { const o = el("option", null, t("anyDuration", v)); o.value = v; if (v === dur) o.selected = true; durSel.appendChild(o); }
    }
    fillDur();
    durSel.onchange = () => { dur = +durSel.value; LS.set("coincidir:dur:" + ev.id, dur); paintGroup(); };

    function renderBest(data) {
      const list = $("best-list");
      list.innerHTML = "";
      const total = data.length;
      const k = Math.max(1, Math.round(dur / ev.slot_min));
      const windows = [];
      if (total) {
        for (let i = 0; i + k <= sortedSlots.length; i++) {
          const startU = sortedSlots[i];
          if (sortedSlots[i + k - 1] !== startU + (k - 1) * SLOT_MS) continue; // no consecutivos
          const who = data.filter((r) => { for (let j = 0; j < k; j++) if (!r.slots.has(startU + j * SLOT_MS)) return false; return true; });
          if (who.length) windows.push({ start: startU, end: startU + k * SLOT_MS, who });
        }
      }
      windows.sort((a, b) => b.who.length - a.who.length || a.start - b.start);
      const picked = [];
      for (const w of windows) {
        if (picked.some((p) => w.start < p.end && p.start < w.end)) continue;
        picked.push(w);
        if (picked.length >= 5) break;
      }
      // Extender cada ventana mientras siga la misma gente
      for (const p of picked) {
        const names = new Set(p.who.map((r) => r.name));
        let next = p.end;
        while (slotSet.has(next) && !picked.some((q) => q !== p && q.start <= next && next < q.end) &&
               p.who.every((r) => r.slots.has(next)) &&
               data.filter((r) => r.slots.has(next)).every((r) => names.has(r.name))) next += SLOT_MS;
        p.end = next;
      }
      // Unir ventanas contiguas con exactamente la misma gente
      const key = (w) => w.who.map((r) => r.name).sort().join("\u0001");
      picked.sort((a, b) => a.start - b.start);
      for (let i = 0; i < picked.length - 1; i++) {
        if (picked[i].end === picked[i + 1].start && key(picked[i]) === key(picked[i + 1])) {
          picked[i].end = picked[i + 1].end;
          picked.splice(i + 1, 1);
          i--;
        }
      }
      picked.sort((a, b) => b.who.length - a.who.length || a.start - b.start);
      $("best-empty").hidden = picked.length > 0;
      for (const p of picked) {
        const li = el("li");
        li.appendChild(el("span", "when", fmtRange(p.start, p.end, viewTz)));
        li.appendChild(el("span", "count", `${p.who.length}/${total}`));
        const names = new Set(p.who.map((r) => r.name));
        const missing = data.filter((r) => !names.has(r.name)).map((r) => r.name);
        li.appendChild(el("div", "missing", missing.length ? `${t("missing")} ${missing.join(", ")}` : t("everyone")));
        list.appendChild(li);
      }
    }

    // ----- Pintar mi disponibilidad (selección rectangular, mouse y touch) -----
    const mg = $("my-grid");
    let dragStart = null, dragMode = true, baseSel = null;
    function cellAt(e) {
      const n = document.elementFromPoint(e.clientX, e.clientY);
      const d = n && n.closest && n.closest(".c");
      return d && mg.contains(d) && d.dataset.r !== undefined ? d : null;
    }
    function applyRect(d) {
      const r0 = +dragStart.dataset.r, c0 = +dragStart.dataset.c, r1 = +d.dataset.r, c1 = +d.dataset.c;
      mySel = new Set(baseSel);
      const [ra, rb] = [Math.min(r0, r1), Math.max(r0, r1)], [ca, cb] = [Math.min(c0, c1), Math.max(c0, c1)];
      for (let r = ra; r <= rb; r++) for (let c = ca; c <= cb; c++) {
        const u = layout.cell.get(`${layout.cols[c]}|${layout.rows[r]}`);
        if (u === undefined) continue;
        if (dragMode) mySel.add(u); else mySel.delete(u);
      }
      paintMine();
    }
    mg.addEventListener("pointerdown", (e) => {
      if (!me) return;
      const d = cellAt(e);
      if (!d) return;
      e.preventDefault();
      painting = true;
      dragStart = d;
      baseSel = new Set(mySel);
      dragMode = !mySel.has(+d.dataset.u);
      applyRect(d);
    });
    mg.addEventListener("pointermove", (e) => {
      if (!dragStart) return;
      const d = cellAt(e);
      if (d) applyRect(d);
    });
    const endDrag = () => {
      if (!dragStart) return;
      dragStart = null; painting = false;
      dirty = true;
      paintGroup();
      scheduleSave();
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    function scheduleSave() {
      clearTimeout(saveTimer);
      $("save-status").textContent = t("saving");
      saveTimer = setTimeout(save, 500);
    }
    async function save() {
      if (!me || !dirty) return;
      dirty = false;
      try {
        await store.saveResponse(ev.id, me, [...mySel].sort((a, b) => a - b));
        $("save-status").textContent = t("saved");
        const idx = responses.findIndex((r) => nameKey(r.name) === nameKey(me));
        const entry = { name: me, slots: new Set(mySel) };
        if (idx >= 0) responses[idx] = entry; else responses.push(entry);
      } catch (e) {
        console.error(e);
        dirty = true;
        $("save-status").textContent = t("saveError");
      }
    }
    window.addEventListener("beforeunload", () => { if (dirty) save(); });

    // ----- Identificarse -----
    function setMe(name) {
      const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);
      if (!clean) return;
      const existing = responses.find((r) => nameKey(r.name) === nameKey(clean));
      me = existing ? existing.name : clean;
      mySel = new Set(existing ? existing.slots : []);
      $("my-name").value = me;
      $("my-overlay").hidden = true;
      LS.set("coincidir:me:" + ev.id, me);
      $("save-status").textContent = "";
      paintMine();
      paintGroup();
    }
    $("name-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (dirty) save();
      setMe($("my-name").value);
    });

    function renderAll() {
      buildLayout();
      renderGrid($("my-grid"), "mine");
      renderGrid($("group-grid"), "group");
      activeCell = null;
      $("cell-info").hidden = true;
      paintMine();
      paintGroup();
    }

    rerenderEvent = () => { fillDur(); updateWa(); renderAll(); if (me) $("save-status").textContent = ""; };

    await loadResponses();
    renderAll();
    const remembered = LS.get("coincidir:me:" + ev.id, null);
    if (remembered) setMe(remembered);

    // Refrescar respuestas de los demás cada 15 s
    setInterval(async () => {
      if (painting || document.hidden) return;
      await loadResponses();
      paintGroup();
    }, 15000);
  }

  // ---------- Arranque ----------
  let rerenderCreate = null, rerenderEvent = null;
  $("lang-toggle").addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    LS.set("coincidir:lang", lang);
    applyI18n();
    if (rerenderCreate) rerenderCreate();
    if (rerenderEvent) rerenderEvent();
  });

  applyI18n();
  if (!REMOTE) $("demo-banner").hidden = false;
  const id = new URLSearchParams(location.search).get("e");
  if (id) initEvent(id); else initCreate();
})();
