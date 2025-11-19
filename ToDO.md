
***

# Detailed Refactoring Instruction for GitHub Copilot

**Context:**
I am maintaining a static blog website hosted on GitHub Pages (`ff66ccff.github.io`). The project uses vanilla HTML/CSS/JS. I need to implement a robust automated build pipeline and fix critical client-side bugs.

**Objective:**
Please generate code to implement the following 4-step refactoring plan.

---

### Step 1: Implement Automated Content Generation (Node.js)
Create a script named **`scripts/generate-posts.js`** (you may need to create the folder).
**Constraints:**
*   Use **only** Node.js built-in modules (`fs`, `path`). Do not require `package.json` or `npm install`.
*   **Logic:**
    1.  Scan the `./posts` directory.
    2.  Filter for `.md` files only.
    3.  For each file, parse metadata:
        *   **Title:** Read the file content. Look for the first line starting with `# ` (Markdown H1). If not found, fallback to the filename.
        *   **Date:** Try to extract from the filename if it matches `YYYY-MM-DD-title.md`. Otherwise, use `fs.statSync().birthtime`.
        *   **Path:** The relative path accessible by the browser (e.g., `posts/filename.md`).
        *   **Snippet:** Extract the first 100 characters of the text (stripping Markdown syntax if possible) for a preview.
    4.  Sort the array by Date (descending).
    5.  Write the result to **`posts.json`** in the root directory.
    6.  Log "Successfully generated posts.json" to the console.

---

### Step 2: Set up GitHub Actions Workflow
Create or overwrite **`.github/workflows/deploy.yml`**.
**Configuration Requirements:**
*   **Trigger:** On `push` to `main` branch.
*   **Permissions:** Must include `contents: read`, `pages: write`, and `id-token: write`.
*   **Job Steps:**
    1.  **Checkout** source code.
    2.  **Setup Node.js** (version 20).
    3.  **Run Build Script:** Execute `node scripts/generate-posts.js`.
    4.  **Upload Artifact:** Use `actions/upload-pages-artifact@v3`. Important: Upload the current directory `.` so that `posts.json` is included.
    5.  **Deploy:** Use `actions/deploy-pages@v4`.

---

### Step 3: Refactor Frontend Data Fetching (`blog.js`)
Modify the existing blog loading logic to stop using the GitHub API.
**Requirements:**
*   **Fetch Source:** Change `fetch('https://api.github.com/...')` to `fetch('./posts.json')`.
*   **Error Handling:** Add a `.catch()` block to log errors if the JSON fails to load.
*   **Content Loading:** When a user clicks a post title:
    *   Do **not** use `raw.githubusercontent.com`.
    *   Fetch the file using the local relative path provided in the JSON (e.g., `fetch(post.path)`).
*   **DOM:** Ensure the rendering loop matches the structure of the new JSON object (Title, Date, Snippet).

---

### Step 4: Fix Critical UI & Caching Bugs
1.  **Service Worker (`sw.js`):**
    *   Update `CACHE_NAME` to `'static-cache-v-auto-1'` to invalidate old caches.
    *   In the `install` event: execute `self.skipWaiting()` immediately.
    *   In the `activate` event: execute `clients.claim()` immediately.
    *   *Reason:* This ensures users see the new site version without manually clearing the cache.

2.  **Dark Mode Toggle (`script.js` or `index.html`):**
    *   Locate the `initTheme` or toggle event listener.
    *   **Fix:** Stop using `classList.replace()`. It causes bugs if the class state is desynchronized.
    *   **Implementation:**
        ```javascript
        // Expected Logic:
        const icon = document.getElementById('theme-icon'); // Ensure correct ID
        // Always remove both to reset state
        icon.classList.remove('fa-sun', 'fa-moon');
        // Add the correct one based on isDark boolean
        icon.classList.add(isDark ? 'fa-moon' : 'fa-sun');
        ```

**Output Request:**
Please provide the full code for:
1.  `scripts/generate-posts.js`
2.  `.github/workflows/deploy.yml`
3.  The corrected functions for `blog.js`
4.  The corrected logic for `sw.js` and the theme toggle function.