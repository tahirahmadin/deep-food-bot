import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;
  private apiUrl: string = "https://payments.gobbl.ai/api";

  constructor() {
    this.stripe = loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
        "pk_test_51QnDfMRsmaUdhKRSXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      {
        stripeAccount: "acct_1QnDfMRsmaUdhKRS",
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
            sellerId: "acct_1QnDfMRsmaUdhKRS",
            userId,
            restaurantName,
            restaurantId,
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
}

export const stripeService = new StripeService();
