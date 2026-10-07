export default {
  api: {
    input: {
      target: './openApi.json',
      // Log and LogCategory are derived from their zod schemas in echo_utilities: the API schemas are
      // generated from them, not the other way round.
      filters: {
        mode: 'exclude',
        schemas: ['Log', 'LogCategory']
      }
    },
    output: {
      mode: 'tags-split',
      target: './__generated__',
      schemas: './__generated__/types',
      fileExtension: '.ts',
      client: null,
      indexFiles: false
    }
  }
}
