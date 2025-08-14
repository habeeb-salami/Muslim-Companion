# 🎨 Theme System Documentation

## Overview

The Muslim Companion extension features a comprehensive theme system that allows users to customize the appearance of the extension with multiple pre-built themes and custom color options.

## Features

- **5 Pre-built Themes**: Light, Dark, Soft, Ramadan, and Eid
- **Custom Color Picker**: Modify individual colors for any theme
- **Live Preview**: See changes in real-time
- **Theme Export/Import**: Share themes between devices
- **System Theme Detection**: Automatically detect user's system preference
- **Responsive Design**: Themes adapt to different screen sizes
- **Accessibility**: High contrast and reduced motion support

## Theme Files Structure

```
src/
├── styles/
│   ├── theme.css          # Main theme system CSS
│   └── styles.css         # Additional styling
├── js/
│   ├── theme-manager.js   # Core theme management
│   └── theme-toggle.js    # Reusable theme toggle component
├── theme/
│   └── newtab.html        # Themed new tab page
└── images/
    ├── theme_frame.png    # Chrome theme frame
    ├── theme_toolbar.png  # Chrome theme toolbar
    ├── theme_tab_background.png    # Chrome theme tab background
    └── theme_ntp_background.png   # Chrome theme new tab background

options/
└── theme-settings.html    # Theme customization interface
```

## Available Themes

### 1. Light Theme
- **Primary**: Teal (#0d9488)
- **Secondary**: Amber (#f59e0b)
- **Background**: White (#ffffff)
- **Surface**: Light Gray (#f8fafc)
- **Text**: Dark Gray (#1e293b)

### 2. Dark Theme
- **Primary**: Cyan (#22d3ee)
- **Secondary**: Yellow (#fbbf24)
- **Background**: Dark Blue (#0f172a)
- **Surface**: Darker Blue (#1e293b)
- **Text**: Light Gray (#f1f5f9)

### 3. Soft Theme
- **Primary**: Amber (#f59e0b)
- **Secondary**: Teal (#0d9488)
- **Background**: Warm White (#fafaf9)
- **Surface**: Light Warm Gray (#f5f5f4)
- **Text**: Dark Gray (#1e293b)

### 4. Ramadan Theme
- **Primary**: Yellow (#fbbf24)
- **Secondary**: Teal (#0d9488)
- **Background**: Deep Blue (#1e3a8a)
- **Surface**: Blue (#1e40af)
- **Text**: Warm Yellow (#fef3c7)

### 5. Eid Theme
- **Primary**: Yellow (#fbbf24)
- **Secondary**: Cyan (#22d3ee)
- **Background**: Purple (#7c3aed)
- **Surface**: Light Purple (#8b5cf6)
- **Text**: Warm Yellow (#fef3c7)

## Usage

### Basic Theme Switching

```javascript
// Using the theme manager
if (window.themeManager) {
  themeManager.setTheme('dark');
  themeManager.setTheme('ramadan');
}

// Direct CSS class application
document.body.classList.add('theme-dark');
document.body.classList.remove('theme-light');
```

### Adding Theme Toggle to Any Page

```html
<!-- Include the theme toggle script -->
<script src="../src/js/theme-toggle.js"></script>

<!-- The toggle will be automatically created -->
<!-- Or create with custom options -->
<script>
  const themeToggle = new ThemeToggle({
    position: 'top-left',
    size: 'large',
    showLabel: true,
    labelText: 'Switch Theme'
  });
</script>
```

### Custom Theme Creation

```javascript
// Create a custom theme
const customTheme = {
  name: 'My Custom Theme',
  icon: '🌟',
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#2c3e50',
    surface: '#34495e',
    text: '#ecf0f1',
    textSecondary: '#bdc3c7',
    border: '#7f8c8d',
    accent: '#e74c3c'
  }
};

// Add to theme manager
themeManager.themeConfigs['custom'] = customTheme;
themeManager.availableThemes.push('custom');
themeManager.setTheme('custom');
```

## CSS Custom Properties

The theme system uses CSS custom properties (variables) for consistent theming:

```css
:root {
  --primary-color: #0d9488;
  --secondary-color: #f59e0b;
  --background-color: #ffffff;
  --surface-color: #f8fafc;
  --text-color: #1e293b;
  --text-secondary-color: #64748b;
  --border-color: #e2e8f0;
  --accent-color: #22d3ee;
}
```

## Utility Classes

The theme system provides utility classes for common styling needs:

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>

<!-- Cards -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">Card content goes here</div>
</div>

<!-- Forms -->
<div class="form-group">
  <label class="form-label">Input Label</label>
  <input type="text" class="form-input" placeholder="Enter text">
</div>

<!-- Alerts -->
<div class="alert alert-info">Information message</div>
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>

<!-- Badges -->
<span class="badge badge-primary">Primary Badge</span>
<span class="badge badge-secondary">Secondary Badge</span>
```

## Chrome Theme Integration

The extension includes Chrome theme support through the `manifest.json`:

```json
{
  "theme": {
    "images": {
      "theme_frame": "/src/images/theme_frame.png",
      "theme_toolbar": "/src/images/theme_toolbar.png",
      "theme_tab_background": "/src/images/theme_tab_background.png",
      "theme_ntp_background": "/src/images/theme_ntp_background.png"
    },
    "colors": {
      "frame": [26, 26, 46],
      "toolbar": [22, 33, 62],
      "ntp_background": [15, 52, 96],
      "tab_text": [255, 255, 255],
      "bookmark_text": [255, 255, 255]
    }
  }
}
```

## Browser Compatibility

- **Chrome**: 112+ (Manifest V3)
- **Firefox**: 109+ (with limitations)
- **Edge**: 112+
- **Safari**: 16+ (with limitations)

## Performance Considerations

- Themes are applied using CSS custom properties for optimal performance
- Theme switching is instant with no page reloads
- Images are optimized and cached
- Minimal JavaScript overhead

## Accessibility Features

- **High Contrast Support**: Automatically adjusts for high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Blindness**: Themes designed with color contrast in mind

## Keyboard Shortcuts

- **Ctrl + Shift + T**: Toggle between themes
- **Tab**: Navigate through theme settings
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate color pickers

## Troubleshooting

### Theme Not Applying
1. Check if `theme-manager.js` is loaded
2. Verify CSS custom properties are being set
3. Check browser console for errors
4. Ensure theme classes are applied to body element

### Colors Not Updating
1. Verify color picker inputs are valid hex colors
2. Check if theme manager is properly initialized
3. Ensure CSS custom properties are being updated
4. Check for CSS specificity conflicts

### Performance Issues
1. Reduce number of simultaneous theme changes
2. Optimize image sizes for Chrome themes
3. Use CSS transforms instead of layout changes
4. Minimize DOM manipulation during theme switching

## Contributing

To add new themes or modify existing ones:

1. **Add Theme Configuration**: Update `themeConfigs` in `theme-manager.js`
2. **Create Theme Images**: Add corresponding Chrome theme images
3. **Update CSS**: Add theme-specific styles in `theme.css`
4. **Test**: Verify theme works across different pages and components
5. **Document**: Update this README with new theme information

## License

This theme system is part of the Muslim Companion extension and follows the same licensing terms.

---

For more information, see the main extension documentation or contact the development team.
