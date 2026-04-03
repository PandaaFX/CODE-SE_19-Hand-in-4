function showNotification(message, isSuccess) {
  if (window.notify) {
    if (isSuccess) {
      window.notify.success(message);
    } else {
      window.notify.error(message);
    }
    return;
  }

  console.warn("notify is not available yet:", message);
}

function setSubmittingState(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]');

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.style.opacity = isSubmitting ? "0.7" : "1";
}

async function sendForm(event, formAction, formMethodOverride) {
  event.preventDefault();

  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }

  const formData = new FormData(form);
  const body = new URLSearchParams(formData).toString();

  setSubmittingState(form, true);

  try {
    const response = await fetch(`/${formAction}`, {
      method: formMethodOverride || "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json",
      },
      body,
    });

    if (response.redirected) {
      window.location.assign(response.url);
      return {
        ok: true,
        status: response.status,
        payload: null,
      };
    }

    let payload = null;
    const responseText = await response.text();

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    const result = {
      ok: response.ok,
      status: response.status,
      payload,
    };

    if (response.ok) {
      showNotification(
        payload.message ?? "Request completed successfully.",
        true,
      );

      if (payload?.reload) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } else {
      const errorMessage =
        (payload && payload.errorMessage) ||
        (payload && payload.message) ||
        (typeof payload === "string" && payload) ||
        `Request failed with status ${response.status}`;

      showNotification(errorMessage, false);
    }

    return result;
  } catch (error) {
    showNotification("Network error. Please try again.", false);

    return {
      ok: false,
      status: 0,
      payload: null,
      error,
    };
  } finally {
    setSubmittingState(form, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form[data-form-action]");

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      const formAction = form.getAttribute("data-form-action");
      if (!formAction) {
        return;
      }

      const formMethodOverride = form.getAttribute("data-form-method");

      await sendForm(event, formAction, formMethodOverride);
    });
  });
});
