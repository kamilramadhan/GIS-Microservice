/**
 * BPS API Configuration - Development/Testing
 * 
 * File ini untuk testing lokal.
 * Untuk production, gunakan bps-config.example.js sebagai template.
 */

if (typeof CONFIG !== 'undefined') {
    // APP ID BPS (ganti dengan APP ID Anda dari dashboard)
    CONFIG.BPS_API.APP_ID = '0a94470ebd2b059f522da5b53a491575';
    
    // Untuk testing, set USE_LOCAL_FALLBACK = false untuk memaksa gunakan API
    CONFIG.USE_LOCAL_FALLBACK = false;
    
    console.log('✓ BPS Config loaded');
    console.log('→ APP ID:', CONFIG.BPS_API.APP_ID.substring(0, 8) + '...');
}
