const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

exports.handler = async function(event, context) {
  const url = 'https://forum.warmane.com/forumdisplay.php?f=2';

  // Busca a página do fórum
  const response = await fetch(url);
  const text = await response.text();

  // Usa jsdom para extrair os dados
  const dom = new JSDOM(text);
  const document = dom.window.document;

  // Seleciona os tópicos (ajuste se necessário)
  const threads = document.querySelectorAll('li.threadbit');
  
  let items = [];
  for (let i = 0; i < Math.min(10, threads.length); i++) {
    const thread = threads[i];
    const titleLink = thread.querySelector('.threadtitle a');
    if (!titleLink) continue;
    
    const title = titleLink.textContent.trim();
    const link = titleLink.href;
    const dateElem = thread.querySelector('.author .date');
    const pubDate = dateElem ? new Date(dateElem.textContent.trim()) : new Date();

    items.push({title, link, pubDate});
  }

  // Monta o XML do RSS
  let rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`).join('');

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>Warmane - Últimas Notícias</title>
      <link>${url}</link>
      <description>Últimos tópicos da área de notícias do fórum Warmane</description>
      ${rssItems}
    </channel>
  </rss>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/rss+xml' },
    body: rss
  };
};
