export const EchoErrorSchema = {
  $id: 'EchoError',
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string' }
  },
  required: ['statusCode', 'message']
} as const
