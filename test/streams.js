'use strict'

const Stream = require('..')
const GetStream = require('get-stream')
const { Readable, Writable, Transform } = require('stream')

describe('Streams', () => {
  it('creates a stream', async () => {
    expect(
      await GetStream(
        Stream('supercharge').asStream()
      )
    ).toEqual('supercharge')
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

    expect(result).toEqual([1, 2])
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

    expect(results).toEqual([{ name: 'Marcus', supercharged: true }])
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

    expect(result).toEqual([{ name: 'Marcus', supercharged: true }])
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

    expect(result).toEqual([2, 4, 6])
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

    expect(result).toEqual([10, 20, 30])
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

    expect(result).toEqual([2, 2, 2])
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

    expect(result).toEqual([1, 1, 1])
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

    expect(result).toEqual([10])
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

      expect(true).toEqual(false) // should not be reached
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toEqual('map error')
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
        expect(error.message).toEqual('stream error')
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

      expect(true).toEqual(false) // should not be reached
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain('Missing destination')
    }
  })
})
