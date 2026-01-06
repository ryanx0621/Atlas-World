"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = void 0;
/**
 * Escapes all Regular Expression characters in a string
 * @param text the string to escape
 * @returns an escaped string
 */
const escapeRegExp = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=misc.js.map