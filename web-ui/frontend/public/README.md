# FlowForge Logo Assets

## Required Files

Place your logo files in this directory:

### Primary Logo
- **`logo.svg`** - Your horizontal FlowForge logo (robot icon + "FLOWFORGE" text)
  - This is the main logo used throughout the app
  - Will also be used as the favicon in the browser tab

### Optional Variants (Recommended)
- **`logo-icon.svg`** - Just the robot icon (for compact spaces, mobile, etc.)
- **`logo-dark.svg`** - Dark mode version (if needed)
- **`favicon.ico`** - Traditional favicon format (16x16, 32x32, 48x48)

## Usage in Components

Import and use the Logo component:

```tsx
import { Logo } from '@/components/Logo';

// Full logo
<Logo width={200} />

// Icon only
<Logo variant="icon" width={40} />

// With custom styling
<Logo className="my-custom-class" />
```

## Direct Image Usage

You can also reference the logo directly:

```tsx
<img src="/logo.svg" alt="FlowForge" />
```

## Current Status

✅ Public directory created
✅ Logo component created at `src/components/Logo.tsx`
✅ index.html updated with favicon reference
⏳ **Next step: Add your `logo.svg` file to this directory**

## File Paths

- Public assets: `web-ui/public/logo.svg`
- Logo component: `web-ui/src/components/Logo.tsx`
