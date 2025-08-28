import React, { useState, useEffect, ChangeEvent } from 'react';
import Peer from 'peerjs';
import { QRCodeCanvas } from 'qrcode.react'; // Corrected import
import { Scanner } from '@yudiel/react-qr-scanner';
import './App.css';

function App() {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<{ name: string; url: string }[]>([]);
  const [notification, setNotification] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const newPeer = new Peer({
      host: window.location.hostname,
      port: 9000,
      path: '/peerjs',
      debug: 3,
    });

    newPeer.on('open', (id) => {
      setMyId(id);
      console.log('My peer ID is:', id);
    });

    const handleNewConnection = (conn: any) => {
      console.log('Incoming connection from:', conn.peer);
      setConnection(conn);
      conn.on('data', (data: any) => {
        const { file, fileName, type } = data;
        const blob = new Blob([file], { type });
        const url = URL.createObjectURL(blob);
        setReceivedFiles((prevFiles) => [...prevFiles, { name: fileName, url }]);
        setNotification(`File received: ${fileName}`);
        setTimeout(() => setNotification(''), 3000); // Notification disappears after 3 seconds
        console.log('File received:', fileName);
      });
      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
      });
    };

    newPeer.on('connection', handleNewConnection);

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
        setNotification(`File received: ${fileName}`);
        setTimeout(() => setNotification(''), 3000);
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

  const handleScan = (result: any) => {
    if (result) {
      setScanResult(result.text);
      setRemoteId(result.text); // Automatically set remoteId from scan
      console.log('QR Code Scanned:', result.text);
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>P2P Send</h1>
        {notification && <div className="notification">{notification}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '800px', margin: '20px 0' }}>
          <div style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '8px', margin: '0 10px' }}>
            <h2>My ID (Share this QR)</h2>
            <p>My ID: <strong>{myId}</strong></p>
            {myId && (
              <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                <QRCodeCanvas value={myId} size={128} level="H" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '8px', margin: '0 10px' }}>
            <h2>Scan Remote ID</h2>
            <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{ facingMode: 'environment' }}
                styles={{ container: { width: '100%', height: 'auto' }, video: { width: '100%', height: 'auto' } }}
              />
            </div>
            {scanResult && <p>Scanned ID: <strong>{scanResult}</strong></p>}
          </div>
        </div>

        {!connection && (
          <div style={{ marginTop: '20px' }}>
            <input
              type="text"
              placeholder="Enter Remote Peer ID manually"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              style={{ padding: '8px', marginRight: '10px', width: '250px' }}
            />
            <button onClick={connectToPeer} disabled={!peer || !remoteId} style={{ padding: '8px 15px' }}>
              Connect
            </button>
          </div>
        )}

        {connection && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', width: '100%', maxWidth: '800px' }}>
            <h2>Connected to: {connection.peer}</h2>
            <div>
              <input type="file" onChange={handleFileChange} style={{ marginRight: '10px' }} />
              <button onClick={sendFile} disabled={!selectedFile} style={{ padding: '8px 15px' }}>
                Send File
              </button>
            </div>
            <div style={{ marginTop: '20px' }}>
              <h3>Received Files:</h3>
              <ul>
                {receivedFiles.map((file, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    <a href={file.url} download={file.name} style={{ color: '#61dafb', textDecoration: 'none' }}>
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