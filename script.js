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
