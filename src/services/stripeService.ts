import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;
  private apiUrl: string = import.meta.env.VITE_PUBLIC_BACKEND_API_URL;

  async getOrderStatus(orderId: string) {
    try {
      if (!orderId) {
        throw new Error("Order ID is required");
      }

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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch order status");
      }

      const data = await response.json();

      // Handle error response
      if (data.error) {
        throw new Error(data.message || "Failed to get order status");
      }

      // Return result directly since it contains "succeeded" or "failed"
      return data.result;
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
        stripeAccount: "",
      }
    );
  }

  async createPaymentIntent(
    cart: any[],
    orderDetails: any,
    restaurantName: string,
    userId: string,
    restaurantId: number,
    sellerId: string
  ) {
    try {
      console.log("Creating payment intent with seller ID:", sellerId);

      if (!sellerId || !sellerId.trim()) {
        throw new Error("Valid Stripe account ID is required");
      }

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
            sellerId: sellerId,
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
        const errorData = await response.text();
        throw new Error(errorData.message || "Failed to create payment intent");
      }

      const data = await response.json();
      console.log("Payment intent response:", data);

      if (!data.clientSecret) {
        throw new Error(
          "No client secret returned from payment intent creation"
        );
      }

      if (data.error) {
        throw new Error(data.error.message || "Payment intent creation failed");
      }

      return data.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  }

  async createCashIntent(
    cart: any[],
    orderDetails: any,
    restaurantName: string,
    userId: string,
    restaurantId: number
  ) {
    try {
      console.log("Creating payment intent with Cas:");

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

      const response = await fetch(`${this.apiUrl}/payment/create-cash-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          lineItems,
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
      });

      const data = await response.json();
      if (data.error) {
        throw new Error("Failed to create payment intent");
      }
      console.log("Payment intent response:", data);

      return data?.result;
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
    restaurantId: number,
    depositAddress: string
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
            sellerId: depositAddress,
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
