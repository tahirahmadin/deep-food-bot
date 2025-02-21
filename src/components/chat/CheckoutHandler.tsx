import React from "react";
import { QueryType } from "../../context/ChatContext";

interface CheckoutHandlerProps {
  state: any;
  dispatch: any;
  input: string;
  setInput: (value: string) => void;
}

export const useCheckoutHandler = ({
  state,
  dispatch,
  input,
  setInput,
}: CheckoutHandlerProps) => {
  const handleCheckoutFlow = () => {
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      queryType: QueryType.CHECKOUT,
    };
    dispatch({ type: "ADD_MESSAGE", payload: userMessage });

    if (state.checkout.paymentMethod) {
      return;
    }

    if (state.checkout.step === "details") {
      handleDetailsStep();
    } else if (state.checkout.step === "payment") {
      handlePaymentStep();
    }

    setInput("");
  };

  const handleDetailsStep = () => {
    if (!state.checkout.orderDetails.name) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { name: input.trim() },
      });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Great! What's your delivery address?",
          isBot: true,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.CHECKOUT,
        },
      });
    } else if (!state.checkout.orderDetails.address) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { address: input.trim() },
      });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Perfect! And your phone number?",
          isBot: true,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.CHECKOUT,
        },
      });
    } else if (!state.checkout.orderDetails.phone) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { phone: input.trim() },
      });
      dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Great! Now for payment. Please enter your card number:",
          isBot: true,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.CHECKOUT,
        },
      });
    }
  };

  const handlePaymentStep = () => {
    if (!state.checkout.orderDetails.cardNumber) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { cardNumber: input.trim() },
      });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Please enter the card expiry date (MM/YY):",
          isBot: true,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.CHECKOUT,
        },
      });
    } else if (!state.checkout.orderDetails.expiryDate) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { expiryDate: input.trim() },
      });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Finally, please enter the CVV:",
          isBot: true,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.CHECKOUT,
        },
      });
    } else if (!state.checkout.orderDetails.cvv) {
      dispatch({
        type: "UPDATE_ORDER_DETAILS",
        payload: { cvv: input.trim() },
      });
      completeOrder();
    }
  };

  const completeOrder = () => {
    const total = state.cart
      .reduce(
        (sum: number, item: any) =>
          sum + parseFloat(item.price) * item.quantity,
        0
      )
      .toFixed(2);

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now() + 1,
        text: `Thank you for your order! Your total is $${total}. Your order will be delivered to ${state.checkout.orderDetails.address}. We'll send updates to ${state.checkout.orderDetails.phone}.`,
        isBot: true,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: QueryType.CHECKOUT,
      },
    });
    dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
  };

  return { handleCheckoutFlow };
};
