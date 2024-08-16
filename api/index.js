const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const stripe = require("stripe")(
  "sk_test_51PIrfLRpqezBlhwYKUt3jNFVpuQH47gGwdRn3Wfq89lOtyEerpQ81HyFF8ZJwApctKvcz7VAk7ERdHYMY6jDX95E00ZylWbkm0"
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello world");
});

dotenv.config();

app.use(bodyParser.json());

const dataFilePath = path.join(__dirname, "./data/products.json");
let products = JSON.parse(fs.readFileSync(dataFilePath));

const getNextId = () => {
  const ids = products.map((product) => product.id);
  return Math.max(...ids) + 1;
};

app.get("/products", (req, res) => {
  console.log("GET /products called");
  res.json(products);
  console.log("Loaded products:", products);
});

app.get("/products/:id", (req, res) => {
  const productId = req.params.id;
  const product = products.find((p) => p.id === parseInt(productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
  } else {
    res.json(product);
  }
});

app.post("/products", (req, res) => {
  const { title, author, price } = req.body;
  if (!title || !author || typeof price !== "number") {
    return res.status(400).json({
      error: "Title, author, and price are required and price must be a number",
    });
  }
  const newProduct = {
    id: getNextId(),
    title,
    author,
    price,
  };
  products.push(newProduct);
  fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
  res.status(201).json(newProduct);
});

app.put("/products/:id", (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  const index = products.findIndex((p) => p.id === parseInt(productId));
  if (index === -1) {
    res.status(404).json({ error: "Product not found" });
  } else {
    products[index] = { ...products[index], ...updatedProduct };
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
    res.json(products[index]);
  }
});

app.delete("/products/:id", (req, res) => {
  const productId = req.params.id;
  const index = products.findIndex((p) => p.id === parseInt(productId));
  if (index === -1) {
    res.status(404).json({ error: "Product not found" });
  } else {
    products.splice(index, 1);
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
    res.sendStatus(204);
  }
});

const YOUR_DOMAIN = "http://localhost:8000";

app.post("/create-checkout-session", async (req, res) => {
  const productId = req.body.product_id;
  const product = products.find((p) => p.id === parseInt(productId));

  if (!product) {
    console.error("Product not found for ID:", productId);
    return res.status(404).json({ error: "Product not found" });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "sek",
          product_data: {
            name: product.title,
          },
          unit_amount: product.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}/pages/successfulPayment.php`,
    cancel_url: `${YOUR_DOMAIN}/pages/cancelledPayment.php`,
  });

  res.redirect(303, session.url);
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
