@workspace /fix I need to perform a major refactor to fix 3 specific issues in this project. Please execute the following 3 steps sequentially. You have permission to create, edit, and delete files.

### Step 1: Completely REMOVE Service Worker (Fix caching)
The Service Worker is causing caching issues. I want it gone.
1.  **DELETE** the file `sw.js` from the root directory.
2.  **EDIT** `index.html`:
    *   Remove the code block that registers the service worker.
    *   Insert this "Kill Switch" script in the `<head>` to force unregister existing workers for visitors:
        ```javascript
        <script>
          if(window.navigator && navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations()
            .then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
        </script>
        ```

### Step 2: Fix Dark Mode (Fix partial applying & toggle logic)
The dark mode currently only applies partially or fails on some elements.
1.  **EDIT** `css/style.css` (or `style.css`):
    *   Ensure there are global CSS variables for colors (e.g., `--bg-color`, `--text-color`).
    *   Add a global rule to force all elements to inherit these colors, preventing "white patches" in dark mode:
        ```css
        *, *::before, *::after {
            transition: background-color 0.3s, color 0.3s;
        }
        body, .card, .navbar, footer { 
            /* Ensure these elements use variables, not hardcoded colors */
            background-color: var(--bg-color);
            color: var(--text-color);
        }
        ```
2.  **EDIT** `js/script.js` (or wherever `initTheme` is):
    *   Change the toggle target from `document.body` to `document.documentElement` (the `<html>` tag).
    *   Fix the icon toggle logic: Do NOT use `replace()`. Use `remove('fa-sun', 'fa-moon')` then `add(...)` based on the current state.

### Step 3: Refactor Blog to Static JSON + Pagination (Fix API limit)
The GitHub API is failing. We will switch to a build-time JSON generation.
1.  **CREATE** a folder `scripts/` and a file `scripts/generate-posts.js`.
    *   Write a Node.js script using `fs` and `path` modules.
    *   It should scan `posts/*.md`, extract Title (first line) and Date (filename or stat), and sort by date desc.
    *   It should write the result to `posts.json` in the root.
2.  **CREATE** `.github/workflows/deploy.yml`.
    *   Create a workflow that runs on push to `main`.
    *   Steps: Checkout -> Setup Node -> Run `node scripts/generate-posts.js` -> Upload Artifact (current dir) -> Deploy to GitHub Pages.
3.  **EDIT** `js/blog.js`:
    *   Remove all GitHub API calls.
    *   Fetch `./posts.json` instead.
    *   Implement **Pagination**:
        *   Page size: 5 posts.
        *   Add logic to render only the current slice of the array.
        *   Add "Prev" and "Next" buttons to the DOM to control the page index.

Please execute these changes now.