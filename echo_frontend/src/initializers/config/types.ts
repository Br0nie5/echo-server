import type { FrontConfig } from '../../shared/config/frontConfig'

/** What `ConfigProvider` provides. */
export interface ConfigContextValue {
  config: FrontConfig
}
