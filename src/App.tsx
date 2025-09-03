import React, { useState, useEffect, ChangeEvent } from 'react';
import Peer, { PeerJSOption } from 'peerjs';
import { QRCodeCanvas } from 'qrcode.react'; // Corrected import
import { Scanner } from '@yudiel/react-qr-scanner';
import './App.css';

const CHUNK_SIZE = 16 * 1024; // 16KB

function App() {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<{ name: string; url: string }[]>([]);
  const [notification, setNotification] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Temporary storage for incoming file chunks
  const [incomingFiles, setIncomingFiles] = useState<{[key: string]: {chunks: ArrayBuffer[], metadata: any, receivedSize: number}}>({});

  // 共通のデータハンドラ関数
  const handleIncomingData = (data: any) => {
    if (data.type === 'file-metadata') {
      // Initialize incoming file buffer
      setIncomingFiles(prev => ({
        ...prev,
        [data.fileName]: { chunks: [], metadata: data, receivedSize: 0 }
      }));
      setNotification(`Receiving file: ${data.fileName}`);
    } else if (data.type === 'file-chunk') {
      setIncomingFiles(prev => {
        const fileData = prev[data.fileName];
        if (fileData) {
          // 既にこのチャンクが受信されているかチェック
          if (fileData.chunks[data.chunkIndex]) {
            console.warn(`Duplicate chunk received for ${data.fileName}, index ${data.chunkIndex}. Skipping.`);
            return prev; // 重複なのでスキップ
          }

          console.log('Received chunk:', data.fileName, data.chunkIndex, data.chunk, data.chunk.byteLength);
          fileData.chunks[data.chunkIndex] = data.chunk;
          fileData.receivedSize += data.chunk.byteLength;

          console.log('Current incomingFiles state for file:', fileData);
          console.log('Total received size:', fileData.receivedSize, 'Expected size:', fileData.metadata.fileSize);

          // Check if all chunks received
          if (fileData.receivedSize === fileData.metadata.fileSize) {
            const completeBlob = new Blob(fileData.chunks, { type: fileData.metadata.fileType });
            const url = URL.createObjectURL(completeBlob);
            // Trigger automatic download
            const a = document.createElement('a');
            a.href = url;
            a.download = fileData.metadata.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up the object URL

            setReceivedFiles((prevFiles) => [...prevFiles, { name: fileData.metadata.fileName, url }]);
            setNotification(`File received: ${fileData.metadata.fileName}`);
            setTimeout(() => setNotification(''), 3000);
            console.log('File received:', fileData.metadata.fileName);
            // Clean up temporary storage
            const newIncomingFiles = { ...prev };
            delete newIncomingFiles[data.fileName];
            return newIncomingFiles;
          }
        }
        return prev;
      });
    } else {
      // Handle other types of data if any
      console.log('Received non-file data:', data);
    }
  };


  useEffect(() => {
    const peerJsServerUrl = process.env.REACT_APP_PEERJS_SERVER_URL;
    console.log("REACT_APP_PEERJS_SERVER_URL:", peerJsServerUrl); // ★追加

    const iceConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.sipgate.net:3478' },
        { urls: 'stun:stun.voip.ms:3478' },
        { urls: 'stun:stun.ekiga.net' },
      ],
    };

    let peerConfig: PeerJSOption = { debug: 3, config: iceConfig };

    

    if (peerJsServerUrl) {
      try {
        const url = new URL(peerJsServerUrl);
        peerConfig = {
          host: url.hostname,
          port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80),
          path: '/peerjs',
          secure: url.protocol === 'https:',
          debug: 3,
          config: iceConfig, // ここにiceConfigを追加
        };
      } catch (e) {
        console.error("Invalid REACT_APP_PEERJS_SERVER_URL:", peerJsServerUrl, e);
        // Fallback to default or handle error appropriately
      }
    } else {
      // Fallback to default local configuration if environment variable is not set
      peerConfig = {
        host: window.location.hostname,
        port: 9000,
        path: '/peerjs',
        debug: 3,
        config: iceConfig, // ここにもiceConfigを追加
      };
    }

    console.log("Peer Config:", peerConfig); // ★追加

    const newPeer = new Peer(peerConfig);

    newPeer.on('open', (id) => {
      setMyId(id);
      console.log('My peer ID is:', id);
    });

    const handleNewConnection = (conn: any) => {
      console.log('Incoming connection from:', conn.peer);
      setConnection(conn);
      conn.on('data', handleIncomingData); // 共通ハンドラを呼び出す
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
      conn.on('data', handleIncomingData); // 共通ハンドラを呼び出す
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
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const sendFile = async () => {
    if (connection && selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        console.log('Sending file metadata:', file.name, file.type, file.size); // 追加
        // Send file metadata first
        connection.send({
          type: 'file-metadata',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        let offset = 0;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        while (offset < file.size) {
          // フロー制御: バッファが一定量を超えたら待機
          // PeerJSのDataConnectionにはbufferedAmountLowThresholdがないため、手動で待機
          while (connection.bufferedAmount > connection.peerConnection.sctp.maxMessageSize * 2) { // 適当な閾値
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms待機
          }

          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const reader = new FileReader();

          await new Promise<void>((resolve, reject) => {
            reader.onload = (e) => {
              if (e.target && e.target.result) {
                connection.send({
                  type: 'file-chunk',
                  fileName: file.name,
                  chunkIndex: Math.floor(offset / CHUNK_SIZE),
                  totalChunks: totalChunks,
                  chunk: e.target.result, // ArrayBuffer
                });
                offset += CHUNK_SIZE;
                resolve();
              } else {
                reject(new Error("Failed to read chunk."));
              }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(chunk);
          });
        }
      }
      setSelectedFiles([]); // Clear selected files after sending
    }
  };

  const handleScan = (detectedCodes: any[]) => { // result を detectedCodes に変更し、型を明確に
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedText = detectedCodes[0].rawValue; // 最初の検出結果の rawValue を取得
      if (scannedText) {
        setScanResult(scannedText);
        setRemoteId(scannedText); // Automatically set remoteId from scan
        console.log('QR Code Scanned:', scannedText);
      } else {
        console.log('QR Code Scanned: No text found in rawValue', detectedCodes);
      }
    } else {
      console.log('QR Code Scanned: No detected codes or invalid result', detectedCodes);
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

        <div className="main-content-container">
          <div className="content-section">
            <h2>My ID (Share this QR)</h2>
            <p>My ID: <strong>{myId}</strong></p>
            {myId && (
              <div className="qr-code-canvas-container">
                <QRCodeCanvas value={myId} size={128} level="H" />
              </div>
            )}
          </div>

          <div className="content-section">
            <h2>Scan Remote ID</h2>
            <div className="qr-scanner-container">
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
          <div className="connection-controls">
            <input
              type="text"
              placeholder="Enter Remote Peer ID manually"
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              className="manual-id-input"
            />
            <button onClick={connectToPeer} disabled={!peer || !remoteId} className="connect-button">
              Connect
            </button>
          </div>
        )}

        {connection && (
          <div className="connected-app-section">
            <h2>Connected to: {connection.peer}</h2>
            <div className="file-transfer-controls">
              <input type="file" onChange={handleFileChange} multiple className="file-input" />
              <button onClick={sendFile} disabled={selectedFiles.length === 0} className="send-file-button">
                Send File
              </button>
              {selectedFiles.length > 0 && (
                <p>{selectedFiles.length} file(s) selected.</p>
              )}
            </div>
            <div className="received-files-section" style={{ marginTop: '20px' }}>
              <h3>Received Files:</h3>
              <ul>
                {receivedFiles.map((file, index) => (
                  <li key={index} className="received-file-item">
                    <a href={file.url} download={file.name} className="received-file-link">
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