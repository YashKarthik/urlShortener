require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const URI = process.env['URI']

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

const Url = mongoose.model('Url', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.use(express.urlencoded({
  extended: true
}));

const addEntry = (original_url) => {
  const short_url = Math.floor(Math.random()*(999-100+1)+100);

  Url.create({
    original_url: original_url,
    short_url: short_url
  }, (err, url) => {
    if (err) console.log(err);
  });

  return short_url;
}

app.post('/api/shorturl/', (req, res) => {
  const original_url = req.body.url;
  const www = original_url.replace(/(^\w+:|^)\/\//, '');

  dns.lookup(www, (err, address, family) => {
    const r = /^(ftp|http|https):\/\/[^ "]+$/;

    if (err || r.test(original_url) === false) {
      console.log(err, '\n\nSending json for invalid url');
      res.status(404).json({ error: 'invalid url'});
      return;
    };

    Url.findOne({ original_url: original_url }, (err, url) => {
      if (err) {
        console.log('\n----------ERROR-----------\n', err);
        res.status(503).json({ error: 'Error has occurred'})
      }

      if (url === null) {
        res.json({
          original_url: original_url,
          short_url: addEntry(original_url)
        });
      } else {
        res.json({
          original_url: original_url,
          short_url: url.short_url
        });
      };

    })
  });
})

app.get('/api/shorturl/:short_url', (req, res) => {
  const short_url = req.params.short_url;

  Url.findOne({short_url: short_url}, (err, url) => {
    if (err) console.log('\n----------ERROR-----------\n', err);

    if (url === null) {
      res.json({ error: "No short URL found for the given input" })
      return;
    } else {
      res.redirect(308, url.original_url)
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});