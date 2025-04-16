// Type declarations to fix TypeScript errors

declare module 'better-sqlite3' {
  interface Statement {
    run(...params: any[]): { 
      lastInsertRowid: number | bigint; 
      changes: number;
    };
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): Iterable<any>;
  }

  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    transaction(fn: Function): Function;
    pragma(pragma: string, options?: { simple?: boolean }): any;
    checkpoint(databaseName?: string): void;
    function(name: string, cb: Function): void;
    close(): void;
  }

  interface DatabaseConstructor {
    new(filename: string, options?: any): Database;
    (filename: string, options?: any): Database;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
