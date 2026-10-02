// Mock bank onboarding wizard. Reads and sends nothing outside this page.
(function () {
  var steps = [
    { tpl: "tpl-personal", title: ["Personal details", "البيانات الشخصية"] },
    { tpl: "tpl-employer", title: ["Employer letter", "خطاب جهة العمل"] },
    { tpl: "tpl-income", title: ["Source of income", "مصدر الدخل"] },
    { tpl: "tpl-fatca", title: ["Tax residence", "الإقامة الضريبية"] },
    { tpl: "tpl-review", title: ["Review and submit", "المراجعة والإرسال"] }
  ];
  function dynamic(host, control, boxId, tplFor) {
    var box = host.querySelector("#" + boxId);
    function sync() {
      box.replaceChildren();
      var id = tplFor(host);
      if (id) {
        box.appendChild(host.querySelector("#" + id).content.cloneNode(true)); Portal.applyLang(box);
        var st = (window.PortalWizard && window.PortalWizard.state) || {};
        box.querySelectorAll("input,textarea").forEach(function (i) { if (i.name in st) i.value = st[i.name]; });
      }
    }
    host.querySelectorAll(control).forEach(function (c) { c.addEventListener("change", sync); });
    sync();
  }
  Portal.wizard({
    steps: steps,
    doneUrl: "done.html",
    onRender: {
      3: function (host) { dynamic(host, "#b-source", "source-extra", function (h) { return h.querySelector("#b-source").value === "other" ? "tpl-src-other" : null; }); },
      4: function (host) { dynamic(host, "input[name=taxOther]", "tax-extra", function (h) { var r = h.querySelector("input[name=taxOther]:checked"); return r && r.value === "yes" ? "tpl-tx-yes" : null; }); },
      5: function (host) {
        var cb = host.querySelector("#b-agree"), sb = host.querySelector("#submit");
        sb.disabled = !cb.checked;
        cb.addEventListener("change", function () { sb.disabled = !cb.checked; });
        host.querySelector("#b-terms-open").addEventListener("click", function (e) { Portal.openDialog("dlg-terms", e.currentTarget); });
      }
    }
  });
})();
