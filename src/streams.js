'use strict'

const { Transform } = require('stream')

class Streams {
  /**
   * Create a new streaming instance.
   *
   * @param {Stream} stream
   *
   * @returns {Streams}
   */
  constructor ({ stream, objectMode = false }) {
    this.stream = stream
    this.objectMode = objectMode
  }

  /**
   * Returns the resulting stream.
   *
   * @returns {Readable}
   */
  asStream () {
    return this.stream
  }

  /**
   * Asynchronously filter data from the stream. The `callback`
   * testing function should return `true` if an item
   * should be included in the resulting collection.
   *
   * @param {Function} test
   *
   * @returns {Streams}
   */
  filter (test) {
    return this.through(async (chunk, encoding) => {
      const result = await test(chunk, encoding)

      return result ? chunk : null
    })
  }

  /**
   * Creates a transform stream that processes the given
   * `callback` function and passes the resulting
   * values and errors up to the next layer.
   *
   * @param {Function} callback
   *
   * @returns {Transform}
   */
  through (callback) {
    return new Transform({
      readableObjectMode: this.objectMode,
      writableObjectMode: this.objectMode,

      async transform (chunk, encoding, next) {
        try {
          next(null, await callback(chunk, encoding))
        } catch (error) {
          next(error)
        }
      }
    })
  }
}

module.exports = Streams
