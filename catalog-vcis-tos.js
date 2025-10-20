// Add the button and overlay
$('#header-menu').append(` `);

// Load HTML for popup from GitHub Pages
fetch('https://<abw-ed.github.io/VCIS-testbed/html/tnc-content.html')
  .then(res => res.text())
  .then(html => {
    $('body').append(html);
    console.log("✅ T&C content loaded");
  })
  .catch(err => console.error("❌ Failed to load T&C HTML:", err));

// Show popup
$('#header-menu').on('click', '#show-tnc', function() {
  $('#tnc-overlay').show();
  $('#tnc-popup').show();
  console.log("👉 Popup opened");
});

// Hide popup
$('body').on('click', '#close-tnc, #tnc-overlay', function() {
  $('#tnc-popup').hide();
  $('#tnc-overlay').hide();
  console.log("❎ Popup closed");
});
