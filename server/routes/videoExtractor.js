const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.post('/extract-video', async (req, res) => {
  const { targetUrl } = req.body;

  try {
    console.log("🔍 Scraping Target URL:", targetUrl);

  
    const { data } = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      },
      timeout: 15000 // slownet prblm
    });

    const $ = cheerio.load(data);
    let videoSrc = null;

    
    videoSrc = $('video').attr('src') || $('video source').attr('src');

    
    if (!videoSrc) {
      $('iframe').each((index, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src) {
          if (
            src.includes('vidoza') || 
            src.includes('streamtape') || 
            src.includes('dood') || 
            src.includes('fembed') || 
            src.includes('mixdrop') || 
            src.includes('embed') ||
            src.includes('player')
          ) {
            videoSrc = src;
            return false; 
          }
        }
      });
    }

    if (!videoSrc) {
      const htmlString = $.html();
    
      const embedRegex = /(https?:)?\/\/(www\.)?(vidoza\.to|streamtape\.com|dood\.to|doodstream\.com)\/(embed|e|d)\/[a-zA-Z0-9_-]+/g;
      const matches = htmlString.match(embedRegex);
      if (matches && matches.length > 0) {
        videoSrc = matches[0];
      }
    }

    
    if (videoSrc && videoSrc.startsWith('//')) {
      videoSrc = 'https:' + videoSrc;
    }

    if (videoSrc) {
      console.log("🎯 Extracted Movie Player URL:", videoSrc);
      return res.json({ success: true, videoUrl: videoSrc });
    } else {
      return res.json({ success: false, message: "No streamable video player found on this page. Try another link or stream server." });
    }

  } catch (error) {
    console.error("❌ Scraping failed:", error.message);
    return res.status(500).json({ success: false, error: "Website blocked the request. Please upload the movie or try a different source." });
  }
});

module.exports = router;