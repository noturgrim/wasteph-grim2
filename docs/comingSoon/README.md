# WastePH - Coming Soon Page

A professional, minimalist coming soon page for WastePH waste management application.

## Design Philosophy

Clean, modern, and professional design focused on:

- Minimalist aesthetics with maximum impact
- Typography-driven layout using Montserrat font family
- Subtle interactive elements that respond to user input
- Dark background with strategic use of green accent color
- No distracting animations or unnecessary elements

## Features

**Professional Typography**

- Text-based logo with Montserrat Extra Bold
- Clear hierarchy and spacing
- Consistent font family throughout

**Interactive Background**

- Subtle gradient that follows mouse movement
- Minimal grid pattern overlay
- Creates depth without distraction

**Clean Countdown Timer**

- Large, readable numbers with tabular formatting
- Minimal labels with proper spacing
- Subtle hover interactions

**Streamlined Email Form**

- Single-line input with underline design
- Inline button for desktop, stacked for mobile
- Clear validation states
- Success feedback

**Minimal Footer**

- Text-based social media links
- Clean copyright notice
- Proper spacing and borders

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4.1
- Montserrat Font (400-900 weights)

## Configuration

### Launch Date

Edit the `launchDate` in `src/App.jsx`:

```javascript
const launchDate = new Date("2025-03-01T00:00:00");
```

### Social Media Links

Update the `links` object in the `handleSocialClick` function in `src/App.jsx`:

```javascript
const links = {
  facebook: "https://facebook.com/yourpage",
  instagram: "https://instagram.com/yourpage",
  twitter: "https://twitter.com/yourpage",
  linkedin: "https://linkedin.com/company/yourpage",
};
```

### Email API Integration

Replace the simulated API call in `src/components/NotifyForm.jsx`:

```javascript
const handleSubmit = async (event) => {
  event.preventDefault();

  const response = await fetch("YOUR_API_ENDPOINT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    setStatus("success");
    setEmail("");
  } else {
    setStatus("error");
  }
};
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
comingSoon/
├── src/
│   ├── components/
│   │   ├── CountdownTimer.jsx      # Minimalist countdown
│   │   └── NotifyForm.jsx          # Email collection form
│   ├── assets/
│   ├── App.jsx                     # Main application
│   ├── index.css                   # Global styles
│   └── main.jsx                    # Entry point
├── package.json
└── vite.config.js
```

## Components

### CountdownTimer

Displays a clean, readable countdown with days, hours, minutes, and seconds. Features:

- Large tabular numbers for easy reading
- Minimal labels with proper spacing
- Subtle underline on hover
- Automatic updates every second

### NotifyForm

Email collection form with modern design. Features:

- Underline input style
- Inline button layout on desktop
- Form validation with clear error states
- Success feedback
- Ready for API integration

## Color Palette

- Background: `#0a0f0d` (Dark green-black)
- Primary Green: `#15803d`
- Accent Green: `#16a34a`
- Text: White with various opacity levels

## Typography

All text uses Montserrat font family:

- Logo: 900 weight (Extra Bold)
- Headings: 700-800 weight (Bold/Extra Bold)
- Body: 400-600 weight (Regular/Medium)
- Labels: 600 weight (Semi Bold)

## Design Principles

**Minimalism**

- Remove all unnecessary elements
- Focus on content and functionality
- Strategic use of whitespace

**Professionalism**

- Clean lines and borders
- Consistent spacing
- Subtle interactions

**Accessibility**

- High contrast ratios
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus states on all controls

**Responsiveness**

- Mobile-first approach
- Fluid typography
- Flexible layouts
- Touch-friendly targets

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## Performance

- Minimal JavaScript
- No heavy animations
- Optimized font loading
- Fast initial load
- Efficient re-renders

## License

© 2024 WastePH. All rights reserved.
