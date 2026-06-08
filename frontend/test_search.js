import 'dotenv/config';
import { Legacy } from './src/services/api.js';

async function testSearch() {
    try {
        console.log("Testing search for PC-ADM-001...");
        const response = await Legacy.get('/search/Computer', {
            'criteria[0][field]': 1,
            'criteria[0][searchtype]': 'equals',
            'criteria[0][value]': 'PC-ADM-001',
            'forcedisplay[0]': 2,
            range: '0-1'
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error(e.message);
        if (e.response) {
            console.error(e.response.data);
        }
    }
}

testSearch();
