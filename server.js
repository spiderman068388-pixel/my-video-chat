const express = require('express');
const app = express();
const path = require('path');

// Static files ko dhoondhne ke liye (style.css, script.js)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is live on port ${PORT}`);
});
