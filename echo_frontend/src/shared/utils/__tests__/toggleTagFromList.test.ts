import { toggleTagFromList } from '../toggleTagFromList'

describe('toggleTagFromList', () => {
  it.each([
    { previousTags: [], tags: ['blue'] },
    { previousTags: ['red'], tags: ['red', 'blue'] },
    { previousTags: ['red', 'green'], tags: ['red', 'green', 'blue'] }
  ])(
    'Should add the tag at the end of $previousTags, which does not hold it',
    ({ previousTags, tags }) => {
      expect(toggleTagFromList(previousTags, 'blue')).toEqual(tags)
    }
  )

  it.each([
    { previousTags: ['blue'], tags: [] },
    { previousTags: ['red', 'blue', 'green'], tags: ['red', 'green'] }
  ])('Should remove the tag from $previousTags, which holds it', ({ previousTags, tags }) => {
    expect(toggleTagFromList(previousTags, 'blue')).toEqual(tags)
  })

  it('Should leave the list it is given as it is', () => {
    const previousTags = ['red', 'blue']

    toggleTagFromList(previousTags, 'blue')
    toggleTagFromList(previousTags, 'green')

    expect(previousTags).toEqual(['red', 'blue'])
  })
})
