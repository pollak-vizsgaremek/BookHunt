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

    let response;
    let retries = 2;
    while (retries >= 0) {
      try {
        response = await axios.get(
          "https://www.googleapis.com/books/v1/volumes",
          { params }
        );
        break; // Sucess, break the retry loop
      } catch (err) {
        if (err.response && (err.response.status === 503 || err.response.status === 429) && retries > 0) {
          retries--;
          await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        } else {
          throw err; // Out of retries or different error, surface it
        }
      }
    }

    // Extract only the useful fields from Google's response
    const books = (response.data.items || []).map((item) => {
      const info = item.volumeInfo;
      let validIsbn = null;
      if (info.industryIdentifiers) {
        const isbn13 = info.industryIdentifiers.find(i => i.type === 'ISBN_13');
        const isbn10 = info.industryIdentifiers.find(i => i.type === 'ISBN_10');
        const other = info.industryIdentifiers.find(i => i.type === 'OTHER');
        
        if (isbn13) validIsbn = isbn13.identifier;
        else if (isbn10) validIsbn = isbn10.identifier;
        else if (other) validIsbn = other.identifier;
        else validIsbn = info.industryIdentifiers[0].identifier;
      }

      return {
        googleId: item.id,
        title: info.title || "Unknown title",
        authors: info.authors || [],
        description: info.description || "",
        thumbnail: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null,
        imageLinks: info.imageLinks || null,
        publishedDate: info.publishedDate || null,
        pageCount: info.pageCount || null,
        categories: info.categories || [],
        language: info.language || null,
        isbn: validIsbn,
        previewLink: info.previewLink || null,
        ratingsCount: info.ratingsCount || 0,
        averageRating: info.averageRating || 0,
      };
    });

    // Sort logic to surface popular matches (highest ratings/reviews) first
    // This dramatically improves finding prices since more popular editions have actual store matches
    if (!orderBy || orderBy === 'relevance') {
      books.sort((a, b) => (b.ratingsCount || 0) - (a.ratingsCount || 0));
    }

    res.json({ total: response.data.totalItems, books });
  } catch (error) {
    if (error.response) {
      console.error("Google Books API rejection:", error.response.status, error.response.data);
    } else {
      console.error("Google Books API error:", error.message);
    }
    res.status(500).json({ 
      error: "Failed to fetch books from Google.",
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

export default router;
