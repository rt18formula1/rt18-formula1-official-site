const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createProduct() {
  try {
    const product = await stripe.products.create({
      name: "Hamlet (e-book)",
      description: "A Shakespearean tragedy",
      tax_code: "txcd_10103100",
      default_price_data: {
        unit_amount: 1000,
        currency: "usd"
      }
    }, {
      headers: {
        'stripe-version': '2026-02-25.preview'
      }
    });

    console.log("Product Created Successfully!");
    console.log("Product ID:", product.id);
    console.log("Price ID:", product.default_price);
  } catch (err) {
    console.error("Error creating product:", err.message);
  }
}

createProduct();
