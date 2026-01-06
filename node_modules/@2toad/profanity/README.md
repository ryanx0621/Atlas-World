# Profanity 🧼

![GitHub Release](https://img.shields.io/github/v/release/2Toad/Profanity)
[![Downloads](https://img.shields.io/npm/dm/@2toad/profanity.svg)](https://www.npmjs.com/package/@2toad/profanity)
[![Build status](https://github.com/2toad/profanity/actions/workflows/ci.yml/badge.svg)](https://github.com/2Toad/Profanity/actions/workflows/nodejs.yml)

A multi-language profanity filter with full TypeScript support

## Getting Started

Install the package

```Shell
npm i @2toad/profanity
```

>If you're using Node 11.x or older, you'll need to install [Profanity 1.x](https://github.com/2Toad/Profanity/releases)

## Usage

```JavaScript
import { profanity, CensorType } from '@2toad/profanity';
// or
const { profanity, CensorType } = require('@2toad/profanity');
```

```JavaScript
profanity.exists('I like big butts and I cannot lie');
// true

profanity.exists('I like big glutes and I cannot lie');
// false

profanity.censor('I like big butts (aka arses) and I cannot lie');
// I like big @#$%&! (aka @#$%&!) and I cannot lie

profanity.censor('I like big butts (aka arses) and I cannot lie', CensorType.FirstChar);
// I like big *utts (aka *rses) and I cannot lie
```

## Options
Create an instance of the Profanity class to change the default options:

```JavaScript
import { Profanity } from '@2toad/profanity';

const profanity = new Profanity({
    languages: ['de'],
    wholeWord: false,
    grawlix: '*****',
    grawlixChar: '$',
});
```

### languages

By default, this is set to `['en']` (English). You can change the default to any [supported language](./supported-languages.md), including multiple languages:

```JavaScript
const profanity = new Profanity({
    languages: ['en', 'de'],
});
```

You can override this option by specifying the languages in `exists` or `censor`:

```JavaScript
profanity.exists('Je suis un connard', ['fr']);
// true

profanity.censor('I like big butts and je suis un connard', CensorType.Word, ['en', 'de', 'fr']);
// I like big @#$%&! and je suis un @#$%&!
```

If no languages are specified in the method call, it will use the languages specified in the options.

### wholeWord

By default, this is set to `true` so profanity only matches on whole words:
```JavaScript
profanity.exists('Arsenic is poisonous but not profane');
// false
```

Setting this to `false`, results in partial word matches:
```JavaScript
profanity.exists('Arsenic is poisonous but not profane');
// true (matched on arse)
```

#### Compound Words  
Profanity detection works on parts of compound words, rather than treating hyphenated or underscore-separated words as indivisible.

When `wholeWord` is `true`, each portion of a compound word is analyzed for a match:
```JavaScript
profanity.exists("Don't be an arsenic-monster");
// false

profanity.exists("Don't be an arse-monster");
// true (matched on arse)
```
Setting `wholeWord` to `false`, results in partial word matches on each portion of a compound word:
```JavaScript
profanity.exists("Don't be an arsenic-monster");
// true (matched on arse)
```

### grawlix

By default this is set to `@#$%&!`:
```JavaScript
profanity.censor('I like big butts and I cannot lie');
// I like big @#$%&! and I cannot lie
```

Setting this to `****`, results in:
```JavaScript
profanity.censor('I like big butts and I cannot lie');
// I like big **** and I cannot lie
```

### grawlixChar

When specifying a `CensorType` other than `CensorType.Word`, this is the character used by the `censor` function.

By default this is set to `*`:
```JavaScript
profanity.censor('I like big butts and I cannot lie', CensorType.AllVowels);
// I like big b*tts and I cannot lie
```

Setting this to `$`, results in:
```JavaScript
profanity.censor('I like big butts and I cannot lie', CensorType.AllVowels);
// I like big b$tts and I cannot lie
```

### unicodeWordBoundaries

Controls whether word boundaries are Unicode-aware. By default this is set to `false` due to the performance impact.

- When `false` (default), whole-word matching uses ASCII-style boundaries (similar to `\b`) plus underscore `_` as a separator. This is fastest and ideal for ASCII inputs.
- When `true`, whole-word matching uses Unicode-aware boundaries so words with diacritics (e.g., `vehículo`, `horário`) and compound separators are handled correctly.

```JavaScript
// Enable Unicode-aware boundaries when processing non-ASCII input
const profanity = new Profanity({ unicodeWordBoundaries: true });

profanity.exists('vehículo horario');
// false (does not match on "culo" inside "vehículo")
```

## Customize the word list

Add words:
```JavaScript
profanity.addWords(['aardvark', 'zebra']);
```

Remove words:
```JavaScript
profanity.removeWords(['butt', 'arse']);
```

## Whitelist
The whitelist allows you to specify words that are always ignored by the profanity filter.

>This can be useful if you want to enable partial word matching (`wholeWord = false`), so combined words are caught (e.g., arselicker), while specific words you add to the whitelist are ignored (e.g., arsenic).

Add words to the whitelist:
```JavaScript
profanity.whitelist.addWords(['arsenic', 'buttress']);
```

Remove words from the whitelist:
```JavaScript
profanity.whitelist.removeWords(['arsenic', 'buttress']);
```

## Benchmarking ⏱️

To see how Profanity performs, check out our [benchmark results](./src/tools/benchmark/results.md).

## Contributing 🤝

So you want to contribute to the Profanity project? Fantastic! Please read the [Contribute](./contribute.md) doc to get started.