// Mock sign in: reads nothing, sends nothing, just continues to the application.
document.getElementById("signin-continue").addEventListener("click", function () { location.assign("apply.html"); });
document.getElementById("signin").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); location.assign("apply.html"); } });
