import { ProfanityOptions } from "./profanity-options";
import { List, CensorType } from "./models";
export declare class Profanity {
    options: ProfanityOptions;
    whitelist: List;
    private blacklist;
    private removed;
    private regexes;
    constructor(options?: ProfanityOptions | Partial<ProfanityOptions>);
    /**
     * Checks if the given text contains any profanity.
     * @param text - The text to check for profanity.
     * @param languages - Optional array of language codes to use for profanity detection.
     *                    If not provided, uses the languages specified in the options.
     * @returns True if profanity is found, false otherwise.
     */
    exists(text: string, languages?: string[]): boolean;
    /**
     * Censors profanity in the given text.
     * @param text - The text to censor.
     * @param censorType - The type of censoring to apply. Defaults to CensorType.Word.
     * @param languages - Optional array of language codes to use for profanity detection.
     *                    If not provided, uses the languages specified in the options.
     * @returns The censored text.
     */
    censor(text: string, censorType?: CensorType, languages?: string[]): string;
    /**
     * Adds words to the profanity blacklist.
     * @param words - An array of words to add to the blacklist.
     */
    addWords(words: string[]): void;
    /**
     * Removes words from the profanity blacklist.
     * @param words - An array of words to remove from the blacklist.
     */
    removeWords(words: string[]): void;
    /**
     * Checks if a given match is whitelisted.
     * @param matchStart - The starting index of the match in the text.
     * @param matchEnd - The ending index of the match in the text.
     * @param text - The lowercase text being checked.
     * @returns True if the match is whitelisted, false otherwise.
     */
    private isWhitelisted;
    /**
     * Replaces profanity in the text using the provided replacer function.
     * @param text - The original text.
     * @param lowercaseText - The lowercase version of the text.
     * @param replacer - A function that determines how to replace profane words.
     * @param regex - The regular expression used to find profane words.
     * @returns The text with profanity replaced.
     */
    private replaceProfanity;
    /**
     * Determines the list of languages to use, either from the provided list or falling back to default languages.
     * @param languages - An optional list of languages to use.
     * @returns The list of languages to be used.
     */
    private resolveLanguages;
    /**
     * Retrieves or constructs a regular expression for detecting profanity in the specified languages.
     * This method first checks if a regex for the given combination of languages already exists in the cache.
     *
     * @param languages - An array of languages to include in the regex.
     * @throws {Error} If no languages are provided.
     * @returns A RegExp object for detecting profanity in the specified languages.
     */
    private getRegex;
    /**
     * Constructs a regular expression for detecting profane words.
     *
     * @param words - An array of profane words to be included in the regex.
     * @returns A RegExp that matches any of the profane or blacklisted words.
     */
    private buildRegex;
    /**
     * Clear the cached regexes.
     */
    private clearRegexes;
}
export declare const profanity: Profanity;
