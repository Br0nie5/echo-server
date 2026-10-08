/** A row of the `users` table. */
export interface UserDto {
  id: number
  username: string
  password_hash: string
  is_admin: 0 | 1
}
