# Spotify-Downloader

<p align="center">
  <img src="frontend/public/logo.svg" alt="Logo" width="160"/>
</p>

<p align="center">
  <!-- Version Badges -->
  <img src="https://img.shields.io/badge/node.js-18%2B-green" alt="Node.js"/>
  <img src="https://img.shields.io/badge/npm-9%2B-blue" alt="npm"/>
  <!-- Technology Badges -->
  <img src="https://img.shields.io/badge/Express-4.x-lightgrey?logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/Socket.io-4.x-lightgrey?logo=socket.io" alt="Socket.io"/>
  <img src="https://img.shields.io/badge/React-18.x-blue?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-4.x-purple?logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss" alt="TailwindCSS"/>
</p>

## Demo Video

[Watch the demo video](https://drive.google.com/file/d/1dvNQZKL6-51E14BLlShv6K64vo9jhOTl/view?usp=sharing)

## Description

Spotify-Downloader is a web application that enables users to download tracks from Spotify playlists as MP3 files. You can log in with your Spotify account to access your playlists, or paste a public playlist URL. The app fetches playlist tracks and provides easy download options, including real-time progress updates.

**Key Features:**

- Login with Spotify or paste playlist URL
- Browse and select tracks
- Download tracks as MP3 or ZIP
- Real-time download progress

**Purpose:**  
Makes it easy to download Spotify playlist tracks for offline use, solving the hassle of accessing favorite music without an internet connection.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [License](#license)

---

## Installation

### Prerequisites

- Node.js (v18+)
- npm

### Step-by-step Instructions

```bash
git clone https://github.com/yourusername/Spotify-Downloader.git
cd Spotify-Downloader

# Backend setup
cd backend
npm install
npm run server

# Frontend setup
cd ../frontend
npm install
npm run dev
```

---

## Usage

1. **Login with Spotify:**  
   Authenticate to access your playlists.

2. **Paste Playlist URL:**  
   Enter a public Spotify playlist URL.

3. **Download:**  
   Select tracks and download as MP3 or ZIP.

## Screenshots

![Login Mode](frontend/public/img1.png)
![URL Mode](frontend/public/img2.png)
![Playlist Page](frontend/public/img3.png)
![Tracks Page](frontend/public/img4.png)
![Download Page](frontend/public/img5.png)

---

## Configuration

- **Environment Variables:**

  - `backend/.env`:
    - `SPOTIFY_CLIENT_ID`
    - `SPOTIFY_CLIENT_SECRET`
    - `SPOTIFY_REDIRECT_URI`
    - `VITE_FRONTEND_URL`
    - `PORT`
  - `frontend/.env`:
    - `VITE_BACKEND_URL`

- **Config Files:**
  - `backend/.env`
  - `frontend/.env`

---

## API Reference

- `GET /api/playlist`  
  Fetch playlist information from a Spotify URL.

- `GET /api/stream`  
  Stream and download individual tracks (uses Socket.io for progress).

- `POST /api/download-zip`  
  Download selected tracks as a ZIP file.

- `POST /api/auth`  
  Spotify authentication (login, callback, etc.).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
