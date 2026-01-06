import { FilterOptions } from './utils.js';
/**
 * *Async version* of `filter()` function. Filters a string for profanity. It replaces profanity with "`***`".
 * @param str String to filter
 * @param options Options for filtering
 * @returns Filtered string
 * @example
 * // in async scope
 * await filter('fuck you') // '*** you'
 * await filter('fuck you', { lang: 'en' }) // '*** you'
 * await filter('fuck you, coglione', { lang: ['en', 'it'] }) // '*** you, ***'
 */
export declare const filter: (str: string, options?: FilterOptions) => Promise<string>;
