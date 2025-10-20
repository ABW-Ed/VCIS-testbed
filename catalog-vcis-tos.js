$(function () {
fetch('https://abw-ed.github.io/VCIS-testbed/html/tnc-content.html')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  })
  .then(html => {
    // Store it in a variable (like your old var touModal)
    var touModal = html;

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
