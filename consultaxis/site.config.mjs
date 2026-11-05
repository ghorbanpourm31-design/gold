// ConsultAxis website configuration.
// Everything that is a fact about the company or the technical setup lives here,
// so the pages and the legal texts read from one place.

export default {
  // Production origin. consultaxis.me should 301-redirect here (see public/.htaccess).
  origin: 'https://www.consultaxis.de',

  // Languages. To add one: copy content/en.json to content/<code>.json, translate it,
  // add legal texts under content/legal/<code>/, add the language here and add its
  // slugs to every route below. No template changes are needed.
  languages: [
    { code: 'de', locale: 'de_DE', label: 'Deutsch', short: 'DE' },
    { code: 'en', locale: 'en_GB', label: 'English', short: 'EN' },
  ],
  defaultLanguage: 'de',

  // Route key -> slug per language. URLs are /<lang>/<slug>/.
  routes: {
    home: { de: '', en: '' },
    business: { de: 'unternehmensberatung', en: 'business-consulting' },
    people: { de: 'unternehmensberatung/personal-und-organisation', en: 'business-consulting/people-and-organisation' },
    sales: { de: 'unternehmensberatung/vertrieb-und-umsatz', en: 'business-consulting/sales-and-revenue' },
    documents: { de: 'unternehmensberatung/dokumente-und-prozesse', en: 'business-consulting/documents-and-processes' },
    operations: { de: 'unternehmensberatung/betrieb-und-kosten', en: 'business-consulting/operations-and-costs' },
    strategy: { de: 'unternehmensberatung/geschaeftsentwicklung-und-strategie', en: 'business-consulting/business-development-and-strategy' },
    realestate: { de: 'immobilienberatung', en: 'real-estate-consulting' },
    about: { de: 'ueber-uns', en: 'about-us' },
    industries: { de: 'branchen', en: 'industries' },
    partners: { de: 'partner', en: 'partners' },
    contact: { de: 'kontakt', en: 'contact' },
    thanks: { de: 'kontakt/danke', en: 'contact/thank-you' },
    sendError: { de: 'kontakt/fehler', en: 'contact/error' },
    imprint: { de: 'impressum', en: 'imprint' },
    privacy: { de: 'datenschutz', en: 'privacy-policy' },
  },

  // Main navigation, in order (the client's suggested structure).
  nav: ['home', 'business', 'realestate', 'about', 'industries', 'partners', 'contact'],

  // The five business consulting areas, in order.
  serviceAreas: ['people', 'sales', 'documents', 'operations', 'strategy'],

  // Shows a "draft for legal review" notice on Imprint and Privacy Policy. Set to false only
  // after the legal texts have been reviewed and every placeholder is filled.
  legalDraft: true,

  // Pages that must not be indexed.
  noindex: ['thanks', 'sendError'],

  // Company facts. Empty strings are NOT published on marketing pages; the legal
  // pages show a marked placeholder instead, and `npm run check` lists every gap.
  // Fill these only with details verified against the commercial register.
  company: {
    name: 'ConsultAxis UG (haftungsbeschränkt)',
    brand: 'ConsultAxis',
    email: 'info@consultaxis.de',
    phone: '', // e.g. '+49 69 1234567' once confirmed. Shown on the contact page only when set.
    street: '',
    postcode: '',
    city: '',
    country: { de: 'Deutschland', en: 'Germany' },
    managingDirectors: '',
    registerCourt: '',
    registerNumber: '',
    vatId: '',
    businessId: '',
  },

  // Hosting and processors. Fill in once the hosting contract is signed; the
  // privacy policy reads these values.
  hosting: {
    provider: '', // e.g. 'Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen'
    serverLocation: '', // e.g. 'Germany'
    logRetentionDays: '', // e.g. '7'
  },
  mail: {
    provider: '', // mailbox provider for info@consultaxis.de
    location: '',
  },

  // Consent management. Every optional (non-essential) service the site loads must be
  // registered here. While this list is empty the site sets no cookies and uses no
  // local storage, so no banner is shown; the "Cookie settings" link explains that.
  // Example entry, kept for reference (do not uncomment without updating the privacy policy):
  // { id: 'matomo', category: 'statistics', name: 'Matomo (self-hosted)', provider: 'ConsultAxis UG',
  //   location: 'Germany', purpose: { de: '...', en: '...' }, cookies: ['_pk_id (13 months)', '_pk_ses (30 minutes)'],
  //   src: '/assets/js/matomo-loader.js' }
  consent: {
    version: '2026-11-05',
    services: [],
  },
};
