export const AuthTokenSchema = {
  $id: 'AuthToken',
  type: 'object',
  properties: {
    success: { type: 'boolean', description: 'True if authentication was successful.' },
    message: { type: 'string', description: 'Status message.' }
  },
  required: ['success']
} as const

export const LoginRequestSchema = {
  $id: 'LoginRequest',
  type: 'object',
  properties: {
    username: { type: 'string', description: 'The user username.' },
    password: { type: 'string', description: 'The user password.' }
  },
  required: ['username', 'password']
} as const

export const SignUpRequestSchema = {
  $id: 'SignUpRequest',
  type: 'object',
  properties: {
    username: { type: 'string', description: 'The wanted username.' },
    password: { type: 'string', description: 'The wanted password.' }
  },
  required: ['username', 'password']
} as const
