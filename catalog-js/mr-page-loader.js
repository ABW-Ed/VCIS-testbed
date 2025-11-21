$(function () {
  // ===============================
  // 1. Insert hidden Terms of Use modal
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
        <div id="custom-tou-content">
          <div role="main"><span id="maincontent"></span>
            <div class="policy_version mb-3">
              <div class="clearfix mt-2">
                <h3 id="policy-5">Protecting Children - Mandatory Reporting and Other Obligations</h3>
              </div>
              <div class="policy_document_summary clearfix mb-1">				
                <div class="niceborder">
                  <p>The Learning Management System (LMS) is provided by the Department to host whole of Victorian Government child safety and wellbeing professional development courses.</p>
                  <p>Users of the LMS are required to register to initiate their training, providing the following personal information:</p>
                  <ul>
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Email</li>
                    <li>What school sector do you work in?</li>
                    <li>Name of school</li>
                    <li>Department or agency.</li>
                  </ul>
                  <p>The information provided is used to:</p>
                  <ul>
                    <li>Create a UserID for the system</li>
                    <li>Monitor and report on relevant module completion, including to your employer</li>
                    <li>Provide assistance via appropriate channels</li>
                    <li>Keep you informed of training and professional development opportunities</li>
                  </ul>
                  <p>You can access and update your registration details through your profile page.</p>
                </div>          		  		  		  		  
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  $("body").append(touModal);

  // ===============================
  // 2. Function to open modal (popup)
  // ===============================
  function openTouModal(e) {
    e.preventDefault();
    $("#custom-tou-modal").fadeIn(200);
  }

  // ===============================
  // 3. Function to close modal (popup)
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
    $(this).attr("href", "#")
      .removeAttr("target")
      .addClass("custom-tou-link")
      .text("Terms of Use");
  });

  // ===============================
  // 5. Replace Footer Terms of Use link
  // ===============================
  $("#app-footer a[href*='acceptable-use']").each(function () {
    $(this).attr("href", "#")
      .removeAttr("target")
      .addClass("custom-tou-link")
      .text("Terms of Use");
  });

  // ===============================
  // 6. Complete modal attachment to elements
  // ===============================
  $(document).on("click", ".custom-tou-link", openTouModal);

  // ===============================
  // 7. Redirect check (with delay/polling for ENV)
  // ===============================
  var targetUrl = "https://protectngstraining.education.vic.gov.au/courses/non-government-schools-protecting-children-training"; // redirect to enrolment page as it's the only listing
  var maxWaitMs = 5000;          // stop attempting to redirect after 5 secs
  var intervalMs = 50;          // try every 50ms
  var waited = 0;

  var redirectCheck = setInterval(function () {
    try {
      if (ENV && ENV.products_initial_data && ENV.products_initial_data.products && ENV.homepage) {
        var productUrl = ENV.products_initial_data.products[0].url;
        var hpCheck = ENV.homepage;

        if (hpCheck === true && productUrl === targetUrl) {
          clearInterval(redirectCheck);
          window.location.href = targetUrl; // instant redirect
        }
      }
    } catch (err) {
      console.warn("Redirect check error:", err);
    }

    waited += intervalMs;
    if (waited >= maxWaitMs) {
      clearInterval(redirectCheck);
    }
  }, intervalMs);

  // ===============================
  // 8. User-based DOM customisations
  // ===============================
  var userCheck = setInterval(function () {
    try {
      if (ENV && ENV.user !== undefined) {
        var userObj = ENV.user;

        // Case 1: Logged out (empty ENV.user object)
        if ($.isEmptyObject(userObj)) {
          $("#header-menu-container").css("display", "none");
          $("#enroll-hero a").text("Login / Enrol");
        }

        // Case 2: Logged in but not enrolled
        if (userObj.enrolled === false) {
          $(".Registration__SignInButton a")
            .find("span")         // find all spans inside the <a>
            .last()               // take the innermost/deepest one
            .text("Login to Enrol");
        }

        // Done checking once ENV.user is stable
        clearInterval(userCheck);
      }
    } catch (err) {
      console.warn("User check error:", err);
    }
  }, intervalMs);

  // 9. insert new MR title bit - functions only

  function cleanListingsChrome() {
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

  function addMrTopper2890() {
    const container = document.querySelector("#main");
    if (!container) return;

    fetch("https://abw-ed.github.io/VCIS-testbed/html/mrpageinsert.html")
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(html => {
        container.insertAdjacentHTML("afterbegin", html);
      })
      .catch(err => console.error("Fetch error:", err));
  }






  // ===============================
  // 10. Course title duplication & renaming (only for IDs 16772 & 15667)
  // ===============================
  var productWatcher = setInterval(function () {
    try {
      if (
        ENV &&
        ENV.products_initial_data &&
        ENV.products_initial_data.products &&
        Array.isArray(ENV.products_initial_data.products)
      ) {
        // Extract product IDs
        const ids = ENV.products_initial_data.products.map(p => p.id);

        // Only run if the catalogue is one of the 2 target IDs
        if (ids.includes(16772) || ids.includes(15667)) {

          // Your working duplication & replacement script
          (() => {
            const replacements = {
              "Protecting Children - Mandatory Reporting and Other Obligations Early Childhood": "Early Childhood",
              "Protecting Children - Mandatory Reporting and Other Obligations Non-Government Schools": "Non-Government Schools"
            };

            const headings = [...document.querySelectorAll(".product-heading")];

            headings.forEach(orig => {

              // Deep clone
              const clone = orig.cloneNode(true);
              clone.classList.remove("product-heading");
              clone.classList.add("product-heading-2");

              // Correct: pull hidden full title from screenReaderContent
              const sr = clone.querySelector(".css-1lvij29-truncateText");
              const key = sr ? sr.textContent.trim() : null;

              if (key && replacements[key]) {
                const newText = replacements[key];

                // Locate the visible truncated span
                const visibleTextSpan =
                  clone.querySelector(".css-1lvij29-truncateText > span:not([class])");

                if (visibleTextSpan) {
                  visibleTextSpan.textContent = newText;
                }
              }

              // Insert clone immediately after the original


              orig.insertAdjacentElement("afterend", clone);
              cleanListingsChrome();
              addMrTopper();

            });

          })();

          clearInterval(productWatcher); // Done
        } else {
          // IDs didn't match → also stop watching
          clearInterval(productWatcher);
        }
      }

    } catch (err) {
      console.warn("Product watcher error:", err);
    }
  }, intervalMs);

});
