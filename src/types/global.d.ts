export {};

declare global {
  interface CoinbaseCommerceButton {
    setup: (config: {
      checkoutId: string;
      custom?: string;
      onSuccess?: () => void;
      onFailure?: () => void;
    }) => void;
    show: () => void;
  }

  interface Window {
    CoinbaseCommerceButton: CoinbaseCommerceButton;
  }
} 