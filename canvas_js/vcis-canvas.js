// ----------------------------
// Canvas LMS Customization Manager
// Refactored for better maintainability and scalability
// ----------------------------


// Constructor - this is where we assign regularly used values for later on that cannot be 'programmatically' assigned easily
class CanvasCustomizer {

  constructor() {
    this.config = {
      SCORM_TOOL_ID: "207",
      DEFAULT_ASSIGNMENT_ID: 247,
      POLLING_INTERVAL: 5000,
      PASSING_GRADE: 90,
      HIGHLIGHT_FLASH_COUNT: 10,
      NEXT_BTN_FLASH_COUNT: 20,
      TIMEOUTS: {
        DEFAULT: 3000,
        SCORM_SETUP: 8000, // 8 seconds should be enough
        IFRAME_READY: 15000,  // Time to wait for iframe
        NAVMENU_READY: 2000
      }
    };

    this.state = {
      scormWatcherStarted: false,
      scormPollingInterval: null,
      isInitialized: false,
      activePollingAssignments: new Set() // Track which assignments are being polled
    };

    this.selectors = {
      studentView: '[data-testid="assignments-2-student-view"]',
      nextButton: '[data-testid="next-assignment-btn"]',
      viewFeedbackButton: '[data-testid="view_feedback_button"]',
      courseMenuToggle: '#courseMenuToggle',
      helpTray: '#help_tray',
      scormIframe: 'iframe.tool_launch',
      moduleItem: 'li[id^="context_module_item_"].min_score_requirement',
      completionRequirements: '.with-completion-requirements',
      itemName: '.item_name'

    };


    this.hiddenElements = [
      "course-show-secondary",
      "right-side-wrapper",
      "global_nav_calendar_link"
    ];


    // list of Help items that are blocked from Nav menu
    this.blockedHelpItems = [
      "Field Admin Console Access",
      "Ask the Community",
      "Submit a Feature Idea",
      "Search the Canvas Guides",
      "Training Services Portal"
    ];
    // conditional block list of items
    this.blockedHelpItemsConditional = [
      "Protecting Children - Mandatory Reporting and Other Obligations for Non-Government Schools - Frequently Asked Questions"
    ];

    this.blockedHelpItemsConditional2 = [
      "Protecting Children - Mandatory Reporting and Other Obligations for Early Childhood - Frequently Asked Questions"
    ];

    this.observers = new Map();

    // problem SCORMs, mostly MARAM ones
    this.ProblemSCORMs = [
      "/assignments/301",
      "/assignments/302",
      "/assignments/303",
      "/assignments/305",
      "/assignments/306",
      "/assignments/307",
      "/assignments/310",
      "/assignments/311",
      "/assignments/312",
      "/assignments/323",
      "/assignments/324",
      "/assignments/325",
      "/assignments/326",
      "/assignments/327",
      "/assignments/328",
      "/assignments/329",
      "/assignments/330",
      "/assignments/331",
      "/assignments/340",
      "/assignments/341",
      "/assignments/342",
      "/assignments/344",
      "/assignments/345",
      "/assignments/346",
      "/assignments/352",
      "/assignments/353",
      "/assignments/354",
      "/courses/236/assignments/311",
      "/courses/236/assignments/312",
      "/courses/236/assignments/330"
    ];


    this.catalogBaseUrl = this.isMRMod()
      ? "https://protectngstraining.education.vic.gov.au"
      : "https://training-infosharing.sydney.catalog.canvaslms.com";
  }

  // ----------------------------
  // Main Initialization
  // ----------------------------
  async init() {
    if (this.state.isInitialized) return;

    try {
      if (!this.isStudent()) {
        console.log("Non-student user detected, skipping customizations");
        return;
      }

      console.log("Initializing Canvas customizations for student");

      await Promise.all([
        this.applyStudentStyles(),
        this.setupUICustomizations(),
        this.setupSCORMHandling()

      ]);

      await this.highlightFirstIncompleteModule();

      if (this.isWikiPage()) {
        console.log("Found wiki page");
        await this.updateModuleCompletionStatus();
      }

      if (this.isQuizPage() || this.isSCORMContext()) {
        console.log("HP button check");

        const nextBtn = document.querySelector('[aria-label="Next Module Item"]');

        if (!nextBtn || this.isProblemSCORM()) {
          await this.createHomeButtons();
        } else {
          console.log("Next button exists — skipping custom home buttons");
        }
      }

      this.state.isInitialized = true;
      console.log("Canvas customizations initialized successfully");

    } catch (error) {
      console.error("Error initializing Canvas customizations:", error);
    }
  }

  // ----------------------------
  // Utility Methods
  // ----------------------------

  isStudent() {
    const roles = window.ENV?.current_user_roles || [];
    const isStudentRole =
      roles.includes("student") || roles.includes("fake_student");
    const isAdminRole =
      roles.includes("admin") || roles.includes("root_admin");
    return isStudentRole && !isAdminRole;
  }

  isSCORMContext() {
    return String(window.ENV?.LTI_TOOL_ID) === this.config.SCORM_TOOL_ID;
  }


  // for problematic SCORMs that don't have a close button
  isProblemSCORM() {
    const path = window.location.pathname;
    return this.ProblemSCORMs.some(p => path.includes(p));
  }

  isHomePage() {
    return window.ENV?.active_context_tab === "home";
  }

  isWikiPage() {
    return !!window.ENV?.WIKI_PAGES_PATH;
  }

  isQuizPage() {
    return window.ENV?.active_context_tab === "quizzes";
  }

  isMRMod() {
    return ["217", "224"].includes(window.ENV?.COURSE_ID);
  }

  isMRModEC() {
    return ["224"].includes(window.ENV?.COURSE_ID);
  }

  isMRModNG() {
    return ["224"].includes(window.ENV?.COURSE_ID);
  }

  getCurrentUserId() {
    return window.ENV?.current_user_id || null;
  }

  $(selector) {
    return document.querySelector(selector);
  }

  $$(selector) {
    return document.querySelectorAll(selector);
  }

  waitFor(getter, callback, timeout = this.config.TIMEOUTS.DEFAULT) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        try {
          const value = getter();
          if (value) {
            clearInterval(timer);
            callback(value);
            resolve(value);
          } else if (Date.now() - start > timeout) {
            clearInterval(timer);
            reject(new Error(`Timeout waiting for condition`));
          }
        } catch (error) {
          clearInterval(timer);
          reject(error);
        }
      }, 100);
    });
  }

  // ----------------------------
  // Style Management  
  // ----------------------------
  async applyStudentStyles() {
    const styleId = "canvas-student-customizations";

    if (this.$(styleId)) return;

    const styles = this.hiddenElements
      .map(id => `#${id} { display: none !important; }`)
      .join('\n');

    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    console.log("Applied student CSS customizations");
  }

  // ----------------------------
  // UI Customizations
  // ----------------------------
  async setupUICustomizations() {
    this.hideAttemptBlock();
    this.customizeHelpTray();
    this.updateDashboardLink();
    // this.createHomeButtons();
  }

  updateDashboardLink() {
    const catalogUrl = this.catalogBaseUrl;
    const userId = this.getCurrentUserId();
    if (!catalogUrl || !userId) {
      console.warn("Missing catalog URL or current user ID; dashboard link not updated.");
      return;
    }

    const dashboardLink = this.$("#global_nav_dashboard_link");
    if (!dashboardLink) {
      console.warn("Could not find Canvas dashboard link.");
      return;
    }

    const dashHref = `${catalogUrl}/dashboard/completed?current_user_id=${encodeURIComponent(userId)}`;
    dashboardLink.setAttribute("href", dashHref);

    console.log(`Updated Dashboard link → ${dashHref}`);
  }

  hideAttemptBlock() {
    const container = this.$(this.selectors.studentView);
    if (!container) return;

    const attemptNode = Array.from(container.querySelectorAll("*"))
      .find(el => el.textContent.trim().startsWith("Attempt"));

    const anonGradeNode = Array.from(container.querySelectorAll("*"))
      .find(el => el.textContent.trim().startsWith("Anonymous Grading"));


    if (attemptNode && attemptNode.style.display !== "none") {
      attemptNode.style.display = "none";
      console.log("ðŸ” Hidden attempt block");
    }

    if (anonGradeNode && anonGradeNode.style.display !== "none") {
      anonGradeNode.style.display = "none";
      console.log("Hidden anongrade block");
    }

  }

  hideHomeButtons() {
  try {
    // Hide custom right button
    document.querySelectorAll(".vcis-layout-rightbutton")
      .forEach(el => el.style.display = "none");

    // Hide "Return to Course Page" via aria-label
    const ariaBtn = document.querySelector('[aria-label="Return to Course Page"]');
    if (ariaBtn) ariaBtn.style.display = "none";

    console.log("🏠 Home buttons hidden after completion");
  } catch (e) {
    console.warn("Error hiding home buttons:", e);
  }
}

  customizeHelpTray() {
    const tray = this.$(this.selectors.helpTray);
    if (!tray) return;

    const buttons = tray.querySelectorAll(
      "a[role='button'], button[role='button'], a.css-1fu6hu0-view-link"
    );

    // Start with the default blocked list
    let itemsToBlock = [...this.blockedHelpItems];

    // Apply correct conditional logic
    if (this.isMRModNG()) {
      itemsToBlock = itemsToBlock.concat(this.blockedHelpItemsConditional);
      console.log("MRModNG detected – applying conditional list 1");
    } else if (this.isMRModEC()) {
      itemsToBlock = itemsToBlock.concat(this.blockedHelpItemsConditional2);
      console.log("MRModEC detected – applying conditional list 2");
    } else {
      console.log("Neither MRModNG nor MRModEC detected – using default block list only");
    }

    buttons.forEach(el => {
      const text = el.innerText.trim();
      const href = el.getAttribute("href") || "";

      if (itemsToBlock.some(item => text.includes(item) || href.includes(item))) {
        const li = el.closest("li");
        (li || el).style.display = "none";
        console.log(`Hidden help item: ${text || href}`);
      }
    });
  }

  createHomepageButton() {
    const left = document.querySelector(".module-sequence-footer-left");
    const right = document.querySelector(".module-sequence-footer-right");

    let clone = null;

    // -------------------------------------------------
    // Normal path: try to clone the Previous button
    // -------------------------------------------------
    if (left) {
      const prevBtn = left.querySelector(".module-sequence-footer-button--previous");
      if (prevBtn) {
        clone = prevBtn.cloneNode(true);

        // Remove SVG arrow
        const arrowIcon = clone.querySelector("svg.IconMiniArrowStart");
        if (arrowIcon) arrowIcon.remove();

        // Modify link + text as before
        const link = clone.querySelector("a[aria-label], a[href]");
        if (link) {
          link.setAttribute("aria-label", "Return to Course Page");

          const hrefStr = link.getAttribute("href") || link.href || "";
          const match = hrefStr.match(/\/courses\/(\d+)\/?/);
          if (match) {
            link.setAttribute("href", `/courses/${match[1]}/`);
          } else if (link.href) {
            const absMatch = link.href.match(/\/courses\/(\d+)\/?/);
            if (absMatch) link.setAttribute("href", `/courses/${absMatch[1]}/`);
          }
        }

        function replaceTextNode(root, searchRegex, replacement) {
          const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                return searchRegex.test(node.nodeValue)
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            },
            false
          );

          const nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);

          for (const textNode of nodes) {
            textNode.nodeValue = textNode.nodeValue.replace(searchRegex, replacement);
          }

          return nodes.length > 0;
        }

        const replaced = replaceTextNode(clone, /Previous/i, "Return to Course Page");

        if (!replaced) {
          const textCandidates = Array.from(clone.querySelectorAll("span, strong, em, b, i, p"));
          for (let i = textCandidates.length - 1; i >= 0; i--) {
            const el = textCandidates[i];
            if (el.textContent.trim() && /Previous/i.test(el.textContent)) {
              el.textContent = el.textContent.replace(/Previous/i, "Return to Course Page");
              break;
            }
          }
        }
      }
    }

    // -------------------------------------------------
    // FAILSAFE PATH: build a button manually
    // -------------------------------------------------
    if (!clone) {
      const courseId = window.ENV?.COURSE_ID;
      if (!courseId) {
        console.warn("No course ID; cannot create homepage button");
        return;
      }

      clone = document.createElement("div");
      clone.className = "content-box vcis-layout-rightbutton";
      clone.innerHTML = `
      <a href="/courses/${courseId}" class="Button icon">
        <span aria-hidden="true">Return to Course Page</span>
        <span class="screenreader-only">Return to Course Page</span>
      </a>
    `;

      // Insert before closing </div> of #main.ic-Layout-columns
      const main = document.querySelector('#main.ic-Layout-columns');
      if (main) {
        main.appendChild(clone);
      }

      return; // stop here — no footer insert when using fallback
    }

    // -------------------------------------------------
    // Normal insertion path (cloned version)
    // -------------------------------------------------
    if (right && clone) {
      right.appendChild(clone);
    }
  }



  async createHomeButtons() {
    try {
      // Wait for ENV to stabilize
      await this.waitFor(
        () => window.ENV?.current_user_roles,
        () => { },
        this.config.TIMEOUTS.SCORM_SETUP
      );

      // Only run in SCORM or Quiz
      if (!this.isSCORMContext() && !this.isQuizPage()) {
        return;
      }

      console.log("SCORM/Quiz context confirmed — checking next button state");

      // If the real Next button exists, do nothing
      const nextBtn = document.querySelector('[data-testid="next-assignment-btn"]');
      if (nextBtn) {
        console.log("Next button exists — skipping homepage button creation");
        return;
      }

      // Grab course ID
      const courseId = window.ENV?.COURSE_ID;
      if (!courseId) {
        console.warn("No course ID found — cannot check module completion.");
        return;
      }

      // Fetch modules + items
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`,
        {
          credentials: "include",
          headers: { "Accept": "application/json" }
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch modules:", res.status);
        return;
      }

      const modules = await res.json();

      if (!Array.isArray(modules)) {
        console.warn("Modules response was not an array.");
        return;
      }

      // Extract ONLY required items
      const requiredItems = modules
        .flatMap(m => m.items || [])
        .filter(item => !!item.completion_requirement); // only required ones

      if (!requiredItems.length) {
        console.log("No required modules found — treating as complete");
        this.createHomepageButton();
        return;
      }

      // See if any required items are incomplete
      const hasIncompleteRequired = requiredItems.some(item => {
        return item.completion_requirement.completed === false;
      });

      if (!hasIncompleteRequired) {
        console.log("All required modules completed — creating homepage button");
        this.createHomepageButton();
      } else {
        console.log("Required modules still incomplete — no action taken");
      }

    } catch (err) {
      console.warn("createHomeButtons failed:", err.message);
    }
  }

  // ----------------------------
  // SCORM Handling
  // ----------------------------
  async setupSCORMHandling() {
    // Wait for ENV to be fully loaded before checking SCORM context
    try {
      await this.waitFor(() => window.ENV?.current_user_roles, () => { }, this.config.TIMEOUTS.SCORM_SETUP);

      if (!this.isSCORMContext()) {
        console.log("Non-SCORM context, skipping SCORM setup");
        return;
      }

      console.log("SCORM context detected, setting up SCORM handling");

      await this.collapseCourseNavigation();
      this.hideFeedbackButtons();

      // Wait longer for iframe to be ready and ENV to stabilize
      await this.initSCORMWatcher();

    } catch (error) {
      console.warn("SCORM setup timed out or failed:", error.message);
    }
  }

  async collapseCourseNavigation() {
    try {
      const btn = await this.waitFor(
        () => this.$(this.selectors.courseMenuToggle),
        () => { },                          // placeholder callback
        this.config.NAVMENU_READY          // timeout value
      );

      const label = btn.getAttribute("aria-label") || btn.getAttribute("title") || "";
      const isOpen = /Hide Course(s)? Navigation Menu/i.test(label);

      if (isOpen) {
        btn.click();
        console.log("Collapsed navigation for SCORM");
      }
    } catch (error) {
      console.warn("Could not collapse navigation:", error.message);
    }
  }

  setupXHRWatcher(courseId, assignmentId) {
    if (this.state.xhrWatcherStarted) return;
    this.state.xhrWatcherStarted = true;

    console.log("🛰️ XHR watcher activated for Problem SCORM");

    const originalFetch = window.fetch;
    const origOpen = XMLHttpRequest.prototype.open;

    // 🌟 NEW inactivity failsafe timer
    const FAILSAFE_TIME = 30000; // 30 seconds
    let inactivityTimer = null;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log("⏳ No XHR activity for 30s → Failsafe grade check triggered");
        this.checkGradeAndHighlight(courseId, assignmentId);
      }, FAILSAFE_TIME);
    };

    // Start timer immediately
    resetInactivityTimer();


    // -----------------------------------
    // FETCH WRAPPER
    // -----------------------------------
    window.fetch = async (...args) => {
      try {
        const url = args[0];

        if (typeof url === "string" && !url.includes("/submissions/self")) {
          console.log("🎯 XHR fetch detected:", url);

          // Debounce normal reactions
          clearTimeout(this._xhrDebounce);
          this._xhrDebounce = setTimeout(() => {
            this.checkGradeAndHighlight(courseId, assignmentId);
          }, 300);

          // Reset failsafe timer
          resetInactivityTimer();
        }

      } catch (e) {
        console.warn("XHR watcher fetch error:", e);
      }

      return originalFetch.apply(this, args);
    };


    // -----------------------------------
    // XHR.open WRAPPER
    // -----------------------------------
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      try {
        if (typeof url === "string") {
          console.log("🎯 XHR open detected:", url);

          clearTimeout(window._xhrDebounce);
          window._xhrDebounce = setTimeout(() => {
            window.__SCORMWatcher.checkGradeAndHighlight(courseId, assignmentId);
          }, 300);

          // Reset failsafe timer
          resetInactivityTimer();
        }

      } catch (e) {
        console.warn("XHR watcher XHR error:", e);
      }

      return origOpen.call(this, method, url, ...rest);
    };


    // Store reference for XHR callbacks
    window.__SCORMWatcher = this;
  }

  hideFeedbackButtons() {
    this.$$(this.selectors.viewFeedbackButton).forEach(el => {
      el.style.display = "none";
    });
    console.log("Hidden feedback buttons");
  }

  async initSCORMWatcher() {
    if (this.state.scormWatcherStarted) return;

    // Wait for the iframe to actually exist and be ready
    try {
      console.log("Waiting for SCORM iframe to be ready...");

      const iframe = await this.waitFor(
        () => this.$(this.selectors.scormIframe),
        () => { },
        10000 // Give it 10 seconds to appear
      );

      // Additional wait for iframe to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.state.scormWatcherStarted = true;

      const courseId = window.ENV?.COURSE_ID;
      const assignmentId = window.ENV?.ASSIGNMENT_ID || this.config.DEFAULT_ASSIGNMENT_ID;

      if (!courseId) {
        console.warn("No course ID available for SCORM watcher");
        return;
      }

      if (this.isProblemSCORM()) {
        this.setupXHRWatcher(courseId, assignmentId);
        this.createHomeButtons();         // ← added
        console.log("Problem SCORM detected → XHR watcher + home buttons enabled");
      }

      // Still watch iframe changes normally
      this.setupIframeWatcher(iframe, courseId, assignmentId);
      console.log("SCORM watcher initialized successfully");



      // 🔽 Scroll iframe into center view once it's ready, slight adjustment to scorm window height
      try {
        const iframeRect = iframe.getBoundingClientRect();
        const absoluteElementTop = iframeRect.top + window.scrollY;
        const middle = absoluteElementTop - (window.innerHeight / 2 + 50) + (iframeRect.height / 2 + 50);

        window.scrollTo({
          top: middle,
          behavior: "smooth"
        });

        console.log("SCORM iframe centered in viewport");
      } catch (err) {
        console.warn("Could not scroll to SCORM iframe:", err.message);
      }




    } catch (error) {
      console.warn("SCORM iframe not found or failed to initialize:", error.message);
    }
  }

  setupIframeWatcher(iframe, courseId, assignmentId) {
    // Debounce timer to avoid rapid consecutive calls
    let gradeCheckTimeout = null;

    // ----------------------------
    // Watch for src attribute changes
    // ----------------------------
    const attrObserver = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "src") {
          const newSrc = iframe.getAttribute("src");

          // Ignore blank or about:blank src changes
          if (!newSrc || newSrc === "about:blank") continue;

          console.log(`Iframe src changed: ${newSrc}`);

          // Trigger grade check when iframe src changes
          clearTimeout(gradeCheckTimeout);
          gradeCheckTimeout = setTimeout(async () => {
            console.log("Iframe change detected - checking grade");
            try {
              await this.checkGradeAndHighlight(courseId, assignmentId);
            } catch (error) {
              console.error("Error checking grade on src change:", error);
            }
          }, 300); // short debounce
        }
      }
    });

    attrObserver.observe(iframe, { attributes: true });
    this.observers.set('scorm-iframe-attr', attrObserver);

    // ----------------------------
    // Watch for load events
    // ----------------------------
    iframe.addEventListener("load", () => {
      const src = iframe.src;

      // Ignore blank or about:blank iframe loads
      if (!src || src === "about:blank") return;

      console.log(`📤 Iframe loaded: ${src}`);

      // Debounced grade check
      clearTimeout(gradeCheckTimeout);
      gradeCheckTimeout = setTimeout(async () => {
        console.log("Iframe load detected - checking grade");
        try {
          await this.checkGradeAndHighlight(courseId, assignmentId);
        } catch (error) {
          console.error("Error checking grade on iframe load:", error);
        }
      }, 500); // small delay to let SCORM content initialize
    });
  }

  async checkGradeAndHighlight(courseId, assignmentId) {
  try {
    console.log("Checking current grade status...");
    const nextBtn = document.querySelector('[data-testid="next-assignment-btn"]');
    const submission = await this.checkSubmissionStatus(courseId, assignmentId);

    if (this.isPassingGrade(submission?.grade)) {
      console.log(`Passing grade found: ${submission.grade}`);
      nextBtn.style.display = ""; // ensure it's visible
      this.highlightNextButton();

      // 🔥 NEW: hide home buttons once completed
      this.hideHomeButtons();

      return true;
    } else {
      nextBtn.style.display = "none";
      console.log(`Current grade: ${submission?.grade || 'No grade'} (not passing)`);

      return false;
    }
  } catch (error) {
    console.warn("Could not check grade status:", error.message);
    return false;
  }
}


  async checkSubmissionStatus(courseId, assignmentId) {
    const response = await fetch(
      `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self`,
      {
        credentials: "include",
        headers: { "Accept": "application/json" }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch submission`);
    }

    return await response.json();
  }

  isPassingGrade(grade) {
    if (!grade) return false;

    const gradeStr = grade.toString().trim().toLowerCase();

    // Check for "complete" status
    if (gradeStr === "complete") return true;

    // Check for numeric grade >= passing threshold
    const numeric = parseFloat(gradeStr.replace("%", ""));
    return !isNaN(numeric) && numeric >= this.config.PASSING_GRADE;
  }

  // ----------------------------
  // Visual Highlighting
  // ----------------------------
  highlightNextButton() {
    const btn = this.$(this.selectors.nextButton);
    if (!btn) {
      console.warn("âNext assignment button not found");
      return;
    }

    this.createHighlightEffect(btn, {
      flashCount: this.config.NEXT_BTN_FLASH_COUNT,
      message: "Highlighted Next Assignment button"
    });
  }

  async highlightFirstIncompleteModule() {
    if (!this.isHomePage() && !this.isWikiPage()) {
      console.log("Not on modules home page, skipping module highlighting");
      return;
    }

    try {
      const courseId = window.ENV?.COURSE_ID || window.ENV?.course_id;
      if (!courseId) throw new Error("No course ID found");

      const incompleteItems = await this.getIncompleteModuleItems(courseId);
      if (incompleteItems.length === 0) {
        console.log("All module items completed");
        return;
      }

      const targetElement = this.findModuleTargetElement();
      if (!targetElement) {
        console.warn("No module target element found");
        return;
      }

      this.addBeginLabel(targetElement);
      this.createHighlightEffect(targetElement, {
        flashCount: this.config.HIGHLIGHT_FLASH_COUNT,
        message: "Highlighted first incomplete module"
      });

    } catch (error) {
      console.error("Error highlighting module:", error);
    }
  }

  async getIncompleteModuleItems(courseId) {
    // Get first page of module items
    const modulesResp = await fetch(
      `/api/v1/courses/${courseId}/modules?per_page=1`,
      {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }
    );

    if (!modulesResp.ok) throw new Error(`Failed to fetch modules: ${modulesResp.status}`);

    const modules = await modulesResp.json();
    if (modules.length === 0) throw new Error("No modules found");

    // Get items in first module
    const itemsResp = await fetch(
      `/api/v1/courses/${courseId}/modules/${modules[0].id}/items?per_page=100`,
      {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }
    );

    if (!itemsResp.ok) throw new Error(`Failed to fetch module items: ${itemsResp.status}`);

    const items = await itemsResp.json();
    return items.filter(item =>
      item.completion_requirement &&
      !item.completion_requirement.completed &&
      !item.completion_requirement.fulfilled
    );
  }

  findModuleTargetElement() {
    const targetLi = this.$(this.selectors.moduleItem);
    return targetLi?.querySelector(this.selectors.completionRequirements);
  }

  addBeginLabel(targetElement) {
    const nameNode = targetElement.querySelector(this.selectors.itemName);
    if (nameNode && !nameNode.querySelector(".begin-label")) {
      const label = document.createElement("span");
      label.className = "begin-label";
      label.textContent = "";
      label.style.marginRight = "0rem";
      nameNode.prepend(label);
    }
  }

  createHighlightEffect(element, options = {}) {
    const { flashCount = 10, message = "Element highlighted" } = options;

    // element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();

    setTimeout(() => {
      const originalTransition = element.style.transition;
      const originalBoxShadow = element.style.boxShadow;

      element.style.transition = "box-shadow 0.3s ease-in-out";

      let count = 0;
      const flashInterval = setInterval(() => {
        element.style.boxShadow = count % 2 === 0 ? "0 0 20px 8px cornflowerblue" : "none";
        count++;

        if (count > flashCount) {
          clearInterval(flashInterval);
          element.style.transition = originalTransition || "";
          element.style.boxShadow = originalBoxShadow || "none";
        }
      }, 500);

      console.log(message);
    }, 1000);
  }

  // ----------------------------
  // Assignment Completion Updater (auto-maps sequentially)
  // This part of the script checks for a 'wiki' page (also called a canvas 'Page') for certain element types
  // if one is found, it will update the element
  // this is largely used to show completion for eLearn modules
  // ----------------------------
  async updateModuleCompletionStatus() {
    try {
      const courseId = window.ENV?.COURSE_ID;
      if (!courseId) {
        console.warn("No course ID found — cannot update module completions.");
        return;
      }

      // Collect ModComp and ModButton elements
      const modElements = Array.from(document.querySelectorAll("[id^='ModComp']"));
      const modButtons = Array.from(document.querySelectorAll("[id^='ModButton']"));

      if (modElements.length === 0) {
        console.log("No ModComp elements found on this page.");
        return;
      }

      // ⬇️ Fetch Modules + Items + completion info
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules?include[]=items&include[]=content_details`,
        {
          credentials: "include",
          headers: { "Accept": "application/json" }
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch modules:", res.status);
        return;
      }

      const modules = await res.json();
      if (!modules || !modules.length) {
        console.warn("No modules returned.");
        return;
      }

      // 🔧 Flatten all module items into a single list
      const allItems = modules.flatMap(mod => mod.items || []);

      let allComplete = true;

      // Loop through each ModComp element and match by index
      modElements.forEach((el, index) => {
        const item = allItems[index];
        const button = modButtons[index];

        const isOptional = el.dataset.req === "no";

        if (isOptional) {
          console.log(`Skipping optional module: ${el.id}`);
        }

        if (!item) {
          el.textContent = "Completion (no module item)";
          el.classList.add("modcomp-noassign");

          if (button) button.classList.remove("completed", "in-progress");

          if (!isOptional) allComplete = false;
          return;
        }

        // Find the parent module for this item
        const parentModule = modules.find(m => m.id === item.module_id);

        // Item-level completion (assignments, must view etc)
        const itemComplete = !!item.completion_requirement?.completed;

        // Module-level completion (surveys, some quizzes)
        const moduleComplete = parentModule?.state === "completed" || !!parentModule?.completed_at;

        // Treat as complete if EITHER is true
        const complete = itemComplete || moduleComplete;

        // Locked = not started
        const locked = !!item.content_details?.locked_for_user;

        let statusText = "Status: Not started";
        let classname = "modcomp-notstart";

        if (complete) {
          statusText = "Status: Completed";
          classname = "modcomp-complete";

          const card = el.closest(".module-card");
          if (card) {
            const cardButton = card.querySelector(".module-button");
            if (cardButton) cardButton.classList.add("completed");
          }

        } else if (!locked) {
          // Item visible/unlocked but not complete
          statusText = "Status: Not Completed";
          classname = "modcomp-inprogress";
        } else {
          if (!isOptional) allComplete = false;
        }

        el.textContent = statusText;
        el.classList.add(classname);

        if (button) {
          button.classList.remove(
            "completed",
            "in-progress",
            "modcomp-complete",
            "modcomp-inprogress",
            "modcomp-notstart",
            "modcomp-noassign"
          );

          if (complete) {
            button.classList.add("completed", "modcomp-complete");
          } else if (!locked) {
            button.classList.add("in-progress", "modcomp-inprogress");
          }
        }

        if (!complete && !isOptional) {
          allComplete = false;
        }
      });

      // ----------------------------
      //  Certificate logic (unchanged)
      // ----------------------------
      const certElement = document.querySelector("[id^='CompCertificate']");
      const certButton = document.querySelector("[id^='CompCertButton']");

      if (certElement) {
        if (allComplete) {
          certElement.textContent = "Certificate Available";
          certElement.classList.remove("cert-unavail");
          certElement.classList.add("cert-avail");

          if (certButton) {
            certButton.classList.remove("in-progress");
            certButton.classList.add("completed");
            certButton.style.pointerEvents = "auto";
            certButton.style.cursor = "pointer";

            const catalogUrl = this.catalogBaseUrl;
            certButton.setAttribute("href", `${catalogUrl}/dashboard/completed`);
          }
        } else {
          certElement.textContent = "Course Incomplete";
          certElement.classList.add("cert-unavail");

          if (certButton) {
            certButton.classList.remove("completed");
            certButton.classList.add("in-progress");
            certButton.style.pointerEvents = "none";
            certButton.style.cursor = "default";
            certButton.removeAttribute("href");
          }
        }
      }

      console.log("Module completion statuses updated.");

    } catch (error) {
      console.error("Error updating module completion status:", error);
    }
  }
  // ----------------------------
  // Cleanup
  // ----------------------------
  cleanup() {
    // No continuous polling to stop, but clean up any remaining intervals
    this.state.activePollingAssignments.clear();

    this.observers.forEach((observer, key) => {
      observer.disconnect();
      console.log(`Disconnected observer: ${key}`);
    });

    this.observers.clear();
  }
}

// ----------------------------
// Auto-initialization with improved DOM handling
// ----------------------------
class CanvasManager {
  constructor() {
    this.customizer = new CanvasCustomizer();
    this.initPromise = null;
  }

  async init() {
    // Prevent multiple initializations
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  async doInit() {
    await this.waitForDOMReady();
    await this.waitForENV();

    await this.customizer.init();

    document.addEventListener("turbolinks:load", () => {
      console.log("Turbolinks navigation detected — reinitializing UI");
      this.customizer.setupUICustomizations();
      this.customizer.setupSCORMHandling();
    });

    document.addEventListener("page:load", () => {
      console.log("Page.js navigation detected — reinitializing UI");
      this.customizer.setupUICustomizations();
      this.customizer.setupSCORMHandling();
    });

    // start watching the DOM for React subcomponent changes
    this.setupDOMObserver();
  }

  waitForDOMReady() {
    return new Promise(resolve => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
      }
    });
  }

  waitForENV() {
    return new Promise(resolve => {
      const ready = () => window.ENV && window.ENV.current_user_roles;
      if (ready()) return resolve(window.ENV);
      const observer = new MutationObserver(() => {
        if (ready()) {
          observer.disconnect();
          resolve(window.ENV);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }


  setupDOMObserver() {
    // Debounced re-initialization for dynamic content
    let timeout = null;

    const observer = new MutationObserver(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.customizer.setupUICustomizations();

        // Re-check SCORM setup if we haven't started the watcher yet
        if (!this.customizer.state.scormWatcherStarted) {
          this.customizer.setupSCORMHandling().catch(error => {
            console.warn("Failed to setup SCORM on DOM change:", error);
          });
        }
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false // Reduced observer scope
    });

    console.log("DOM observer initialized");
  }
}

// Initialize the manager
const canvasManager = new CanvasManager();
canvasManager.init().catch(error => {
  console.error("Failed to initialize Canvas Manager:", error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  canvasManager.customizer?.cleanup();
});
