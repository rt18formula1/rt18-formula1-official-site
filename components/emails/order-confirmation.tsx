import * as React from "react";

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  totalPrice: number;
}

export const OrderConfirmationEmail: React.FC<Readonly<OrderConfirmationEmailProps>> = ({
  orderId,
  customerName,
  totalPrice,
}) => (
  <div style={{ fontFamily: "sans-serif", color: "#000" }}>
    <h1>Thank you for your order, {customerName}!</h1>
    <p>We've received your payment for order <strong>#{orderId.slice(0, 8)}</strong>.</p>
    <p>Total Amount: <strong>¥{totalPrice.toLocaleString()}</strong></p>
    <hr />
    <p>We'll notify you as soon as your items are shipped or ready for download.</p>
    <p>Regards,<br />rt18_formula1 Team</p>
  </div>
);
