import { PropTypes } from 'react';

export default function getPhrasePropTypes(defaultPhrases) {
  return Object.keys(defaultPhrases).reduce((phrases, key) => {
    const phrasesWithNewKey = { ...phrases };
    phrasesWithNewKey[key] = PropTypes.node;
    return phrasesWithNewKey;
  }, {});
}
