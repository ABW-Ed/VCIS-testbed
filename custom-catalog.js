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
