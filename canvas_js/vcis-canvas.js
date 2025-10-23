// ----------------------------
// Canvas LMS Customization Manager
// Refactored for better maintainability and scalability
// ----------------------------

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
        DEFAULT: 5000,
        SCORM_SETUP: 12000, // Increased for SCORM ENV loading
        IFRAME_READY: 15000  // Time to wait for iframe
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

    this.blockedHelpItems = [
      "Field Admin Console Access",
      "Ask the Community", 
      "Submit a Feature Idea",
	  "Search the Canvas Guides",
	  "Training Services Portal"
    ];
	
	this.blockedHelpItemsConditional = [
		"Protecting Children - Mandatory Reporting and Other Obligations for Non-Government Schools - Frequently Asked Questions"
	];

    this.observers = new Map();
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

      console.log("ðŸŽ¨ Initializing Canvas customizations for student");
      
      await this.applyStudentStyles();
      await this.setupUICustomizations();
      await this.setupSCORMHandling();
      await this.highlightFirstIncompleteModule();
      
      this.state.isInitialized = true;
      console.log("âœ… Canvas customizations initialized successfully");
      
    } catch (error) {
      console.error("âŒ Error initializing Canvas customizations:", error);
    }
  }

  // ----------------------------
  // Utility Methods
  // ----------------------------
  isStudent() {
    const roles = window.ENV?.current_user_roles || [];
    return roles.includes("student") || roles.includes("fake_student");
  }

  isSCORMContext() {
    return String(window.ENV?.LTI_TOOL_ID) === this.config.SCORM_TOOL_ID;
  }

  isHomePage() {
    return window.ENV?.active_context_tab === "home";
  }
  
  isMRMod() {
	return window.ENV?.COURSE_ID === "217";
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
    
    console.log("ðŸ“ Applied student CSS customizations");
  }

  // ----------------------------
  // UI Customizations
  // ----------------------------
  async setupUICustomizations() {
    this.hideAttemptBlock();
    this.customizeHelpTray();
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
      console.log("ðŸ” Hidden anongrade block");
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

    // If MR Mod detected, extend the list with the conditional ones
    if (!this.isMRMod()) {
      itemsToBlock = itemsToBlock.concat(this.blockedHelpItemsConditional);
      console.log("Not MR page");
    }

    buttons.forEach(el => {
      const text = el.innerText.trim();
      const href = el.getAttribute("href") || "";

      if (itemsToBlock.some(item => text.includes(item) || href.includes(item))) {
        const li = el.closest("li");
        (li || el).style.display = "none";
        console.log(`ðŸš« Hidden help item: ${text || href}`);
      }
    });
  }
  
  // ----------------------------
  // SCORM Handling
  // ----------------------------
  async setupSCORMHandling() {
    // Wait for ENV to be fully loaded before checking SCORM context
    try {
      await this.waitFor(() => window.ENV?.current_user_roles, () => {}, this.config.TIMEOUTS.SCORM_SETUP);
      
      if (!this.isSCORMContext()) {
        console.log("â„¹ï¸ Non-SCORM context, skipping SCORM setup");
        return;
      }

      console.log("ðŸŽ¯ SCORM context detected, setting up SCORM handling");

      await this.collapseCourseNavigation();
      this.hideFeedbackButtons();
      
      // Wait longer for iframe to be ready and ENV to stabilize
      await this.initSCORMWatcher();
      
    } catch (error) {
      console.warn("âš ï¸ SCORM setup timed out or failed:", error.message);
    }
  }

  async collapseCourseNavigation() {
    try {
      const btn = await this.waitFor(() => this.$(this.selectors.courseMenuToggle));
      
      const label = btn.getAttribute("aria-label") || btn.getAttribute("title") || "";
      const isOpen = /Hide Course(s)? Navigation Menu/i.test(label);
      
      if (isOpen) {
        btn.click();
        console.log("ðŸ“± Collapsed navigation for SCORM");
      }
    } catch (error) {
      console.warn("âš ï¸ Could not collapse navigation:", error.message);
    }
  }

  hideFeedbackButtons() {
    this.$$(this.selectors.viewFeedbackButton).forEach(el => {
      el.style.display = "none";
    });
    console.log("ðŸ”’ Hidden feedback buttons");
  }

  async initSCORMWatcher() {
    if (this.state.scormWatcherStarted) return;

    // Wait for the iframe to actually exist and be ready
    try {
      console.log("â³ Waiting for SCORM iframe to be ready...");
      
      const iframe = await this.waitFor(
        () => this.$(this.selectors.scormIframe),
        () => {},
        15000 // Give it 15 seconds to appear
      );

      // Additional wait for iframe to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.state.scormWatcherStarted = true;

      const courseId = window.ENV?.COURSE_ID;
      const assignmentId = window.ENV?.ASSIGNMENT_ID || this.config.DEFAULT_ASSIGNMENT_ID;

      if (!courseId) {
        console.warn("âš ï¸ No course ID available for SCORM watcher");
        return;
      }

      this.setupIframeWatcher(iframe, courseId, assignmentId);
      console.log("👁️ SCORM watcher initialized successfully");

      // 🔽 Scroll iframe into center view once it's ready, slight adjustment to scorm window height
      try {
        const iframeRect = iframe.getBoundingClientRect();
        const absoluteElementTop = iframeRect.top + window.scrollY;
        const middle = absoluteElementTop - (window.innerHeight / 2 - 50) + (iframeRect.height / 2 - 50);

        window.scrollTo({
          top: middle,
          behavior: "smooth"
        });

        console.log("🪄 SCORM iframe centered in viewport");
      } catch (err) {
        console.warn("⚠️ Could not scroll to SCORM iframe:", err.message);
      }

      
    } catch (error) {
      console.warn("âš ï¸ SCORM iframe not found or failed to initialize:", error.message);
    }
  }

  setupIframeWatcher(iframe, courseId, assignmentId) {
    let lastSrc = null;

    // Watch for src attribute changes
    const attrObserver = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "src") {
          const newSrc = iframe.getAttribute("src");
          console.log(`ðŸ”„ Iframe src changed: ${newSrc}`);
          lastSrc = null;
          
          // Trigger grade check when iframe src changes
          console.log("ðŸŽ¯ Iframe change detected - checking grade");
          try {
            await this.checkGradeAndHighlight(courseId, assignmentId);
          } catch (error) {
            console.error("âŒ Error checking grade on src change:", error);
          }
        }
      }
    });

    attrObserver.observe(iframe, { attributes: true });
    this.observers.set('scorm-iframe-attr', attrObserver);

    // Watch for load events - check grade each time iframe loads
    iframe.addEventListener("load", async () => {
      const src = iframe.src;
      console.log(`ðŸ“„ Iframe loaded: ${src}`);

      if (src !== lastSrc) {
        lastSrc = src;
        
        // Add a small delay to ensure iframe content is ready
        setTimeout(async () => {
          console.log("ðŸŽ¯ Iframe detected - checking grade");
          try {
            await this.checkGradeAndHighlight(courseId, assignmentId);
          } catch (error) {
            console.error("âŒ Error checking grade on iframe load:", error);
          }
        }, 1000); // 1 second delay to ensure iframe is fully loaded
      }
    });
  }

  async checkGradeAndHighlight(courseId, assignmentId) {
    try {
      console.log("ðŸ” Checking current grade status...");
      const submission = await this.checkSubmissionStatus(courseId, assignmentId);
      
      if (this.isPassingGrade(submission?.grade)) {
        console.log(`âœ… Passing grade found: ${submission.grade}`);
        this.highlightNextButton();
        return true; // Indicates passing grade found
      } else {
        console.log(`ðŸ“ Current grade: ${submission?.grade || 'No grade'} (not passing)`);
        return false;
      }
    } catch (error) {
      console.warn("âš ï¸ Could not check grade status:", error.message);
      return false;
    }
  }

  // Note: These methods are no longer needed since we're not continuously polling
  // Keeping them for potential future use or cleanup purposes
  startSCORMPolling(courseId, assignmentId) {
    // This method is now unused - grade checking happens on iframe events only
    console.log("â„¹ï¸ startSCORMPolling called but not needed - using event-driven approach");
  }

  stopSCORMPolling() {
    // This method is now unused - no continuous polling to stop
    if (this.state.scormPollingInterval) {
      clearInterval(this.state.scormPollingInterval);
      this.state.scormPollingInterval = null;
      console.log("â¹ï¸ SCORM polling stopped");
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
      console.warn("âš ï¸ Next assignment button not found");
      return;
    }

    this.createHighlightEffect(btn, {
      flashCount: this.config.NEXT_BTN_FLASH_COUNT,
      message: "ðŸŽ¯ Highlighted Next Assignment button"
    });
  }

  async highlightFirstIncompleteModule() {
    if (!this.isHomePage()) {
      console.log("â„¹ï¸ Not on home page, skipping module highlighting");
      return;
    }

    try {
      const courseId = window.ENV?.COURSE_ID || window.ENV?.course_id;
      if (!courseId) throw new Error("No course ID found");

      const incompleteItems = await this.getIncompleteModuleItems(courseId);
      if (incompleteItems.length === 0) {
        console.log("âœ… All module items completed");
        return;
      }

      const targetElement = this.findModuleTargetElement();
      if (!targetElement) {
        console.warn("âš ï¸ No module target element found");
        return;
      }

      this.addBeginLabel(targetElement);
      this.createHighlightEffect(targetElement, {
        flashCount: this.config.HIGHLIGHT_FLASH_COUNT,
        message: "âœ¨ Highlighted first incomplete module"
      });

    } catch (error) {
      console.error("âŒ Error highlighting module:", error);
    }
  }

  async getIncompleteModuleItems(courseId) {
    // Get first module
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

    element.scrollIntoView({ behavior: "smooth", block: "center" });
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
  // Cleanup
  // ----------------------------
  cleanup() {
    // No continuous polling to stop, but clean up any remaining intervals
    this.stopSCORMPolling();
    this.state.activePollingAssignments.clear();
    
    this.observers.forEach((observer, key) => {
      observer.disconnect();
      console.log(`ðŸ§¹ Disconnected observer: ${key}`);
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
    // Wait for DOM and ENV to be ready
    await this.waitForDOMReady();
    await this.waitForENV();
    
    await this.customizer.init();
    this.setupDOMObserver();
  }

  waitForDOMReady() {
    return new Promise(resolve => {
      if (document.readyState === "complete" || 
          (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
      }
    });
  }

  waitForENV() {
    return new Promise(resolve => {
      const checkENV = () => {
        if (window.ENV && window.ENV.current_user_roles) {
          resolve();
        } else {
          setTimeout(checkENV, 100);
        }
      };
      checkENV();
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
      }, 250);
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false // Reduced observer scope
    });

    console.log("ðŸ‘ï¸ DOM observer initialized");
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
