const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// ===== MongoDB Setup =====
mongoose.connect("mongodb://localhost:27017/movieReviewDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const reviewSchema = new mongoose.Schema({
  movieId: String,
  title: String,
  username: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", reviewSchema);

// ===== Popular Movies Hardcoded =====
const popularMovies = [
  "Avengers",
  "Spider-Man",
  "Batman",
  "Inception",
  "Avatar",
  "Top Gun",
  "The Godfather",
  "Parasite",
  "Interstellar",
  "Joker"
];

// ===== Fetch movies API =====
app.get("/movies", async (req, res) => {
  const query = req.query.query || "";
  try {
    if (query) {
      // Search query
      const response = await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=4ef5a84b`);
      res.json(response.data.Search || []);
    } else {
      // Fetch all popular movies in parallel
      const promises = popularMovies.map(title =>
        axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(title)}&type=movie&apikey=4ef5a84b`)
      );
      const results = await Promise.all(promises);
      const movies = results.flatMap(r => r.data.Search || []);
      res.json(movies);
    }
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// ===== Movie detail + reviews =====
app.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  try {
    const response = await axios.get(`https://www.omdbapi.com/?i=${movieId}&plot=full&apikey=4ef5a84b`);
    const movie = response.data;
    const reviews = await Review.find({ movieId });
    res.json({ movie, reviews });
  } catch (err) {
    console.error(err);
    res.json({ movie: null, reviews: [] });
  }
});

// ===== Add Review =====
app.post("/add_review", async (req, res) => {
  try {
    await Review.create(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ===== Start Server =====
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
