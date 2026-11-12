# Response to the ConsultAxis Website Review & Redesign Brief

Reply to section 12 of the brief. Everything below refers to the build in this folder.

## 1. Revised visual direction (implemented)

- **Lighter colour balance:** white is the default surface, alternating with light grey (#F4F5F6). The navy blocks are gone: hero, header, menu, closing band, contact area and footer are now white or grey. Navy (#142B45) is kept for headings, navigation text, the primary button and small details; champagne gold (#B69A69) only for fine lines, icons, small labels and the animated axis motif.
- **Homepage:** headline "Success Along Every Axis.", the supporting text and intro from the brief, two balanced service cards directly below the hero (with their focus areas: People · Sales · Processes · Operations · Strategy / Market analysis · Property documents · Economic assessment), "How we work", and a final contact call to action.
- **Calls to action** are tailored per page (for example "Request a property consultation" on Real Estate, "Discuss Sales & Revenue" on that service page) and open the contact form with the right enquiry type preselected.
- **Motion:** a quiet animated "axis field" behind every page's opening section and closing card; text and images arrive with short entrance and scroll animations; the axes diagram and the floor plan draw themselves. All of it is self-hosted, pauses when off-screen and switches to still frames for visitors who prefer reduced motion.
- **Contact form:** required fields are name, email and message; enquiry type and, for Real Estate, selling / buying / market analysis / document review are optional. The privacy notice sits beside the submit button; success and error messages are shown in place.

## 2. Information and documents still required from ConsultAxis

| Item | Status |
|---|---|
| Current official commercial register extract (PDF) | Needed to confirm the details below before `companyVerified` can be switched on |
| Registered address, managing director, Amtsgericht Kassel, HRB 19850 | Entered from the public listing, marked "verify" |
| Current articles of association / latest amendment | Needed (company purpose vs. consulting and real estate consulting) |
| Business telephone number | Missing |
| VAT ID (USt-IdNr.) and W-IdNr., if issued | Missing |
| Approved founder / management profile and photo | Missing (About Us shows no people until approved) |
| Team size | Missing (also relevant for VSBG and DPO assessment) |
| Partner names, logos and written permissions | None published until supplied |
| Confirmation of target markets, languages, B2B / B2C | Missing (Real Estate addresses private clients, so B2C applies at least there) |
| Official logo files | Missing (a typographic placeholder is used) |
| Own photography, if wanted | Optional; library photographs with credits are prepared |

## 3. Technical inventory

See `TECH-INVENTORY.md`: hosting, the Cloudflare finding for the staging site, scripts, fonts, cookies (none), storage (none), tracking (none), contact-form processing and all providers.

## 4. Legal-page placeholders still outstanding

`npm run check` lists them per page. In short:

- **Imprint:** company details (verify), telephone, VAT ID / W-IdNr. (or remove the lines), VSBG statement decision, wording on regulated activities.
- **Privacy Policy:** hosting provider, server location, log retention, mailbox provider and location, retention period for enquiries, legal-basis confirmation, DPO decision, third-country transfers (Cloudflare if kept), supervisory authority confirmation (Hessian Commissioner, for the seat in Niestetal).
- The draft notice stays on both legal pages until the legal review is done (`legalDraft: false`).

## 5. Next steps

1. Decide on production hosting (EU host with PHP, or Cloudflare with a different form handler); this sets the remaining Privacy Policy facts.
2. Supply the register extract and the items in section 2; then switch on `companyVerified`.
3. Legal review of the German Imprint and Privacy Policy; update the English translations to match.
4. Final review on the staging link, then launch.
