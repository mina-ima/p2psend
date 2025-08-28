import React, { useState, useEffect, ChangeEvent } from 'react';
import Peer from 'peerjs';
import './App.css';

function App() {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<{ name: string; url: string }[]>([]);

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
      conn.on('data', (data: any) => {
        // Assuming data is { file: ArrayBuffer, fileName: string, type: string }
        const { file, fileName, type } = data;
        const blob = new Blob([file], { type });
        const url = URL.createObjectURL(blob);
        setReceivedFiles((prevFiles) => [...prevFiles, { name: fileName, url }]);
        console.log('File received:', fileName);
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
       conn.on('data', (data: any) => {
        const { file, fileName, type } = data;
        const blob = new Blob([file], { type });
        const url = URL.createObjectURL(blob);
        setReceivedFiles((prevFiles) => [...prevFiles, { name: fileName, url }]);
        console.log('File received:', fileName);
      });
      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
      });
      conn.on('error', (err) => {
        console.error('Connection error:', err);
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendFile = () => {
    if (connection && selectedFile) {
      // To send a file, we need to read it as an ArrayBuffer
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result;
        if (fileData) {
          connection.send({
            file: fileData,
            fileName: selectedFile.name,
            type: selectedFile.type,
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
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
              <input type="file" onChange={handleFileChange} />
              <button onClick={sendFile} disabled={!selectedFile}>
                Send File
              </button>
            </div>
            <div>
              <h3>Received Files:</h3>
              <ul>
                {receivedFiles.map((file, index) => (
                  <li key={index}>
                    <a href={file.url} download={file.name}>
                      {file.name}
                    </a>
                  </li>
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