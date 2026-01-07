const Parser = require('rss-parser');
const db = require('../db');

// Configure parser to look for common media tags used by news sites
const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

const RSS_FEEDS = [
    'https://www.jckonline.com/feed/', 
    'https://www.rapaport.com/feed/'
];

/**
 * Helper: Smartly try to find an image URL in the RSS item.
 * RSS feeds are messy; images hide in different places.
 */
const extractImageUrl = (item) => {
    // 1. Try standard RSS 'enclosure' (usually podcasts, but sometimes images)
    if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
        return item.enclosure.url;
    }

    // 2. Try 'media:content' (common in professional news feeds)
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        return item.mediaContent.$.url;
    }

    // 3. Try 'media:thumbnail' (another common spot)
    if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
        return item.mediaThumbnail.$.url;
    }

    // 4. Last ditch effort: Regex find the first <img> tag inside the HTML content
    // We look in 'content:encoded' first (full HTML), then standard 'content'
    const htmlContent = item.contentEncoded || item.content || '';
    // Regex to grab the 'src' attribute of an img tag
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = htmlContent.match(imgRegex);
    
    // If we found an image in HTML, make sure it's not a tiny tracking pixel
    if (match && match[1]) {
        const url = match[1];
        if (!url.includes('feeds.feedburner.com') && !url.includes('pixel')) {
             return url;
        }
    }

    return null; // Give up, no image found.
};


async function getSystemAdminId() {
    try {
        const query = "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1";
        const { rows } = await db.query(query);
        if (rows.length > 0) return rows[0].user_id;
        console.error("[NewsBot] ⚠️ No Admin user found! Cannot assign news.");
        return null;
    } catch (err) {
        console.error("[NewsBot] Error finding admin:", err);
        return null;
    }
}

const fetchAndSaveNews = async (io) => {
    console.log('📰 [NewsBot] Waking up and looking for images...');

    const adminId = await getSystemAdminId();
    if (!adminId) return;

    let newArticlesCount = 0;

    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items) {
                const checkQuery = "SELECT 1 FROM news WHERE title = $1";
                const checkRes = await db.query(checkQuery, [item.title]);

                if (checkRes.rowCount === 0) {
                    // Combine snippet + link
                    const cleanContent = (item.contentSnippet || item.content || "") + 
                                         `\n\n<a href="${item.link}" target="_blank">Read full story on Source</a>`;
                    
                    // --- NEW: Use the smart extractor ---
                    const imageUrl = extractImageUrl(item);
                    // ------------------------------------

                    const insertQuery = `
                        INSERT INTO news (admin_id, title, content, image_url)
                        VALUES ($1, $2, $3, $4) RETURNING *
                    `;
                    
                    const { rows } = await db.query(insertQuery, [
                        adminId, 
                        item.title, 
                        cleanContent,
                        imageUrl // Now this is much more likely to have a URL
                    ]);
                    
                    const newArticle = rows[0];
                    newArticlesCount++;

                    if (io) io.emit('new-article', newArticle);
                    
                    console.log(`✅ [NewsBot] Saved: ${item.title} ${imageUrl ? '(with image)' : '(no image)'}`);
                }
            }
        } catch (error) {
            console.error(`❌ [NewsBot] Error fetching feed ${feedUrl}:`, error.message);
        }
    }

    if (newArticlesCount === 0) {
        console.log('💤 [NewsBot] No new news found.');
    } else {
        console.log(`✨ [NewsBot] Finished. Added ${newArticlesCount} new articles.`);
    }
};

module.exports = { fetchAndSaveNews };