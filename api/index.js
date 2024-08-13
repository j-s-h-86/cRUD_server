const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello world");
});

dotenv.config();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Load initial product data
const dataFilePath = path.join(__dirname, "./data/products.json");
let products = JSON.parse(fs.readFileSync(dataFilePath));

// Helper function to get the next product ID
const getNextId = () => {
  const ids = products.map((product) => product.id);
  return Math.max(...ids) + 1;
};

// Get all products
app.get("/products", (req, res) => {
  res.json(products);
});

// Get a single product by ID
app.get("/products/:id", (req, res) => {
  const productId = req.params.id;
  const product = products.find((p) => p.id === parseInt(productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
  } else {
    res.json(product);
  }
});

// Add a new product
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

// Update a product by ID
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

// Delete a product by ID
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

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
