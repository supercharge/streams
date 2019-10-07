'use strict'

const StreamProxy = require('./src/streams-proxy')

const stream = stream => {
  return new StreamProxy(stream)
}

module.exports = stream
module.exports.default = stream
