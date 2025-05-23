# BRIDGE - Belgian Administration Guide

A modern mobile-first Progressive Web App (PWA) designed to help Polish seasonal workers navigate Belgian administrative processes.

## Features

- **Personalized Guidance**: Customized task lists based on user circumstances
- **Bilingual Support**: Polish and English interfaces
- **Progress Tracking**: Mark tasks as complete and track overall progress
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Offline Storage**: Data saved locally for privacy and offline access
- **PWA Ready**: Can be installed as a native app on mobile devices

## Administrative Tasks Covered

The app helps users complete essential Belgian administrative tasks:

1. **LIMOSA Registration** - Mandatory seasonal work declaration
2. **Municipal Registration** - Required for stays longer than 6 months
3. **Health Insurance** - Essential healthcare coverage enrollment
4. **Bank Account** - Opening a Belgian bank account
5. **Tax Number** - Tax registration for longer stays
6. **Emergency Contact** - Safety contact setup

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **PWA Ready** - Progressive Web App capabilities

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bridge-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
bridge-app/
├── app/
│   ├── components/
│   │   └── BridgeApp.tsx     # Main application component
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icons/               # App icons
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── package.json
```

## Key Components

### BridgeApp Component

The main application component includes:
- **Welcome Screen**: Language selection and introduction
- **Questions Flow**: 5-step intake questionnaire
- **Checklist Screen**: Personalized task management

### Data Management

- **Local Storage**: All user data stored locally for privacy
- **TypeScript Interfaces**: Strongly typed data structures
- **State Management**: React hooks for application state

## Customization

### Adding New Languages

1. Add language code to the `Language` type in `BridgeApp.tsx`
2. Add translations to the `translations` object
3. Update the language selector options

### Adding New Tasks

1. Add task definition to the `tasks` object in translations
2. Update the `generatePersonalizedTasks` function logic
3. Add corresponding icon to the `getIconComponent` function

### Styling

The app uses Tailwind CSS with a custom blue color palette. Main colors:
- Primary: `blue-900` (#1e3a8a)
- Secondary: `blue-800` (#1e40af)
- Accent: `blue-600` (#2563eb)

## PWA Features

The app includes Progressive Web App capabilities:
- **Installable**: Can be added to home screen
- **Responsive**: Works on all device sizes
- **Fast Loading**: Optimized performance
- **Offline Ready**: Core functionality works without internet

## Deployment

### Vercel (Recommended)

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically with zero configuration

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Development Notes

### TypeScript

The app is fully typed with TypeScript interfaces for:
- User profiles and questionnaire data
- Translation objects and language support
- Component props and state management

### Mobile Optimization

- Touch-friendly interface with large tap targets
- Smooth animations and transitions
- Fixed bottom navigation for easy thumb access
- Responsive design for various screen sizes

### Privacy & Security

- No server-side data storage
- All user data remains on device
- GDPR compliant by design
- No external tracking or analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add TypeScript types for new features
5. Test on mobile devices
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the GitHub repository.
