// API URLs
export const API_URL = 'https://api.muetab.com/v2';
export const SPONSORS_URL = 'https://sponsors.muetab.com';
export const GITHUB_URL = 'https://api.github.com';
export const OPENSTREETMAP_URL = 'https://www.openstreetmap.org';

// Moo URLs
export const WEBSITE_URL = 'https://muetab.com';
export const MARKETPLACE_URL = 'https://muetab.com/marketplace';
export const CHANGELOG_URL = 'https://muetab.com/blog/changelog';
export const PRIVACY_URL = 'https://muetab.com/privacy';
export const WEBLATE_URL = 'https://hosted.weblate.org/projects/mue/mue-tab/';
export const REPO_URL = 'https://github.com/apoapostolov/Moo-New-Tab-for-Firefox';
export const ISSUES_URL = `${REPO_URL}/issues`;
// The settings header appends the page name as the issue title.
export const BUG_REPORT = `${ISSUES_URL}/new?labels=bug&template=bug_report.yml&title=`;
export const SENTRY_DSN =
  'https://430352fd4b174d688ebd82fc85c22c58@o1217438.ingest.sentry.io/6359480';
export const KNOWLEDGEBASE = 'https://support.muetab.com';

// Moo Info
export const ORG_NAME = 'apoapostolov';
export const REPO_NAME = 'Moo-New-Tab-for-Firefox';
export const EMAIL = 'theapoapostolov@gmail.com';
export const TWITTER_HANDLE = 'apomakesmods';
export const DISCORD_SERVER = 'zv8C9F8';

export const VERSION = '1.0.0';

// Feature flags
// Hides the Experimental page; its debug hotkey loads unconditionally.
export const SHOW_EXPERIMENTAL = false;
// Hides the Discord invite in About; set to true to show it.
export const SHOW_DISCORD_LINK = false;
