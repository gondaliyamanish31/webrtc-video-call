WebRTC Video Call Application
A modern, feature-rich peer-to-peer video calling application built with Next.js, React, TypeScript, Socket.IO, and WebRTC. This application enables high-quality video calls with real-time chat, screen sharing, and seamless reconnection capabilities.

Table of Contents

Project Description
Features
Technology Stack
Prerequisites
Installation & Setup
Project Structure
Configuration
Running the Application
Usage Guide
Testing Scenarios
Troubleshooting
API Documentation
Contributing
License


Project Description
This WebRTC Video Call Application is a full-stack real-time communication platform that enables users to create or join virtual rooms for video conferencing. The application uses peer-to-peer WebRTC technology for direct video/audio streaming, ensuring low latency and high quality.
Key Capabilities:

Room-Based Communication: Users can create unique rooms or join existing ones using room IDs
Peer-to-Peer Architecture: Direct connection between users using WebRTC with STUN servers
Signaling Server: Socket.IO-based signaling for WebRTC connection establishment
Persistent Identity: Browser fingerprinting for reconnection support
Real-Time Features: Live chat alongside video calls with unread message tracking
Screen Sharing: Controlled screen sharing with automatic conflict resolution

Use Cases:

Remote team meetings and collaboration
One-on-one video consultations
Virtual classrooms and webinars
Social video hangouts
Technical support with screen sharing


Features
Video & Audio

HD Video Quality: 1280x720 resolution at 30fps
Audio Enhancement: Echo cancellation, noise suppression, and auto gain control
Multi-Participant Support: Up to 10 users per room
Dynamic Grid Layout: Automatically adjusts video layout based on participant count
Toggle Controls: Mute/unmute microphone and enable/disable camera
Connection Quality Indicators: Real-time status for each peer connection

Screen Sharing

Single Active Sharer: Only one user can share screen at a time
Automatic Takeover: New sharer automatically stops previous sharer
Windowed Mode: No forced fullscreen behavior
Cursor Visibility: Shows cursor in shared screen
Seamless Switching: Smooth transition between camera and screen share

Chat System

Resizable Panel: Drag to adjust chat width between 300px and 800px
Unread Counter: Accurate badge showing unread message count
Sender Identification: Clear display of who sent each message
Message Bubbles: Professional chat UI with proper alignment
Color-Coded Users: Unique avatar colors for each participant
Timestamps: All messages display send time
Date Dividers: Automatic date separators for multi-day conversations
Auto-Scroll: Automatically scrolls to latest message

Reconnection & Reliability

Host Rejoining: Room creator can refresh browser and reconnect
Fingerprint System: Persistent browser-based user identification
Auto-Reconnect: Automatic reconnection on socket disconnect
ICE Candidate Buffering: Handles timing issues in peer connection setup
Connection Recovery: Attempts to recover disconnected peer connections
State Management: Maintains room state during reconnections

User Experience

Responsive Design: Works on desktop and tablet devices
Permission Handling: Clear prompts for camera/microphone access
Error Messages: User-friendly error notifications
Loading States: Visual feedback during initialization
Keyboard Shortcuts: Enter to send messages, etc.
Visual Indicators: Connection status, participant count, screen sharing status


Technology Stack
Frontend

Next.js 14+: React framework with App Router
React 18+: UI library with hooks
TypeScript 5+: Type-safe JavaScript
Material-UI (MUI): Component library for UI
Styled Components: CSS-in-JS styling
React Hook Form: Form validation and handling

Backend

Node.js: JavaScript runtime
Socket.IO: Real-time bidirectional communication
Next.js API Routes: Serverless API endpoints

WebRTC & Networking

WebRTC: Peer-to-peer video/audio streaming
STUN Servers: Google's public STUN servers
Socket.IO: WebRTC signaling protocol

Development Tools

ESLint: Code linting
Prettier: Code formatting
TypeScript: Type checking


Prerequisites
Before you begin, ensure you have the following installed:
Required

Node.js: Version 18.0.0 or higher
npm: Version 9.0.0 or higher (comes with Node.js)
Git: For cloning the repository

Optional

Yarn or pnpm: Alternative package managers
VS Code: Recommended IDE with extensions:

ESLint
Prettier
TypeScript and JavaScript Language Features



System Requirements

Operating System: Windows 10+, macOS 10.15+, or Linux
RAM: Minimum 4GB (8GB recommended)
Browser: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
Network: Stable internet connection (recommended 5+ Mbps)

Browser Permissions

Camera access permission
Microphone access permission
Screen sharing permission (for screen share feature)


Installation & Setup
Step 1: Clone the Repository
bashgit clone https://github.com/yourusername/webrtc-video-call.git
cd webrtc-video-call
Step 2: Install Dependencies
Using npm:
bashnpm install
Using yarn:
bashyarn install
Using pnpm:
bashpnpm install
Step 3: Environment Setup
Create a .env.local file in the root directory:
bashtouch .env.local
Add the following environment variables:
env# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Socket.IO (optional - uses defaults if not set)
NEXT_PUBLIC_SOCKET_PATH=/api/socket

# STUN/TURN Servers (optional - uses Google's STUN by default)
NEXT_PUBLIC_STUN_SERVER_1=stun:stun.l.google.com:19302
NEXT_PUBLIC_STUN_SERVER_2=stun:stun1.l.google.com:19302
Step 4: Build the Application
For development:
bashnpm run dev
For production:
bashnpm run build
npm run start

Project Structure
webrtc-video-call/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home page
│   │   ├── room/
│   │   │   └── [roomId]/
│   │   │       └── page.tsx         # Video call room page
│   │   └── layout.tsx               # Root layout
│   ├── components/
│   │   ├── HomePage/
│   │   │   └── HomePage.tsx         # Home page component
│   │   ├── VideoCallPage/
│   │   │   └── VideoCallPage4.tsx   # Main video call page
│   │   ├── Video/
│   │   │   ├── LocalVideo.tsx       # Local video display
│   │   │   ├── RemoteVideo.tsx      # Remote video display
│   │   │   ├── VideoControls.tsx    # Control buttons
│   │   │   └── RoomInfo.tsx         # Room information display
│   │   ├── Chat/
│   │   │   └── ChatPanel.tsx        # Resizable chat panel
│   │   └── common/
│   │       └── CopyButton.tsx       # Copy to clipboard button
│   ├── contexts/
│   │   └── VideoCallContext4.tsx    # Global video call state
│   ├── hooks/
│   │   └── useMediaStream.ts        # Custom hook for media streams
│   ├── utils/
│   │   ├── constants.ts             # App constants
│   │   └── roomId.ts                # Room ID utilities
│   └── pages/
│       └── api/
│           └── socket.ts            # Socket.IO server handler
├── public/                          # Static assets
├── .env.local                       # Environment variables
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── next.config.js                   # Next.js configuration
└── README.md                        # This file

Configuration
WebRTC Configuration
Edit src/contexts/VideoCallContext4.tsx to customize WebRTC settings:
typescriptconst STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers if needed:
    // {
    //   urls: "turn:your-turn-server.com:3478",
    //   username: "username",
    //   credential: "password"
    // }
  ],
  iceCandidatePoolSize: 10,
};
Media Constraints
Customize video/audio quality in requestPermissions():
typescriptconst stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
    facingMode: "user",
    frameRate: { ideal: 30, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});
Room Settings
Edit src/pages/api/socket.ts to change room limits:
typescriptconst MAX_USERS = 10; // Change maximum participants per room

Running the Application
Development Mode
Start the development server:
bashnpm run dev
The application will be available at:

Local: http://localhost:3000
Network: http://YOUR_IP:3000 (accessible from other devices on same network)

Production Mode
Build and start the production server:
bashnpm run build
npm run start
Using Different Ports
To run on a different port:
bashPORT=8080 npm run dev
Network Testing
To test across different devices on the same network:

Find your local IP address:

Windows: ipconfig
Mac/Linux: ifconfig or ip addr


Access the app from another device using: http://YOUR_IP:3000


Usage Guide
Creating a Room

Open the application in your browser
Click the "Create New Room" button
A unique Room ID will be generated automatically
Grant camera and microphone permissions when prompted
Share the Room ID with participants
Wait for participants to join

Joining a Room

Open the application in your browser
Enter the Room ID in the "Join Existing Room" input field
Click the "Join Room" button
Grant camera and microphone permissions when prompted
You will be connected to the room

Video Call Controls
Microphone Toggle

Click the microphone icon to mute/unmute
Red background indicates muted

Camera Toggle

Click the camera icon to turn video on/off
Red background indicates camera off

Screen Share

Click the screen share icon
Select which screen/window to share
If someone else is sharing, their share will stop
Click again to stop sharing

Chat

Click the chat icon to open chat panel
Drag left edge to resize panel width
Type message and press Enter or click send button
Badge shows unread message count when chat is closed

End Call

Click the red phone icon to leave the room
You will be redirected to the home page

Reconnecting After Refresh
For Room Creator:

If you accidentally refresh the browser
The app will automatically detect you as the creator
You will rejoin the same room without errors
Other participants remain connected

For Participants:

Refresh the browser
You will be reconnected to the same room
Your video/audio settings are preserved


Testing Scenarios
Test Scenario 1: Basic Room Creation and Joining
Objective: Verify basic room creation and participant joining functionality.
Steps:

Open the application in Browser 1
Click "Create New Room"
Grant camera/microphone permissions
Note the generated Room ID
Open the application in Browser 2 (incognito or different browser)
Enter the Room ID from step 4
Click "Join Room"
Grant camera/microphone permissions in Browser 2

Expected Results:

Browser 1 creates room successfully
Room ID is displayed and can be copied
Browser 2 joins the room without errors
Both users see each other's video
Connection status shows "CONNECTED"
Participant count shows "2 Participants"


Test Scenario 2: Audio/Video Controls
Objective: Test microphone and camera toggle functionality.
Steps:

Establish a call with 2 participants
In Browser 1, click the microphone icon
Observe the icon changes to muted state (red background)
In Browser 2, verify audio is not heard
In Browser 1, click microphone icon again
In Browser 1, click camera icon
Observe video feed stops showing
In Browser 2, verify video shows "Camera Off" placeholder
In Browser 1, click camera icon again

Expected Results:

Microphone mutes/unmutes correctly
Visual indicator (red background) appears when muted
Other participant cannot hear muted audio
Camera turns off/on correctly
"Camera Off" placeholder shown when camera disabled
Controls respond immediately without lag


Test Scenario 3: Screen Sharing (Single User)
Objective: Verify screen sharing works and only one user can share at a time.
Steps:

Establish a call with 2 participants (User A and User B)
User A clicks the screen share button
User A selects a window/screen to share
Observe User B sees User A's screen
User B clicks the screen share button
User B selects a window/screen to share
Observe User A's screen share automatically stops
Observe User A sees notification about forced stop
User B clicks screen share button again to stop

Expected Results:

User A successfully shares screen
User B sees shared screen clearly
When User B starts sharing, User A's share stops automatically
User A receives notification: "Screen sharing stopped: Another user started sharing"
Only one user can share at any time
"SHARING SCREEN" chip appears in header for active sharer
Stopping screen share returns to camera view


Test Scenario 4: Real-Time Chat with Unread Count
Objective: Test chat functionality and unread message counter.
Setup: Two users (User A and User B) in a call.
Steps:

User A closes the chat panel (if open)
User B sends message: "Hello"
Observe User A's chat icon shows badge with "1"
User B sends message: "How are you?"
Observe User A's chat icon badge updates to "2"
User A opens chat panel
Observe badge disappears (shows 0)
User A closes chat panel
Observe badge still shows 0 (no unread)
User B sends message: "Test message"
Observe badge shows "1"
User A opens chat and sends reply: "Got it"
User A closes chat
User B sends another message
Observe badge increments again

Expected Results:

Badge appears when message received and chat is closed
Badge count increments for each new message
Badge disappears (shows 0) when chat is opened
Badge resets correctly after closing chat
Unread count works consistently every time (not just first time)
User's own messages don't increment unread count
All messages show sender name correctly
Messages from others show their user ID (e.g., "User Q5uo8h")
Own messages show "You" as sender


Test Scenario 5: Chat Panel Resizing
Objective: Test resizable chat panel functionality.
Steps:

Open chat panel
Observe default width (approximately 380px)
Hover over the left edge of chat panel
Observe drag indicator icon appears
Click and drag left edge to the left
Observe panel gets wider
Try to drag beyond maximum width (800px)
Observe panel stops at 800px
Drag left edge to the right
Observe panel gets narrower
Try to drag below minimum width (300px)
Observe panel stops at 300px
Release mouse button
Observe width stays at set position

Expected Results:

Default width is 380px
Drag handle visible on hover (vertical line with icon)
Panel width changes smoothly during drag
Minimum width enforced at 300px
Maximum width enforced at 800px
Width persists after mouse release
No layout issues during resize
Messages remain properly formatted at all widths


Test Scenario 6: Host Reconnection After Browser Refresh
Objective: Verify room creator can refresh browser and rejoin room.
Setup:

Browser 1: Room Creator
Browser 2: Participant

Steps:

Browser 1 creates a room (note Room ID)
Browser 2 joins the room
Establish video connection between both
Browser 1 refreshes the page (F5 or Ctrl+R)
Grant permissions again if prompted
Observe Browser 1 rejoins automatically
Observe Browser 2 remains connected
Verify video/audio works between both users
Browser 2 sends a chat message
Verify Browser 1 receives the message

Expected Results:

Browser 1 refreshes without error
No "room already exists" error appears
Browser 1 automatically rejoins the same room
Room ID remains the same
Browser 2 sees reconnection (may briefly disconnect)
Video connection re-establishes
Chat history is cleared (expected behavior)
New messages work correctly
Participant count remains accurate


Test Scenario 7: Participant Reconnection After Network Interruption
Objective: Test automatic reconnection on network issues.
Steps:

Establish call with 2 users
On one user, open browser DevTools
Go to Network tab
Select "Offline" to simulate network loss
Wait 5 seconds
Select "Online" to restore network
Observe reconnection behavior
Test video/audio functionality
Test chat functionality

Expected Results:

Connection status changes to "CONNECTING" when offline
Socket automatically attempts reconnection
Connection re-establishes within a few seconds
Video/audio may briefly disconnect then reconnect
Chat continues working after reconnection
No data loss for active streams
User remains in same room


Test Scenario 8: Multiple Participants (3-10 Users)
Objective: Test scalability with multiple participants.
Steps:

Create room in Browser 1
Join with Browser 2
Join with Browser 3
Continue up to desired number (max 10)
Observe video grid layout changes
Test audio/video with all participants
Test chat with multiple senders
Test screen sharing with multiple users
Have one user leave
Observe grid adjusts

Expected Results:

Up to 10 participants can join
11th participant receives "room full" error
Video grid adjusts layout automatically:

1 user: Full width
2 users: Half screen each
3-4 users: Quarter screen grid
5-9 users: 3-column grid
10 users: 4-column grid


All participants see all others
Audio mixing works (can hear multiple people)
Chat messages from all users display correctly
Participant panel shows all users
Performance remains acceptable


Test Scenario 9: Error Handling - Invalid Room ID
Objective: Test application behavior with invalid room IDs.
Steps:

Open application
Enter room ID: "abc" (too short - min 4 chars)
Click "Join Room"
Observe error message
Enter room ID: "NonExistentRoom123"
Click "Join Room"
Observe error message
Enter room ID with special characters: "room!@#$"
Click "Join Room"
Observe error message

Expected Results:

Room IDs under 4 characters rejected with error
Non-existent rooms show clear error: "Room not found"
Invalid characters show validation error
User remains on home page after errors
Error messages are user-friendly
No application crashes
Can retry with valid room ID


Test Scenario 10: Permission Denied Handling
Objective: Test behavior when camera/microphone access denied.
Steps:

Open application in fresh browser/incognito
Click "Create New Room"
When browser prompts for permissions, click "Block" or "Deny"
Observe error handling
Clear site permissions in browser settings
Return to application
Click "Grant Permissions" button
This time, click "Allow" on permission prompt

Expected Results:

Clear error message when permissions denied
Error message: "Failed to access camera/microphone. Please grant permissions."
Application doesn't crash
"Grant Permissions" button appears
Clicking button re-prompts for permissions
After granting, user can proceed normally
Permissions persist across sessions (unless cleared)


Test Scenario 11: End Call Cleanup
Objective: Verify proper cleanup when ending call.
Steps:

Establish call with 2 users
Send some chat messages
Turn on screen sharing
User A clicks "End Call" button
Observe User A redirected to home page
Observe User B sees "User left" notification
User B's video continues working
Create new room and verify no leftover state

Expected Results:

User clicking "End Call" immediately leaves room
Redirected to home page
Other participants notified of departure
Video/audio streams properly stopped
Peer connections closed
Socket connection cleaned up
No memory leaks
Can create/join new room without issues
Previous room data not carried over


Test Scenario 12: Browser Compatibility
Objective: Test application across different browsers.
Browsers to Test:

Google Chrome (latest)
Mozilla Firefox (latest)
Microsoft Edge (latest)
Safari (macOS only)
Brave Browser

Steps (repeat for each browser):

Open application
Create room
Grant permissions
Join from different browser
Test video/audio
Test screen sharing
Test chat
Test all controls

Expected Results:

Application loads in all modern browsers
WebRTC features work consistently
UI renders correctly
Performance is acceptable
Screen sharing works (except Safari with limitations)
Chat and controls function properly
Note: Safari may have some WebRTC limitations


Test Scenario 13: Mobile Device Testing
Objective: Test on mobile devices and tablets.
Devices to Test:

iOS Safari (iPhone/iPad)
Android Chrome
Android Firefox

Steps:

Access application from mobile browser
Create or join room
Test video in portrait and landscape
Test touch controls
Test chat on mobile
Test screen rotation
Test background/foreground switching

Expected Results:

Responsive layout on mobile screens
Video grid adjusts for mobile viewport
Touch controls work smoothly
Chat panel usable on mobile
Orientation changes handled gracefully
App continues when returning from background
Performance acceptable on mobile devices
Note: Screen sharing may not work on iOS Safari


Test Scenario 14: Long-Duration Call Stability
Objective: Test application stability over extended period.
Steps:

Start video call with 2-3 participants
Leave call running for 30 minutes
Periodically send chat messages
Monitor connection status
Test controls intermittently
Check browser memory usage
Test screen sharing multiple times
Continue call for 1 hour total

Expected Results:

Connection remains stable
No memory leaks (check browser task manager)
Video/audio quality maintained
Chat continues working
No unexpected disconnections
Controls remain responsive
Application doesn't slow down over time
Socket connection stays alive


Test Scenario 15: Concurrent Rooms
Objective: Test multiple independent rooms simultaneously.
Steps:

Create Room A (Browser 1)
Join Room A (Browser 2)
Create Room B (Browser 3)
Join Room B (Browser 4)
Verify both rooms independent
Test all features in both rooms
Verify no cross-room interference

Expected Results:

Multiple rooms operate independently
Users in Room A don't see Room B users
Chat messages don't leak between rooms
Each room maintains its own state
No performance degradation
Server handles multiple rooms correctly
Room cleanup happens independently


Troubleshooting
Issue: No Video Displayed
Symptoms: Black screen or "Camera Off" displayed
Solutions:

Check browser permissions

Click the lock icon in address bar
Ensure camera/microphone are allowed


Check camera not in use by another application
Try different browser
Restart browser
Check camera drivers are installed

Issue: No Audio
Symptoms: Cannot hear other participants or they cannot hear you
Solutions:

Check microphone not muted in system settings
Verify correct microphone selected in browser
Check audio output device
Try toggling microphone off/on in app
Restart browser
Check system volume levels

Issue: Connection Failed
Symptoms: "Connection Failed" status or unable to connect
Solutions:

Check internet connection
Disable VPN temporarily
Check firewall settings (allow WebRTC)
Try different network
Use TURN server if behind strict firewall
Check browser console for errors

Issue: Screen Share Not Working
Symptoms: Screen share button not responding or error appears
Solutions:

Check browser supports screen sharing
Grant screen recording permission (macOS)
Try different screen/window selection
Restart browser
Update browser to latest version
Check system permissions

Issue: High CPU/Memory Usage
Symptoms: Browser becomes slow or hot
Solutions:

Reduce number of participants
Lower video quality in code
Close other browser tabs
Use hardware acceleration
Update browser
Check for browser extensions interfering

Issue: Chat Messages Not Appearing
Symptoms: Messages sent but not received
Solutions:

Check internet connection
Verify socket connection status
Try refreshing page
Check browser console for errors
Ensure both users in same room

Issue: Unread Count Not Updating
Symptoms: Badge not showing correct count
Solutions:

This has been fixed in latest version
Clear browser cache
Refresh the page
Update to latest code version

Issue: Room Creator Cannot Rejoin
Symptoms: "Room already exists" error after refresh
Solutions:

This has been fixed in latest version
Clear browser localStorage
Use updated socket.ts with fingerprint support
Update VideoCallContext4.tsx to latest version


API Documentation
Socket.IO Events
Client → Server Events
create-room
typescriptsocket.emit('create-room', roomId: string, fingerprint?: string)
Creates a new room with specified room ID and optional fingerprint for reconnection.
join-room
typescriptsocket.emit('join-room', roomId: string, fingerprint?: string)
Joins an existing room with specified room ID.
leave-room
typescriptsocket.emit('leave-room', roomId: string)
Leaves the specified room.
offer
typescriptsocket.emit('offer', {
  offer: RTCSessionDescriptionInit,
  to: string
})
Sends WebRTC offer to specific peer.
answer
typescriptsocket.emit('answer', {
  answer: RTCSessionDescriptionInit,
  to: string
})
Sends WebRTC answer to specific peer.
ice-candidate
typescriptsocket.emit('ice-candidate', {
  candidate: RTCIceCandidate,
  to: string
})
Sends ICE candidate to specific peer.
chat-message
typescriptsocket.emit('chat-message', {
  roomId: string,
  message: string,
  senderName: string
})
Sends chat message to all users in room.
screen-share-started
typescriptsocket.emit('screen-share-started', { roomId: string })
Notifies room that user started screen sharing.
screen-share-stopped
typescriptsocket.emit('screen-share-stopped', { roomId: string })
Notifies room that user stopped screen sharing.
Server → Client Events
room-created
typescriptsocket.on('room-created', {
  roomId: string,
  userId: string,
  isCreator: boolean
})
Confirms room creation.
room-joined
typescriptsocket.on('room-joined', {
  roomId: string,
  userId: string,
  existingUsers: string[],
  roomStats: object,
  isCreator: boolean
})
Confirms successful room join with existing users list
