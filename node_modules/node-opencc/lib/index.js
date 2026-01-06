'use strict';

const fs            = require('fs');
const path          = require('path');
const dictionaries  = require('../dist/dictionary.json');

const cachedDictionaries = {};

function getDictionary(name, options = {}) {
  const { reverse } = options;
  let cacheName     = reverse ? `R_${ name }` : name;
  let dictionary    = cachedDictionaries[cacheName];

  return dictionary || (cachedDictionaries[cacheName] = dictionaries[name].reduce((map, entry) => {
    const first = options.reverse ? 1 : 0;

    map[entry[first]] = entry[1 - first];

    return map;
  }, {}));
}

function convertChain(input, chains) {
  return chains.reduce((input, chain) => {
    const dictionaries = chain.slice();

    dictionaries.splice(0, 0, {});

    return translate(input, Object.assign.apply(null, dictionaries));
  }, input);
}

exports.hongKongToSimplified = function (text) {
  return convertChain(text, [
    [
      getDictionary('HKVariantsRevPhrases'),
      getDictionary('HKVariants', { reverse: true })
    ],
    [
      getDictionary('TSPhrases'),
      getDictionary('TSCharacters')
    ],
  ]);
};

exports.simplifiedToHongKong = function (text) {
  return convertChain(text, [
    [
      getDictionary('STPhrases'),
      getDictionary('STCharacters')
    ],
    [
      getDictionary('HKVariantsPhrases'),
      getDictionary('HKVariants')
    ]
  ]);
};

exports.simplifiedToTraditional = function (text) {
  return convertChain(text, [
    [
      getDictionary('STPhrases'),
      getDictionary('STCharacters')
    ]
  ]);
};

exports.simplifiedToTaiwan = function (text) {
  return convertChain(text, [
    [
      getDictionary('STPhrases'),
      getDictionary('STCharacters')
    ],
    [
      getDictionary('TWVariants')
    ]
  ]);
};

exports.simplifiedToTaiwanWithPhrases = function (text) {
  return convertChain(text, [
    [
      getDictionary('STPhrases'),
      getDictionary('STCharacters')
    ],
    [
      getDictionary('TWPhrasesIT'),
      getDictionary('TWPhrasesName'),
      getDictionary('TWPhrasesOther'),
      getDictionary('TWVariants')
    ]
  ]);
};

exports.traditionalToHongKong = function (text) {
  return convertChain(text, [
    [
      getDictionary('HKVariants')
    ]
  ]);
};

exports.traditionalToSimplified = function (text) {
  return convertChain(text, [
    [
      getDictionary('TSPhrases'),
      getDictionary('TSCharacters')
    ]
  ]);
};

exports.traditionalToTaiwan = function (text) {
  return convertChain(text, [
    [
      getDictionary('TWVariants')
    ]
  ]);
};

exports.taiwanToSimplified = function (text) {
  return convertChain(text, [
    [
      getDictionary('TWVariantsRevPhrases'),
      getDictionary('TWVariants', { reverse: true })
    ],
    [
      getDictionary('TSPhrases'),
      getDictionary('TSCharacters')
    ]
  ]);
};

exports.taiwanToSimplifiedWithPhrases = function (text) {
  return convertChain(text, [
    [
      getDictionary('TWVariantsRevPhrases'),
      getDictionary('TWVariants', { reverse: true })
    ],
    [
      getDictionary('TWPhrasesIT', { reverse: true }),
      getDictionary('TWPhrasesName', { reverse: true }),
      getDictionary('TWPhrasesOther', { reverse: true })
    ],
    [
      getDictionary('TSPhrases'),
      getDictionary('TSCharacters')
    ]
  ]);
};

function translate(text, dictionary) {
  const maxLength  = Object.keys(dictionary).reduce((maxLength, word) => Math.max(maxLength, word.length), 0);
  const translated = [];

  for (let i = 0, { length } = text; i < length; i++) {
    let found;

    for (let j = maxLength; j > 0; j--) {
      const target = text.substr(i, j);

      if (Object.hasOwnProperty.call(dictionary, target)) {
        i += j - 1;
        translated.push(dictionary[target]);
        found = 1;
        break;
      }
    }

    !found && translated.push(text[i]);
  }

  return translated.join('');
}
