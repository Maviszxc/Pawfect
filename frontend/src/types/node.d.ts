// Custom type definitions for Node.js types

declare namespace NodeJS {
  interface Timeout {
    ref(): Timeout;
    unref(): Timeout;
    hasRef(): boolean;
    refresh(): Timeout;
    [Symbol.toPrimitive](): number;
  }
}