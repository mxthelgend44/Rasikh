// Mock Emirates ID application wizard. Reads and sends nothing outside this page.
(function () {
  var steps = [
    { tpl: "tpl-applicant", title: ["Applicant details", "بيانات مقدم الطلب"] },
    { tpl: "tpl-documents", title: ["Photo and passport", "الصورة وجواز السفر"] },
    { tpl: "tpl-visa", title: ["Residency visa", "تأشيرة الإقامة"] },
    { tpl: "tpl-address", title: ["Delivery address", "عنوان التسليم"] },
    { tpl: "tpl-declaration", title: ["Declaration", "الإقرار"] },
    { tpl: "tpl-payment", title: ["Payment and submit", "الدفع والإرسال"] }
  ];
  function sponsorSection(host) {
    var box = host.querySelector("#sponsor-extra");
    function sync() {
      var v = host.querySelector("input[name=sponsor]:checked");
      var id = v ? "tpl-sp-" + v.value : null;
      box.replaceChildren();
      if (id) {
        box.appendChild(host.querySelector("#" + id).content.cloneNode(true)); Portal.applyLang(box);
        var st = (window.PortalWizard && window.PortalWizard.state) || {};
        box.querySelectorAll("input").forEach(function (i) { if (i.name in st) i.value = st[i.name]; });
      }
    }
    host.querySelectorAll("input[name=sponsor]").forEach(function (r) { r.addEventListener("change", sync); });
    sync();
  }
  Portal.wizard({
    steps: steps,
    doneUrl: "done.html",
    onRender: {
      3: sponsorSection,
      5: function (host) {
        var cb = host.querySelector("#declare"), nb = document.getElementById("next");
        nb.disabled = !cb.checked;
        cb.addEventListener("change", function () { nb.disabled = !cb.checked; });
      }
    },
    beforeNext: {
      4: function (go, host) {
        var txt = [host.querySelector("#street").value, host.querySelector("#area").value, host.querySelector("#emirate").selectedOptions[0].textContent].filter(Boolean).join(", ");
        document.getElementById("dlg-address-text").textContent = txt;
        var d = Portal.openDialog("dlg-address", document.getElementById("next"));
        d.__onclose = function (rv) { if (rv === "confirm") go(); };
      }
    }
  });
})();
