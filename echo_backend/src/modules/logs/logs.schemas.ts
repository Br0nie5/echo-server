export const LogCategorySchema = {
  $id: 'LogCategory',
  type: 'string',
  enum: ['SUCCESS', 'INFO', 'WARNING', 'ERROR']
} as const

export const LogSchema = {
  $id: 'Log',
  type: 'object',
  properties: {
    id: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    groupName: { type: 'string' },
    fileName: { type: 'string' },
    jobId: { type: 'integer' },
    category: { $ref: 'LogCategory#' },
    message: { type: 'string' },
    callFile: { type: 'string' },
    callLine: { type: 'integer' }
  },
  required: ['id', 'date', 'fileName', 'jobId', 'category', 'message'],
  additionalProperties: false
} as const
