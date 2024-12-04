# Symphony

Real-time multiplayer web app where you create drawings that get transformed into music. Built for HackWestern 11.

## Demo

https://github.com/user-attachments/assets/19c79cdc-0c84-4a63-b796-d89baff4029e

## Screenshots

Final result example:
![Final result example](https://github.com/user-attachments/assets/5fa060df-bac7-45b8-a42e-75451509b61b)

Host panel that shows everyone's drawings live:
![Host panel example](https://github.com/user-attachments/assets/77d3ab4d-6caf-44bc-a244-9bab5dcfc181)

Whiteboard example:
![Whiteboard example](https://github.com/user-attachments/assets/5ecf03fa-00cf-4a09-b5d1-00422edc8732)

## Features

- **Real-time Collaboration:** Players from different locations can play together simultaneously
- **Drawing**: Collaborative drawing interface with multiple colors and eraser tools
- **AI Integration**: Converts player drawings into song lyrics and music using AI
- **Host Controls**: Special host interface to manage the game flow and view player drawings as they draw in real-time
- **Beautiful UI:** Intuitive interface, repsonsive design for mobile, minimalistic UI, light & dark mode
- **Take it Home:** After playing, you can download the song, the album cover, and all the drawings

## Architecture

![Architecture Diagram](https://github.com/user-attachments/assets/546f554e-483a-4c1f-b14e-382673fc4383)

1. **Next.js Client** (`/frontend`): Web application that players use to draw and listen to the generated music
2. **Express Websocket Server** (`/server`): Node.js server that handles game logic, AI integration, and real-time communication between players
3. **Express Server** (`/song-generation-api/server`): Server that hosts the Chrome extension for Suno integration
4. **Chrome Extension** (`/song-generation-api/extension`): Chrome extension that interacts with Suno to generate songs from lyrics (there's no official Suno API, and unofficial APIs did not work)

## Tech Stack

- **Frontend**:

  - Next.js 15 (React)
  - TailwindCSS
  - Socket.IO Client
  - Shadcn/UI Components

- **Backend**:

  - Socket Server (Node.js/TypeScript)
  - Express
  - OpenAI API Integration
  - Socket.IO

- **Extension**:
  - Chrome Extension (JavaScript)
  - WebRTC

## Future Improvements

- **Database Integration**: Store game data, drawings, and songs in a database
- **User Accounts**: Allow users to create accounts and revisit songs they've created
- **Robustness**: Improve error handling and edge case handling
- **Suno Integration**: Ideally Suno releases an official API, otherwise host the Chrome extension using a headless browser (currently uses ngrok to expose localhost as a public URL)
- **Custom Music Settings**: Allow users to vote on the genre

## Getting Started

1. Clone the repository

2. Install dependencies:

```bash
# In frontend
pnpm install

# In server
pnpm install
```

3. Set up environment variables:

```bash
# In frontend/.env
NEXT_PUBLIC_SOCKET_SERVER_URL=

# In server/.env
OPENAI_API_KEY=
SONG_API=
```

4. Run the development servers:

```bash
# In frontend
pnpm dev

# In server
pnpm dev
```

5. Either mock the song link instead of calling the song generation API, or set up the song generation API server + Chrome extension

## Game Flow

1. Players join a lobby with nicknames
2. Host starts the game
3. Players create drawings simultaneously
4. AI processes the drawings to generate lyrics
5. System creates a song from the combined lyrics
6. Players can listen to and download their creation
