const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:username', (req, res) => {
    const username = req.params.username;
    const userNumber = parseInt(req.query.num, 10);

    if (isNaN(userNumber) || userNumber < 1 || userNumber > 10) {
        return res.send(`
      <h1>Shame on you, ${username}!</h1>
      <p>You need to enter a number between 1 and 10.</p>
      <a href="/">Try Again</a>
    `);
    }

    const randomNumber = Math.floor(Math.random() * 10) + 1;

    if (userNumber === randomNumber) {
        res.send(`
          <h1>Congratulations ${username}, you're a winner!</h1>
          <p>The correct number was ${randomNumber}.</p>
          <a href="/">Play Again</a>
        `);
    } else {
        res.send(`
          <h1>Sorry ${username}, you lost.</h1>
          <p>The correct number was ${randomNumber}.</p>
          <a href="/">Try Again</a>
        `);
    }
});

app.use((req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});