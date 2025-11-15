# Rivian Dash Cam Dashboard

A modern, responsive dashboard for viewing and analyzing Rivian dash cam footage with driving session data, multi-angle video playback, and violation tracking.

## Features

### 🚗 Multi-Camera Video Playback
- **4-Camera Layout**: Front Left, Front Center, Front Right, and Rear cameras
- **Synchronized Playback**: All cameras play simultaneously with unified controls
- **Focus Mode**: Click any camera to view it in full screen with easy exit
- **Vehicle-Layout Design**: Cameras positioned to match actual vehicle setup

### 📊 Drive Analysis
- **Session Selection**: Browse and select from multiple driving sessions
- **Real-time Score**: Circular score badge with color-coded performance indicators
- **Violation Detection**: Colored badges showing detected violations with severity levels
- **Timeline View**: Vertical timeline showing drive start, violations, and end events

### 🎛️ Interactive Timeline
- **Event Tracking**: Visual timeline of all driving events
- **Violation Details**: Click violations to see speed, GPS coordinates, and severity
- **Time Navigation**: Scrub through timeline to navigate video playback
- **Event Types**: Drive start/end, speeding, harsh braking, lane departure, etc.

### 🎨 Modern UI
- **Dark/Light Mode**: Automatic theme detection with system preferences
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: Polished transitions and hover effects
- **Accessibility**: Keyboard navigation and screen reader support

## Project Structure

```
app/
├── dashboard/
│   └── page.tsx           # Main dashboard page
├── globals.css            # Global styles and custom CSS
├── layout.tsx             # Root layout
└── page.tsx               # Home page (redirects to dashboard)

components/
├── ui/                    # shadcn/ui components
├── session-sidebar.tsx    # Left sidebar for session selection
├── video-player.tsx       # Multi-camera video player
├── driving-timeline.tsx   # Right timeline panel
└── score-badge.tsx        # Score and violation badges

types/
└── driving.ts            # TypeScript interfaces for driving data
```

## API Integration

The dashboard expects the following API endpoints:

### Get All Driving Sessions
```
GET /api/drives
Response: [
  {
    "id": "string",
    "start_time": "ISO 8601 timestamp",
    "end_time": "ISO 8601 timestamp"
  }
]
```

### Get Drive Session Details
```
GET /api/drive/{id}
Response: {
  "id": "string",
  "start_time": "ISO 8601 timestamp", 
  "end_time": "ISO 8601 timestamp",
  "score": number (0-100),
  "timeline": [
    {
      "timestamp": "ISO 8601 timestamp",
      "latitude": number,
      "longitude": number,
      "speed": number,
      "detected_violation": "string | null"
    }
  ]
}
```

## Video File Structure

Videos should be organized in the following structure:
```
public/videos/
├── session-1/
│   ├── front-center.mp4
│   ├── front-left.mp4
│   ├── front-right.mp4
│   └── rear.mp4
├── session-2/
│   └── ... (same structure)
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Dashboard**
   Navigate to `http://localhost:3000`

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

## Violation Types

The system supports various violation types with severity levels:

| Violation | Severity | Description |
|-----------|----------|-------------|
| Speeding | High | Exceeding speed limit |
| Harsh Braking | Medium | Sudden deceleration |
| Rapid Acceleration | Medium | Aggressive acceleration |
| Lane Departure | Low | Unintended lane change |
| Tailgating | High | Following too closely |

## Scoring System

Drive scores are calculated based on:
- **90-100**: Excellent (Green) - Clean driving, no violations
- **75-89**: Good (Yellow) - Minor violations only  
- **0-74**: Needs Improvement (Red) - Multiple or severe violations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

To add new features or modify existing ones:

1. **Add New Components**: Create in `components/` directory
2. **Update Types**: Modify `types/driving.ts` for new data structures
3. **Styling**: Use Tailwind classes or add to `globals.css`
4. **Icons**: Use Lucide React for consistent iconography

## Performance Considerations

- Videos are lazy-loaded to improve initial page load
- Timeline events are virtualized for large datasets
- Components use React.memo for optimal re-rendering
- Images and videos should be optimized for web delivery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details