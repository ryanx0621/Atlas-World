# afinn-165

[![Build][build-badge]][build]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

[AFINN 165][afinn165].
AFINN 165 contains 3382 entries.
That’s 905 more than [AFINN 111][afinn111].

## Install

[npm][]:

```sh
npm install afinn-165
```

## Use

```js
var afinn = require('afinn-165')

afinn.xoxo //=> 3
afinn.bankruptcy //=> -3
```

## API

### `afinn165`

`afinn-165` returns entries to valence ratings (`Object.<string, number>`).

> Note!
> Be careful when accessing unknown properties on the `afinn165` object, words
> such as “constructor” or “toString” might occur.
> It’s recommended to use a `hasOwnProperty` check beforehand.

## Musings

In total, 905 entries were added and two were changed.
Compared to [AFINN 111][afinn111], the following changed:

*   Many new words
*   `damn` is now rated as `-2` (was `-4`)
*   `exasperated`, `futile`, `irresponsible` are now `-2` (were 2)
*   New entries with spaces: `damn cute`, `damn good`, `kind of`, `fucking
    awesome`, `fucking beautiful`, `fucking cute`, `fucking fantastic`, `fucking
    good`, `fucking great`, `fucking hot`, `fucking love`, `fucking loves`,
    `fucking perfect`
*   New entries with hyphens: `environment-friendly`, `game-changing`,
    `ill-fated`, `loving-kindness`, `non-approved`, `post-traumatic`,
    `self-abuse`, `self-contradictory`, `side-effect`, `side-effects`,
    `violence-related`, `well-being`, `well-championed`, `well-developed`,
    `well-established`, `well-focused`, `well-groomed`, `well-proportioned`

## Related

*   [`afinn-96`](https://github.com/words/afinn-96)
    — AFINN list from 2009 with 1468 entries
*   [`afinn-111`](https://github.com/words/afinn-111)
    — AFINN list from 2011 with 2477 entries
*   [`emoji-emotion`](https://github.com/words/emoji-emotion)
    — Like AFINN but for emoji
*   [`polarity`](https://github.com/words/polarity)
    — Detect the polarity of text, based on `afinn-169` and `emoji-emotion`

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/words/afinn-165.svg

[build]: https://travis-ci.org/words/afinn-165

[downloads-badge]: https://img.shields.io/npm/dm/afinn-165.svg

[downloads]: https://www.npmjs.com/package/afinn-165

[size-badge]: https://img.shields.io/bundlephobia/minzip/afinn-165.svg

[size]: https://bundlephobia.com/result?p=afinn-165

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[afinn165]: https://stackoverflow.com/questions/32750682/32845659#32845659

[afinn111]: https://github.com/words/afinn-111
