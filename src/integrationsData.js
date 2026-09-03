/**
 * Public Integrations page content.
 *
 * Kept in its own module so the marketing copy can be asserted by a plain
 * node:test run without booting React or a browser.
 *
 * `logo` is optional. When present it must be a site-relative path under
 * public/ pointing at artwork the partner supplied to us. Never point it at a
 * third-party or webmail URL, and never invent artwork for a partner that has
 * not sent any: a card with no `logo` renders an honest text wordmark instead.
 */
export const integrationCategories = [
  {
    name: 'Multiple Listing Service (MLS)',
    items: [
      // No logo was supplied for Cincinnati, so this card stays an honest
      // wordmark rather than borrowed or invented artwork.
      { name: 'CincyMLS', desc: 'MLS of Greater Cincinnati' },
      {
        name: 'Coconut Coast Organization of REALTORS®',
        desc: 'Formerly Bonita-Estero REALTORS®',
        logo: '/images/integrations/coconut-coast-organization-of-realtors.png',
        logoAlt: 'Coconut Coast Organization of REALTORS logo',
      },
      {
        name: 'Baldwin County Association of REALTORS®',
        desc: 'Baldwin County, Alabama',
        logo: '/images/integrations/baldwin-county-association-of-realtors.png',
        logoAlt: 'Baldwin County Association of REALTORS logo',
      },
      {
        name: 'Gulf Coast MLS - Mobile Area Association of REALTORS®',
        desc: 'Mobile area, Alabama',
        logo: '/images/integrations/gulf-coast-mls-mobile-area-association-of-realtors.jpg',
        logoAlt: 'Gulf Coast MLS, Mobile Area Association of REALTORS logo',
      },
    ],
  },
  {
    name: 'Customer Relationship Management (CRM)',
    items: [
      { name: 'BoldTrail by Inside Real Estate', desc: 'Complete real estate CRM platform' },
    ],
  },
  {
    name: 'Calendars',
    items: [
      { name: 'Apple Calendar', desc: 'Seamless scheduling with Apple Calendar' },
      { name: 'Calendly', desc: 'Automated scheduling and booking' },
      { name: 'Google Calendar', desc: 'Sync appointments with Google Calendar' },
      { name: 'Microsoft Outlook Calendar', desc: 'Integrate with Outlook scheduling' },
    ],
  },
  {
    name: 'Leads',
    items: [
      { name: 'Homes.com', desc: 'Lead generation platform' },
      { name: 'Homezai', desc: 'Internal lead management' },
      { name: 'LinkedIn', desc: 'Professional networking leads' },
      { name: 'Meta (Facebook, Instagram)', desc: 'Social media advertising' },
      { name: 'Realtor.com', desc: 'Premier real estate marketplace' },
      { name: 'TikTok', desc: 'Short-form video marketing' },
      { name: 'Zillow', desc: 'Leading real estate marketplace' },
    ],
  },
  {
    name: 'Design Apps',
    items: [
      { name: 'Canva', desc: 'Professional design and marketing materials' },
      { name: 'Maxa Designs', desc: 'Real estate marketing and design solutions' },
    ],
  },
  {
    name: 'User Roster Feeds',
    items: [
      { name: 'Berkshire Hathaway HomeServices (BoldTrail)', desc: 'Agent roster synchronization' },
      { name: 'Weichert Realtors (BoldTrail)', desc: 'Agent roster synchronization' },
    ],
  },
]

export default integrationCategories
