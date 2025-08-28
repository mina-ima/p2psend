import React, { useState, useEffect } from 'react';
import Peer from 'peerjs';
import './App.css';

function App() {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  useEffect(() => {
    const newPeer = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/peerjs',
      debug: 3,
    });

    newPeer.on('open', (id) => {
      setMyId(id);
      console.log('My peer ID is:', id);
    });

    newPeer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      setConnection(conn);
      conn.on('data', (data) => {
        console.log('Received:', data);
        setReceivedMessages((prevMessages) => [...prevMessages, data as string]);
      });
      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);

    return () => {
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, []);

  const connectToPeer = () => {
    if (peer && remoteId) {
      const conn = peer.connect(remoteId);
      setConnection(conn);
      conn.on('data', (data) => {
        console.log('Received:', data);
        setReceivedMessages((prevMessages) => [...prevMessages, data as string]);
      });
      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
      });
      conn.on('error', (err) => {
        console.error('Connection error:', err);
      });
    }
  };

  const sendMessage = () => {
    if (connection && message) {
      connection.send(message);
      setMessage('');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>P2P Send</h1>
        <p>My ID: {myId}</p>
        <div>
          <input
            type="text"
            placeholder="Remote Peer ID"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
          />
          <button onClick={connectToPeer}>Connect</button>
        </div>
        {connection && (
          <div>
            <p>Connected to: {connection.peer}</p>
            <div>
              <input
                type="text"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
            <div>
              <h3>Received Messages:</h3>
              <ul>
                {receivedMessages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
