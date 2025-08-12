declare module 'cli-progress' {
  export interface Options {
    format?: string;
    fps?: number;
    stream?: NodeJS.WriteStream;
    stopOnComplete?: boolean;
    clearOnComplete?: boolean;
    barCompleteChar?: string;
    barIncompleteChar?: string;
    hideCursor?: boolean;
    barGlue?: string;
    etaBuffer?: number;
    etaBufferLength?: number;
    noTTYOutput?: boolean;
    notTTYSchedule?: number;
  }

  export interface SingleBar {
    start(total: number, startValue: number, payload?: any): void;
    update(current: number, payload?: any): void;
    stop(): void;
  }

  export class SingleBar {
    constructor(options?: Options, preset?: Preset);
  }

  export interface Preset {
    format: string;
    fps?: number;
    stopOnComplete?: boolean;
    clearOnComplete?: boolean;
    barCompleteChar?: string;
    barIncompleteChar?: string;
  }

  export const Presets: {
    shades_classic: Preset;
    shades_grey: Preset;
    rect: Preset;
    legacy: Preset;
  };
}