export declare const loadLang: (lang: SupportedLang) => Promise<string[]>;
export declare const loadLangSync: (lang: SupportedLang) => string[];
/**
 * List of supported languages
 */
export declare const supportedLangs: SupportedLang[];
/**
 * Supported language type
 * @example const english: SupportedLang = 'en'
 * const french: SupportedLang = 'fr'
 */
export type SupportedLang = 'af' | 'cz' | 'de' | 'en' | 'es' | 'fi' | 'fr' | 'hi' | 'it' | 'nl' | 'pl' | 'ru' | 'sk' | 'th' | 'uk';
/**
 * Removes excess letters followed or preceded by "***" in a string.
 */
export declare const removeExcess: (str: string, placeholder?: string) => string;
export interface Options {
    /**
     * Language to use. Use `undefined` to use all languages, or select a language / array of languages to use.
     * @default undefined
     */
    lang?: SupportedLang | SupportedLang[];
    /**
     * Custom Set of words to look for.
     * @example
     * const customKeywords = new Set(['customWord1', 'customWord2']);
     * await filter('customWord1', { customKeywords }) // '***'
     */
    customKeywords?: Set<string>;
}
export interface FilterOptions extends Options {
    /**
     * Placeholder to use instead of "***"
     * @default '***'
     * @example
     * await filter('Fuck you', { placeholder: 'myString' }) // 'myString you'
     */
    placeholder?: string;
}
export interface DetectOptions extends Options {
    /**
     * Whether to use the "rigid" mode, which is more strict
     * @default false
     * @example
     * await detect('Fuckyou') // false
     * await detect('Fuckyou', { rigidMode: true }) // true
     */
    rigidMode?: boolean;
    /**
     * Amount of chunk of words processed on every iteration. Adjust this based on your application's performance characteristics.
     * @default 100
     */
    processedChunkSize?: number;
    /**
     * Custom Set of words to look for.
     * @example
     * const customKeywords = new Set(['customWord1', 'customWord2']);
     * await filter('customWord1', { customKeywords }) // '***'
     */
    customKeywords?: Set<string>;
}
