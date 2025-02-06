declare module 'coinbase-commerce-node' {
  export class Client {
    static init(apiKey: string): Client;
    charges: {
      create(data: {
        name: string;
        description: string;
        pricing_type: string;
        local_price: {
          amount: string;
          currency: string;
        };
        metadata: Record<string, any>;
      }): Promise<any>;
    };
  }

  export class Webhook {
    static verifyEventBody(
      rawBody: string,
      signature: string,
      secret: string
    ): {
      type: string;
      data: {
        metadata: {
          userId: string;
          coins: string;
        };
      };
    };
  }
} 