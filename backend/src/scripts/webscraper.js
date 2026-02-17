import axios from 'axios';
import cheerio from 'cheerio';

async function scrapeSite(keyword) {
	const url = `https://www.google.com/search?q=${keyword}&tbm=isch`;
	const { data } = await axios.get(url);
    const $ = cheerio.load(data);
	return $
}

const keyword = "coffee"; // change with any keyword you want
scrapeSite(keyword).then(result => {
	console.log(result)
	}).catch(err => console.log(err));
