if ("serviceWorker" in navigator && document.currentScript) {
  const swUrl = new URL("sw.js", document.currentScript.src).href;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}

(function () {
  const banner = document.getElementById("install-banner");
  const text = document.getElementById("install-banner-text");
  const installBtn = document.getElementById("install-btn");
  const dismissBtn = document.getElementById("install-dismiss");
  if (!banner) return;

  const dismissKey = "install-banner-dismissed";
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(dismissKey) === "1";
  } catch (err) {
    dismissed = false;
  }

  if (isStandalone || dismissed) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt = null;

  if (isIOS) {
    text.textContent = 'Add this to your home screen: tap Share, then "Add to Home Screen."';
    banner.hidden = false;
  } else {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      text.textContent = "Install this as an app for quick access.";
      installBtn.hidden = false;
      banner.hidden = false;
    });
  }

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.hidden = true;
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      banner.hidden = true;
      try {
        localStorage.setItem(dismissKey, "1");
      } catch (err) {
        // ignore storage errors
      }
    });
  }

  window.addEventListener("appinstalled", () => {
    banner.hidden = true;
  });
})();

document.querySelectorAll(".waitlist-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    if (form.action.includes("list-manage.com")) {
      // Mailchimp doesn't accept cross-origin AJAX submissions from another
      // domain - let the browser submit normally. The form's target="_blank"
      // opens Mailchimp's own confirmation page in a new tab.
      return;
    }

    event.preventDefault();

    const status = document.getElementById("form-status");
    const button = form.querySelector("button");
    const originalLabel = button.textContent;

    if (form.action.includes("YOUR_FORM_ID")) {
      if (status) {
        status.textContent = "Waitlist isn't connected yet — add a Formspree form ID (see README).";
        status.className = "form-status error";
      }
      return;
    }

    button.disabled = true;
    button.textContent = "Joining...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (response.ok) {
        form.reset();
        if (status) {
          status.textContent = "You're on the list. Talk soon.";
          status.className = "form-status success";
        }
      } else {
        throw new Error("Request failed");
      }
    } catch (err) {
      if (status) {
        status.textContent = "Something went wrong — please try again.";
        status.className = "form-status error";
      }
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
});
