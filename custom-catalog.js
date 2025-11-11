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
      fetch("https://abw-ed.github.io/VCIS-testbed/html/tnc-content.html")
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

//Add color Banner (idempotent)
if (!document.getElementById('custom_color_banner')) {
  var color_banner = $('<div id="custom_color_banner" style="height: 15px; background-repeat: no-repeat;"></div>');
  $('#app-header > div.container').after(color_banner);
}

// Define Tile Text, Links and Public Image URL's
var defineTiles = function(){
    var tiles = [["All Employees","/browse/all/all-employees","https://abw-ed.github.io/VCIS-testbed/assets/img/all_employees.jpg"],
                 ["Administrators & Managers","/browse/all/administrators-and-managers","https://abw-ed.github.io/VCIS-testbed/assets/img/managers_s.jpg"],
                 ["Instructional","/browse/all/instructional","https://abw-ed.github.io/VCIS-testbed/assets/img/instructional.jpg"],
                 ["Non-Instructional","/browse/all/non-instructional","https://abw-ed.github.io/VCIS-testbed/assets/img/non-instructional.jpg"]];
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
var buildTileHTML = function(tile){
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
                   '</h3></div><div class="product-footer"><div class="learn-more"><div class="product-dates home-page-tile-browse-text" style="padding-top: 10px;overflow: visible !important;">Browse Courses Now</div></div></div></div><div class="sr-only"><div>Browse '
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

  var $feature = $("#home-page #feature");
  if (!$feature.length) return; // wait until feature exists

  // If already present, don't create duplicates; just recompute positions.
  var $container = $("#custom-feature-container");
  var $left = $("#feature-bg-left");
  var $right = $("#feature-bg-right");

  if (!$container.length) {
    $left = $('<div id="feature-bg-left"></div>');
    $container = $(
      "<div id='custom-feature-container' class='container'>" +
        "<div class='hero-container col-xs-12 col-sm-12 col-md-12'>" +
          "<h1><span>Information Sharing and MARAM Online Learning System</span></h1>" +
          "<h2>Browse the available courses now</h2>" +
        "</div>" +
      "</div>"
    );
    $right = $('<div id="feature-bg-right"></div>');
    $feature.append($left, $container, $right);
  }

  // After layout, measure and position
  requestAnimationFrame(function () {
    var c = $container[0];
    if (!c) return;

    var rect = c.getBoundingClientRect();
    var marginLeft = Math.max(0, Math.round(rect.left)) + 5;
    var top = Math.round(rect.top + window.pageYOffset);

    if ($left.length)  $left.css({ width: marginLeft + "px", top: top + "px" });
    if ($right.length) $right.css({ width: marginLeft + "px", top: top + "px" });
  });
}

/* ---------------------------------------
   Tiles + homepage customizations (idempotent)
----------------------------------------*/
var homePageCustomizations = function(){
    if (window.location.pathname === "/browse/infosharing/"){
        // Only inject tiles if we haven't already
        if (!$("#listings .custom-home-tile").length) {
          var tiles = defineTiles();
          var tilesHTML = "";
          tiles.forEach(function(tile){
              tilesHTML += buildTileHTML(tile);
          });
          if ($("#listings").length) {
            $("#listings").append(tilesHTML);
          }
        }

        // cache-safe hero
        initHeroOnce();

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
          '<div class="sr-only">Use the following button to be redirected to a URL with all available courses</div>' +
          '<button type="button" id="search-all-courses-btn" onclick="location.href=\''+window.location.origin+'/browse/all?sort=date\'" class="search-refine-button btn btn-lg" aria-expanded="false" aria-haspopup="false" style="padding-left: 16px; padding-right: 40px;">' +
            '<div class="search-refine-button__contents">' +
              '<div class="search-refine-button__text">Search All Courses</div>' +
              '<div class="search-submit" aria-hidden="true" style="color:#ffffff;padding-left: 160px;"></div>' +
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
function tweakLoginHref(){
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
function setupHeaderNavOnce(){
  if ($("#app-header #user-nav #page-links").length) return; // already done
  $("#app-header div.col-xs-12.col-sm-6.col-md-7").attr("class", "col-xs-12 col-sm-12 col-md-4");
  $("#app-header div.col-xs-12.col-sm-6.col-md-5").attr("class", "col-xs-12 col-sm-12 col-md-8");
  $("#app-header #user-nav").prepend("<div id='page-links'><ul class='piped-list'>\
    <li><a target='_blank' rel='noreferrer noopener' href='https://training-infosharing.instructure.com'>Canvas Home</a></li>\
    <li><a href='https://training-infosharing.sydney.catalog.canvaslms.com'>Catalog Home</a></li>\
    <li><a href='https://training-infosharing.sydney.catalog.canvaslms.com/dashboard'>Catalog Dashboard</a></li>\
    </ul></div>");
}

// Main initializer â€” safe to call many times
function initAll(){
  if (window.location.href.indexOf("https://training-infosharing.sydney.catalog.canvaslms.com/") === -1) {
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
function hideListingsChrome(){
  if (window.location.pathname !== '/browse/infosharing/') return;
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

// ---- Boot sequence ----

// Run on normal load; wait for #feature if needed for hero sizing
$(function () {
  (function waitForFeature(attempts) {
    if ($("#home-page #feature").length || attempts > 60) {
      initAll();
      hideListingsChrome();
      return;
    }
    setTimeout(function(){ waitForFeature(attempts + 1); }, 250);
  })(0);
});

// Re-run on bfcache restore
window.addEventListener("pageshow", function (e) {
  if (e.persisted) {
    initAll();
    hideListingsChrome();
  }
});

// SPA navigations (if used)
document.addEventListener("turbolinks:load", function(){
  initAll(); hideListingsChrome();
});
document.addEventListener("turbo:load", function(){
  initAll(); hideListingsChrome();
});

// Keep background edges aligned on resize
window.addEventListener("resize", function () {
  requestAnimationFrame(initHeroOnce);
});
