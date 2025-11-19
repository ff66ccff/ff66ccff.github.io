const storageKey = 'theme-preference';

const onClick = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    setPreference();
};

const getColorPreference = () => {
    if (localStorage.getItem(storageKey))
        return localStorage.getItem(storageKey);
    else
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const setPreference = () => {
    localStorage.setItem(storageKey, theme.value);
    reflectPreference();
};

const reflectPreference = () => {
    document.documentElement.setAttribute('data-theme', theme.value);
    const toggleBtn = document.querySelector('#theme-toggle');
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', theme.value);
        toggleBtn.innerHTML = theme.value === 'light'
            ? '<i class="fas fa-moon"></i>'
            : '<i class="fas fa-sun"></i>';
    }
};

const theme = {
    value: getColorPreference(),
};

// Initialize
reflectPreference();

window.onload = () => {
    reflectPreference();
    const toggleBtn = document.querySelector('#theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', onClick);
    }
};

// Sync with system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches: isDark }) => {
    theme.value = isDark ? 'dark' : 'light';
    setPreference();
});
