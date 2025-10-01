/**
 * Debug script to test BU/LOB selection issue
 */

console.log('=== Debugging BU/LOB Selection Issue ===');

// Check if we can access the app in browser console
console.log(`
Manual Test Steps:
1. Open browser console (F12)
2. Navigate to http://localhost:3000
3. Run these commands in console:

// Check if businessUnits data is loaded
console.log('Business Units:', window.businessUnits || 'Not found on window');

// Check React DevTools for state
console.log('Use React DevTools to inspect AppProvider state');

Expected BU/LOB structure:
- ECOM (bu-ecom)
  - Phone (lob-ecom-phone) [hasData: true]  
  - Chat (lob-ecom-chat) [hasData: false]

Issue Symptoms:
1. Clicking "ECOM" doesn't update button text
2. Prompts don't change to contextual ones
3. State isn't updating properly

Possible Causes:
1. Event handler not firing
2. State update not propagating  
3. React re-render not happening
4. Dropdown structure issue
`);

console.log('✅ Debug info logged - check browser console for manual testing');