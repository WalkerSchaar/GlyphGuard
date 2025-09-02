function showToast(message, domain = "") {
  const toast = document.createElement("div");
  toast.className = "homoglyph-toast";
  toast.innerText = message;

  if (domain) {
    toast.dataset.toastFor = domain; // prevent duplicate alerts
  }

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}
