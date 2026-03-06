const fs = require('fs');
const ht = fs.readFileSync('trademo_home.html', 'utf8');
const cheerio = require('cheerio');
const $ = cheerio.load(ht);
const hero = $('.bg-custom-gradient-home-hero');
if (hero.length > 0) {
    fs.writeFileSync('hero_ht.html', hero.html());
} else {
    console.log('not found');
}
