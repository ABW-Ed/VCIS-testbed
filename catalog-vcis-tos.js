// Add the button and overlay
$('#header-menu').append(`<div id="tnc-popup"
     style="display:none; position:fixed; top:10%; left:10%;
            width:80%; height:70%; background:#fff; border:2px solid #333;
            padding:20px; z-index:9999; overflow:auto; border-radius:8px;">
  <h2>Terms & Conditions</h2>
  <p>Your terms go here...</p>
  <button id="close-tnc" style="margin-top:10px;">Close</button>
</div> `);

// Load HTML for popup from GitHub Pages
fetch('https://abw-ed.github.io/VCIS-testbed/html/tnc-content.html')
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


