# Expat BA (working name)

Free resource (and eventually app) for foreigners moving to Buenos Aires:
step-by-step guides for the practical/bureaucratic stuff (DNI, CUIT/CUIL,
visas, apostille, tax residency, bank account, housing, health insurance,
SUBE/phone, money exchange), plus a growing email newsletter for new
guides. Monetization plan is affiliate/commission on relevant products
(SIM cards, insurance, etc.), not subscriptions — the content stays free.

Started as a pure landing page to validate demand; now an installable PWA
with 11+ guides, a newsletter signup (Mailchimp), and analytics
(GoatCounter).

## Files

- `index.html` — homepage
- `guides/` — all guide pages + the guides hub (`guides/index.html`)
- `style.css` — shared styling (light/dark aware)
- `script.js` — newsletter form handling + service worker registration
- `guides/guide.js` — checklist checkbox persistence (localStorage)
- `guides/country-select.js` — country tab switcher (apostille guide)
- `manifest.json`, `sw.js`, `icons/` — PWA (installable, works offline for
  already-visited pages)

## Newsletter

Forms post to a Mailchimp audience (see the `action` URL in any
`.waitlist-form` — the CSS class name is unchanged for now, only the
visible copy says "Subscribe"). Submissions require email confirmation
(double opt-in) unless the address was previously imported as
already-subscribed.

## Deploy: GitHub Pages (free, no build step)

Settings → Pages → Deploy from a branch → `main` → `/ (root)`. Live at
`https://5hitcake.github.io/Expat/`.

## Status

- [x] Homepage, newsletter signup (Mailchimp), analytics (GoatCounter)
- [x] 11 guides covering the main visa/bureaucracy/practical topics
- [x] PWA (installable on iOS/Android, no custom domain needed)
- [ ] Custom domain — deliberately skipped for now (no budget), fine to
      revisit once there's a settled name and more traction
- [ ] Personalization (no-account quiz that tailors which guides to show)
- [ ] Vetted contacts directory (needs real curation, not fabricated)
- [ ] Affiliate links (researched: SafetyWing, Wise, Holafly/Airalo,
      Booking.com — on hold until the product direction is clearer)

## Ideas for later (not started, just captured so they don't get lost)

- **Chat / posting feature** — a way for users to talk to each other and
  post, not just read guides. Ties into the "community" concept from the
  original pitch. No urgency, just don't want to lose the idea.
