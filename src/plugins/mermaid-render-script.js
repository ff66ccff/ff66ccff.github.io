(() => {
	if (window.mermaidInitialized) return;
	window.mermaidInitialized = true;

	const MIN_SCALE = 0.2;
	const MAX_SCALE = 6;
	const ZOOM_STEP = 1.2;
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 1000;

	let currentTheme = null;
	let fullscreenSession = null;
	let isRendering = false;
	let mermaidLoadPromise = null;
	let renderQueued = false;
	let renderTimer = null;
	let retryCount = 0;
	let themeObserver = null;
	const diagramControllers = new WeakMap();

	function getThemePalette() {
		const root = document.documentElement;
		const isDark = root.classList.contains("dark");
		const styles = getComputedStyle(root);
		const surface =
			styles.getPropertyValue("--card-bg").trim() ||
			styles.getPropertyValue("--surface").trim() ||
			(isDark ? "#0b1220" : "#ffffff");
		const backdrop = isDark
			? "rgba(8, 15, 30, 0.9)"
			: "rgba(255, 255, 255, 0.94)";
		const border = isDark
			? "rgba(255, 255, 255, 0.08)"
			: "rgba(15, 23, 42, 0.08)";

		return { surface, backdrop, border };
	}

	function createControlButton(action, signal) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "mermaid-control";
		button.dataset.action = action.name;
		button.textContent = action.label;
		button.title = action.title;
		button.setAttribute("aria-label", action.title);
		button.addEventListener(
			"click",
			(event) => {
				event.preventDefault();
				event.stopPropagation();
				action.run();
			},
			{ signal },
		);
		return button;
	}

	function disposeDiagramInteraction(host) {
		diagramControllers.get(host)?.destroy();
	}

	function attachDiagramInteraction(host, svgElement, options = {}) {
		disposeDiagramInteraction(host);

		const eventController = new AbortController();
		const { signal } = eventController;
		const viewport = document.createElement("div");
		viewport.className = "mermaid-viewport";
		const wrapper = document.createElement("div");
		wrapper.className = "mermaid-zoom-wrapper";
		wrapper.appendChild(svgElement);
		viewport.appendChild(wrapper);

		const controls = document.createElement("div");
		controls.className = "mermaid-zoom-controls";
		controls.setAttribute("role", "toolbar");
		controls.setAttribute("aria-label", "Mermaid diagram controls");

		const state = { scale: 1, x: 0, y: 0 };
		let isPanning = false;
		let startClientX = 0;
		let startClientY = 0;
		let startX = 0;
		let startY = 0;

		function applyTransform() {
			wrapper.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
		}

		function setScale(nextScale, clientPoint) {
			const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
			if (scale === state.scale) return;

			const rect = viewport.getBoundingClientRect();
			const anchorX = clientPoint
				? clientPoint.clientX - rect.left
				: rect.width / 2;
			const anchorY = clientPoint
				? clientPoint.clientY - rect.top
				: rect.height / 2;
			const diagramX = (anchorX - state.x) / state.scale;
			const diagramY = (anchorY - state.y) / state.scale;

			state.scale = +scale.toFixed(3);
			state.x = anchorX - diagramX * state.scale;
			state.y = anchorY - diagramY * state.scale;
			applyTransform();
		}

		function resetView() {
			state.scale = 1;
			state.x = 0;
			state.y = 0;
			applyTransform();
		}

		const actions = [
			{
				name: "zoom-in",
				label: "+",
				title: "Zoom in",
				run: () => setScale(state.scale * ZOOM_STEP),
			},
			{
				name: "zoom-out",
				label: "−",
				title: "Zoom out",
				run: () => setScale(state.scale / ZOOM_STEP),
			},
			{
				name: "reset",
				label: "⤾",
				title: "Reset view",
				run: resetView,
			},
		];

		if (typeof options.onFullscreen === "function") {
			actions.push({
				name: "fullscreen",
				label: "⛶",
				title: "View fullscreen",
				run: options.onFullscreen,
			});
		}

		for (const action of actions) {
			controls.appendChild(createControlButton(action, signal));
		}
		host.replaceChildren(viewport, controls);

		viewport.addEventListener(
			"pointerdown",
			(event) => {
				if (!event.isPrimary) return;
				if (event.pointerType === "mouse" && event.button !== 0) return;

				event.preventDefault();
				isPanning = true;
				startClientX = event.clientX;
				startClientY = event.clientY;
				startX = state.x;
				startY = state.y;
				viewport.classList.add("is-panning");
				viewport.setPointerCapture(event.pointerId);
			},
			{ signal },
		);

		viewport.addEventListener(
			"pointermove",
			(event) => {
				if (!isPanning) return;
				state.x = startX + event.clientX - startClientX;
				state.y = startY + event.clientY - startClientY;
				applyTransform();
			},
			{ signal },
		);

		function endPan(event) {
			if (!isPanning) return;
			isPanning = false;
			viewport.classList.remove("is-panning");
			if (event && viewport.hasPointerCapture(event.pointerId)) {
				viewport.releasePointerCapture(event.pointerId);
			}
		}

		viewport.addEventListener("pointerup", endPan, { signal });
		viewport.addEventListener("pointercancel", endPan, { signal });
		viewport.addEventListener(
			"lostpointercapture",
			() => {
				isPanning = false;
				viewport.classList.remove("is-panning");
			},
			{ signal },
		);

		viewport.addEventListener(
			"wheel",
			(event) => {
				event.preventDefault();
				const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
				setScale(state.scale * factor, event);
			},
			{ passive: false, signal },
		);

		viewport.addEventListener("dblclick", resetView, { signal });
		applyTransform();

		const controller = {
			destroy() {
				eventController.abort();
				diagramControllers.delete(host);
			},
		};
		diagramControllers.set(host, controller);
		return controller;
	}

	function closeFullscreen() {
		if (!fullscreenSession) return;

		const session = fullscreenSession;
		fullscreenSession = null;
		session.eventController.abort();
		session.diagramController.destroy();
		session.overlay.remove();
		document.body.classList.remove("mermaid-fullscreen-open");

		if (session.previousFocus?.isConnected) {
			session.previousFocus.focus({ preventScroll: true });
		}
	}

	function openFullscreen(svgElement) {
		closeFullscreen();

		const palette = getThemePalette();
		const previousFocus =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		const eventController = new AbortController();
		const { signal } = eventController;
		const overlay = document.createElement("div");
		overlay.className = "mermaid-fullscreen-overlay";
		overlay.setAttribute("role", "dialog");
		overlay.setAttribute("aria-modal", "true");
		overlay.setAttribute("aria-label", "Fullscreen Mermaid diagram");
		overlay.style.setProperty("--mermaid-fs-backdrop", palette.backdrop);
		overlay.style.setProperty("--mermaid-fs-surface", palette.surface);
		overlay.style.setProperty("--mermaid-fs-border", palette.border);

		const stage = document.createElement("div");
		stage.className = "mermaid-fullscreen-stage";
		const clonedSvg = svgElement.cloneNode(true);
		clonedSvg.removeAttribute("width");
		clonedSvg.removeAttribute("height");
		clonedSvg.style.width = "100%";
		clonedSvg.style.height = "100%";
		clonedSvg.style.maxWidth = "100%";
		clonedSvg.style.maxHeight = "100%";
		clonedSvg.style.minHeight = "0";

		const diagramController = attachDiagramInteraction(stage, clonedSvg);
		const closeButton = document.createElement("button");
		closeButton.type = "button";
		closeButton.className = "mermaid-fullscreen-close";
		closeButton.textContent = "×";
		closeButton.title = "Close fullscreen";
		closeButton.setAttribute("aria-label", "Close fullscreen diagram");
		closeButton.addEventListener("click", closeFullscreen, { signal });
		stage.appendChild(closeButton);
		overlay.appendChild(stage);

		overlay.addEventListener(
			"click",
			(event) => {
				if (event.target === overlay) closeFullscreen();
			},
			{ signal },
		);

		document.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					closeFullscreen();
					return;
				}
				if (event.key !== "Tab") return;

				const focusable = Array.from(
					overlay.querySelectorAll("button:not([disabled])"),
				);
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			},
			{ signal },
		);

		fullscreenSession = {
			overlay,
			eventController,
			diagramController,
			previousFocus,
		};
		document.body.appendChild(overlay);
		document.body.classList.add("mermaid-fullscreen-open");
		closeButton.focus({ preventScroll: true });
	}

	function hasThemeChanged() {
		const nextTheme = document.documentElement.classList.contains("dark")
			? "dark"
			: "default";
		if (currentTheme === nextTheme) return false;
		currentTheme = nextTheme;
		return true;
	}

	function cleanupMutationObserver() {
		themeObserver?.disconnect();
		themeObserver = null;
	}

	function setupMutationObserver() {
		cleanupMutationObserver();
		themeObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				const wasDark =
					mutation.oldValue?.split(/\s+/).includes("dark") ?? false;
				const isDark = document.documentElement.classList.contains("dark");
				if (wasDark !== isDark && hasThemeChanged()) {
					closeFullscreen();
					scheduleRender(150);
					break;
				}
			}
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
			attributeOldValue: true,
		});
	}

	async function loadMermaid() {
		if (window.mermaid?.render) return;
		if (!mermaidLoadPromise) {
			mermaidLoadPromise = new Promise((resolve, reject) => {
				const primaryScript = document.createElement("script");
				primaryScript.src =
					"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
				primaryScript.onload = resolve;
				primaryScript.onerror = () => {
					primaryScript.remove();
					const fallbackScript = document.createElement("script");
					fallbackScript.src =
						"https://unpkg.com/mermaid@11/dist/mermaid.min.js";
					fallbackScript.onload = resolve;
					fallbackScript.onerror = () => {
						fallbackScript.remove();
						reject(
							new Error(
								"Failed to load Mermaid from both primary and fallback CDNs",
							),
						);
					};
					document.head.appendChild(fallbackScript);
				};
				document.head.appendChild(primaryScript);
			});
		}

		try {
			await mermaidLoadPromise;
		} catch (error) {
			mermaidLoadPromise = null;
			throw error;
		}
	}

	function configureMermaid(isDark) {
		window.mermaid.initialize({
			startOnLoad: false,
			theme: isDark ? "dark" : "default",
			themeVariables: {
				fontFamily: "inherit",
				fontSize: "16px",
				primaryColor: isDark ? "#ffffff" : "#000000",
				primaryTextColor: isDark ? "#ffffff" : "#000000",
				primaryBorderColor: isDark ? "#ffffff" : "#000000",
				lineColor: isDark ? "#ffffff" : "#000000",
				secondaryColor: isDark ? "#333333" : "#f0f0f0",
				tertiaryColor: isDark ? "#555555" : "#e0e0e0",
			},
			securityLevel: "loose",
			errorLevel: "warn",
			logLevel: "error",
		});
	}

	async function renderMermaidDiagrams() {
		if (isRendering) {
			renderQueued = true;
			return;
		}

		const mermaidElements = Array.from(
			document.querySelectorAll(".mermaid[data-mermaid-code]"),
		);
		if (mermaidElements.length === 0) return;

		isRendering = true;
		window.dispatchEvent(new CustomEvent("mermaid:render:start"));

		try {
			const isDark = document.documentElement.classList.contains("dark");
			configureMermaid(isDark);
			const batchSize = 3;

			for (let index = 0; index < mermaidElements.length; index += batchSize) {
				const batch = mermaidElements.slice(index, index + batchSize);
				await Promise.all(
					batch.map(async (element, localIndex) => {
						const code = element.getAttribute("data-mermaid-code");
						if (!code) return;

						disposeDiagramInteraction(element);
						let attempts = 0;
						while (attempts < 3) {
							try {
								element.innerHTML =
									'<div class="mermaid-loading">Rendering diagram...</div>';
								const renderId = `mermaid-${Date.now()}-${index + localIndex}-${attempts}`;
								const { svg } = await window.mermaid.render(renderId, code);
								if (!element.isConnected) return;

								const doc = new DOMParser().parseFromString(
									svg,
									"image/svg+xml",
								);
								const svgElement = doc.documentElement;
								svgElement.setAttribute("width", "100%");
								svgElement.removeAttribute("height");
								svgElement.style.maxWidth = "100%";
								svgElement.style.height = "auto";
								svgElement.style.filter = isDark
									? "brightness(0.9) contrast(1.1)"
									: "none";
								attachDiagramInteraction(element, svgElement, {
									onFullscreen: () => openFullscreen(svgElement),
								});
								return;
							} catch (error) {
								attempts += 1;
								console.warn(
									`Mermaid rendering attempt ${attempts} failed for element ${index + localIndex}:`,
									error,
								);
								if (attempts >= 3) {
									element.innerHTML = `
										<div class="mermaid-error">
											<p>Failed to render diagram after 3 attempts.</p>
											<button type="button" onclick="location.reload()">Retry Page</button>
										</div>
									`;
								} else {
									await new Promise((resolve) =>
										setTimeout(resolve, 500 * attempts),
									);
								}
							}
						}
					}),
				);

				if (index + batchSize < mermaidElements.length) {
					await new Promise((resolve) => {
						if ("requestIdleCallback" in window) {
							window.requestIdleCallback(resolve);
						} else {
							setTimeout(resolve, 50);
						}
					});
				}
			}

			retryCount = 0;
			window.dispatchEvent(
				new CustomEvent("mermaid:render:done", {
					detail: { count: mermaidElements.length },
				}),
			);
		} catch (error) {
			console.error("Error rendering Mermaid diagrams:", error);
			window.dispatchEvent(new CustomEvent("mermaid:render:done"));
			if (retryCount < MAX_RETRIES) {
				retryCount += 1;
				scheduleRender(RETRY_DELAY * retryCount);
			}
		} finally {
			isRendering = false;
			if (renderQueued) {
				renderQueued = false;
				scheduleRender();
			}
		}
	}

	async function ensureMermaidRendered() {
		if (!document.querySelector(".mermaid[data-mermaid-code]")) return;
		try {
			await loadMermaid();
			await renderMermaidDiagrams();
		} catch (error) {
			console.error("Failed to initialize Mermaid:", error);
			if (retryCount < MAX_RETRIES) {
				retryCount += 1;
				scheduleRender(RETRY_DELAY * retryCount);
			}
		}
	}

	function scheduleRender(delay = 0) {
		clearTimeout(renderTimer);
		renderTimer = setTimeout(ensureMermaidRendered, delay);
	}

	function setupEventListeners() {
		document.addEventListener("astro:page-load", () => {
			currentTheme = null;
			retryCount = 0;
			hasThemeChanged();
			scheduleRender(100);
		});
		document.addEventListener("astro:before-swap", () => {
			clearTimeout(renderTimer);
			closeFullscreen();
			cleanupMutationObserver();
		});
		document.addEventListener("astro:after-swap", () => {
			setupMutationObserver();
			scheduleRender();
		});
		document.addEventListener("visibilitychange", () => {
			if (!document.hidden) scheduleRender(200);
		});
	}

	function initialize() {
		setupMutationObserver();
		setupEventListeners();
		hasThemeChanged();
		window.renderMermaidDiagrams = ensureMermaidRendered;
		scheduleRender();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialize, { once: true });
	} else {
		initialize();
	}
})();
