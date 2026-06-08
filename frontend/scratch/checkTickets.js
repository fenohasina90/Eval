import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5173/apirest',
  headers: {
    'App-Token': 'votre_app_token_si_necessaire', // Usually not required if proxy handles it
    'Session-Token': 'votre_session_token' // Let's just hit the API via proxy if it exists?
  }
});

async function checkTickets() {
  try {
    // Try hitting the frontend proxy which has session
    const res = await axios.get('http://localhost:5173/apirest/Ticket?range=0-999999&is_deleted=1');
    console.log("Tickets supprimés: ", res.data.length, res.data.slice(0, 2));
  } catch(e) {
    console.log(e.message);
  }

  try {
    const res2 = await axios.get('http://localhost:5173/apirest/Ticket?range=0-999999&status=all');
    console.log("Tickets normaux: ", res2.data.length, res2.data.slice(0, 2));
  } catch(e) {
    console.log(e.message);
  }
}

checkTickets();
