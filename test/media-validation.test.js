import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_MEDIA_BYTES,
  ALLOWED_MEDIA_TYPES,
  sniffMediaType,
  validateMedia,
  safeMediaName,
} from '../src/content/media.js'

/**
 * Nina uploads the images. The file name and the declared extension are attacker
 * controlled, so type is decided by the leading bytes and never by the extension.
 */

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)])
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
])
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(64, 1)])
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP'),
  Buffer.alloc(64, 1),
])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
const HTML = Buffer.from('<!DOCTYPE html><html><body><script>alert(1)</script></body></html>')
const ELF = Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(64, 1)])
const ZIP = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64, 1)])
const PDF = Buffer.from('%PDF-1.7\n%rest')

describe('the allowed type list is a raster whitelist', () => {
  test('only raster image types are allowed and svg is not among them', () => {
    assert.deepEqual([...ALLOWED_MEDIA_TYPES].sort(), ['image/jpeg', 'image/png', 'image/webp'])
  })
})

describe('type is decided by the leading bytes', () => {
  test('recognised rasters sniff correctly', () => {
    assert.equal(sniffMediaType(JPEG), 'image/jpeg')
    assert.equal(sniffMediaType(PNG), 'image/png')
    assert.equal(sniffMediaType(WEBP), 'image/webp')
    assert.equal(sniffMediaType(GIF), 'image/gif')
  })

  test('anything unrecognised sniffs to null rather than to a guess', () => {
    assert.equal(sniffMediaType(SVG), null)
    assert.equal(sniffMediaType(ELF), null)
    assert.equal(sniffMediaType(Buffer.alloc(0)), null)
  })
})

describe('active content is refused', () => {
  const hostile = [
    ['an svg carrying a script', SVG, 'hero.svg'],
    ['an svg renamed to png', SVG, 'hero.png'],
    ['an html document renamed to jpg', HTML, 'hero.jpg'],
    ['an elf executable renamed to png', ELF, 'hero.png'],
    ['a zip archive renamed to jpg', ZIP, 'hero.jpg'],
    ['a pdf renamed to png', PDF, 'hero.png'],
  ]

  for (const [label, buffer, name] of hostile) {
    test(`${label} is rejected`, () => {
      const result = validateMedia(buffer, name)
      assert.equal(result.ok, false, `${label} was accepted`)
      assert.ok(result.reason, 'a rejection must carry an operator readable reason')
    })
  }

  test('a gif sniffs correctly but is still refused, because it is not on the whitelist', () => {
    const result = validateMedia(GIF, 'hero.gif')
    assert.equal(result.ok, false)
    assert.match(result.reason, /image\/gif/)
  })

  test('the rejection names the sniffed type, so an operator can tell type from size', () => {
    assert.equal(validateMedia(SVG, 'a.png').code, 'unrecognised_type')
    assert.equal(validateMedia(GIF, 'a.gif').code, 'disallowed_type')
  })
})

describe('size is bounded', () => {
  test('the cap is a stated number rather than an accident', () => {
    assert.equal(MAX_MEDIA_BYTES, 8 * 1024 * 1024)
  })

  test('a file over the cap is refused with a size code', () => {
    const huge = Buffer.concat([JPEG, Buffer.alloc(MAX_MEDIA_BYTES + 1)])
    const result = validateMedia(huge, 'hero.jpg')
    assert.equal(result.ok, false)
    assert.equal(result.code, 'too_large')
  })

  test('an empty file is refused', () => {
    const result = validateMedia(Buffer.alloc(0), 'hero.jpg')
    assert.equal(result.ok, false)
    assert.equal(result.code, 'empty')
  })
})

describe('valid media is accepted with its real type', () => {
  test('a jpeg is accepted', () => {
    const result = validateMedia(JPEG, 'hero.jpg')
    assert.equal(result.ok, true, result.reason)
    assert.equal(result.type, 'image/jpeg')
  })

  test('a png with a wrong extension is accepted on its real type and gets the right extension', () => {
    const result = validateMedia(PNG, 'hero.jpg')
    assert.equal(result.ok, true)
    assert.equal(result.type, 'image/png')
    assert.equal(result.extension, '.png')
  })
})

/*
 * Naming is deliberately stable rather than content addressed. An article that is
 * already published, and a social card a platform has already scraped, both point at a
 * fixed URL. Hashing the bytes into the name would turn every image correction into a
 * new URL and orphan the old one, which is the opposite of what replacing an image
 * should do. Keeping the name means a replacement lands in place and every existing
 * reference keeps resolving.
 */
describe('media names are stable, safe and derived only from the file name', () => {
  test('a name is lowercased and separated with hyphens', () => {
    assert.equal(safeMediaName('My Photo.JPG', 'image/jpeg'), 'my-photo.jpg')
  })

  test('the same source name always produces the same output name, so a replacement lands in place', () => {
    const other = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)])
    assert.equal(safeMediaName('a.jpg', 'image/jpeg'), safeMediaName('a.jpg', 'image/jpeg'))
    // the bytes are not an input at all, which is the property that keeps the URL stable
    assert.equal(validateMedia(JPEG, 'a.jpg').ok, validateMedia(other, 'a.jpg').ok)
  })

  test('the extension follows the sniffed type, not the claimed one', () => {
    assert.equal(safeMediaName('hero.jpg', 'image/png'), 'hero.png')
    assert.equal(safeMediaName('hero.png', 'image/webp'), 'hero.webp')
  })

  test('a hostile file name cannot escape the media directory', () => {
    const name = safeMediaName('../../etc/passwd.jpg', 'image/jpeg')
    assert.equal(name, 'passwd.jpg')
    assert.doesNotMatch(name, /\//)
    assert.doesNotMatch(name, /\.\./)
  })

  test('a windows style path is reduced to its basename too', () => {
    assert.equal(safeMediaName('C:\\Users\\nina\\hero.jpg', 'image/jpeg'), 'hero.jpg')
  })

  test('a name that is entirely punctuation still produces a usable file name', () => {
    assert.equal(safeMediaName('***.jpg', 'image/jpeg'), 'image.jpg')
  })

  test('a leading dot cannot produce a hidden file', () => {
    assert.equal(safeMediaName('.htaccess.jpg', 'image/jpeg'), 'htaccess.jpg')
  })
})
