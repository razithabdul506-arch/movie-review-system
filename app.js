const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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

/* ================= ROUTES ================= */

// Get movie details from OMDb + reviews
app.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const apiKey = "YOUR_API_KEY";

  const response = await fetch(
    `http://www.omdbapi.com/?i=${movieId}&apikey=${apiKey}`
  );
  const movie = await response.json();

  const reviews = await Review.find({ movieId });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "No ratings yet";

  res.send(`
  <html>
  <head>
    <title>${movie.Title}</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>

  <div class="container">

    <div class="movie-detail">
      <img src="${movie.Poster}">
      <div>
        <h1>${movie.Title}</h1>
        <p>${movie.Year} • ${movie.Genre}</p>
        <p>${movie.Plot}</p>
        <h3>⭐ ${avgRating}</h3>
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

    <br>
    <a href="/" class="back-btn">⬅ Back</a>

  </div>

  </body>
  </html>
  `);
});

// Add review
app.post("/add_review", async (req, res) => {
  const review = new Review(req.body);
  await review.save();
  res.redirect("/movie/" + req.body.movieId);
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
