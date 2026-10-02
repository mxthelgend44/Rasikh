// Mock utilities account wizard. Reads and sends nothing outside this page.
(function () {
  var steps = [
    { tpl: "tpl-premise", title: ["Tenancy and premise", "العقد والعقار"] },
    { tpl: "tpl-holder", title: ["Account holder", "صاحب الحساب"] },
    { tpl: "tpl-meter", title: ["Meter details", "بيانات العدّاد"] },
    { tpl: "tpl-payment", title: ["Payment method", "طريقة الدفع"] },
    { tpl: "tpl-submit", title: ["Terms and submit", "الشروط والإرسال"] }
  ];
  // a section that is inserted into the page when a radio is chosen (iframe-free, dynamic DOM)
  function dynamic(host, radioName, boxId, prefix) {
    var box = host.querySelector("#" + boxId);
    function sync() {
      var v = host.querySelector("input[name=" + radioName + "]:checked");
      box.replaceChildren();
      var tpl = v && host.querySelector("#" + prefix + v.value);
      if (tpl) {
        box.appendChild(tpl.content.cloneNode(true)); Portal.applyLang(box);
        var st = (window.PortalWizard && window.PortalWizard.state) || {};
        box.querySelectorAll("input").forEach(function (i) { if (i.name in st) i.value = st[i.name]; });
      }
    }
    host.querySelectorAll("input[name=" + radioName + "]").forEach(function (r) { r.addEventListener("change", sync); });
    sync();
  }
  Portal.wizard({
    steps: steps,
    doneUrl: "done.html",
    onRender: {
      1: function (host) { host.querySelector("#premise-help").addEventListener("click", function (e) { Portal.openDialog("dlg-premise", e.currentTarget); }); },
      3: function (host) { dynamic(host, "hasMeter", "meter-extra", "tpl-m-"); },
      4: function (host) { dynamic(host, "payMethod", "pay-extra", "tpl-pm-"); },
      5: function (host) {
        var cb = host.querySelector("#agree-terms"), sb = host.querySelector("#submit");
        sb.disabled = !cb.checked;
        cb.addEventListener("change", function () { sb.disabled = !cb.checked; });
        host.querySelector("#terms-open").addEventListener("click", function (e) { Portal.openDialog("dlg-terms", e.currentTarget); });
      }
    }
  });
})();
