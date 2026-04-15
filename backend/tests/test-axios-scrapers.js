import axios from 'axios';
import fs from 'fs';

(async () => {
    const isbn = '9781974709939'; // Chainsaw Man Vol 1
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    try {
        console.log('Fetching Crunchyroll...');
        const cr = await axios.get(`https://store.crunchyroll.com/search?q=${isbn}`, { headers }).catch(e=>e.response);
        console.log('CR Status:', cr?.status);
        if (cr?.data) fs.writeFileSync('cr.html', cr.data);

        console.log('Fetching ThriftBooks...');
        const tb = await axios.get(`https://www.thriftbooks.com/browse/?b.search=${isbn}`, { headers }).catch(e=>e.response);
        console.log('TB Status:', tb?.status);
        if (tb?.data) fs.writeFileSync('tb.html', tb.data);

        console.log('Fetching Barnes & Noble...');
        const bn = await axios.get(`https://www.barnesandnoble.com/s/${isbn}`, { headers }).catch(e=>e.response);
        console.log('BN Status:', bn?.status);
        if (bn?.data) fs.writeFileSync('bn.html', bn.data);

    } catch(e) { console.error(e); }
})();
