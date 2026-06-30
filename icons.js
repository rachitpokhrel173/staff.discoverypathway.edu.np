// ════════════════════════════════════════════════════════════
// ICON LIBRARY — lightweight inline SVG icons (no emoji, no external deps)
// Usage: icon('plus')  or  icon('plus', 14)
// ════════════════════════════════════════════════════════════

const ICON_PATHS = {
  dashboard:  '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  user:       '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  users:      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 21c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17.5" cy="9" r="3"/><path d="M15.5 14.7c2.9.5 5 2.9 5 6.3"/>',
  money:      '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
  receipt:    '<path d="M6 2.5h12v19l-2.5-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21.5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  check:      '<path d="M5 12.5l4.5 4.5L19 7"/>',
  check_circle:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/>',
  plus:       '<path d="M12 5v14M5 12h14"/>',
  edit:       '<path d="M3 21l3.4-.8L20 6.6a2 2 0 0 0 0-2.8l-.8-.8a2 2 0 0 0-2.8 0L3.8 16.6 3 21z"/><path d="M14.5 5.5l4 4"/>',
  trash:      '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
  print:      '<path d="M7 8.5V3h10v5.5"/><rect x="4.5" y="8.5" width="15" height="8" rx="1.5"/><path d="M7 14.5h10V21H7z"/>',
  search:     '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M19.5 19.5L15 15"/>',
  calendar:   '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v4M16 3v4"/>',
  mail:       '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 6.5l9 6.5 9-6.5"/>',
  phone:      '<path d="M5.5 4h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z"/>',
  home:       '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v10h12V10"/>',
  briefcase:  '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  shield:     '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  camera:     '<rect x="2.5" y="7" width="19" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.7"/><path d="M8.5 7l1.3-2.5h4.4L15.5 7"/>',
  family:     '<circle cx="8" cy="6.5" r="2.8"/><circle cx="16" cy="6.5" r="2.8"/><path d="M3 20c0-3 2-5.5 5-5.5s5 2.5 5 5.5"/><path d="M11 20c0-3 2-5.5 5-5.5s5 2.5 5 5.5"/>',
  bank:       '<path d="M3 10l9-6 9 6"/><path d="M5 10v9M10 10v9M14 10v9M19 10v9"/><path d="M3 19h18"/>',
  warning:    '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 9.5v5M12 17.5v.1"/>',
  alert:      '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.1"/>',
  logout:     '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"/><path d="M15.5 16l4-4-4-4"/><path d="M19 12H9"/>',
  upload:     '<path d="M12 16V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5"/>',
  download:   '<path d="M12 4v12M7.5 11.5L12 16l4.5-4.5"/><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5"/>',
  star:       '<path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  location:   '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  bell:       '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  building:   '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/><path d="M10 21v-4h4v4"/>',
  id:         '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><circle cx="8" cy="11" r="2.2"/><path d="M5.3 16c.5-1.7 1.8-2.6 2.7-2.6s2.2.9 2.7 2.6"/><path d="M14 9.5h5M14 13h5"/>',
  graduation: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6 11.5v4.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"/><path d="M21.5 9.5v6"/>',
  heart:      '<path d="M12 20.5s-7.5-4.7-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10.5c0 5.3-7.5 10-7.5 10z"/>',
  spinner_ring:'<circle cx="12" cy="12" r="9" stroke-dasharray="40" stroke-dashoffset="10"/>',
  close:      '<path d="M5 5l14 14M19 5L5 19"/>',
  globe:      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  doc:        '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5V7h4"/><path d="M9 12h6M9 15.5h6M9 8.5h2"/>',
};

function icon(name, size=16, extra='') {
  const path = ICON_PATHS[name];
  if(!path) return '';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;flex-shrink:0;${extra}">${path}</svg>`;
}
