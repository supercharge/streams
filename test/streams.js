'use strict'

const Stream = require('..')
const Lab = require('@hapi/lab')
const { Readable } = require('stream')
const GetStream = require('get-stream')
const { expect } = require('@hapi/code')

const { describe, it } = (exports.lab = Lab.script())

describe('Streams', () => {
  it('creates a stream', async () => {
    expect(
      await GetStream(
        Stream('supercharge').asStream()
      )
    ).to.equal('supercharge')
  })

  it('accepts a stream', async () => {
    const stream = new Readable({
      objectMode: true,

      read () {
        this.push(1)
        this.push(2)
        this.push(null)
      }
    })

    expect(
      await GetStream.array(
        Stream(stream)
          .inObjectMode()
          .filter(item => item > 0)
          .asStream()
      )
    ).to.equal([1, 2])
  })

  it('.filter()', async () => {
    expect(
      await GetStream.array(
        Stream([
          { name: 'Marcus', supercharged: true },
          { name: 'Express-Dude', supercharged: false }
        ])
          .inObjectMode()
          .filter(item => item.supercharged)
          .asStream()
      )
    ).to.equal([{ name: 'Marcus', supercharged: true }])
  })
})
