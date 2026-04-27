import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const res = await axios.get("https://www.googleapis.com/books/v1/volumes", {
            params: {
                q: "subject:Fiction",
                maxResults: 10,
                orderBy: 'relevance',
                key: process.env.GOOGLE_BOOKS_API_KEY
            }
        });
        
        const items = res.data.items || [];
        for (const item of items) {
            console.log(`Title: ${item.volumeInfo.title}`);
            console.log(`RatingsCount: ${item.volumeInfo.ratingsCount}`);
            console.log(`AvgRating: ${item.volumeInfo.averageRating}`);
            console.log('---');
        }
    } catch (e) {
        console.error(e.message);
    }
}
test();
