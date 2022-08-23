# Tricks

Herein lies some tricks to pull out of the hat for faster backfront development.

![CI](https://github.com/MrSwitch/tricks/workflows/CI/badge.svg)
[![NPM Version](https://img.shields.io/npm/v/tricks.svg?style=flat&branch=main)](https://npmjs.org/package/tricks)
[![Known Vulnerabilities](https://snyk.io/test/github/mrswitch/tricks/badge.svg)](https://snyk.io/test/github/mrswitch/tricks)


## Install

After installing tricks ...

```bash
npm i tricks
```

### Example usage...

Incorporate a trick by pointing deep into the library... e.g.

```javascript
let createUrl = require('tricks/string/createUrl');

module.exports = createUrl('https://test.com/?name=dodson', {name: 'andrew', extra: 1});

// 'https://test.com/?name=andrew&extra=1'
```

Helping to keep your projects bundled size to a minimum.

## Docs

Whilst the jsdocs are being composed piecemeal [./docs](./docs), go explore the [directory](https://github.com/MrSwitch/tricks) of functions.

More info and specs in [test/](https://github.com/MrSwitch/tricks/tree/main/test) directory.
