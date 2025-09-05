# Tiora Manager Logo Integration Guide

## How to Add Your Logo to the Application

### Step 1: Copy Your Logo Files

1. Copy your logo files from `E:\Personal\Saloon\logo` to the project's assets folder:
   ```
   src/assets/images/
   ```

2. Recommended logo formats and naming:
   - `tiora-logo.svg` (Vector format - recommended)
   - `tiora-logo.png` (High resolution - at least 512x512px)
   - `tiora-logo-light.svg` (For dark backgrounds if needed)
   - `tiora-logo-dark.svg` (For light backgrounds if needed)

### Step 2: Update the Logo Component

Replace the placeholder logo in `src/components/shared/Logo.tsx` with your actual logo:

```tsx
// Option 1: Using an image file
const LogoIcon = () => (
  <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
    <img 
      src="/src/assets/images/tiora-logo.svg" 
      alt="Tiora Manager Logo" 
      className="w-full h-full object-contain"
    />
  </div>
);

// Option 2: Using React component (if you have SVG as React component)
import TioraLogoSVG from '../assets/images/tiora-logo.svg?react';

const LogoIcon = () => (
  <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
    <TioraLogoSVG className="w-full h-full" />
  </div>
);
```

### Step 3: Update Vite Configuration (if using SVG imports)

Add this to your `vite.config.ts` if you want to import SVGs as React components:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: "**/*.svg?react",
    })
  ],
})
```

### Step 4: Copy Command for Your Logo

To copy your logo from the external folder to the project, run this command in PowerShell:

```powershell
# Navigate to your project directory
cd "E:\Personal\Saloon\SaloonWeb\project"

# Copy logo files
Copy-Item "E:\Personal\Saloon\logo\*" -Destination "src\assets\images\" -Recurse

# Or copy specific file
Copy-Item "E:\Personal\Saloon\logo\your-logo-name.svg" -Destination "src\assets\images\tiora-logo.svg"
```

### Step 5: Usage Examples

The Logo component can be used throughout the application:

```tsx
// Icon only
<Logo size="md" variant="icon" />

// Text only
<Logo size="lg" variant="text" />

// Full logo with icon and text
<Logo size="md" variant="full" />

// Custom className
<Logo size="sm" variant="icon" className="shadow-lg" />
```

### Current Logo Locations

The logo is currently used in:
- Login screen (`src/components/Login.tsx`)
- Can be easily added to headers, dashboards, etc.

### Logo Sizes Available

- `sm`: 32px (w-8 h-8)
- `md`: 48px (w-12 h-12) 
- `lg`: 64px (w-16 h-16)
- `xl`: 80px (w-20 h-20)

### Notes

1. The current placeholder shows a "T" in a gradient background
2. Replace the `LogoIcon` component content with your actual logo
3. Maintain the responsive sizing system
4. Consider providing both light and dark variants for different themes
5. Ensure your logo works well at different sizes

## Current Modern Design Features

The new login screen includes:
- ✅ Modern glass-morphism design with backdrop blur
- ✅ Animated background elements
- ✅ Gradient color schemes
- ✅ Smooth hover animations and transitions
- ✅ Professional typography with "Tiora Manager" branding
- ✅ Responsive design
- ✅ Light theme optimized
- ✅ Intuitive UI with improved form inputs
- ✅ System status indicator
- ✅ Modern button styling with hover effects
