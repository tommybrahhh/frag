const https = require('https');

https.get('https://ibb.co/8LtX7QpR', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const match = data.match(/https:\/\/i\.ibb\.co\/[^"']+/);
    if (match) {
      console.log('Direct Link found:', match[0]);
    } else {
      console.log('No direct link found in HTML');
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});