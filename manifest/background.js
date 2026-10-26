/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
if (typeof browser === 'undefined') {
  var browser = chrome;
}

browser.runtime.setUninstallURL('https://github.com/apoapostolov/Moo-New-Tab-for-Firefox');

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.tabs.create({
      url: browser.runtime.getURL('index.html'),
    });
  }
});
