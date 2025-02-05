import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;

  constructor() {
    this.stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!, {
      stripeAccount: "acct_1QnDfMRsmaUdhKRS",
    });
  }

  async processPayment(
    paymentMethodId: string,
    cart: any[],
    orderDetails: any,
    restaurantName: string
  ) {
    try {
      let apiUrl: string = "https://payments.gobbl.ai/api";

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

      let sellerId = "acct_1QnDfMRsmaUdhKRS";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.userId;

      const response = await fetch(`${apiUrl}/payment/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItems,
          sellerId,
          userId, // Add userId to request
          restaurantName, // Pass the restaurant name from parameter
          paymentMethodId,
          customerDetails: {
            name: orderDetails.name,
            email: orderDetails.email,
            address: orderDetails.address,
            phone: orderDetails.phone,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Payment processing failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
