
// This is an optional script that could be used with a library like sharp
// to generate favicons and app icons from your profile image
// To use it, you would need to install sharp and run this script

/*
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Source image
const sourceImage = path.join(__dirname, '../images/me.avif');

// Generate favicon sizes
const sizes = [16, 32, 192, 512];
const appleSize = 180;

// Process each size
async function generateIcons() {
  // Regular favicons
  for (const size of sizes) {
    await sharp(sourceImage)
      .resize(size, size)
      .toFile(path.join(iconsDir, `${size === 192 ? 'android-chrome' : 'favicon'}-${size}x${size}.png`));
    
    console.log(`Generated ${size}x${size} icon`);
  }
  
  // Apple touch icon
  await sharp(sourceImage)
    .resize(appleSize, appleSize)
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  
  console.log(`Generated ${appleSize}x${appleSize} Apple touch icon`);
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(err => console.error('Error generating icons:', err));
*/

// Note: Until the above script is set up, you'll need to manually create
// the following icon files and place them in the /icons directory:
// - favicon-16x16.png
// - favicon-32x32.png
// - android-chrome-192x192.png
// - android-chrome-512x512.png
// - apple-touch-icon.png
