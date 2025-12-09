/**
 * SCREENCAST ANIMATION SCRIPT
 * 
 * Paste this into your browser console (F12) to create a smooth zoom animation
 * from maximum distance into Vienna, Austria.
 * 
 * The map will:
 * 1. Start zoomed out showing the whole world
 * 2. Smoothly fly to Vienna with a cinematic zoom
 * 
 * IMPORTANT: Make sure you're on a page with the map visible!
 * 
 * Note: Wrapped in IIFE to avoid variable redeclaration errors if run multiple times.
 */

// Check if map is available
if (typeof window.myMap === 'undefined') {
  console.error('❌ Map not found! Make sure you:');
  console.error('   1. Are on a page with the map visible');
  console.error('   2. Wait for the map to fully load');
  console.error('   3. Check the console for "Map exposed as window.myMap" message');
  throw new Error('window.myMap is not available');
}

// Wrap in IIFE to avoid redeclaration errors when running multiple times
(function() {
  // Starting position - Atlantic Ocean view (closer to Europe)
  const START_POSITION = {
    lng: -30,
    lat: 40,
    zoom: 2.5
  };
  
  // Austria geographical center coordinates
  const AUSTRIA_CENTER = {
    lng: 13.3333,
    lat: 47.3333,
    zoomNUTS1: 4.5, // NUTS1 level - country/regional view
    zoomNUTS3: 6.5  // NUTS3 level - detailed regional view
  };

  // Animation sequence
  console.log('🎬 Starting screencast animation...');

  // Step 1: Start from Atlantic Ocean
  window.myMap.flyTo({
    center: [START_POSITION.lng, START_POSITION.lat],
    zoom: START_POSITION.zoom,
    duration: 0, // Instant
    essential: true
  });

  // Step 2: Wait a moment, then fly dramatically to Austria (NUTS1)
  setTimeout(() => {
    console.log('🚀 Flying to Austria (NUTS1 view)...');
    
    window.myMap.flyTo({
      center: [AUSTRIA_CENTER.lng, AUSTRIA_CENTER.lat],
      zoom: AUSTRIA_CENTER.zoomNUTS1,
      duration: 6000, // 6 seconds for longer journey
      essential: true,
      easing: (t) => t * (2 - t) // Smooth ease-out
    });
  }, 1000); // Wait 1 second before starting

  console.log('✅ Animation queued!');
})();

// Function to run the initial fly-in animation
window.flyToAustria = function() {
  if (typeof window.myMap === 'undefined') {
    console.error('❌ Map not available!');
    return;
  }
  
  console.log('🎬 Starting fly-in animation...');
  
  // Start from Atlantic Ocean
  window.myMap.flyTo({
    center: [-30, 40],
    zoom: 2.5,
    duration: 0,
    essential: true
  });
  
  // Fly to Austria
  setTimeout(() => {
    console.log('🚀 Flying to Austria (NUTS1 view)...');
    window.myMap.flyTo({
      center: [13.3333, 47.3333],
      zoom: 4.5,
      duration: 6000,
      essential: true,
      easing: (t) => t * (2 - t)
    });
  }, 1000);
  
  console.log('✅ Fly-in animation queued!');
};

// Zoom into NUTS3 regions (call this after the initial animation completes)
window.zoomToNUTS3 = function() {
  if (typeof window.myMap === 'undefined') {
    console.error('❌ Map not available!');
    return;
  }
  
  console.log('🔍 Zooming to NUTS3 level...');
  window.myMap.flyTo({
    center: [13.3333, 47.3333], // Austria center
    zoom: 6.5, // NUTS3 level
    duration: 3000, // 3 seconds
    essential: true,
    easing: (t) => t * (2 - t)
  });
  console.log('✅ Zoom to NUTS3 queued!');
};

// Zoom back out to NUTS1 (call this to return to overview)
window.zoomBackOut = function() {
  if (typeof window.myMap === 'undefined') {
    console.error('❌ Map not available!');
    return;
  }
  
  console.log('🔙 Zooming back to NUTS1 level...');
  window.myMap.flyTo({
    center: [13.3333, 47.3333], // Austria center
    zoom: 4.5, // NUTS1 level
    duration: 3000, // 3 seconds
    essential: true,
    easing: (t) => t * (2 - t)
  });
  console.log('✅ Zoom back queued!');
};
