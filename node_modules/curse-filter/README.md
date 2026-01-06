<div align='center'>

<br>

# **curse-filter**

**curse-filter** is a fully-equipped Node.js library that simplifies profanity filtering in _15+ different languages_.

[![npm version](https://img.shields.io/npm/v/curse-filter.svg?style=flat-square)](https://www.npmjs.org/package/curse-filter)
[![install size](https://packagephobia.com/badge?p=curse-filter@latest)](https://packagephobia.com/result?p=curse-filter@latest)
[![GitHub](https://img.shields.io/github/license/alessandrofoglia07/curse-filter)](https://github.com/alessandrofoglia07/curse-filter/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/alessandrofoglia07/curse-filter)](https://github.com/alessandrofoglia07/curse-filter)

<br>
</div>

## Installation

```bash
npm install curse-filter
```

## Loading the module

### ESM / Typescript

This module is first thought for Typescript/ESM, so this is the recommended way to load it.

```typescript
import { filter } from 'curse-filter';
```

### Note

Profanity language is used in this README for demonstration purposes only. Please be respectful.

## Usage

### **`supportedLangs`**

```typescript
import { supportedLangs } from 'curse-filter';

// This will log an array of supported languages
console.log(supportedLangs);
```

### **`filter()`**

The `filter()` function asynchronously replaces curse words in a string with asterisks ("\*\*\*") or a custom placeholder.

```typescript
import { filter } from 'curse-filter';

// This must be used in an async function or top-level await context

await filter('fuck you');
// result: '*** you'

await filter('fuck you', { lang: 'en' });
// result: '*** you'

await filter('fuck you, coglione', { lang: ['en', 'it'] });
// result: '*** you, ***'

await filter('fuck you, coglione', { lang: ['en', 'it'], placeholder: 'customPlaceholder' });
// result: 'customPlaceholder you, customPlaceholder'
```

#### Parameters

-   `str` _(string)_ – The input string to filter.

-   `options` _(optional)_ – An object with:

    -   `lang` _(string | string[] | true)_: One or more language codes (e.g., `'en'`, `'it'`, or `['en', 'it']`). If omitted, all supported languages will be used. Note that **the fewer languages** you pass to the function's options object, **the faster** the filtering will be.

    -   `placeholder` _(string)_: The replacement string. Defaults to `'\*\*\*'`.

    -   `customKeywords` _(Set\<string>)_: A Set to add custom words to look for in the string.

#### Returns

A `Promise<string>` with the filtered string.

### **`detect()`**

The `detect()` function asynchronously detects whether or not curse words are in a string.

```typescript
import { detect } from 'curse-filter';

// This must be used in an async function or top-level await context

await detect('fuck you');
// result: true

await detect('fuckyou');
// false (no space, not detected by default)

await detect('fuckyou', { rigidMode: true });
// true (rigid mode allows substring matching)

await detect('fuck you, coglione', { lang: ['en', 'it'] });
// true
```

#### Parameters

-   `str` _(string)_ – The input string to scan.

-   `options` _(optional)_ – An object with:

    -   `lang` _(string | string[])_: One or more language codes (e.g., `'en'`, `'it'`, or `['en', 'it']`). If omitted, all supported languages will be used.

    -   `rigidMode` _(boolean)_: If `true`, performs substring detection (e.g., matches `"fuckyou"`). Defaults to `false`.

    -   `processedChunkSize` _(number)_: Optional internal chunk size for performance control (default is `100`).

    -   `customKeywords` _(Set\<string>)_: A Set to add custom words to look for in the string.

#### Returns

A `Promise<boolean>` – Resolves to true if profanity is detected, otherwise false.

## **Express.js middlewares**

curse-filter comes with built-in `express.js` middlewares.

### **`detectMiddleware`** middleware

The `detectMiddleware` middleware analizes the whole `req.body` object for curse words.

```ts
import express, { Request, Response } from 'express';
import { detectMiddleware } from 'curse-filter';
import { registerUserToDB } from './db';

const app = express();

app.use(express.json());

app.post('/register', detectMiddleware, async (req: Request, res: Response) => {
    /* If the request body contains curse words, the middleware will automatically 
    send a 422 response with a message containing the detected curse words.
    If no curse words are detected, the middleware will call the next() function. */

    await registerUserToDB(req.body);

    res.status(200).json({ message: 'User registered!' });
});
```

It is possible to configure the middleware with the following options:

```ts
// Class for configuring the middleware
import { MiddlewaresConfig } from 'curse-filter';

// Default values:

MiddlewareConfig.onError = null; // Called when a curse word is detected, before sending the response

MiddlewareConfig.detectOptions = {
    lang: 'en', // Language(s) to use for detection
    rigidMode: false, // If true, performs substring detection (e.g., matches "fuckyou")
    processedChunkSize: 100, // Optional internal chunk size for performance control
    customKeywords: new Set() // A Set to add custom words to look for in the string
}; // Options for the detect function

MiddlewareConfig.errorMessage = 'Not allowed content detected.'; // Message sent in the response

MiddlewareConfig.statusCode = 422; // Status code sent in the response
```

## **Typescript**

### **`SupportedLang` type**

```typescript
import { SupportedLang } from 'curse-filter';

const lang: SupportedLang = 'en';
```

# New Version v6.0.0 → v7.0.0

This version drops the `CustomKeywords` Set-like object to introduce a **quicker way of adding custom words** to look for and drops support for the synchronous versions of the functions, in favor of promise-based functions. This means that the `filter()` and `detect()` functions and the `detectMiddleware` middleware are now only asynchronous and return a promise for **increased performance**.

## License

[MIT](https://github.com/alessandrofoglia07/curse-filter/blob/main/LICENSE)

<br>

<div align='center'>

Made with 💜 by [alessandrofoglia07](https://github.com/alessandrofoglia07)

</div>
