# Symphony

[![Symphony Demo](https://img.youtube.com/vi/SG54dt-6A14/0.jpg)](https://youtu.be/SG54dt-6A14)

Real-time multiplayer web application where players create drawings that get transformed into an AI-generated song. Built for HackWestern 11.

## Screenshots

Final results:
![image](https://github.com/user-attachments/assets/5fa060df-bac7-45b8-a42e-75451509b61b)

Admin panel that shows everyone's drawings live:
![image](https://github.com/user-attachments/assets/77d3ab4d-6caf-44bc-a244-9bab5dcfc181)

Whiteboard:
![image](https://github.com/user-attachments/assets/5ecf03fa-00cf-4a09-b5d1-00422edc8732)

## Features

- **Real-time Collaboration:** Players from different locations can play together simultaneously.
- **Drawing**: Collaborative drawing interface with multiple colors and eraser tools
- **AI Integration**: Converts player drawings into song lyrics and music using AI
- **Host Controls**: Special host interface to manage the game flow and view player drawings as they draw in real-time
- **Beautiful UI:** Intuitive interface, repsonsive design for mobile, minimalistic UI, light & dark mode.
- **Take it Home:** After playing, you can download the song, the album cover, and all the drawings.

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

## Structure

The project consists of three main components:

1. **Frontend** (`/frontend`): Next.js web application
2. **Socket Server** (`/server`): Game logic and AI integration
3. **Song Generation API** (`/song-generation-api`): Chrome extension and server for Suno integration

## Getting Started

1. Clone the repository

2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install server dependencies
cd ../server
pnpm install
```

3. Set up environment variables:

```bash
# In server/.env
OPENAI_API_KEY=your_api_key
SONG_API=your_song_api_url
```

4. Run the development servers:

```bash
# Run frontend
cd frontend
pnpm dev

# Run server
cd server
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
