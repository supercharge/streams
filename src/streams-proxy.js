'use strict'

const Stream = require('./pending-stream')
const { pipeline } = require('readable-stream')
const Queue = require('@supercharge/queue-datastructure')

class StreamProxy {
  /**
   * Create a new streaming instance.
   *
   * @param {Stream} items
   *
   * @returns {StreamProxy}
   */
  constructor (items, callChain = []) {
    this.items = items
    this.events = new Map()
    this.objectMode = false
    this.callChain = new Queue(callChain)
  }

  /**
   * Returns the resulting stream.
   *
   * @returns {Readable}
   */
  asStream () {
    return this._process()
  }

  /**
   * Activates object mode streams.
   *
   * @returns {StreamProxy}
   */
  inObjectMode () {
    this.objectMode = true

    return this
  }

  on (event, handler) {
    this.events.set(event, handler)

    return this
  }

  /**
   * Asynchronously filter data from the stream. The `callback`
   * testing function should return `true` if an item
   * should be included in the resulting collection.
   *
   * @param {Function} callback
   *
   * @returns {StreamProxy}
   */
  filter (callback) {
    return this._enqueue('filter', callback)
  }

  /**
   * Creates a transform stream that processes the given
   * `callback` function and passes the resulting
   * values and errors up to the next layer.
   *
   * @param {Function} callback
   *
   * @returns {StreamProxy}
   */
  map (callback) {
    return this._enqueue('map', callback)
  }

  /**
   * Enqueues an operation in the collection pipeline
   * for processing at a later time.
   *
   * @param {String} method
   * @param {Function} callback
   * @param {*} data
   *
   * @returns {CollectionProxy}
   */
  _enqueue (method, callback, data) {
    this.callChain.enqueue({ method, callback, data })

    return this
  }

  /**
   * Processes the collection pipeline and returns
   * all items in the collection.
   *
   * @returns {StreamProxy}
   */
  pipe (output) {
    this._process(output).pipe(output)
  }

  /**
   * Creates and processes the stream pipeline.
   *
   * @returns {Readable}
   */
  _process () {
    const stream = Stream.inObjectMode(this.objectMode).from(this.items)
    const streams = [stream.asStream()]

    while (this.callChain.isNotEmpty()) {
      const { method, callback, data } = this.callChain.dequeue()

      streams.push(
        callback ? stream[method](callback, data) : stream[method](data)
      )
    }

    if (streams.length > 1) {
      return pipeline(...streams, error => {
        if (error) {
          this._handle(error)
        }
      })
    }

    return stream.asStream()
  }

  _handle (error) {
    if (this.events.get('error')) {
      return this.events.get('error')(error)
    }

    throw error
  }
}

module.exports = StreamProxy
