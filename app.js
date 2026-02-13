const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= DATABASE ================= */

mongoose.connect("mongodb://localhost:27017/movieReviewDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= SCHEMA ================= */

const reviewSchema = new mongoose.Schema({
  movieId: String,
  title: String,
  username: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", reviewSchema);

/* ================= HOME ================= */

app.get("/", async (req, res) => {

  const response = await fetch(
    `https://www.omdbapi.com/?s=2025&type=movie&apikey=4ef5a84b`
  );

  const data = await response.json();
  const movies = data.Search || [];

  res.send(`
  <html>
  <head>
    <title>Movie Review Hub</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>

  <header>
    <h1>🎬 Movie Review Hub</h1>
  </header>

  <form action="/search" method="GET" class="search-bar">
    <input type="text" name="query" placeholder="Search movies..." required>
    <button type="submit">Search</button>
  </form>

  <div class="grid">
    ${movies.map(movie => `
      <div class="card">
        <a href="/movie/${movie.imdbID}">
          <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450"}">
          <div class="card-body">
            <h3>${movie.Title}</h3>
            <p>${movie.Year}</p>
          </div>
        </a>
      </div>
    `).join("")}
  </div>

  </body>
  </html>
  `);
});

/* ================= SEARCH ================= */

app.get("/search", async (req, res) => {

  const query = req.query.query;

  const response = await fetch(
    `https://www.omdbapi.com/?s=${query}&apikey=4ef5a84b`
  );

  const data = await response.json();
  const movies = data.Search || [];

  res.send(`
  <html>
  <head>
    <title>Search Results</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>

  <header>
    <h1>Search Results</h1>
    <a href="/" class="back-btn">⬅ Back</a>
  </header>

  <div class="grid">
    ${movies.map(movie => `
      <div class="card">
        <a href="/movie/${movie.imdbID}">
          <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450"}">
          <div class="card-body">
            <h3>${movie.Title}</h3>
            <p>${movie.Year}</p>
          </div>
        </a>
      </div>
    `).join("")}
  </div>

  </body>
  </html>
  `);
});

/* ================= MOVIE PAGE ================= */

app.get("/movie/:id", async (req, res) => {

  const movieId = req.params.id;

  const response = await fetch(
    `https://www.omdbapi.com/?i=${movieId}&apikey=4ef5a84b`
  );

  const movie = await response.json();
  const reviews = await Review.find({ movieId });

  res.send(`
  <html>
  <head>
    <title>${movie.Title}</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>

  <div class="container">

    <a href="/" class="back-btn">⬅ Back</a>

    <div class="movie-detail">
      <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450"}">
      <div>
        <h1>${movie.Title}</h1>
        <p>${movie.Year} • ${movie.Genre}</p>
        <p>${movie.Plot}</p>
      </div>
    </div>

    <hr>

    <h2>Add Review</h2>
    <form action="/add_review" method="POST">
      <input type="hidden" name="movieId" value="${movieId}">
      <input type="hidden" name="title" value="${movie.Title}">
      <input type="text" name="username" placeholder="Your Name" required>
      <input type="number" name="rating" min="1" max="5" placeholder="Rating (1-5)" required>
      <textarea name="comment" placeholder="Write review..." required></textarea>
      <button type="submit">Submit Review</button>
    </form>

    <h2>Reviews</h2>
    ${reviews.map(r => `
      <div class="review">
        <strong>${r.username}</strong> ⭐ ${r.rating}
        <p>${r.comment}</p>
      </div>
    `).join("")}

  </div>

  </body>
  </html>
  `);
});

/* ================= ADD REVIEW ================= */

app.post("/add_review", async (req, res) => {
  await Review.create(req.body);
  res.redirect("/movie/" + req.body.movieId);
});

/* ================= SERVER ================= */

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
