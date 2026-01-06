export declare class List {
    words: Set<string>;
    onListChanged: () => void;
    get empty(): boolean;
    constructor(onListChanged: () => void);
    removeWords(words: string[]): void;
    addWords(words: readonly string[] | string[]): void;
}
