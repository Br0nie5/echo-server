import type { Log } from '../schemas/log.schema.js'

/** The seeds of the two hashes an id is made of, which together give it 106 bits. */
const HASH_SEEDS = [0, 1]

/** Length of the hexadecimal text of a 53-bit hash. */
const HASH_HEXADECIMAL_LENGTH = 14

/** Hashes `text` into an integer of 53 bits, which `seed` changes. */
const hashText = (text: string, seed: number): number => {
  // cyrb53, a public-domain hash: fast, without dependency, and the same in Node.js and in the
  // browser. Its constants are those of the algorithm.
  let firstHalf = 0xdeadbeef ^ seed
  let secondHalf = 0x41c6ce57 ^ seed

  for (let characterIndex = 0; characterIndex < text.length; characterIndex++) {
    const characterCode = text.charCodeAt(characterIndex)
    firstHalf = Math.imul(firstHalf ^ characterCode, 2654435761)
    secondHalf = Math.imul(secondHalf ^ characterCode, 1597334677)
  }

  firstHalf = Math.imul(firstHalf ^ (firstHalf >>> 16), 2246822507)
  firstHalf ^= Math.imul(secondHalf ^ (secondHalf >>> 13), 3266489909)
  secondHalf = Math.imul(secondHalf ^ (secondHalf >>> 16), 2246822507)
  secondHalf ^= Math.imul(firstHalf ^ (firstHalf >>> 13), 3266489909)

  return 4294967296 * (2097151 & secondHalf) + (firstHalf >>> 0)
}

/**
 * Creates the `id` of a log, from the log without it.
 *
 * It is a hash of `idNumber`, an integer, and of the `date`, `jobId`, `location`, `level`,
 * `message` and `origin` of the log, written as 28 hexadecimal characters: short whatever the log
 * holds, and another one as soon as one of these changes. `idNumber` tells apart the logs that have
 * all of those in common: it is usually the position of the log where it is stored.
 *
 * ```ts
 * const logs = noIdLogs.map((noIdLog, index) => ({ ...noIdLog, id: createLogId(noIdLog, index) }))
 * ```
 */
export const createLogId = (
  { date, jobId, location, level, message, origin }: Omit<Log, 'id'>,
  idNumber: number
): string => {
  const identifyingText = JSON.stringify({
    idNumber,
    date,
    jobId,
    location,
    level,
    message,
    origin
  })

  return HASH_SEEDS.map((seed) =>
    hashText(identifyingText, seed).toString(16).padStart(HASH_HEXADECIMAL_LENGTH, '0')
  ).join('')
}
