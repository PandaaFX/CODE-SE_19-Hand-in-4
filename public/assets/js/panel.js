const modal = document.getElementById("delete-modal");
const btnOpen = document.getElementById("btn-open-delete-modal");
const btnCancel = document.getElementById("btn-cancel-delete");

if (btnOpen && modal) {
  btnOpen.addEventListener("click", function () {
    modal.classList.add("is-open");
  });

  btnCancel.addEventListener("click", function () {
    modal.classList.remove("is-open");
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      modal.classList.remove("is-open");
    }
  });
}

const infoForm = document.getElementById("update-info-form");

if (infoForm) {
  const fields = infoForm.querySelectorAll(".field-value");
  const saveBtn = document.getElementById("btn-save-info");
  const originals = {};

  fields.forEach(function (field) {
    originals[field.name] = field.value;
  });

  function checkDirty() {
    let dirty = false;
    fields.forEach(function (field) {
      if (field.value !== originals[field.name]) {
        dirty = true;
      }
    });
    saveBtn.disabled = !dirty;
  }

  fields.forEach(function (field) {
    field.addEventListener("input", checkDirty);
  });

  infoForm.addEventListener("reset", function () {
    window.setTimeout(function () {
      checkDirty();
    }, 0);
  });

  checkDirty();
}

const passwordForm = document.getElementById("update-password-form");

if (passwordForm) {
  const saveBtn = document.getElementById("btn-save-password");
  const currentPw = document.getElementById("field-current-password");
  const newPw = document.getElementById("field-new-password");
  const confirmPw = document.getElementById("field-confirm-password");

  function checkPasswordReady() {
    const filled =
      currentPw.value.length > 0 &&
      newPw.value.length > 0 &&
      confirmPw.value.length > 0;

    const match = newPw.value === confirmPw.value;
    saveBtn.disabled = !(filled && match);

    if (confirmPw.value.length > 0 && !match) {
      confirmPw.style.borderColor = "#b42318";
    } else {
      confirmPw.style.borderColor = "";
    }
  }

  [currentPw, newPw, confirmPw].forEach(function (field) {
    field.addEventListener("input", checkPasswordReady);
  });

  passwordForm.addEventListener("reset", function () {
    window.setTimeout(function () {
      checkPasswordReady();
      confirmPw.style.borderColor = "";
    }, 0);
  });

  checkPasswordReady();
}

const avatarWrapper = document.getElementById("avatar-wrapper");

if (avatarWrapper) {
  avatarWrapper.addEventListener("click", async function () {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Images",
          accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    });

    const file = await fileHandle.getFile();

    const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowed.has(file.type)) {
      window.notify.error("Unsupported file type.");
      return;
    }

    const request = await fetch("/panel/updateUserAvatar", {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    const response = await request.json();
    if (request?.ok) {
      window.notify.success(response?.message ?? "Updated!");
      document.getElementById("avatar-img").src = `/api/avatar?v=${Date.now()}`;
    } else {
      window.notify.error(response?.errorMessage ?? "Something went wrong");
    }
  });
}
