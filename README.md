<div align="center">
  <a href="https://superchargejs.com">
    <img width="471" style="max-width:100%;" src="https://superchargejs.com/images/supercharge-text.svg" />
  </a>
  <br/>
  <br/>
  <p>
    <h3>Streams</h3>
  </p>
  <p>
    Streaming utilities for Node.js based on promises, instead of events.
  </p>
  <br/>
  <p>
    <a href="#installation"><strong>Installation</strong></a> ·
    <a href="#Docs"><strong>Docs</strong></a> ·
    <a href="#usage"><strong>Usage</strong></a>
  </p>
  <br/>
  <br/>
  <p>
    <a href="https://www.npmjs.com/package/@supercharge/streams"><img src="https://img.shields.io/npm/v/@supercharge/streams.svg" alt="Latest Version"></a>
    <a href="https://www.npmjs.com/package/@supercharge/streams"><img src="https://img.shields.io/npm/dm/@supercharge/streams.svg" alt="Monthly downloads"></a>
  </p>
  <p>
    <em>Follow <a href="http://twitter.com/marcuspoehls">@marcuspoehls</a> and <a href="http://twitter.com/superchargejs">@superchargejs</a> for updates!</em>
  </p>
</div>

---

## Introduction
The native Node.js stream implementation is based on event emitters. It’s hard to manage the control flow in your application when using events. If you want to actively wait for a stream to finish, you must wrap it into a promise.

This `@supercharge/streams` package wraps Node.js streams into promises to make them `async/await`-ready. It provides methods, like

- `.map(callback)`
- `.filter(callback)`
- `.through(transformStream)`

to interact with the input data.


## Installation

```
npm i @supercharge/streams
```


## Docs
Find all the [details for `@supercharge/streams` in the extensive Supercharge docs](https://superchargejs.com/docs/streams).


## Usage
Using `@supercharge/streams` is pretty straightforward. The package exports a function that accepts data or a read-stream as an input. If the input is not a stream, it transforms it into one.

Here’s an example that takes an array with three items and runs it through a streaming pipeline to ultimately writing the result to a file:

```js
const Stream = require('@supercharge/streams')

await Stream([1, 2, 3])
  .inObjectMode()
  .map(item => {
    return item * 2
  })
  .filter(item => {
    return item > 3
  })
  .into(Fs.createWriteStream('./numbers-greater-then-three.csv'))
```

The `.map()` and `.filter()` methods take a callback as an argument. Under the hood, `@supercharge/streams` creates a transform stream for these methods to run the provided callback.


### Object Mode Streams
Object mode streams come handy when working with arrays to retrieve each item from the array individually.

By default, a stream is not in object mode. You must actively chain the `.inObjectMode()` method in the pipeline:

```js
const Fs = require('fs')
const Stream = require('@supercharge/streams')

const users = [
  { name: 'Marcus', supercharged: true },
  { name: 'Red John', supercharged: false }
]

await Stream(users)
  .inObjectMode()
  .filter(user => user.supercharged)
  .into(Fs.createWriteStream('./supercharged-users-export.csv'))
```


### Error Handling
The native Node.js streams use event emitters and this comes with separate channels for data and errors. The `@supercharge/streams` package transforms the event-based streams into promise-based streams. Promises have a single channel for data and errors.

You must actively catch errors if you don’t want them to bubble up in your appplication:

```js
try {
  await Stream(input)
    .map(() => throw new Error('sh*t happens'))
    .into(output)
} catch (error) {
  // handle error
}
```

Errors will be thrown as soon as they appear. The stream will stop and clean up without processing the remaining data.


## Contributing
Do you miss a stream function? We very much appreciate your contribution! Please send in a pull request 😊

1.  Create a fork
2.  Create your feature branch: `git checkout -b my-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request 🚀


## License
MIT © [Supercharge](https://superchargejs.com)

---

> [superchargejs.com](https://superchargejs.com) &nbsp;&middot;&nbsp;
> GitHub [@superchargejs](https://github.com/superchargejs/) &nbsp;&middot;&nbsp;
> Twitter [@superchargejs](https://twitter.com/superchargejs)
