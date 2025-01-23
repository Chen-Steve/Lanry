declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class PayPalHttpClient {
      constructor(environment: Environment);
      execute<T>(request: OrdersCreateRequest | OrdersCaptureRequest): Promise<{ result: T }>;
    }

    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    type Environment = SandboxEnvironment | LiveEnvironment;
  }

  namespace orders {
    interface OrderResult {
      id: string;
      status: string;
      purchase_units: Array<{
        amount: {
          currency_code: string;
          value: string;
        };
        description: string;
      }>;
    }

    class OrdersCreateRequest {
      prefer(value: string): void;
      requestBody(body: {
        intent: string;
        purchase_units: Array<{
          amount: {
            currency_code: string;
            value: string;
          };
          description: string;
        }>;
      }): void;
    }

    class OrdersCaptureRequest {
      constructor(orderId: string);
    }
  }
} 