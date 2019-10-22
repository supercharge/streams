'use strict'

const { promisify } = require('util')
const { pipeline } = require('stream')
const Pipeline = promisify(pipeline)
const EventEmitter = require('events')
const Stream = require('./pending-stream')
const Queue = require('@supercharge/queue-datastructure')

class StreamProxy extends EventEmitter {
  /**
   * Create a new streaming instance.
   *
   * @param {Stream} items
   *
   * @returns {StreamProxy}
   */
  constructor (items, callChain = []) {
    super()

    this.items = items
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
   * Pipes the stream through the given `transform` function.
   * You may also pass in an instance of a Node.js
   * `Transform` stream to this `through` method.
   *
   * @param {Function} transform
   *
   * @returns {StreamProxy}
   */
  through (transform) {
    return this._enqueue('through', transform)
  }

  /**
   * Alias for `.pipe`. Processes the streaming
   * pipeline and * ultimately pipes all chunks
   * into the `destination` stream.
   *
   * @returns {Promise}
   */
  async into (destination) {
    return this.pipe(destination)
  }

  /**
   * Processes the streaming pipeline and ultimately
   * pipes all chunks into the `destination` stream.
   *
   * @returns {Promise}
   */
  async pipe (destination) {
    if (!destination) {
      throw new Error('Missing destination stream for .pipe call')
    }

    const streams = this._streamsForPipeline().concat(destination)

    await Pipeline(...streams)
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
   * Creates the array of streams which build the streaming pipeline.
   *
   * @returns {Array}
   */
  _streamsForPipeline () {
    const stream = Stream.inObjectMode(this.objectMode).from(this.items)
    const streams = [stream.asStream()]

    while (this.callChain.isNotEmpty()) {
      const { method, callback, data } = this.callChain.dequeue()

      streams.push(
        stream[method](callback, data)
      )
    }

    return streams
  }

  /**
   * Creates and processes the stream pipeline.
   *
   * @param destination
   *
   * @returns {Readable}
   */
  _process () {
    const streams = this._streamsForPipeline()

    return streams.length === 1
      ? streams[0]
      : pipeline(...streams, error => {
        if (error) {
          this.emit('error', error)
          this.emit('end')
        }
      })
  }
}

module.exports = StreamProxy
