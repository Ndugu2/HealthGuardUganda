export const UGANDA_DISTRICTS: string[] = [
  'Abim', 'Adjumani', 'Agago', 'Alebtong', 'Amolatar', 'Amudat', 'Amuria', 'Amuru',
  'Apac', 'Arua', 'Budaka', 'Bududa', 'Bugiri', 'Bugweri', 'Buhweju', 'Buikwe',
  'Bukedea', 'Bukomansimbi', 'Bukwo', 'Bulambuli', 'Buliisa', 'Bundibugyo',
  'Bunyangabu', 'Bushenyi', 'Busia', 'Butaleja', 'Butambala', 'Butebo', 'Buvuma',
  'Buyende', 'Dokolo', 'Gomba', 'Gulu', 'Hoima', 'Ibanda', 'Iganga', 'Isingiro',
  'Jinja', 'Kaabong', 'Kabale', 'Kabarole', 'Kaberamaido', 'Kagadi', 'Kakumiro',
  'Kalangala', 'Kaliro', 'Kalungu', 'Kampala', 'Kamuli', 'Kamwenge', 'Kanungu',
  'Kapchorwa', 'Kapelebyong', 'Kasese', 'Kassanda', 'Katakwi', 'Kayunga', 'Kazo',
  'Kibaale', 'Kiboga', 'Kibuku', 'Kikuube', 'Kiruhura', 'Kiryandongo', 'Kisoro',
  'Kitgum', 'Koboko', 'Kole', 'Kotido', 'Kumi', 'Kwania', 'Kween', 'Kyegegwa',
  'Kyenjojo', 'Kyotera', 'Kyankwanzi', 'Lamwo', 'Lira', 'Lwengo', 'Lyantonde',
  'Madi-Okollo', 'Manafwa', 'Maracha', 'Masaka', 'Masindi', 'Mayuge', 'Mbale',
  'Mbarara', 'Mitooma', 'Mityana', 'Moroto', 'Moyo', 'Mpigi', 'Mubende', 'Mukono',
  'Nabilatuk', 'Nakasongola', 'Nakaseke', 'Nakapiripirit', 'Namisindwa', 'Namutumba',
  'Napak', 'Nebbi', 'Ngora', 'Ntoroko', 'Ntungamo', 'Nwoya', 'Obongi', 'Omoro',
  'Otuke', 'Oyam', 'Pader', 'Pakwach', 'Pallisa', 'Rakai', 'Rubanda', 'Rubirizi',
  'Rukiga', 'Rukungiri', 'Rwampara', 'Sembabule', 'Serere', 'Sheema', 'Sironko',
  'Soroti', 'Terego', 'Tororo', 'Wakiso', 'Yumbe', 'Zombo'
];

export class ValidationService {
  /**
   * Validates if a district is in the official list of Uganda districts.
   */
  public static isValidDistrict(district: string): boolean {
    if (!district) return false;
    const clean = district.trim().toLowerCase();
    return UGANDA_DISTRICTS.some(d => d.toLowerCase() === clean);
  }

  /**
   * Returns a list of district suggestions based on a partial query.
   */
  public static getDistrictSuggestions(query: string): string[] {
    if (!query) return [];
    const clean = query.trim().toLowerCase();
    return UGANDA_DISTRICTS.filter(d => d.toLowerCase().includes(clean)).slice(0, 5);
  }

  /**
   * Validates Ugandan phone numbers.
   * Format: +2567..., +2563..., +2564..., 07..., 03..., 04... followed by 7 or 8 digits.
   * Typically 9 digits after the leading zero or 9 digits after +256.
   */
  public static isValidUgandanPhone(phone: string): boolean {
    const clean = phone.replace(/\s+/g, '');
    
    // Check if starts with +256
    if (clean.startsWith('+256')) {
      const remaining = clean.slice(4);
      return /^[347]\d{8}$/.test(remaining);
    }
    
    // Check if starts with 256 without '+'
    if (clean.startsWith('256')) {
      const remaining = clean.slice(3);
      return /^[347]\d{8}$/.test(remaining);
    }

    // Check if starts with 0
    if (clean.startsWith('0')) {
      const remaining = clean.slice(1);
      return /^[347]\d{8}$/.test(remaining);
    }

    // Standard 9 digit number starting with 7, 3, or 4
    return /^[347]\d{8}$/.test(clean);
  }

  /**
   * Validates a password against strength rules.
   * At least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character.
   */
  public static isStrongPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates that full name contains at least a first name and a last name, using only alphabetical chars and spaces.
   */
  public static isValidFullName(name: string): boolean {
    const clean = name.trim();
    if (clean.length < 3) return false;
    
    // Only letters, spaces, dots, hyphens, and single quotes
    const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
    if (!nameRegex.test(clean)) return false;

    const parts = clean.split(/\s+/);
    return parts.length >= 2 && parts.every(part => part.length >= 1);
  }

  /**
   * Validates if the query/claim text is rightful and verified.
   */
  public static isValidClaimText(text: string): { isValid: boolean; error?: string } {
    const clean = text.trim();
    if (clean.length === 0) {
      return { isValid: false, error: 'Claim text cannot be empty.' };
    }
    if (clean.length < 10) {
      return { isValid: false, error: 'Please enter a detailed claim or question (minimum 10 characters).' };
    }
    // Check if it's just numbers
    if (/^\d+$/.test(clean)) {
      return { isValid: false, error: 'Claim cannot consist of numbers only.' };
    }
    // Check if it's just repetitive characters (e.g. "aaaaaaa")
    const uniqueChars = new Set(clean.toLowerCase().replace(/[^a-z]/g, ''));
    if (uniqueChars.size <= 2 && clean.length > 15) {
      return { isValid: false, error: 'Please enter a rightful claim containing valid words.' };
    }
    return { isValid: true };
  }
}
