declare module 'qrcode-terminal' {
  const QRCode: {
    generate: (text: string, opts?: { small?: boolean }) => void;
  };
  export default QRCode;
}