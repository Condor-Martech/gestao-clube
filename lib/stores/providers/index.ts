import 'server-only'
import type { Store, StoreProvider } from '../types'
import { AppStoreProvider } from './app-store'
import { PlayStoreProvider } from './play-store'

export interface ProviderInputs {
  playPackageName?: string | null
  appStoreId?: string | null
}

export function getProvider(store: Store, inputs: ProviderInputs): StoreProvider {
  if (store === 'app_store') {
    if (!inputs.appStoreId) {
      throw new Error('appStoreId is required for App Store provider')
    }
    return new AppStoreProvider(inputs.appStoreId)
  }

  if (!inputs.playPackageName) {
    throw new Error('playPackageName is required for Play Store provider')
  }
  return new PlayStoreProvider(inputs.playPackageName)
}
