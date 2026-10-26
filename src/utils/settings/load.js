import variables from 'config/variables';
import ExperimentalInit from 'utils/experimental';

/**
 * Applies stored settings to the page. `hotreload` skips the one-time work.
 */
export function loadSettings(hotreload) {
  switch (localStorage.getItem('theme')) {
    case 'dark':
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      break;
    case 'auto':
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
      break;
    default:
      document.body.classList.add('light');
      document.body.classList.remove('dark');
  }

  document.title = localStorage.getItem('tabName') || variables.getMessage('tabname');

  if (hotreload === true) {
    // Drop the injected tags so they can be rebuilt from current settings.
    const custom = ['customcss', 'customfont'];
    custom.forEach((element) => {
      try {
        document.head.removeChild(document.getElementById(element));
      } catch {
        // Element may be absent.
      }
    });
  }

  if (localStorage.getItem('animations') === 'false') {
    document.body.classList.add('no-animations');
  } else {
    document.body.classList.remove('no-animations');
  }

  // The setting is really a text SHADOW rather than a border; the name predates it.
  // The class goes on the body: this runs before the clock is mounted, so the clock
  // cannot be found yet and the shadow never arrived on a fresh page.
  const textBorder = localStorage.getItem('textBorder');
  document.body.classList.toggle('hardTextShadow', textBorder === 'true');

  // 'none' removes the default shadow as well.
  if (textBorder === 'none') {
    document.getElementById('center').classList.add('no-textBorder');
  } else {
    document.getElementById('center').classList.remove('no-textBorder');
  }

  const css = localStorage.getItem('customcss');
  if (css) {
    const style = document.createElement('style');
    style.id = 'customcss';
    style.textContent = css;
    document.head.append(style);
  }

  const font = localStorage.getItem('font');
  if (font) {
    let url = '';
    if (localStorage.getItem('fontGoogle') === 'true') {
      url = `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}&display=swap');`;
    }

    const style = document.createElement('style');
    style.id = 'customfont';
    style.textContent = `
          ${url}
          * {
            font-family: '${font}', 'Lexend Deca', 'Inter', sans-serif !important;
            font-weight: ${localStorage.getItem('fontweight')};
            font-style: ${localStorage.getItem('fontstyle')};
          }
      `;
    document.head.append(style);
  }

  // Seeded on update: an older profile has no value for these keys.
  if (localStorage.getItem('applinks') === null) {
    localStorage.setItem('applinks', JSON.stringify([]));
  }
  if (localStorage.getItem('appsEnabled') === null) {
    localStorage.setItem('appsEnabled', false);
  }

  // One-time work only.
  if (hotreload === true) {
    return;
  }

  ExperimentalInit();
}
