# afinn-165-financialmarketnews

AFINN 165 - Financial Market News.

## Contents

*   [What is this?](#what-is-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`afinn165`](#afinn165)
*   [Musings](#musings)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [License](#license)

## What is this?

This package exposes a map of words rated for valence.
(“goodness” vs “badness”), specifically the AFINN-165 list,
but with additions and modifications to existing words
to be tuned for parsing financial news.

## Install

This package is esm only.
In Node.js (version 14.14+, 16.0+), install with:

```sh
npm install afinn-165-financialmarketnews
```

## Use

```js
import {afinn165FinancialMarketNews} from 'afinn-165-financialmarketnews'

afinn165FinancialMarketNews.raises //=> 1
afinn165FinancialMarketNews.bankruptcy //=> -3
afinn165FinancialMarketNews.crashing //=> -2
```

## API

This package exports the identifier `afinn165FinancialMarketNews`.
There is no default export.

### `afinn165`

Map of words to valence (`Record<string, number>`).

> 👉 **Note**: be careful when accessing unknown properties on the
> `afinn165` object, words such as “constructor” or “toString” might occur.
> It’s recommended to use a `hasOwnProperty` check beforehand.

## Musings

This package adds 170+ words, and modifies a few others
compared to the repository this is forked from.
These modifications and additions aim to help better
parse sentiment from financial news.

## Types

This package is fully typed with TypeScript.
It exports no additional types.

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.

## License

MIT License.
