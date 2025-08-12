declare module 'archiver' {
  import { Readable } from 'stream';

  interface ArchiverOptions {
    zlib?: { level?: number };
  }

  interface Archiver {
    pipe(writeStream: NodeJS.WriteStream): void;
    directory(dirPath: string, destPath: string): void;
    file(path: string, options: { name: string }): void;
    finalize(): void;
    on(event: 'error', handler: (err: Error) => void): void;
  }

  function archiver(format: 'zip', options?: ArchiverOptions): Archiver;
  export default archiver;
}