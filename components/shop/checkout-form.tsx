"use client";

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

export function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/shop/checkout/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message ?? "An error occurred");
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement id="payment-element" />
      
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm hover:bg-gray-100 transition-all shadow-lg active:scale-95 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : `Pay ¥${amount.toLocaleString()}`}
      </button>
      
      {message && (
        <div id="payment-message" className="text-red-400 text-xs font-bold text-center">
          {message}
        </div>
      )}
    </form>
  );
}
