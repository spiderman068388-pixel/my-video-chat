const express = require('express');
const app = express();
const path = require('path');

// Ye line CSS aur JS files ko dhoondhne mein madad karegi
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
