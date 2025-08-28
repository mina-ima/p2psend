/**
 * @file qr-utils.ts
 * @description Defines common interfaces and utilities for QR code operations across web and native platforms.
 */

/**
 * Interface for QR code utility operations.
 */
export interface IQRUtils {
  /**
   * Generates a QR code from the given text data.
   * @param data The text data to encode in the QR code.
   * @returns A promise that resolves with the QR code data (e.g., SVG string, base64 image data).
   */
  generate(data: string): Promise<string>;

  /**
   * Scans a QR code using the device's camera or an image.
   * @returns A promise that resolves with the decoded text data from the QR code.
   */
  scan(): Promise<string>;
}

/**
 * Web-specific implementation of IQRUtils.
 * Uses qrcode.react for generation. Scanning is a placeholder as it requires a separate library and camera access.
 */
export class WebQRUtils implements IQRUtils {
  async generate(data: string): Promise<string> {
    // qrcode.react component is used directly in React components for rendering.
    // For a utility function, we might use a library like 'qrcode' to generate a data URL or SVG string.
    // For simplicity, this example will just return the data itself, assuming the component handles rendering.
    // In a real-world scenario, you'd use a library like 'qrcode' (not qrcode.react) here.
    return Promise.resolve(data); // Placeholder: In reality, this would generate an image/SVG string
  }

  async scan(): Promise<string> {
    // Placeholder for QR code scanning on the web.
    // This would typically involve a library like 'html5-qrcode' or similar,
    // requiring camera access and user permissions.
    console.warn('QR code scanning is not implemented in WebQRUtils.scan().');
    return Promise.reject(new Error('QR code scanning not implemented for web utility.'));
  }
}
