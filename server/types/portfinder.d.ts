declare module 'portfinder' {
  interface PortfinderOptions {
    port?: number;
    host?: string;
    startPort?: number;
    stopPort?: number;
    path?: string;
  }

  const portfinder: {
    basePort: number;
    highestPort: number;
    getPortPromise(options?: PortfinderOptions): Promise<number>;
    getPort(callback: (err: Error | null, port: number) => void): void;
    getPort(options: PortfinderOptions, callback: (err: Error | null, port: number) => void): void;
  };

  export = portfinder;
}
