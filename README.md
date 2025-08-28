# p2psend

中央サーバーを介さずに、ユーザー間で直接ファイルを送信できるP2P（ピアツーピア）ファイル転送アプリケーションです。

## 主な機能

- P2Pによるファイル転送
- シンプルで直感的なユーザーインターフェース

## 使用技術

- **フロントエンド:**
  - React
  - TypeScript
  - PeerJS (WebRTC)
- **バックエンド:**
  - Node.js
  - Express
  - PeerJS Server
- **スタイリング:**
  - CSS

## インストールと実行方法

1.  **リポジトリをクローンします:**
    ```bash
    git clone https://github.com/mina-ima/p2psend.git
    cd p2psend
    ```

2.  **依存関係をインストールします:**
    ```bash
    npm install
    ```

3.  **PeerJSサーバーを起動します:**
    別のターミナルで以下のコマンドを実行し、PeerJSサーバーを起動します。
    ```bash
    npm run server
    ```

4.  **Reactアプリケーションを起動します:**
    ```bash
    npm start
    ```
    ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 利用可能なスクリプト

-   `npm start`: 開発モードでアプリケーションを実行します。
-   `npm run build`: 本番用にアプリケーションをビルドします。
-   `npm test`: テストランナーを起動します。
-   `npm run server`: PeerJSサーバーを起動します。
