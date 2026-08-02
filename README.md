# Expat BA (working name)

Landing page + email waitlist to validate demand for an app that helps
foreigners moving to Buenos Aires with the practical stuff: DNI, CUIT, bank
account, housing without a local guarantor, safely changing money, and
vetted English-speaking contacts (doctors, agents, lawyers).

This repo currently contains **only the validation landing page** — no
app yet. The idea is to see if people actually sign up before building
anything bigger.

## Files

- `index.html` — the page
- `style.css` — styling (light/dark aware)
- `script.js` — waitlist form handling (Formspree, AJAX)

## Setup: connect the waitlist form (required)

The signup form currently points at a placeholder
(`https://formspree.io/f/YOUR_FORM_ID`) and will **not** collect emails
until you connect a real form backend:

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form, copy its form ID (looks like `xzznkba`)
3. In `index.html`, replace both occurrences of `YOUR_FORM_ID` with your
   real form ID
4. Commit and push — signups will now land in your Formspree dashboard
   (and can be forwarded to email or exported to CSV)

Any other form backend (Google Forms, a custom endpoint, Mailchimp, etc.)
works too — just change the form `action` and adjust `script.js` if the
response format differs.

## Deploy: GitHub Pages (free, no build step)

1. Go to **Settings → Pages** in this repo
2. Under "Build and deployment", choose **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Save — the page will be live at `https://5hitcake.github.io/expat/`
   within a minute or two

## Next steps

- [ ] Connect Formspree
- [ ] Enable GitHub Pages
- [ ] Share the link in relevant expat/digital nomad communities (Facebook
      groups, Reddit, forums) to start collecting signups
- [ ] Decide on final name/branding
- [ ] Once there's real signal, scope the first real version (checklists
      content, then community features)
