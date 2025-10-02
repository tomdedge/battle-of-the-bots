# PWA Installation Troubleshooting

## Where to Find Your Installed PWA

### Chrome/Edge on macOS:
1. **Address bar**: Type `chrome://apps/` and press Enter
2. **Applications folder**: Check `/Applications/Chrome Apps/` 
3. **Launchpad**: Look for AuraFlow icon
4. **Dock**: May appear in Dock after installation

### Safari on macOS:
1. **Dock**: PWAs appear directly in Dock
2. **Applications folder**: Look in `/Applications/`

### Firefox:
Firefox has limited PWA support on macOS

## Manual Check Steps:

1. **Open new tab** and type: `chrome://apps/`
2. **Check browser menu**: Three dots → More tools → Create shortcut
3. **Look in Finder**: Search for "AuraFlow" 
4. **Check browser history**: Look for standalone window launches

## If PWA Doesn't Appear:

1. **Uninstall**: Go to `chrome://apps/` → Right-click app → Remove
2. **Clear cache**: DevTools → Application → Storage → Clear site data
3. **Reinstall**: Refresh page and click install prompt again

## Alternative: Create Desktop Shortcut

If PWA installation isn't working, create a shortcut:
1. Chrome: Menu → More tools → Create shortcut → Check "Open as window"
2. This creates an app-like experience without full PWA features