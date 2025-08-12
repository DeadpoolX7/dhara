# Dhara

Dhara is a CLI tool for seamless file transfer between devices using QR codes. Share files instantly between your desktop and mobile devices without installing any apps or signing up for services.

## Features

- 🚀 Instant file sharing via QR codes
- 📱 No mobile app required - works through browser
- 📂 Support for single or multiple files
- 🗂️ Directory sharing with automatic zip compression
- 🔒 Secure one-time transfers with auto-expiring links
- 📊 Progress bar for transfer tracking

## Installation

```bash
npm install -g dhara
```

## Usage

### Sharing Files

Share a single file:
```bash
dhara path/to/file
```

Share multiple files (automatically zipped):
```bash
dhara -m file1.txt file2.pdf file3.jpg
```

Share an entire directory(automatically zipped):
```bash
dhara path/to/directory
```

### Receiving Files

Start receiving files:
```bash
dhara receive
```

With custom session ID:
```bash
dhara receive --id mysession123
```

## How it Works

1. When sharing:
   - Dhara starts a temporary local server
   - Generates a QR code containing the download URL
   - Scan the QR code with your mobile device to download
   - Server automatically shuts down after transfer

2. When receiving:
   - Starts a temporary upload server
   - Displays QR code for the upload page
   - Open on mobile device to upload files
   - Files are saved to a local directory
   - Server shuts down after transfer

## Development

Clone and install dependencies:
```bash
git clone https://github.com/yourusername/dhara.git
cd dhara
npm install
```

Build the project:
```bash
npm run build
```

Run locally:
```bash
npm start
```

## Requirements

- Node.js >= 16.0.0
- Network connectivity between devices
- Devices must be on the same local network

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.