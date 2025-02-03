import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;

  constructor() {
    // Initialize Stripe with your publishable key
    this.stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!, {
      stripeAccount: "acct_1QnDfMRsmaUdhKRS",
    });
  }
  async createCheckoutSession(cart: any[], orderDetails: any) {
    try {
      let apiUrl: string = "https://payments.gobbl.ai/api";

      // Create line items from cart
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
      // Create checkout session
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
          customerDetails: {
            name: orderDetails.name,
            email: orderDetails.email,
            address: orderDetails.address,
            phone: orderDetails.phone,
          },
          orderId: "#1234",
        }),
      });
      console.log("response");
      console.log(response);
      const session = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await this.stripe;
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
