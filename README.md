# p2psend

A peer-to-peer file sending application that allows users to send files directly to each other without going through a central server.

## Features

- Peer-to-peer file transfer
- Simple and intuitive user interface

## Technologies Used

- **Frontend:**
  - React
  - TypeScript
  - PeerJS (for WebRTC)
- **Backend:**
  - Node.js
  - Express
  - PeerJS Server
- **Styling:**
  - CSS

## Installation and Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mina-ima/p2psend.git
    cd p2psend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the PeerJS server:**
    In a separate terminal, run the following command to start the PeerJS server.
    ```bash
    npm run server
    ```

4.  **Start the React application:**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

-   `npm start`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm test`: Launches the test runner.
-   `npm run server`: Starts the PeerJS server.