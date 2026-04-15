import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * @swagger
 * /api/books/search:
 *   get:
 *     summary: Search for books using the Google Books API
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (e.g. book title, author)
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *         description: Number of results to return (default 10, max 40)
 *     responses:
 *       200:
 *         description: A list of matching books
 *       400:
 *         description: Missing search query
 *       500:
 *         description: Failed to fetch from Google Books
 */
router.get("/search", async (req, res) => {
  const { q, maxResults = 10, startIndex = 0, orderBy, printType, filter, subject } = req.query;

  // Make sure the user provided a search term
  if (!q && !subject) {
    return res.status(400).json({ error: "Search query (q) or subject is required." });
  }

  try {
    let finalQuery = q || "";
    if (subject) {
      finalQuery += finalQuery ? `+subject:${subject}` : `subject:${subject}`;
    }

    const params = {
      q: finalQuery,
      maxResults,
      startIndex,
      key: process.env.GOOGLE_BOOKS_API_KEY,
    };

    if (orderBy) params.orderBy = orderBy;
    if (printType) params.printType = printType;
    if (filter) params.filter = filter;

    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      { params }
    );

    // Extract only the useful fields from Google's response
    const books = (response.data.items || []).map((item) => {
      const info = item.volumeInfo;
      return {
        googleId: item.id,
        title: info.title || "Unknown title",
        authors: info.authors || [],
        description: info.description || "",
        thumbnail: info.imageLinks?.thumbnail || null,
        publishedDate: info.publishedDate || null,
        pageCount: info.pageCount || null,
        categories: info.categories || [],
        language: info.language || null,
        isbn: info.industryIdentifiers?.[0]?.identifier || null,
        previewLink: info.previewLink || null,
        ratingsCount: info.ratingsCount || 0,
        averageRating: info.averageRating || 0,
      };
    });

    res.json({ total: response.data.totalItems, books });
  } catch (error) {
    console.error("Google Books API error:", error.message);
    res.status(500).json({ error: "Failed to fetch books from Google." });
  }
});

export default router;
