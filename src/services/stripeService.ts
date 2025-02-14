import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;
  private apiUrl: string = "https://payments.gobbl.ai/api";

  async getOrderStatus(orderId: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/payment/getOrderPaymentStatus?orderId=${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch order status");
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error("Error fetching order status:", error);
      throw error;
    }
  }

  constructor() {
    this.stripe = loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
        "pk_test_51QnDfMRsmaUdhKRSXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      {
        stripeAccount: "acct_1Qs3zeJDUPLwCpmp",
      }
    );
  }

  async createPaymentIntent(
    cart: any[],
    orderDetails: any,
    restaurantName: string,
    userId: string,
    restaurantId: number
  ) {
    try {
      const lineItems = cart.map((item) => ({
        price_data: {
          currency: "aed",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(parseFloat(item.price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      const response = await fetch(
        `${this.apiUrl}/payment/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            lineItems,
            sellerId: "acct_1Qs3zeJDUPLwCpmp",
            userId,
            restaurantName,
            restaurantId,
            cart,
            customerDetails: {
              name: orderDetails.name,
              email: orderDetails.email,
              address: orderDetails.address,
              phone: orderDetails.phone,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  }

  async getStripe() {
    return await this.stripe;
  }

  async createCryptoOrder(
    cart: any[],
    orderDetails: any,
    restaurantName: string,
    userId: string,
    restaurantId: number
  ) {
    try {
      console.log("Creating crypto order with data:", {
        cart,
        orderDetails,
        restaurantName,
        userId,
        restaurantId,
      });

      const lineItems = cart.map((item) => ({
        price_data: {
          currency: "aed",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(parseFloat(item.price) * 100),
        },
        quantity: item.quantity,
      }));

      const response = await fetch(
        `${this.apiUrl}/payment/create-crypto-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            lineItems,
            sellerId: "acct_1Qs3zeJDUPLwCpmp",
            userId,
            restaurantName,
            restaurantId,
            cart,
            customerDetails: {
              name: orderDetails.name,
              email: orderDetails.email || `${userId}@gobbl.ai`, // Provide fallback email
              address: orderDetails.address,
              phone: orderDetails.phone,
            },
            txHash: orderDetails.transactionHash, // Add transaction hash
            network: orderDetails.network, // Add network info
          }),
        }
      );

      const responseText = await response.text();
      console.log("Crypto order API response:", responseText);

      if (!response.ok) {
        throw new Error(`Failed to create crypto order: ${responseText}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating crypto order:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
