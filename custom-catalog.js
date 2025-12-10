
// ===============================
// CONFIG — reusable base URLs
// ===============================
const catalogurl = "https://training-infosharing.sydney.catalog.canvaslms.com";
const canvasurl = "https://training-infosharing.instructure.com";
const githubpage = "https://abw-ed.github.io/VCIS-testbed/";
const vciscaturl = "/browse/infosharing";

var deworkforces = "";
var dffhworkforces = "";
var dhworkforces = "";
var childlink = "";
var csworkforces = "";
var djcsworkforces = "";


// custom-catalog.js
(function () {
  // Wait until jQuery is available (Canvas loads it async sometimes)
  function waitForjQuery(callback) {
    if (typeof window.jQuery !== "undefined") {
      callback(window.jQuery);
    } else {
      console.log("⏳ Waiting for jQuery...");
      setTimeout(() => waitForjQuery(callback), 200);
    }
  }

  waitForjQuery(function ($) {
    $(function () {
      // ===============================
      // 1. Insert hidden Terms of Use modal (structure only)
      // ===============================
      var touModal = `
        <div id="custom-tou-modal" style="display:none; position:fixed; z-index:9999;
             top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6);">
          <div style="background:#fff; max-width:800px; margin:5% auto; padding:20px;
                      border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.5);
                      position:relative; max-height:80%; overflow-y:auto;">
            <button id="custom-tou-close"
                    style="position:absolute; top:10px; right:10px; border:none;
                           background:transparent; font-size:20px; cursor:pointer;">✕</button>
            <h2>Terms of Use</h2>
            <div id="custom-tou-content">Loading...</div>
          </div>
        </div>
      `;
      $("body").append(touModal);

      // ===============================
      // 1b. Load the external HTML into the modal
      // ===============================
      fetch(githubpage + "html/tnc-content.html")
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then((html) => {
          $("#custom-tou-content").html(html);
          console.log("✅ T&C HTML loaded successfully");
        })
        .catch((err) => {
          console.error("❌ Failed to load T&C HTML:", err);
          $("#custom-tou-content").html("<p>Failed to load Terms of Use.</p>");
        });

      // ===============================
      // 2. Function to open modal
      // ===============================
      function openTouModal(e) {
        e.preventDefault();
        $("#custom-tou-modal").fadeIn(200);
      }

      // ===============================
      // 3. Function to close modal
      // ===============================
      $(document).on("click", "#custom-tou-close, #custom-tou-modal", function (e) {
        if (e.target.id === "custom-tou-modal" || e.target.id === "custom-tou-close") {
          $("#custom-tou-modal").fadeOut(200);
        }
      });

      // ===============================
      // 4. Replace Registration Agreement TOU link
      // ===============================
      $(".Registration__Agreement a[href*='acceptable-use']").each(function () {
        $(this)
          .attr("href", "#")
          .removeAttr("target")
          .addClass("custom-tou-link")
          .text("Terms of Use");
      });

      // ===============================
      // 5. Replace Footer Terms of Use link
      // ===============================
      $("#app-footer a[href*='acceptable-use']").each(function () {
        $(this)
          .attr("href", "#")
          .removeAttr("target")
          .addClass("custom-tou-link")
          .text("Terms of Use");
      });

      // ===============================
      // 6. Bind modal to all custom links
      // ===============================
      $(document).on("click", ".custom-tou-link", openTouModal);


      // ===============================
      // 7. User-based DOM customisations
      // ===============================
      const intervalMs = 500;
      const userCheck = setInterval(function () {
        try {
          if (window.ENV && ENV.user !== undefined) {
            const userObj = ENV.user;

            // Case 1: Logged out (empty ENV.user)
            if ($.isEmptyObject(userObj)) {
              $("#header-menu-container").css("display", "none");
              $("#enroll-hero a").text("Login / Enrol");
            }

            // Case 2: Logged in but not enrolled
            if (userObj.enrolled === false) {
              $(".Registration__SignInButton a")
                .find("span")
                .last()
                .text("Login to Enrol");
            }

            clearInterval(userCheck);
          }
        } catch (err) {
          console.warn("User check error:", err);
        }
      }, intervalMs);
    });
  });
})();


// this section is experimental

function isCatalogFrontPage() {
  const path = window.location.pathname;
  const search = window.location.search.toLowerCase();

  return (
    path.startsWith(vciscaturl) &&
    !search.includes("category%5b") &&
    !search.includes("category[")
  );
}

function loadCategoryURLs() {
  return fetch("/browse/infosharing/categories.json")
    .then(r => r.json())
    .then(data => {
      if (!data.categories) return;

      data.categories.forEach(cat => {
        const safeName = cat.name
          .replace(/\s+/g, "")
          .replace(/[^a-zA-Z0-9]/g, "");
        console.log('safename variable:', safeName);

        // Build expected variable name
        const varName = safeName.charAt(0).toLowerCase() + safeName.slice(1);
        console.log('varname variable:', varName);

        // Only assign if the variable already exists
        if (typeof window[varName] !== "undefined") {
          const url =
            "/browse/infosharing?category%5Bid%5D=" + cat.id +
            "&category%5Bname%5D=" + encodeURIComponent(cat.name) +
            "#";
          console.log('url variable:', url);

          window[varName] = url;
        }
      });

      console.log("Populated category URLs:", {
        deworkforces,
        csworkforces,
        dffhworkforces,
        dhworkforces,
        djcsworkforces,
        childlink
      });
    })
    .catch(err => console.error("Failed to load categories:", err));
}

//Add color Banner (idempotent)
if (!document.getElementById('custom_color_banner')) {
  var color_banner = $('<div id="custom_color_banner" style="height: 15px; background-repeat: no-repeat;"></div>');
  $('#app-header > div.container').after(color_banner);
}

// Define Tile Text, Links and Public Image URL's
var defineTiles = async function () {
  await loadCategoryURLs();
  console.log("deworkforces URL:", deworkforces);
  var tiles = [
    ["Education Workforces", deworkforces, githubpage + "assets/img/de-wf-tile.png"],
    ["Families Fairness and Housing", dffhworkforces, githubpage + "assets/img/dffh-wf-tile.png"],
    ["Health Workforces", dhworkforces, githubpage + "assets/img/dh-wf-tile.png"],
    ["Community Service Workforces", csworkforces, githubpage + "assets/img/IS-DFFH-elearn-tile-resize.png"],
    ["Child Link", childlink, githubpage + "assets/img/childlink-logo.png"],
    ["Justice Training", djcsworkforces, githubpage + "assets/img/scales-3.png"]

  ];
  return tiles;
};

// Helper function for checking if an element has been rendered yet
function onElementRendered(selector, cb, _attempts) {
  var el = $(selector);
  _attempts = ++_attempts || 1;
  if (el.length) return cb(el);
  if (_attempts == 60) return;
  setTimeout(function () {
    onElementRendered(selector, cb, _attempts);
  }, 250);
};

// Helper function to help build HTML for Custom tiles
var buildTileHTML = function (tile) {
  // mark each as custom so we can detect/prevent duplicates
  var tileHTML = '<div class="col-md-3 col-sm-6 custom-home-tile"><a class="product-link" href="'
    + tile[1] +
    '"><div class="product-tile course-tile" aria-hidden="true"><div class="product-image"><div class="image-container"><span class="image-wrapper" title="'
    + tile[0] +
    '" style="background-image: url('
    + tile[2] +
    ');"><img class="image-placeholder img-responsive" alt="" src="/assets/product-image-ratio.png"></span></div><span class="ProductIcon__Wrapper--gallery-index"><span class="sr-only"></span><span role="presentation" aria-hidden="true" title="Course"><div class="ProductIcon__LargeCircle--course"><span class="icon icon-course"></span></div> </span> </span></div><div class="product-heading" style="word-wrap: break-word;"><h3 title="'
    + tile[0] +
    ' Courses" class="product-title">'
    + tile[0] +
    '</h3></div><div class="product-footer"><div class="learn-more"><div class="product-dates home-page-tile-browse-text" style="padding-top: 10px;overflow: visible !important;">Browse courses now</div></div></div></div><div class="sr-only"><div>Browse '
    + tile[0] +
    '</div><div></div></div></a></div>';
  return tileHTML;
};

/* ---------------------------------------
   Cache-safe, idempotent hero init
----------------------------------------*/
function initHeroOnce() {
  // Don't run on specific sub-catalogs
  // if (window.location.href.indexOf("https://training-infosharing.sydney.catalog.canvaslms.com/") > -1) return;

  var $feature = $("#feature");
  if (!$feature.length) return; // wait until feature exists - might need to make this dependent on something else

  // If already present, don't create duplicates; just recompute positions.
  var $container = $("#custom-feature-container");
  var $left = $("#feature-bg-left");
  var $right = $("#feature-bg-right");

  if (!$('#custom-feature-container').length) {
    const $feature = $('#feature.feature-region');

    // TODO - really need to make this a HTML element that's sideloaded
    const $container = $(`
    <div id="custom-feature-container" class="container-fluid d-flex">
      <div id="feature-bg-left" class="feature-side left flex-shrink-0"></div>
      <div id="feature-center" class="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-white">
        <div class="hero-container text-center">
          <h1 class="text-center">Information Sharing and MARAM Online Learning System</h1>
          <!-- h2 element Browse the available courses now -->
        </div>
      </div>
      <div id="feature-bg-right" class="feature-side right flex-shrink-0"></div>
    </div>
  `);

    $feature.append($container);
  }


  // After layout, measure and position
  requestAnimationFrame(function () {
    var c = $container[0];
    if (!c) return;

    var rect = c.getBoundingClientRect();
    var marginLeft = Math.max(0, Math.round(rect.left)) + 5;
    var top = Math.round(rect.top + window.pageYOffset);

    if ($left.length) $left.css({ width: marginLeft + "px", top: top + "px" });
    if ($right.length) $right.css({ width: marginLeft + "px", top: top + "px" });
  });
}

/* ---------------------------------------
   Tiles + homepage customizations (idempotent)
----------------------------------------*/


var homePageCustomizations = async function () {

    // create cache-safe hero banner before injecting tiles
  
    initHeroOnce();
  
  if (
    window.location.pathname.startsWith(vciscaturl) &&
    !window.location.search.toLowerCase().includes("category%5b") &&
    !window.location.search.includes("category[")
  ) {
    // Only inject tiles if we haven't already
    if (!$("#listings .custom-home-tile").length) {

      // get rid of existing listings for front page including pagination
      $('#listings [role="listitem"]').remove();
      $('nav[data-automation="Pagination"]').remove();
      
      // Wait for async tiles to be built
      const tiles = await defineTiles();
      let tilesHTML = "";

      tiles.forEach(function (tile) {
        tilesHTML += buildTileHTML(tile);
      });

      if ($("#listings").length) {
        // Wrap tiles in a row
        const rowHTML = `<div class="row">${tilesHTML}</div>`;
        $("#listings").append(rowHTML);
      }
    }





    // Hides No Courses found text
    var hideNoCoursesText = setInterval(function () {
      if ($('div.col-md-12 > h3').length) {
        clearInterval(hideNoCoursesText);
        $("div.col-md-12 > h3").ready(function () {
          $("#listings > div.col-md-12").html("");
        });
      }
    }, 50);
  } else {
    // Add some text to the search bar to help indicate that they are only searching the current sub-catalog
    var checkExist = setInterval(function () {
      if ($('#search').length) {
        clearInterval(checkExist);
        $("#search").ready(function () {
          var q = document.getElementsByName('query')[0];
          if (q && q.placeholder !== 'Search this Page') {
            q.placeholder = 'Search this Page';
          }
        });
      }
    }, 50);
  }

  // Add the Search All Courses Link (idempotent)
  var actionsSel = "#search-form >div.search-form-container > div.container > div.search-form > div.search-form__actions.pull-right";
  if ($(actionsSel).length && !document.getElementById('search-all-courses-btn')) {
    $(actionsSel).append(
      '<span>' +
      '<div class="sr-only">Use the following button to be redirected to the Catalog categories page</div>' +
      '<button type="button" id="search-all-courses-btn" onclick="location.href=\'' + window.location.origin + vciscaturl" class="search-refine-button btn btn-lg" aria-expanded="false" aria-haspopup="false" style="padding-left: 16px; padding-right: 40px;">' +
      '<div class="search-refine-button__contents">' +
      '<div class="search-refine-button__text">Return Home</div>' +
      '<div class="vcis-home-button" aria-hidden="true" style="color:#ffffff;padding-left: 160px;"></div>' +
      '</div>' +
      '</button>' +
      '</span>'
    );
  }
};

//Change Credit Text to Say Points (safe to run repeatedly)
function changeCredits() {
  onElementRendered('.product-credits', function (e) {
    var links = document.getElementsByClassName("product-credits");
    for (var i = 0; i < links.length; i++) {
      var html = links[i].innerHTML;
      // strip pipe once; then replace words
      html = html.replace('|', '');
      // only replace if still credits/credit
      html = html.replace(/\bcredits\b/g, 'points');
      html = html.replace(/\bcredit\b/g, 'point');
      links[i].innerHTML = html;
    }
  });
}

// Tweak Login Href (idempotent per element)
function tweakLoginHref() {
  var pathname = window.location.pathname;
  var els = document.querySelectorAll("a[href^='/login']");
  var redirectUri = "login?target_uri=" + pathname;
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (el.parentElement && el.parentElement.id === "user-nav" && !el.dataset.redirected) {
      el.href = el.href.replace(/login/gi, redirectUri);
      el.dataset.redirected = "true";
    }
  }
}

// One-time header layout + links (idempotent)
// ===============================
// Header nav setup
// ===============================
function setupHeaderNavOnce() {
  if ($("#app-header #user-nav #page-links").length) return;

  $("#app-header div.col-xs-12.col-sm-6.col-md-7")
    .attr("class", "col-xs-12 col-sm-12 col-md-4");

  $("#app-header div.col-xs-12.col-sm-6.col-md-5")
    .attr("class", "col-xs-12 col-sm-12 col-md-8");

  $("#app-header #user-nav").prepend(
    "<div id='page-links'><ul class='piped-list'>\
     <li><a target='_blank' rel='noreferrer noopener' href='" + canvasurl + "'>Canvas Home</a></li>\
     <li><a href='" + catalogurl + "'>Catalog Home</a></li>\
     <li><a href='" + catalogurl + "dashboard'>Catalog Dashboard</a></li>\
     </ul></div>"
  );
}

// Main initializer safe to call many times
function initAll() {
  if (window.location.pathname.startsWith(vciscaturl)) {
    setupHeaderNavOnce();
    homePageCustomizations();
    tweakLoginHref();
    changeCredits();

    // prevent stacking scroll handlers by namespacing
    $(window).off('scroll.ocpsCredits').on('scroll.ocpsCredits', function () {
      changeCredits();
    });
  }
}

// Hide "Listings", "Browse Listings", and "There are no courses..." text
// Only run if we're on the root path
function hideListingsChrome() {
  if (!window.location.pathname.endsWith(vciscaturl)) return;
  var hideListingsContent = setInterval(function () {
    if ($('#main-heading h1, #listings h2, #listings .col-md-12 .h3').length) {
      clearInterval(hideListingsContent);

      // Hide "Listings"
      $('#main-heading h1').each(function () {
        if ($(this).text().trim() === 'Listings') {
          $(this).hide();
        }
      });

      // Hide "Browse Listings"
      $('#listings h2').each(function () {
        if ($(this).text().trim() === 'Browse Listings') {
          $(this).hide();
        }
      });

      // Hide "There are no courses or programs to display."
      $('#listings .col-md-12 .h3').each(function () {
        if ($(this).text().includes('There are no courses')) {
          $(this).hide();
        }
      });
    }
  }, 50);
}

function addAnnouncementBlock() {
  if (
    window.location.pathname.startsWith(vciscaturl) &&
    !window.location.search.toLowerCase().includes("category%5b") &&
    !window.location.search.includes("category[")
  ) {

    // ✅ Prevent double-loading
    if (document.querySelector("#announcement-block")) {
      return;
    }

    const container = document.querySelector("#main-heading");
    if (!container) return;

    // delete 'listings'
    const h1 = container.querySelector("h1");
    if (h1) h1.remove();

    // replace 'browse listings' with...
    const listingsH2 = document.querySelector("#listings h2");
    if (listingsH2) {
      listingsH2.textContent = "Choose your category";
    }

    // insert the announcement HTML block
    fetch(githubpage + "html/catalog-announcements.html")
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(html => {

        // ✅ Double-check before inserting (race condition safe)
        if (!document.querySelector("#announcement-block")) {
          container.insertAdjacentHTML("afterbegin", html);
        }

      })
      .catch(err => console.error("Fetch error:", err));
  }
}


// loader code

function showVCISCatalogLoader() {
 // Don't double-create
  if (document.getElementById("catalog-loader")) return;

  if (!isCatalogFrontPage()) return;

  // Create loader
  const loader = document.createElement("div");
  loader.id = "catalog-loader";

  // Insert your SVG logo instead of spinner
  loader.innerHTML = `
    <img src="https://abw-ed.github.io/VCIS-testbed/assets/svg/Victoria_State_Government_logo.svg" class="vicman-logo" alt="Loading">
  `;

  document.body.appendChild(loader);

  // Start fade-out after animation completes
  setTimeout(() => {
    loader.classList.add("fade-out");

    // Remove from DOM after fade
    setTimeout(() => {
      loader.remove();
    }, 400);

  }, 2200); // match your CSS animation duration
}



function hideVCISCatalogLoader() {
  const loader = document.getElementById("catalog-loader");
  if (!loader) return;

  loader.classList.add("fade-out");

  // loader goes away after fade completes
  setTimeout(() => {
    if (loader) loader.remove();
  }, 400);
}


// ---- Boot sequence with loader ----

$(function () {
  showVCISCatalogLoader();   // blur and spinner on

  (function waitForFeature(attempts) {
    if ($("#feature").length || attempts > 60) {

      initAll();
      hideListingsChrome();
      addAnnouncementBlock();

      // ✅ Let DOM settle a beat, then remove loader
    //  setTimeout(hideVCISCatalogLoader, 150);

      return;
    }
    setTimeout(function () { waitForFeature(attempts + 1); }, 250);
  })(0);
});

// Re-run on bfcache restore
window.addEventListener("pageshow", function (e) {
  if (e.persisted) {
    // showVCISCatalogLoader();

    initAll();
    hideListingsChrome();
    addAnnouncementBlock();

   // setTimeout(hideVCISCatalogLoader, 150);
  }
});

// SPA navigations
document.addEventListener("turbolinks:load", function () {
  showVCISCatalogLoader();

  initAll();
  hideListingsChrome();
  addAnnouncementBlock();

 // setTimeout(hideVCISCatalogLoader, 150);
});

document.addEventListener("turbo:load", function () {
  // showVCISCatalogLoader();

  initAll();
  hideListingsChrome();
  addAnnouncementBlock();

  // setTimeout(hideVCISCatalogLoader, 150);
});

// Keep background aligned on resize
window.addEventListener("resize", function () {
  requestAnimationFrame(initHeroOnce);
});
