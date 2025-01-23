export interface CoinPackage {
  id: number;
  coins: number;
  price: number;
}

export const createPayPalOrder = async (userId: string, coinPackage: CoinPackage) => {
  try {
    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        coins: coinPackage.coins,
        amount: coinPackage.price,
      }),
    });

    const order = await response.json();
    return order.id;
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    throw new Error("Failed to create order");
  }
};

export const onApprove = async (userId: string, orderId: string) => {
  try {
    const response = await fetch("/api/payments/capture-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        userId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error capturing PayPal order:", err);
    throw new Error("Failed to capture payment");
  }
}; 