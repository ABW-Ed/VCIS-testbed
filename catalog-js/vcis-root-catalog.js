// --------------------
// Canvas Catalog Customiser Framework
// --------------------

const maxInitAttempts = 5;
let initAttempts = 0;

/**
 * Feature: Certificate Customiser
 * Runs ONLY on product pages (ENV.product exists)
 */
async function catalogCertCorrection() {
  console.log("✅ Running certificate customiser...");

  const completedPanel = document.querySelector("#completed");
  if (!completedPanel) {
    console.warn("⚠️ No #completed panel found yet.");
    return false;
  }

  let updated = false;

  completedPanel.querySelectorAll(".DashboardCertificate").forEach((cert, idx) => {
    const titleSpan = cert.querySelector(".DashboardCertificate__Title");
    const downloadLink = cert.querySelector("a[href*='?download=1']");

    if (titleSpan && downloadLink) {
      // Append helpful suffix
      if (!titleSpan.textContent.includes(" - Click to download certificate")) {
        titleSpan.textContent = titleSpan.textContent.trim() + " - Click to download certificate";
        console.log(`✏️ Updated title text for cert #${idx + 1}`);
      }

      // Wrap in anchor if not already
      if (!titleSpan.closest("a")) {
        const newLink = document.createElement("a");
        newLink.href = downloadLink.href;
        newLink.className = downloadLink.className + " hover_cert_link";
        newLink.setAttribute("target", "_blank");
        newLink.setAttribute("rel", "noopener noreferrer");
        newLink.appendChild(titleSpan.cloneNode(true));
        titleSpan.replaceWith(newLink);

        console.log(`✅ Wrapped title in download link: ${newLink.href}`);
      }

      // Remove duplicate "View/Download" links
      const extraLinksContainer = cert.querySelector("span > a[href*='?download=1']")?.parentElement;
      if (extraLinksContainer) {
        extraLinksContainer.remove();
        console.log("🗑️ Removed extra View/Download links.");
      }

      updated = true;
    }
  });

  if (updated) {
    console.log("🎉 Certificate customisation complete.");
    return true;
  }

  return false;
}

/**
 * Feature: Product Image Linker + Proceed Link
 * 1. Turns the product image into a link to the Canvas course
 * 2. Adds a "Click here to proceed to the course" link under #add-to-bulk-checkout-hero
 */
async function productImageLinker() {
  // Check preconditions
  if (!ENV?.isCurrentUserEnrolled) return;
  if (!ENV?.urls?.canvas_courses) return;
  if (!ENV?.product?.canvas_course_id) return;

  const baseUrl = ENV.urls.canvas_courses.replace(/^\/\//, "https://");
  const courseId = ENV.product.canvas_course_id;
  const targetUrl = `${baseUrl}courses/${courseId}`;

  console.log(`🔗 Building course link: ${targetUrl}`);

  // --- Part 1: Turn product image into a link ---
  const section = document.querySelector(
    `#product-page[data-canvas-course-id="${courseId}"]`
  );
  if (section) {
    const productImageDiv = section.querySelector(".product-image");

    if (productImageDiv && productImageDiv.tagName.toLowerCase() !== "a") {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.className = productImageDiv.className;
      link.innerHTML = productImageDiv.innerHTML;

      productImageDiv.replaceWith(link);
      console.log("✅ Product image converted into link:", targetUrl);
    }
  }

  // --- Part 2: Add proceed link into #add-to-bulk-checkout-hero ---
  const heroContainer = document.getElementById("add-to-bulk-checkout-hero");
  if (heroContainer && !heroContainer.querySelector(".proceed-link")) {
    const proceedLink = document.createElement("a");
    proceedLink.href = targetUrl;
    proceedLink.textContent = "Click here to proceed to the course";
    proceedLink.className = "proceed-link btn btn-primary"; // style tweak (Bootstrap)
    proceedLink.target = "_blank";
    proceedLink.rel = "noopener noreferrer";

    heroContainer.appendChild(proceedLink);
    console.log("✅ Proceed link added to hero container.");
  }

  return true;
}

/**
 * Feature: Registration Header Tweaker
 * If ENV.isEnrollmentForm is true and ENV.user.id exists,
 * change the "Self-paced Course" text.
 */
async function registrationHeaderTweaker() {
  if (!ENV?.isEnrollmentForm) return false;
  if (!ENV?.user?.id) return false;

  const dateInfoSpan = document.querySelector(
    "#registration .RegistrationHeader__DateInfo .css-a0y5mv-text"
  );

  if (!dateInfoSpan) return false;

  if (dateInfoSpan.textContent.trim() !== "") {
    dateInfoSpan.textContent = "";
    console.log("✅ Registration header text updated.");
    return true;
  }

  return false;
}

async function registrationHeaderTweaker2() {
  if (!ENV?.isEnrollmentForm) return false;
  if (ENV?.user?.id) return false;

  const dateInfoSpan = document.querySelector(
    "#registration .RegistrationHeader__DateInfo .css-a0y5mv-text"
  );
  if (!dateInfoSpan) return false;

  const wrapper = dateInfoSpan.closest("span");
  const container = wrapper.parentElement;

  // Only insert once
  if (!container.querySelector(".outer-accountproceed")) {
    const outer = document.createElement("span");
    outer.className = "outer-accountproceed";

    const inner = document.createElement("span");
    inner.className = "inner-accountproceed";
    inner.textContent = "If you have an account proceed to Login to Enrol";

    outer.appendChild(inner);

    container.insertBefore(outer, wrapper.nextSibling);

    console.log("✨ Nested additional message inserted.");
    return true;
  }

  return false;
}


// makes sure that people don't click the catalog redirect button when new course 
let registrationRedirectArmed = false;

async function registrationSuccessRedirect() {
  const $success = $('.RegistrationBody__Success');
  if (!$success.length) return;

  // Prevent re-arming on every mutation
  if (registrationRedirectArmed) return;
  registrationRedirectArmed = true;

  const $span = $success.find('span').first();
  const extraText = ' Please wait while you are redirected to your course.';

  if (!$span.text().includes('Please wait while you are redirected')) {
    $span.append(extraText);
  }

  $('a[data-cid="Link"]:contains("Return to Catalogue")')
    .closest('li[data-cid="InlineListItem"]')
    .remove();

  setTimeout(function () {
    const $goToCourseLink = $('a[data-testid="go-to-course-link"]').first();

    if ($goToCourseLink.length) {
      $goToCourseLink[0].click();
    } else {
      console.warn('Go to course link not found');
      // Allow retry if link appears later
      registrationRedirectArmed = false;
    }
  }, 5000);
}


/**
 * Initialise a given feature with DOM ready + MutationObserver
 */
function initFeature(featureFn) {
  featureFn(); // run immediately once
  const observer = new MutationObserver(() => {
    featureFn();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}




/**
 * Router: decides which customisations to run based on ENV
 */
async function initCustomisations() {
  if (!window.ENV) {
    console.warn("❌ No ENV object detected — retrying...");
    if (initAttempts < maxInitAttempts) {
      initAttempts++;
      setTimeout(initCustomisations, 500);
    }
    return;
  }

  initAttempts = 0;

  // Branch 1: Non-product pages → certificate customiser
  if (!ENV.product && !ENV.admin_page && !ENV.homepage) {
    console.log("📄 No product context detected — enabling certificate customiser.");
    initFeature(catalogCertCorrection);
  } else {
    console.log("ℹ️ Product page detected — skipping certificate customiser.");
  }

  // Branch 2: Product page + user enrolled → image linker
  if (ENV.isCurrentUserEnrolled && ENV.product?.canvas_course_id) {
    console.log("📄 Enrolled user on product page detected — enabling image linker.");
    initFeature(productImageLinker);
  }

  // Branch 3: Enrollment form → registration header tweak
  if (ENV.isEnrollmentForm && ENV.user?.id) {
    console.log("📄 Enrollment form detected — enabling header tweaker.");
    initFeature(registrationHeaderTweaker);

  }

  // Branch 4: Enrollment form → registration header tweak - logged out
  if (ENV.isEnrollmentForm && !(ENV.user?.id)) {
    console.log("📄 Enrollment form detected — enabling header tweaker.");
    initFeature(registrationHeaderTweaker2);
  }

  // Branch 5: Enrollment success → auto redirect to course
  if (ENV?.user?.id && ENV?.product?.["started?"]) {
    console.log("✅ Enrollment success detected — enabling auto redirect to course.");
    initFeature(registrationSuccessRedirect);
  }


}

// --------------------
// Wrap init in DOM-ready routine
// --------------------
if (document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)) {
  initCustomisations();
} else {
  document.addEventListener("DOMContentLoaded", initCustomisations);
}
