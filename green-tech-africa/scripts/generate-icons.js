// Script to generate PWA icons for Green Tech Africa
// This creates simple SVG-based icons with Ghana-appropriate green theme

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon template
function generateIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle with Ghana green theme -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#22c55e"/>
  
  <!-- Building/house icon -->
  <g transform="translate(${size*0.2}, ${size*0.25})">
    <!-- House base -->
    <rect x="0" y="${size*0.3}" width="${size*0.6}" height="${size*0.35}" fill="white" rx="${size*0.02}"/>
    
    <!-- Roof -->
    <polygon points="${size*-0.05},${size*0.3} ${size*0.3},${size*0.1} ${size*0.65},${size*0.3}" fill="white"/>
    
    <!-- Door -->
    <rect x="${size*0.1}" y="${size*0.45}" width="${size*0.12}" height="${size*0.2}" fill="#22c55e" rx="${size*0.01}"/>
    
    <!-- Windows -->
    <rect x="${size*0.35}" y="${size*0.4}" width="${size*0.08}" height="${size*0.08}" fill="#22c55e" rx="${size*0.005}"/>
    <rect x="${size*0.47}" y="${size*0.4}" width="${size*0.08}" height="${size*0.08}" fill="#22c55e" rx="${size*0.005}"/>
    
    <!-- Solar panel on roof -->
    <rect x="${size*0.15}" y="${size*0.15}" width="${size*0.3}" height="${size*0.08}" fill="#1e40af" rx="${size*0.005}"/>
    
    <!-- Eco leaf symbol -->
    <g transform="translate(${size*0.45}, ${size*0.05})">
      <path d="M 0,${size*0.08} Q ${size*0.04},0 ${size*0.08},${size*0.04} Q ${size*0.04},${size*0.08} 0,${size*0.08}" fill="#16a34a"/>
      <line x1="0" y1="${size*0.08}" x2="${size*0.04}" y2="${size*0.04}" stroke="#16a34a" stroke-width="${size*0.002}"/>
    </g>
  </g>
  
  <!-- Ghana flag colors accent (small stripe at bottom) -->
  <rect x="0" y="${size*0.9}" width="${size}" height="${size*0.033}" fill="#dc2626"/>
  <rect x="0" y="${size*0.933}" width="${size}" height="${size*0.033}" fill="#eab308"/>
  <rect x="0" y="${size*0.966}" width="${size}" height="${size*0.034}" fill="#16a34a"/>
</svg>`;
}

// Generate icons for all sizes
iconSizes.forEach(size => {
  const svgContent = generateIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = ['properties', 'plans', 'projects', 'dashboard'];
shortcuts.forEach(shortcut => {
  const svgContent = generateShortcutIcon(shortcut, 96);
  const filename = `shortcut-${shortcut}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

function generateShortcutIcon(type, size) {
  const baseIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#22c55e"/>`;
  
  let iconContent = '';
  
  switch (type) {
    case 'properties':
      iconContent = `
        <g transform="translate(${size*0.25}, ${size*0.25})">
          <rect x="0" y="${size*0.2}" width="${size*0.5}" height="${size*0.3}" fill="white" rx="${size*0.02}"/>
          <polygon points="${size*-0.05},${size*0.2} ${size*0.25},${size*0.05} ${size*0.55},${size*0.2}" fill="white"/>
          <rect x="${size*0.1}" y="${size*0.35}" width="${size*0.1}" height="${size*0.15}" fill="#22c55e"/>
          <rect x="${size*0.3}" y="${size*0.3}" width="${size*0.08}" height="${size*0.08}" fill="#22c55e"/>
        </g>`;
      break;
    case 'plans':
      iconContent = `
        <g transform="translate(${size*0.2}, ${size*0.2})">
          <rect x="0" y="0" width="${size*0.6}" height="${size*0.6}" fill="white" rx="${size*0.02}"/>
          <line x1="${size*0.1}" y1="${size*0.15}" x2="${size*0.5}" y2="${size*0.15}" stroke="#22c55e" stroke-width="${size*0.02}"/>
          <line x1="${size*0.1}" y1="${size*0.3}" x2="${size*0.4}" y2="${size*0.3}" stroke="#22c55e" stroke-width="${size*0.02}"/>
          <line x1="${size*0.1}" y1="${size*0.45}" x2="${size*0.45}" y2="${size*0.45}" stroke="#22c55e" stroke-width="${size*0.02}"/>
        </g>`;
      break;
    case 'projects':
      iconContent = `
        <g transform="translate(${size*0.2}, ${size*0.2})">
          <rect x="0" y="${size*0.1}" width="${size*0.6}" height="${size*0.5}" fill="white" rx="${size*0.02}"/>
          <rect x="${size*0.05}" y="0" width="${size*0.5}" height="${size*0.15}" fill="white" rx="${size*0.02}"/>
          <circle cx="${size*0.15}" cy="${size*0.25}" r="${size*0.03}" fill="#22c55e"/>
          <circle cx="${size*0.15}" cy="${size*0.35}" r="${size*0.03}" fill="#22c55e"/>
          <circle cx="${size*0.15}" cy="${size*0.45}" r="${size*0.03}" fill="#eab308"/>
        </g>`;
      break;
    case 'dashboard':
      iconContent = `
        <g transform="translate(${size*0.2}, ${size*0.2})">
          <rect x="0" y="0" width="${size*0.25}" height="${size*0.25}" fill="white" rx="${size*0.02}"/>
          <rect x="${size*0.35}" y="0" width="${size*0.25}" height="${size*0.25}" fill="white" rx="${size*0.02}"/>
          <rect x="0" y="${size*0.35}" width="${size*0.25}" height="${size*0.25}" fill="white" rx="${size*0.02}"/>
          <rect x="${size*0.35}" y="${size*0.35}" width="${size*0.25}" height="${size*0.25}" fill="white" rx="${size*0.02}"/>
        </g>`;
      break;
  }
  
  return baseIcon + iconContent + '</svg>';
}

console.log('PWA icons generated successfully!');
console.log('Note: For production, convert SVG icons to PNG format for better browser support.');