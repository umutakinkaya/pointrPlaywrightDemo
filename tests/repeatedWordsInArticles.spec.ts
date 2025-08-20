import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Verify blog articles and extract repeated words', async ({ page }) => {
  // Dosya yolu oluştur
  const resultsDir = path.join(__dirname, '../results');
  const filePath = path.join(resultsDir, 'top_words.txt');
  
  // Results klasörü yoksa oluştur
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Dosyayı temizle veya oluştur
  fs.writeFileSync(filePath, 'EN ÇOK TEKRARLANAN KELİMELER ANALİZİ\n');
  fs.appendFileSync(filePath, '===================================\n\n');

  // 1. Navigate to blog page
  await page.goto('https://pointr.tech/blog');
  
  // Wait for articles to load
  await page.waitForSelector('.single_article');

  // 2. Find and log first 3 article links
  const articleLinks = page.locator('.single_article > a:first-child');
  const articleCount = await articleLinks.count();
  const limit = Math.min(3, articleCount);

  console.log('Bulunan makale linkleri:');
  const hrefs: string[] = [];
  for (let i = 0; i < limit; i++) {
    const href = await articleLinks.nth(i).getAttribute('href');
    if (href) {
      hrefs.push(href);
      console.log(`${i + 1}. ${href}`);
      
      // Dosyaya makale linklerini yaz
      fs.appendFileSync(filePath, `MAKALE ${i + 1}: ${href}\n`);
    } else {
      console.log(`${i + 1}. Link bulunamadı`);
    }
  }

  // Eğer hiç link bulunamadıysa testi sonlandır
  if (hrefs.length === 0) {
    fs.appendFileSync(filePath, 'Hiç makale linki bulunamadı\n');
    console.log('Hiç makale linki bulunamadı, test sonlandırılıyor.');
    return;
  }

  fs.appendFileSync(filePath, '\n');

  // Tüm makalelerin birleşik kelime sayacı
  const allArticlesWordCount: Record<string, number> = {};

  // 3. Visit each article sequentially
  for (let i = 0; i < hrefs.length; i++) {
    console.log(`\n>>> ${i + 1}. makaleye gidiliyor: ${hrefs[i]}`);
    
    // Dosyaya makale başlığını yaz
    fs.appendFileSync(filePath, `\n${i + 1}. MAKALE ANALİZİ: ${hrefs[i]}\n`);
    fs.appendFileSync(filePath, `${'='.repeat(50)}\n`);

    // Navigate directly using the saved URL
    await page.goto(hrefs[i]);
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Debug için sayfa başlığını al
    const title = await page.title();
    console.log(`Sayfa başlığı: ${title}`);
    
    // İçeriği bulmaya çalış
    let content = '';
    
    // Önce spesifik içerik alanlarını dene
    const contentSelectors = [
      '#hs_cos_wrapper_post_body',
      '.post-body',
      '.blog-post-content',
      '.article-content',
      '.content-wrapper',
      'main article',
      'article .content',
      '[class*="content"]',
      '[class*="body"]',
      'main'
    ];
    
    for (const selector of contentSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        content = await element.innerText();
        if (content.trim().length > 100) {
          console.log(`İçerik bulundu: ${selector}`);
          break;
        }
      }
    }
    
    // Fallback: tüm sayfa içeriğini al
    if (!content || content.trim().length < 100) {
      content = await page.locator('body').innerText();
      console.log('Fallback: Tüm body içeriği alındı');
    }

    if (!content || content.trim().length < 100) {
      console.log('Yeterli içerik bulunamadı, bir sonraki makaleye geçiliyor...');
      fs.appendFileSync(filePath, 'İçerik bulunamadı\n\n');
      await page.goBack();
      await page.waitForSelector('.single_article');
      continue;
    }

    // Kelime frekanslarını hesapla
    const words = content
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\wçğıöşü\s]/gi, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20);

    const wordCount: Record<string, number> = {};
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
      
      // Tüm makaleler için genel sayaca ekle
      allArticlesWordCount[word] = (allArticlesWordCount[word] || 0) + 1;
    }

    // En çok geçen 5 kelime
    const topWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`\n${i + 1}. makalede en çok geçen kelimeler:`);
    console.table(topWords);

    // Dosyaya bireysel makale analizini yaz
    fs.appendFileSync(filePath, 'Bireysel Makale - En çok tekrarlanan kelimeler:\n');
    fs.appendFileSync(filePath, '---------------------------------------------\n');
    
    topWords.forEach(([word, count], index) => {
      const line = `${index + 1}. ${word}: ${count} kez\n`;
      fs.appendFileSync(filePath, line);
    });
    
    fs.appendFileSync(filePath, '\n');

    // Blog listesine geri dön
    await page.goBack();
    await page.waitForSelector('.single_article');
  }

  // TÜM MAKALELERİN BİRLEŞİK ANALİZİ
  fs.appendFileSync(filePath, '\nTÜM MAKALELERİN BİRLEŞİK ANALİZİ\n');
  fs.appendFileSync(filePath, '================================\n');
  
  // Tüm makalelerde en çok geçen 5 kelime
  const allTopWords = Object.entries(allArticlesWordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('\nTÜM MAKALELERDE en çok geçen kelimeler:');
  console.table(allTopWords);

  fs.appendFileSync(filePath, 'Tüm Makaleler - En çok tekrarlanan kelimeler:\n');
  fs.appendFileSync(filePath, '--------------------------------------------\n');
  
  allTopWords.forEach(([word, count], index) => {
    const line = `${index + 1}. ${word}: ${count} kez\n`;
    fs.appendFileSync(filePath, line);
  });

  // İstatistikler
  const totalWords = Object.values(allArticlesWordCount).reduce((sum, count) => sum + count, 0);
  const uniqueWords = Object.keys(allArticlesWordCount).length;

  fs.appendFileSync(filePath, '\nİSTATİSTİKLER:\n');
  fs.appendFileSync(filePath, '==============\n');
  fs.appendFileSync(filePath, `Toplam kelime sayısı: ${totalWords}\n`);
  fs.appendFileSync(filePath, `Benzersiz kelime sayısı: ${uniqueWords}\n`);
  fs.appendFileSync(filePath, `Analiz edilen makale sayısı: ${hrefs.length}\n`);

  // Kelime çeşitliliği oranı
  const diversityRatio = totalWords > 0 ? (uniqueWords / totalWords * 100).toFixed(2) : '0.00';
  fs.appendFileSync(filePath, `Kelime çeşitliliği oranı: %${diversityRatio}\n`);

  // En sık kullanılan 5 kelimenin toplam içindeki yüzdesi
  const top5Words = allTopWords.slice(0, 5);
  const top5Total = top5Words.reduce((sum, [_, count]) => sum + count, 0);
  const top5Percentage = totalWords > 0 ? (top5Total / totalWords * 100).toFixed(2) : '0.00';
  
  fs.appendFileSync(filePath, `En sık 5 kelimenin toplam içindeki payı: %${top5Percentage}\n`);

  fs.appendFileSync(filePath, '\nANALİZ TAMAMLANDI\n');
  fs.appendFileSync(filePath, '================\n');

  console.log(`\nAnaliz tamamlandı! Sonuçlar ${filePath} dosyasına kaydedildi.`);
  console.log(`Toplam ${totalWords} kelime, ${uniqueWords} benzersiz kelime analiz edildi.`);

  await page.close();
  console.log('Sayfa kapatıldı.');
  console.log('Test başarıyla tamamlandı!');
  console.log(`Sonuçlar ${filePath} dosyasına kaydedildi.`);
});