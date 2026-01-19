# FlowForge Logo Setup Guide

## ✅ What's Been Set Up

I've prepared your web-ui for the FlowForge logo:

### 1. Directory Structure Created
```
web-ui/
├── public/              ← NEW: Static assets directory
│   └── README.md        ← Instructions for logo placement
└── src/
    ├── assets/          ← NEW: Source assets directory
    └── components/
        └── Logo.tsx     ← NEW: Reusable Logo component
```

### 2. Files Updated/Created

**✅ index.html** - Updated with:
- Favicon reference (`<link rel="icon" href="/logo.svg" />`)
- Meta description
- Theme color

**✅ Logo.tsx Component** - Created at `src/components/Logo.tsx`
- Supports `full` (horizontal logo) and `icon` variants
- Accepts `width`, `height`, and `className` props
- Easy to use throughout the app

## 📋 Next Steps - Add Your Logo

### Step 1: Place Your Logo File

Copy your horizontal logo file to:
```
web-ui/public/logo.svg
```

This file will be:
- Used as the main logo throughout the app
- Used as the favicon in browser tabs
- Publicly accessible at `http://localhost:3000/logo.svg`

### Step 2: (Optional) Create Icon Variant

If you want an icon-only version (just the robot without text), create:
```
web-ui/public/logo-icon.svg
```

This is useful for:
- Mobile layouts
- Small spaces (navbar, sidebar)
- App icons

### Step 3: (Optional) Create Favicon

For better browser compatibility, create a traditional favicon:
```
web-ui/public/favicon.ico
```

You can generate this from your SVG using online tools or image editors.

## 💻 How to Use the Logo Component

### Basic Usage

```tsx
import { Logo } from '@/components/Logo';

function MyComponent() {
  return (
    <div>
      {/* Full horizontal logo */}
      <Logo width={200} />

      {/* Icon only */}
      <Logo variant="icon" width={40} />

      {/* With custom styling */}
      <Logo className="my-custom-class" width={180} />
    </div>
  );
}
```

### Direct Image Usage

You can also use the logo directly without the component:

```tsx
<img src="/logo.svg" alt="FlowForge" />
```

## 🎨 Recommended Logo Variants

Based on your horizontal logo with robot icon + "FLOWFORGE" text:

| File | Description | Size Recommendation |
|------|-------------|---------------------|
| `logo.svg` | Full horizontal logo | ~200-300px width |
| `logo-icon.svg` | Just the robot icon | ~40-64px square |
| `logo-dark.svg` | Dark mode version (optional) | Same as logo.svg |
| `favicon.ico` | Traditional favicon | 16x16, 32x32, 48x48 |

## 📁 Example Layout Integration

Update your [Layout.tsx](src/components/Layout.tsx) to use the logo:

```tsx
import { Logo } from './Logo';

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Add the logo here */}
              <Logo width={160} className="mr-8" />
              {/* ... rest of nav */}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
```

## ✨ What Happens Next

Once you place `logo.svg` in the `public/` directory:

1. **Browser Tab**: Your logo will appear as the favicon
2. **Component Usage**: Use `<Logo />` component anywhere in your app
3. **Public Access**: Logo available at `/logo.svg` URL
4. **Auto-reload**: Vite will pick it up automatically (no restart needed)

## 🧪 Testing

After adding your logo file:

1. **Verify favicon**: Check browser tab icon
2. **Verify component**: Add `<Logo />` to any page and test
3. **Verify public access**: Visit `http://localhost:3000/logo.svg` directly

## 📝 Current File Locations

- **Logo file goes here**: `web-ui/public/logo.svg` ⏳ (waiting for you to add it)
- **Logo component**: `web-ui/src/components/Logo.tsx` ✅
- **HTML reference**: `web-ui/index.html` ✅
- **Instructions**: `web-ui/public/README.md` ✅

---

**Status**: Ready for your logo file!
**Action Required**: Copy your horizontal logo SVG to `web-ui/public/logo.svg`
