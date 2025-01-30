import { loadStripe } from "@stripe/stripe-js";

class StripeService {
  private stripe: Promise<any>;

  constructor() {
    // Initialize Stripe with your publishable key
    this.stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
  }

  async createCheckoutSession(cart: any[], orderDetails: any) {
    try {
      console.log("hitting 1");
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

      let sellerId = "acct_1QmrcrH8oBYxi1Wf";
      // Create checkout session
      const response = await fetch(
        "https://testapi.gobbl.io/api/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineItems,
            sellerId,
            customerDetails: {
              name: orderDetails.name,
              email: orderDetails.email,
              address: orderDetails.address,
              phone: orderDetails.phone,
            },
          }),
        }
      );
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
