'use strict'

const StreamProxy = require('./src/streams-proxy')

const stream = streamOrItems => {
  return new StreamProxy(streamOrItems)
}

module.exports = stream
module.exports.default = stream
