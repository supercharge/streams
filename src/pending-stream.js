'use strict'

const Stream = require('./streams')
const { Readable } = require('stream')
const IntoStream = require('into-stream')

class PendingStream {
  /**
   * Activates object mode streams.
   *
   * @returns {PendingStream}
   */
  static inObjectMode (objectMode) {
    this.objectMode = objectMode

    return this
  }

  /**
   * Creates a readable stream wrapping `items`
   * and returns a streaming instance.
   *
   * @returns {Streams}
   */
  static from (items) {
    return this.wrap(items).intoStream()
  }

  /**
   * Creates a readable stream wrapping `items`. Ensures
   * an object mode stream if object mode is active.
   *
   * @param {*} items
   *
   * @returns {PendingStream}
   */
  static wrap (items) {
    this.isReadableStream(items)
      ? this.stream = items
      : this.stream = this.createReadableFrom(items)

    return this
  }

  /**
   * Determine whether the given `stream` is an instance of `Readable`.
   *
   * @param {*} stream
   *
   * @returns {Boolean}
   */
  static isReadableStream (stream) {
    return stream instanceof Readable
  }

  /**
   * Create a stream from the given `items`.
   *
   * @param {*} items
   *
   * @returns {ReadableStream}
   */
  static createReadableFrom (items) {
    return this.objectMode
      ? IntoStream.object(items)
      : IntoStream(items)
  }

  /**
   * Creates a streaming instance.
   *
   * @returns {Streams}
   */
  static intoStream () {
    return new Stream({
      stream: this.stream,
      objectMode: this.objectMode
    })
  }
}

module.exports = PendingStream
