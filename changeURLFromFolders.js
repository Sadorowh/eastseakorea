// update-img-links.js
// npm install cheerio

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// folders list
const folders = [
  "car-title"
];

const urlFile = path.join(__dirname, "url.txt");
const urls = fs.readFileSync(urlFile, "utf8").split(/\r?\n/).filter(Boolean);

// Words we want to skip in filenames
const skipWords = new Set(["2", "scr", "front", "back", "example"]);

// Convert filename to search words
function filenameToWords(filename) {
  return filename
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[^a-zA-Z0-9]+/g, " ") // replace symbols with spaces
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !skipWords.has(w));
}

// Find best matching URL
function findMatchingUrl(words) {
  let bestMatch = null;
  let bestCount = 0;

  urls.forEach((url) => {
    const urlLower = url.toLowerCase();
    let count = 0;

    words.forEach((w) => {
      if (urlLower.includes(w)) count++;
    });

    if (count > bestCount) {
      bestCount = count;
      bestMatch = url;
    }
  });

  // only accept if at least 3 words matched
  return bestCount >= 3 ? bestMatch : null;
}

// Process each folder
folders.forEach((folder) => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) return;

  fs.readdirSync(folderPath).forEach((file) => {
    if (path.extname(file) === ".html") {
      const filePath = path.join(folderPath, file);
      let html = fs.readFileSync(filePath, "utf8");

      const $ = cheerio.load(html);

      $("img[src='https://eastseakorea.com/download-20.png']").each((_, img) => {
        const $img = $(img);
        const $a = $img.closest("a");

        if ($a.length) {
          const words = filenameToWords(file);
          const matchedUrl = findMatchingUrl(words);

          if (matchedUrl) {
            $a.attr("href", matchedUrl);
            console.log(`✅ Updated href in ${file} → ${matchedUrl}`);
          } else {
            console.log(`⚠️ No match for ${file}`);
          }
        }
      });

      fs.writeFileSync(filePath, $.html(), "utf8");
    }
  });
});
