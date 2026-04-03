const DEFAULT_TIMEOUT = 3200;

function getContainer() {
  let container = document.querySelector(".notify-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "notify-container";
    document.body.appendChild(container);
  }

  return container;
}

function show(message, type = "info", timeout = DEFAULT_TIMEOUT) {
  if (!message) {
    return;
  }

  const container = getContainer();
  const toast = document.createElement("div");
  toast.className = `notify notify-${type}`;
  toast.textContent = String(message);
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-hiding");
    window.setTimeout(() => toast.remove(), 180);
  }, timeout);
}

const notifyApi = {
  show,
  success(message, timeout) {
    show(message, "success", timeout);
  },
  error(message, timeout) {
    show(message, "error", timeout);
  },
  info(message, timeout) {
    show(message, "info", timeout);
  },
};

window.notify = notifyApi;
