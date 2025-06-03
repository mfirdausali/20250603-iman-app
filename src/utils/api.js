const API_BASE = 'https://api.alquran.cloud/v1';

// EveryAyah.com reciters - reliable with proper CORS support
export const RECITERS = {
  'Alafasy_128kbps': { name: 'Mishary Rashid Alafasy', arabicName: 'مشاري بن راشد العفاسي' },
  'Abdul_Basit_Murattal_128kbps': { name: 'Abdul Basit Abd us-Samad', arabicName: 'عبد الباسط عبد الصمد' },
  'MaherAlMuaiqly128kbps': { name: 'Maher Al-Muaiqly', arabicName: 'ماهر المعيقلي' },
  'Sudais_128kbps': { name: 'Abdul Rahman Al-Sudais', arabicName: 'عبد الرحمن السديس' },
  'Husary_128kbps': { name: 'Mahmoud Khalil Al-Husary', arabicName: 'محمود خليل الحصري' },
  'Minshawi_Murattal_128kbps': { name: 'Mohamed Siddiq Al-Minshawi', arabicName: 'محمد صديق المنشاوي' },
  'Shatri_128kbps': { name: 'Abu Bakr Al-Shatri', arabicName: 'أبو بكر الشاطري' },
  'Ayub_128kbps': { name: 'Muhammad Ayyub', arabicName: 'محمد أيوب' },
  'Ghamadi_128kbps': { name: 'Saad Al-Ghamdi', arabicName: 'سعد الغامدي' },
  'Shuraim_128kbps': { name: 'Saud Al-Shuraim', arabicName: 'سعود الشريم' }
};

export const quranAPI = {
  async getSurah(number) {
    try {
      const response = await fetch(`${API_BASE}/surah/${number}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching surah:', error);
      throw error;
    }
  },

  async getSurahList() {
    try {
      const response = await fetch(`${API_BASE}/surah`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching surah list:', error);
      throw error;
    }
  },

  async getAyah(surahNumber, ayahNumber) {
    try {
      const response = await fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching ayah:', error);
      throw error;
    }
  },

  async getAyahWithTranslation(surahNumber, ayahNumber, reciter = 'Alafasy_128kbps') {
    try {
      const [arabic, translation] = await Promise.all([
        fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}`),
        fetch(`${API_BASE}/ayah/${surahNumber}:${ayahNumber}/en.asad`)
      ]);
      
      const arabicData = await arabic.json();
      const translationData = await translation.json();
      
      return {
        arabic: arabicData.data,
        translation: translationData.data
      };
    } catch (error) {
      console.error('Error fetching ayah with translation:', error);
      throw error;
    }
  },

  async getAyahWithAudio(surahNumber, ayahNumber, reciter = 'Alafasy_128kbps') {
    try {
      const audioUrl = this.getAudioUrl(surahNumber, ayahNumber, reciter);
      const reciterInfo = RECITERS[reciter] || { name: 'Unknown Reciter', arabicName: 'قارئ غير معروف' };
      
      return {
        audioUrl,
        reciter: reciterInfo
      };
    } catch (error) {
      console.error('Error getting audio URL:', error);
      throw error;
    }
  },

  getAudioUrl(surahNumber, ayahNumber, reciter = 'Alafasy_128kbps') {
    // EveryAyah.com URLs - zero-padded concatenated format: surahayah (e.g., 001001.mp3)
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    return `https://everyayah.com/data/${reciter}/${paddedSurah}${paddedAyah}.mp3`;
  },

  getAudioFallbackUrls(surahNumber, ayahNumber, reciter = 'Alafasy_128kbps') {
    // EveryAyah fallback reciters for better reliability
    const fallbackReciters = [
      reciter, // User's selected reciter first
      'Alafasy_128kbps', // Most popular fallback
      'Abdul_Basit_Murattal_128kbps', // Classic reciter
      'MaherAlMuaiqly128kbps', // Imam of Masjid al-Haram
      'Sudais_128kbps', // Another Imam of Masjid al-Haram
      'Husary_128kbps' // Traditional Egyptian style
    ];

    // Remove duplicates while preserving order
    const uniqueReciters = [...new Set(fallbackReciters)];
    
    const paddedSurah = surahNumber.toString().padStart(3, '0');
    const paddedAyah = ayahNumber.toString().padStart(3, '0');
    
    return uniqueReciters.map(r => 
      `https://everyayah.com/data/${r}/${paddedSurah}${paddedAyah}.mp3`
    );
  },

  async checkAudioAvailability(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async getValidAudioUrl(surahNumber, ayahNumber, reciter = 'Alafasy_128kbps') {
    const urls = this.getAudioFallbackUrls(surahNumber, ayahNumber, reciter);
    
    // Try each URL in sequence
    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (error) {
        console.log(`URL failed: ${url}`, error);
        continue;
      }
    }
    
    // Return first URL as last resort (EveryAyah is very reliable)
    return urls[0];
  },

  // Helper method to get all available reciters
  getAvailableReciters() {
    return Object.entries(RECITERS).map(([key, value]) => ({
      id: key,
      ...value
    }));
  },

  // Test audio connectivity
  async testAudioConnectivity() {
    try {
      // Test with Al-Fatiha first ayah
      const testUrl = this.getAudioUrl(1, 1, 'Alafasy_128kbps');
      const response = await fetch(testUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Audio connectivity test failed:', error);
      return false;
    }
  }
};