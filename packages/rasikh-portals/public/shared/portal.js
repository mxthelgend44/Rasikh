/* Rasikh MOCK portals: shared behaviour (language toggle with RTL, custom listbox, modal dialog, step wizard).
   Nothing here sends data anywhere. Field values live only in memory on the page while the wizard runs. */
(function () {
  "use strict";
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  // ---------- language ----------
  var STR = {
    complete: ["Please complete the required fields:", "يرجى إكمال الحقول المطلوبة:"],
    required: ["This field is required.", "هذا الحقل مطلوب."],
    other: ["العربية", "English"]
  };
  function readLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "ar" || q === "en") return q;
    try { var s = localStorage.getItem("portal-lang"); if (s === "ar" || s === "en") return s; } catch (e) {}
    var m = /(?:^|; )rasikh-locale=(ar|en)/.exec(doc.cookie);
    return m ? m[1] : "en";
  }
  var lang = readLang();
  function t(key) { return STR[key][lang === "ar" ? 1 : 0]; }
  var ATTRS = [["data-ar", null], ["data-ar-ph", "placeholder"], ["data-ar-aria", "aria-label"], ["data-ar-title", "title"]];
  function applyLang(root) {
    root = root || doc;
    var de = doc.documentElement;
    de.lang = lang; de.dir = lang === "ar" ? "rtl" : "ltr";
    ATTRS.forEach(function (pair) {
      $$("[" + pair[0] + "]", root).concat(root.matches && root.matches("[" + pair[0] + "]") ? [root] : []).forEach(function (el) {
        var enKey = "data-en" + pair[0].slice(7);
        if (!el.hasAttribute(enKey)) el.setAttribute(enKey, pair[1] ? (el.getAttribute(pair[1]) || "") : el.textContent);
        var v = lang === "ar" ? el.getAttribute(pair[0]) : el.getAttribute(enKey);
        if (pair[1]) el.setAttribute(pair[1], v); else el.textContent = v;
      });
    });
    var tg = $("#lang-toggle");
    if (tg) { tg.setAttribute("dir", "ltr"); tg.setAttribute("data-keep-latin", ""); tg.textContent = STR.other[lang === "ar" ? 1 : 0]; tg.setAttribute("lang", lang === "ar" ? "en" : "ar"); tg.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية"); }
    $$("[data-listbox]").forEach(syncListbox);
  }
  function setLang(l) { lang = l; try { localStorage.setItem("portal-lang", l); } catch (e) {} applyLang(); }

  // ---------- custom listbox (select-only combobox pattern) ----------
  function syncListbox(box) {
    var btn = $("[role=combobox]", box), hid = $("input[type=hidden]", box), val = $("[data-value-text]", box);
    var sel = $$("[role=option]", box).filter(function (o) { return o.getAttribute("data-value") === hid.value; })[0];
    $$("[role=option]", box).forEach(function (o) { o.setAttribute("aria-selected", o === sel ? "true" : "false"); });
    val.textContent = sel ? sel.textContent : val.getAttribute(lang === "ar" ? "data-ar" : "data-en") || val.textContent;
    if (sel) val.removeAttribute("data-ar"); // once chosen, the shown text follows the option
    btn.toggleAttribute("data-chosen", !!sel);
  }
  function initListbox(box) {
    if (box.__init) return; box.__init = true;
    var btn = $("[role=combobox]", box), list = $("[role=listbox]", box), hid = $("input[type=hidden]", box);
    var val = $("[data-value-text]", box);
    if (val && !val.hasAttribute("data-en")) val.setAttribute("data-en", val.textContent);
    var opts = $$("[role=option]", box), active = -1;
    function open() { list.hidden = false; btn.setAttribute("aria-expanded", "true"); setActive(Math.max(0, opts.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; }))); }
    function close() { list.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.removeAttribute("aria-activedescendant"); opts.forEach(function (o) { o.classList.remove("active"); }); active = -1; }
    function setActive(i) { active = (i + opts.length) % opts.length; opts.forEach(function (o, j) { o.classList.toggle("active", j === active); }); btn.setAttribute("aria-activedescendant", opts[active].id); opts[active].scrollIntoView({ block: "nearest" }); }
    function choose(o) { hid.value = o.getAttribute("data-value"); hid.dispatchEvent(new Event("change", { bubbles: true })); syncListbox(box); close(); btn.focus(); }
    btn.addEventListener("click", function () { list.hidden ? open() : close(); });
    btn.addEventListener("keydown", function (e) {
      var isOpen = !list.hidden;
      if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); return; }
      if (!isOpen) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Home") { e.preventDefault(); setActive(0); }
      else if (e.key === "End") { e.preventDefault(); setActive(opts.length - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(opts[active]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") close();
    });
    opts.forEach(function (o) { o.addEventListener("click", function () { choose(o); }); });
    doc.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
    syncListbox(box);
  }

  // ---------- modal dialog (native <dialog>) ----------
  function openDialog(id, trigger) {
    var d = doc.getElementById(id); if (!d) return;
    d.__trigger = trigger || doc.activeElement;
    if (!d.__init) {
      d.__init = true;
      $$("[data-close]", d).forEach(function (b) { b.addEventListener("click", function () { d.close(b.getAttribute("data-close")); }); });
      d.addEventListener("close", function () { if (d.__trigger && d.__trigger.isConnected) d.__trigger.focus(); if (d.__onclose) d.__onclose(d.returnValue); });
    }
    d.showModal();
    var first = $("[data-autofocus]", d) || $("h2", d); if (first) { first.setAttribute("tabindex", "-1"); first.focus(); }
    return d;
  }

  // ---------- dynamic section helper ----------
  function mount(containerId, tplId, on) {
    var c = doc.getElementById(containerId), cur = c.firstElementChild;
    if (on && !cur) { c.appendChild(doc.getElementById(tplId).content.cloneNode(true)); applyLang(c); }
    if (!on && cur) c.replaceChildren();
  }

  // ---------- wizard (each step is a <template> cloned into the host: the DOM really changes) ----------
  function wizard(cfg) {
    var host = $("#step-host"), stepper = $("#stepper"), nextBtn = $("#next"), backBtn = $("#back"), summary = $("#err-summary");
    var state = {}, n = 0;
    function pick(root) {
      $$("input,select,textarea", root).forEach(function (el) {
        if (!el.name || el.type === "file") return;
        if (el.type === "checkbox") state[el.name] = el.checked;
        else if (el.type === "radio") { if (el.checked) state[el.name] = el.value; }
        else state[el.name] = el.value;
      });
    }
    function restore(root) {
      $$("input,select,textarea", root).forEach(function (el) {
        if (!el.name || el.type === "file" || !(el.name in state)) return;
        if (el.type === "checkbox") el.checked = !!state[el.name];
        else if (el.type === "radio") el.checked = state[el.name] === el.value;
        else el.value = state[el.name];
        if (el.type === "radio" && el.checked) el.dispatchEvent(new Event("change", { bubbles: true }));
        if (el.type === "checkbox" && el.checked) el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
    function labelOf(el) {
      var l = el.id && $("label[for='" + el.id + "']"); if (l) return l.textContent.replace("*", "").trim();
      var lb = el.closest("[data-listbox]"); if (lb) { var s = $(".lbl", lb.parentElement); if (s) return s.textContent.replace("*", "").trim(); }
      var fs = el.closest("fieldset"); if (fs && $("legend", fs)) return $("legend", fs).textContent.replace("*", "").trim();
      return el.name;
    }
    function validate() {
      var bad = [];
      $$(".error", host).forEach(function (e) { e.remove(); });
      $$("[aria-invalid]", host).forEach(function (e) { e.removeAttribute("aria-invalid"); });
      var seen = {};
      $$("input,select,textarea", host).forEach(function (el) {
        var empty = false;
        if (el.type === "hidden") { var box = el.closest("[data-listbox]"); if (!box || !box.hasAttribute("data-required")) return; empty = !el.value; el = $("[role=combobox]", box); }
        else if (!el.required) return;
        else if (el.type === "checkbox") empty = !el.checked;
        else if (el.type === "radio") { if (seen[el.name]) return; seen[el.name] = 1; empty = !$("input[name='" + el.name + "']:checked", host); }
        else if (el.type === "file") empty = !(el.files && el.files.length);
        else empty = !el.value.trim();
        if (empty) {
          el.setAttribute("aria-invalid", "true"); bad.push(labelOf(el));
          var msg = doc.createElement("div"); msg.className = "error"; msg.id = (el.id || el.name) + "-err"; msg.textContent = t("required");
          (el.closest(".field,.choice,fieldset") || el.parentElement).appendChild(msg);
          el.setAttribute("aria-describedby", msg.id);
        }
      });
      if (bad.length) { summary.hidden = false; summary.textContent = t("complete") + " " + bad.join(lang === "ar" ? "، " : ", "); }
      else { summary.hidden = true; summary.textContent = ""; }
      return !bad.length;
    }
    function renderStepper() {
      stepper.replaceChildren();
      cfg.steps.forEach(function (s, i) {
        var li = doc.createElement("li"); li.textContent = s.title[0]; li.setAttribute("data-ar", s.title[1]);
        if (i + 1 < n) li.className = "done"; if (i + 1 === n) li.setAttribute("aria-current", "step");
        stepper.appendChild(li);
      });
    }
    function show(k, skipValidation) {
      if (k < 1 || k > cfg.steps.length) return;
      pick(host);
      host.replaceChildren(); n = k;
      var tpl = doc.getElementById(cfg.steps[k - 1].tpl);
      host.appendChild(tpl.content.cloneNode(true));
      restore(host);
      $$("[data-listbox]", host).forEach(initListbox);
      summary.hidden = true;
      var final = !!$("[data-final]", host);
      nextBtn.hidden = final; nextBtn.disabled = false; backBtn.disabled = k === 1;
      renderStepper();
      if (cfg.onRender && cfg.onRender[k]) cfg.onRender[k](host, state);
      applyLang(host); applyLang(stepper);
      var h = $(".step-title", host); if (h) { h.setAttribute("tabindex", "-1"); if (!skipValidation) h.focus(); }
      try { history.replaceState(null, "", "#step-" + k); } catch (e) {}
      window.PortalState = { step: k, total: cfg.steps.length };
      doc.dispatchEvent(new CustomEvent("portal:step", { detail: { step: k } }));
    }
    function next() {
      if (!validate()) return;
      var go = function () { show(n + 1); };
      if (cfg.beforeNext && cfg.beforeNext[n]) cfg.beforeNext[n](go, host, state); else go();
    }
    nextBtn.addEventListener("click", next);
    backBtn.addEventListener("click", function () { if (n > 1) show(n - 1); });
    host.addEventListener("click", function (e) { var b = e.target.closest("[data-submit]"); if (b && !b.disabled) location.assign(cfg.doneUrl); });
    var m = /^#step-(\d+)$/.exec(location.hash);
    show(m ? +m[1] : 1, !!m);
    window.PortalWizard = { go: function (k) { show(k, true); }, get step() { return n; }, state: state };
  }

  // ---------- boot ----------
  doc.addEventListener("DOMContentLoaded", function () {
    var tg = $("#lang-toggle");
    if (tg) tg.addEventListener("click", function () { setLang(lang === "ar" ? "en" : "ar"); });
    $$("[data-listbox]").forEach(initListbox);
    applyLang();
  });
  window.Portal = { applyLang: applyLang, openDialog: openDialog, mount: mount, wizard: wizard, initListbox: initListbox, t: t, get lang() { return lang; } };
})();
