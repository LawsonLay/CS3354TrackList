# TrackList

TrackList is a social media web application that allows users to search for songs from Last.fm, rate them, and leave comments. Users can see all or a personalized feed of ratings and user-made posts on the site. They can follow other users, see popular posts, follow different communities by #s, and interact with them as expected of a modern social media.

## Features

- **Search Songs**: Search for songs using the Last.fm API.
- **Rate Songs**: Rate songs using a star rating system.
- **Leave Comments**: Leave comments on songs and posts.
- **View Reviews**: View all reviews and ratings for songs.
- **Make Posts**: Make general or targeted # posts.
- **Follow individuals or hashtags**: Personalized feed based on following, hashtags, and reviews.
- **Post Moderation**: Able to block banned posts and terms in real time.

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase Firestore
- **Build Tool**: Vite
- **Linting**: ESLint
- **Testing**: Vitest, React Testing Library

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase Dev Keys
- Last.FM API Key

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/CS3354TrackList.git
    cd CS3354TrackList
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Provide keys in .env

4. Install blockterm dependencies in the functions folder
   ```sh
    cd functions
    npm install
    ```

### Running the Application

1. Start the development server:
    ```sh
    npm run dev
    ```
    
2. Start the blockterm firebase emulator in functions folder:
    ```sh
    firebase emulators:start
    ```

3. Open your browser and navigate to `http://localhost:3000`.

### Running Tests

To run tests, use the following command:
```sh
npm run test
```

## Project Structure

- `src/`: Contains the source code for the application.
  - `App.jsx`: Main application component.
  - `Star.jsx`: Component for star rating.
  - `ReviewPage.jsx`: Component to display reviews.
  - `firebaseConfig.js`: Firebase configuration.
  - `index.css`: Global styles.
  - `main.jsx`: Entry point for the React application.
- `public/`: Contains static assets.
- `tailwind.config.js`: Tailwind CSS configuration.
- `eslint.config.js`: ESLint configuration.
- `package.json`: Project metadata and dependencies.

## Acknowledgements

- [Last.fm API](https://www.last.fm/api)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
