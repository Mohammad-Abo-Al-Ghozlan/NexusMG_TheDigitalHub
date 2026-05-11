export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            ux_mode?: 'popup' | 'redirect'
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              width?: string
              text?: string
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}
