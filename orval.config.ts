export default {
  api: {
    input: './openApi.json',
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
