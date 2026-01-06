# Translates between Traditional and Simplified Chinese in pure Node.js [![Build Status](https://travis-ci.org/compulim/node-opencc.svg?branch=master)](https://travis-ci.org/compulim/node-opencc)

(This library use [OpenCC](https://github.com/byvoid/opencc) for its dictionary database and test data)

OpenCC is a translation library for Traditional and Simplified Chinese with dictionary of localized phrases and verbs. But it only runs on Python (or Node.js with Python installed).

`node-opencc` is a brand new project that imports OpenCC database and test case, and translates text without installing any native components.

## Usage

`node-opencc` supports Node.js and modern browsers (with Webpack).

```
const opencc = require('node-opencc');

opencc.hongKongToSimplified('滑鼠') === '鼠标';
opencc.traditionalToHongKong('僞') === '偽';
```

`node-opencc` supports the following types of translations:

| Function name                   | Translation                               |
| ------------------------------- | ----------------------------------------- |
| `hongKongToSimplified`          | Hong Kong to Simplified Chinese           |
| `simplifiedToHongKong`          | Simplified Chinese to Hong Kong           |
| `simplifiedToTraditional`       | Simplified Chinese to Traditional Chinese |
| `simplifiedToTaiwan`            | Simplified Chinese to Taiwan              |
| `simplifiedToTaiwanWithPhrases` | Simplified Chinese to Taiwan with phrases |
| `traditionalToHongKong`         | Traditional Chinese to Hong Kong          |
| `traditionalToSimplified`       | Traditional Chinese to Simplified Chinese |
| `traditionalToTaiwan`           | Traditional Chinese to Taiwan             |
| `taiwanToSimplified`            | Taiwan to Simplified Chinese              |
| `taiwanToSimplifiedWithPhrases` | Taiwan to Simplified Chinese with phrases |

## What's not working

Although `node-opencc` tries to redo `OpenCC` with pure JavaScript, there are features that are not working as in `OpenCC`. `node-opencc` currently _do not_ support the following features:

* Multiple alternative phrases, verbs, and characters
* Use `withPhrases` options

## Changelog

Please refer to change log [here](CHANGELOG.md).

## Contribution

You may want to head to [OpenCC](https://github.com/byvoid/opencc) for dictionary contribution.

Love this extension? [Star](https://github.com/compulim/node-opencc/stargazers) us!

Want to make this extension even more awesome? [Send us your wish](https://github.com/compulim/node-opencc/issues/new/).

Hate how it is working? [File an issue](https://github.com/compulim/node-opencc/issues/new/) to us.

To contribute to the code base of `node-opencc`, please file a pull request with unit tests.
