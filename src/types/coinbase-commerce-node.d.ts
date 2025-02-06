declare module 'coinbase-commerce-node' {
  interface ChargeData {
    id: string;
    code: string;
    name: string;
    description: string;
    pricing_type: string;
    local_price: {
      amount: string;
      currency: string;
    };
    metadata: {
      userId: string;
      coins: number;
      [key: string]: string | number;
    };
  }

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
        metadata: {
          userId: string;
          coins: number;
          [key: string]: string | number;
        };
      }): Promise<ChargeData>;
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