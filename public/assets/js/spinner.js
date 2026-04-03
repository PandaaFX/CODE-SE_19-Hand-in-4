window.addEventListener("load", function (e) {
  const spinner_bg = this.document.querySelector(".spinner__background");
  if (!spinner_bg) return;

  spinner_bg.classList.add("fadeOut");
  this.setTimeout(() => spinner_bg.remove(), 1000);
});
