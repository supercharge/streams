'use strict'

const Stream = require('..')
const Lab = require('@hapi/lab')
const GetStream = require('get-stream')
const { expect } = require('@hapi/code')
const { Readable, Writable, Transform } = require('stream')

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

    const result = await GetStream.array(
      await Stream(stream)
        .inObjectMode()
        .filter(item => item > 0)
        .asStream()
    )

    expect(result).to.equal([1, 2])
  })

  it('.filter', async () => {
    const results = await GetStream.array(
      Stream([
        { name: 'Marcus', supercharged: true },
        { name: 'Express-Dude', supercharged: false }
      ])
        .inObjectMode()
        .filter(item => item.supercharged)
        .asStream()
    )

    expect(results).to.equal([{ name: 'Marcus', supercharged: true }])
  })

  it('.pipe', async () => {
    const result = []

    const output = new Writable({
      objectMode: true,
      write (chunk, _, next) {
        result.push(chunk)
        next()
      }
    })

    await Stream([
      { name: 'Marcus', supercharged: true },
      { name: 'Express-Dude', supercharged: false }
    ])
      .inObjectMode()
      .filter(item => item.supercharged)
      .pipe(output)

    expect(result).to.equal([{ name: 'Marcus', supercharged: true }])
  })

  it('.map', async () => {
    const result = []

    const output = new Writable({
      objectMode: true,
      write (chunk, __, next) {
        result.push(chunk)
        next()
      }
    })

    await Stream([1, 2, 3])
      .inObjectMode()
      .map(item => item * 2)
      .into(output)

    expect(result).to.equal([2, 4, 6])
  })

  it('.through function', async () => {
    const result = []

    const output = new Writable({
      objectMode: true,
      write (chunk, __, next) {
        result.push(chunk)
        next()
      }
    })

    await Stream([1, 2, 3])
      .inObjectMode()
      .through(item => {
        return item * 10
      })
      .into(output)

    expect(result).to.equal([10, 20, 30])
  })

  it('.through transform (into)', async () => {
    const transform = new Transform({
      objectMode: true,

      transform (_, __, next) {
        return next(null, 1)
      }
    })

    const result = []

    const output = new Writable({
      objectMode: true,
      write (chunk, __, next) {
        result.push(chunk)
        next()
      }
    })

    await Stream([1, 2, 3])
      .inObjectMode()
      .through(transform)
      .through(item => item * 2)
      .into(output)

    expect(result).to.equal([2, 2, 2])
  })

  it('.through transform (as stream)', async () => {
    const transform = new Transform({
      objectMode: true,
      transform (_, __, next) { next(null, 1) }
    })

    const result = await GetStream.array(
      Stream([1, 2, 3])
        .inObjectMode()
        .through(transform)
        .asStream()
    )

    expect(result).to.equal([1, 1, 1])
  })

  it('pipeline', async () => {
    const transform = new Transform({
      objectMode: true,
      transform (chunk, __, next) { next(null, chunk) }
    })

    const result = await GetStream.array(
      Stream([1, 2, 3])
        .inObjectMode()
        .through(transform)
        .map(item => item * 10)
        .filter(item => item < 20)
        .asStream()
    )

    expect(result).to.equal([10])
  })

  it('catch error', async () => {
    const output = new Writable({
      objectMode: true,
      write (_, __, next) { next(_) }
    })

    try {
      await Stream([1, 2, 3])
        .inObjectMode()
        .map(() => {
          throw new Error('map error')
        })
        .into(output)

      expect(true).to.equal(false) // should not be reached
    } catch (error) {
      expect(error).to.exist()
      expect(error.message).to.equal('map error')
    }
  })

  it('.on stream error', async () => {
    let error

    Stream([1, 2, 3])
      .inObjectMode()
      .map(() => {
        throw new Error('stream error')
      })
      .on('error', err => {
        error = err
      })
      .on('end', () => {
        expect(error.message).to.equal('stream error')
      })
      .asStream()
  })

  it('fails to pipe into non-available destination', async () => {
    try {
      await Stream([1, 2, 3])
        .inObjectMode()
        .map(() => {
          return 1
        })
        .into()

      expect(true).to.equal(false) // should not be reached
    } catch (error) {
      expect(error).to.exist()
      expect(error.message).to.include('Missing destination')
    }
  })
})
