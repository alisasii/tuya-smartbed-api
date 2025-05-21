
const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID || 'YOUR_ACCESS_ID';
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || 'YOUR_ACCESS_SECRET';

async function getTuyaToken() {
  const res = await axios.post('https://openapi.tuya.com/v1.0/token?grant_type=1', {}, {
    headers: {
      'client_id': TUYA_CLIENT_ID,
      'sign_method': 'HMAC-SHA256',
      't': Date.now(),
    }
  });
  return res.data.result.access_token;
}

app.post('/api/tuya-update', async (req, res) => {
  const { device_id, dp_data } = req.body;

  if (!device_id || !dp_data) {
    return res.status(400).json({ error: 'Missing device_id or dp_data' });
  }

  try {
    const token = await getTuyaToken();
    const commands = Object.entries(dp_data).map(([dpid, value]) => ({
      code: getCodeFromDpid(dpid),
      value: value
    }));

    await axios.post(`https://openapi.tuya.com/v1.0/devices/${device_id}/commands`, {
      commands
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': TUYA_CLIENT_ID,
        'sign_method': 'HMAC-SHA256'
      }
    });

    res.json({ status: 'Data sent to Tuya successfully' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send data to Tuya' });
  }
});

function getCodeFromDpid(dpid) {
  const map = {
    "1": "heart_rate",
    "2": "spo2",
    "3": "temperature",
    "4": "moisture",
    "5": "fall_alert"
  };
  return map[dpid] || dpid;
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
