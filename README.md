# WebRTC Video Call Application

A real-time peer-to-peer video calling application built with Next.js, React, TypeScript, Socket.IO, and WebRTC using Turborepo and pnpm.

## Features

- High-quality video calls (720p, 30fps)
- Multi-participant support (up to 10 users)
- Real-time chat with unread message counter
- Screen sharing (single user at a time)
- Host reconnection support after browser refresh
- Audio/video controls (mute/unmute, camera on/off)
- Resizable chat panel (300px - 800px)
- Automatic reconnection on network interruption
- Responsive grid layout

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: Next.js application for video calling
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: ESLint configurations
- `@repo/typescript-config`: Shared TypeScript configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Core Components

- **Video Call Engine**: WebRTC-based peer-to-peer video streaming
- **Signaling Server**: Socket.IO server for WebRTC connection establishment
- **Chat System**: Real-time messaging with unread tracking
- **Screen Sharing**: Controlled screen sharing with automatic conflict resolution
- **State Management**: React Context API for global state

### Technology Stack

- [Turborepo](https://turborepo.com/) - Monorepo build system
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
- [Next.js](https://nextjs.org/) 14+ - React framework
- [React](https://react.dev/) 18+ - UI library
- [TypeScript](https://www.typescriptlang.org/) 5+ - Type-safe JavaScript
- [Socket.IO](https://socket.io/) - Real-time bidirectional communication
- [WebRTC](https://webrtc.org/) - Peer-to-peer video/audio streaming
- [Material-UI](https://mui.com/) - Component library
- [Styled Components](https://styled-components.com/) - CSS-in-JS

### Utilities

This Turborepo has some additional tools already setup:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) 18.0.0 or higher
- [pnpm](https://pnpm.io/) 8.0.0 or higher
- Modern web browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)

## Getting Started

Run the following commands:

```sh
# Clone the repository
git clone https://github.com/yourusername/webrtc-video-call.git
cd webrtc-video-call

# Install dependencies
pnpm install

# Run the development server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
webrtc-video-call/
├── apps/
│   └── web/                            # Main Next.js application
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx            # Home page
│       │   │   └── room/[roomId]/      # Video call room
│       │   ├── components/
│       │   │   ├── HomePage/           # Home page component
│       │   │   ├── VideoCallPage/      # Main video call page
│       │   │   ├── Video/              # Video components
│       │   │   └── Chat/               # Chat components
│       │   ├── contexts/               # Global state management
│       │   ├── hooks/                  # Custom hooks
│       │   ├── utils/                  # Utilities
│       │   └── pages/
│       │       └── api/
│       │           └── socket.ts       # Socket.IO server
│       └── package.json
├── packages/
│   ├── ui/                             # Shared UI components
│   ├── eslint-config/                  # ESLint configurations
│   └── typescript-config/              # TypeScript configurations
├── turbo.json                          # Turborepo configuration
├── pnpm-workspace.yaml                 # pnpm workspace configuration
└── package.json                        # Root package.json
```

## Usage

### Create a Room

```sh
# Open the application
http://localhost:3000

# Click "Create New Room"
# Grant camera and microphone permissions
# Share the generated Room ID with participants
```

### Join a Room

```sh
# Open the application
http://localhost:3000

# Enter the Room ID in the input field
# Click "Join Room"
# Grant camera and microphone permissions
```

### Available Controls

- **Microphone**: Toggle mute/unmute audio
- **Camera**: Toggle video on/off
- **Screen Share**: Share your screen (only one user can share at a time)
- **Chat**: Open/close chat panel (badge shows unread count when closed)
- **End Call**: Leave the room and return to home page

## Testing Scenarios

### Basic Connection Test

```sh
# Step 1: Open app in Browser 1 (e.g., Chrome)
http://localhost:3000

# Step 2: Click "Create New Room"
# Step 3: Copy the Room ID displayed

# Step 4: Open app in Browser 2 (e.g., Firefox or Incognito)
http://localhost:3000

# Step 5: Enter the Room ID and click "Join Room"
# Expected: Both users see each other's video
```

### Chat with Unread Count Test

```sh
# Setup: Establish call with 2 users (User A and User B)

# Step 1: User A closes chat panel
# Step 2: User B sends 3 messages
# Expected: User A sees badge with "3"

# Step 3: User A opens chat
# Expected: Badge disappears (shows 0)

# Step 4: User A closes chat
# Step 5: User B sends another message
# Expected: Badge shows "1" (confirms it works consistently)
```

### Screen Sharing Test

```sh
# Setup: Establish call with 2 users

# Step 1: User A clicks screen share button
# Step 2: User A selects window/screen to share
# Expected: User B sees User A's shared screen

# Step 3: User B clicks screen share button
# Step 4: User B selects window/screen to share
# Expected: User A's screen share stops automatically
# Expected: User A sees notification "Screen sharing stopped: Another user started sharing"
# Expected: Only User B is now sharing screen
```

### Host Reconnection Test

```sh
# Setup: Browser 1 creates room, Browser 2 joins

# Step 1: Browser 1 (host) refreshes the page (F5 or Ctrl+R)
# Step 2: Grant permissions again if prompted
# Expected: Browser 1 rejoins the same room automatically
# Expected: No "room already exists" error
# Expected: Browser 2 remains connected
# Expected: Video connection re-establishes
```

### Chat Panel Resize Test

```sh
# Step 1: Open chat panel
# Step 2: Hover over left edge of chat panel
# Expected: Drag indicator icon appears

# Step 3: Click and drag left edge to the left
# Expected: Panel gets wider (maximum 800px)

# Step 4: Drag left edge to the right
# Expected: Panel gets narrower (minimum 300px)

# Step 5: Release mouse button
# Expected: Width stays at set position
```

### Multiple Participants Test

```sh
# Step 1: Create room in Browser 1
# Step 2: Join with Browser 2
# Step 3: Join with Browser 3
# Step 4: Continue up to 10 participants
# Expected: Video grid layout adjusts automatically
# Expected: All participants can see and hear each other

# Step 5: Try to join with 11th user
# Expected: Error "Room is full. Maximum 10 participants allowed."
```

### Network Interruption Test

```sh
# Setup: Establish call with 2 users

# Step 1: Open browser DevTools (F12)
# Step 2: Go to Network tab
# Step 3: Select "Offline" from throttling dropdown
# Step 4: Wait 5 seconds
# Step 5: Select "Online" from throttling dropdown
# Expected: Connection status changes to "CONNECTING" then back to "CONNECTED"
# Expected: Video/audio reconnects automatically
```

### Invalid Room ID Test

```sh
# Test 1: Short Room ID
# Step 1: Enter "abc" in Room ID field
# Step 2: Click "Join Room"
# Expected: Error "Room ID must be at least 4 characters"

# Test 2: Non-existent Room
# Step 1: Enter "NonExistentRoom123" in Room ID field
# Step 2: Click "Join Room"
# Expected: Error "Room not found"
```

### Permission Denied Test

```sh
# Step 1: Open app in incognito/private window
# Step 2: Click "Create New Room"
# Step 3: Click "Block" or "Deny" on permission prompt
# Expected: Error message "Failed to access camera/microphone"
# Expected: "Grant Permissions" button appears

# Step 4: Click "Grant Permissions" button
# Step 5: Click "Allow" on permission prompt
# Expected: App proceeds to create room normally
```

### End Call Cleanup Test

```sh
# Setup: Establish call with 2 users

# Step 1: User A sends some chat messages
# Step 2: User A clicks "End Call" button
# Expected: User A redirected to home page
# Expected: User B sees "User left" notification
# Expected: User B's video continues working

# Step 3: User A creates new room
# Expected: No leftover state from previous room
```

## Configuration

### Change Video Quality

Edit `apps/web/src/contexts/VideoCallContext4.tsx`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280, max: 1280 },    // Change width
    height: { ideal: 720, max: 720 },     // Change height
    frameRate: { ideal: 30, max: 30 },    // Change frame rate
  },
});
```

### Change Maximum Participants

Edit `apps/web/src/pages/api/socket.ts`:

```typescript
const MAX_USERS = 10; // Change to desired maximum
```

### Add TURN Server

Edit `apps/web/src/contexts/VideoCallContext4.tsx`:

```typescript
const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "your-username",
      credential: "your-password"
    }
  ],
};
```

## Troubleshooting

### No Video Displayed

```sh
# Check browser permissions
- Click lock icon in address bar
- Ensure camera/microphone are "Allowed"
- Restart browser if needed

# Check camera availability
- Close other apps using camera
- Try different browser
```

### Connection Failed

```sh
# Check network
- Verify internet connection
- Disable VPN temporarily
- Check firewall settings

# Browser console
- Press F12 to open DevTools
- Check Console tab for errors
```

### Screen Share Not Working

```sh
# Browser compatibility
- Update browser to latest version
- Chrome/Firefox/Edge recommended
- Safari has limited support

# System permissions (macOS)
- System Preferences → Security & Privacy → Screen Recording
- Allow browser access
```

### Chat Unread Count Not Updating

```sh
# Clear cache
- Press Ctrl+Shift+Delete (Windows/Linux)
- Press Cmd+Shift+Delete (macOS)
- Clear browsing data and reload page

# Verify latest version
- Pull latest code from repository
- Run: pnpm install
- Run: pnpm start
```

### Host Cannot Rejoin After Refresh

```sh
# Ensure latest code
- Verify socket.ts has fingerprint support
- Verify VideoCallContext4.tsx is updated
- Clear localStorage: localStorage.clear() in console

# If issue persists
- Delete .next folder and node_modules
- Run: pnpm install
- Run: pnpm start
```

### Turborepo Cache Issues

```sh
# Clear Turborepo cache
turbo clean

# Or with pnpm
pnpm turbo clean

# Rebuild everything
pnpm install
pnpm build
```

## Development Commands

```sh
# Install dependencies
pnpm install

# Run development server (all apps)
pnpm start

# Run specific app
pnpm --filter web dev

# Build all apps
pnpm build

# Build specific app
pnpm --filter web build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Clean Turborepo cache
pnpm turbo clean
```

## Browser Support

- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+ (limited screen sharing support)

## Key Files

- `apps/web/src/pages/api/socket.ts` - Socket.IO server and signaling logic
- `apps/web/src/contexts/VideoCallContext4.tsx` - WebRTC logic and state management
- `apps/web/src/components/VideoCallPage/VideoCallPage4.tsx` - Main video call UI
- `apps/web/src/components/Chat/ChatPanel.tsx` - Resizable chat interface
- `apps/web/src/components/Video/VideoControls.tsx` - Audio/video control buttons
- `turbo.json` - Turborepo configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration

## Useful Links

Learn more about the tools used:

- [Turborepo Documentation](https://turborepo.com/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)

## License

MIT

## Author

Manish Gondaliya

## Support

For issues and questions, please create a GitHub issue.