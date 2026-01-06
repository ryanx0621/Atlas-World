"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = void 0;
class List {
    get empty() {
        return this.words.size === 0;
    }
    constructor(onListChanged) {
        this.onListChanged = onListChanged;
        this.words = new Set();
    }
    removeWords(words) {
        words.forEach((word) => this.words.delete(word));
        this.onListChanged();
    }
    addWords(words) {
        words.forEach((word) => this.words.add(word.toLowerCase()));
        this.onListChanged();
    }
}
exports.List = List;
//# sourceMappingURL=list.js.map