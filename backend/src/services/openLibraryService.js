import axios from 'axios';

const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';
const COVERS_BASE_URL = 'https://covers.openlibrary.org';

// Required by Open Library API guidelines to identify the application
const openLibraryApi = axios.create({
  baseURL: OPEN_LIBRARY_BASE_URL,
  headers: {
    'User-Agent': 'BookHunt (contact@bookhunt.com)' // Replace with actual email if necessary
  }
});

/**
 * Search for books in Open Library.
 * @param {string} query - The search term (e.g., 'the lord of the rings').
 * @returns {Promise<Object>} Search results.
 */
export const searchBooks = async (query) => {
  try {
    const response = await openLibraryApi.get('/search.json', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching Open Library books:', error.message);
    throw error;
  }
};

/**
 * Get a specific book/edition by ISBN.
 * @param {string} isbn - The ISBN of the book.
 * @returns {Promise<Object|null>} Detailed book info or null if not found.
 */
export const getBookByIsbn = async (isbn) => {
  try {
    const response = await openLibraryApi.get(`/isbn/${isbn}.json`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Not found
    }
    console.error(`Error fetching book with ISBN ${isbn}:`, error.message);
    throw error;
  }
};

/**
 * Get detailed info about a specific Work by its Open Library ID (OLID).
 * @param {string} workId - The Work ID (e.g., 'OL15626917W').
 * @returns {Promise<Object|null>} Detailed work info or null if not found.
 */
export const getWorkById = async (workId) => {
  try {
    const response = await openLibraryApi.get(`/works/${workId}.json`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Not found
    }
    console.error(`Error fetching work with ID ${workId}:`, error.message);
    throw error;
  }
};

/**
 * Search for books by subject.
 * @param {string} subject - The subject or genre (e.g., 'fantasy').
 * @returns {Promise<Object>} Search results for the given subject.
 */
export const getBooksBySubject = async (subject) => {
  try {
    // Subject names should be lowercase and spaces replaced with underscores
    const formattedSubject = subject.toLowerCase().replace(/ /g, '_');
    const response = await openLibraryApi.get(`/subjects/${formattedSubject}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching books by subject ${subject}:`, error.message);
    throw error;
  }
};

/**
 * Generate a Cover URL for a book.
 * @param {string} type - Identifier type (e.g., 'isbn', 'olid', 'id').
 * @param {string|number} identifier - The actual identifier.
 * @param {string} size - Size of the cover ('S', 'M', 'L'). Default is 'M'.
 * @returns {string} The URL to the cover image.
 */
export const getCoverUrl = (type, identifier, size = 'M') => {
  return `${COVERS_BASE_URL}/b/${type}/${identifier}-${size}.jpg`;
};

export default {
  searchBooks,
  getBookByIsbn,
  getWorkById,
  getBooksBySubject,
  getCoverUrl
};
