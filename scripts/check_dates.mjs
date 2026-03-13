import mammoth from 'mammoth';

const base = 'C:/Users/ggrimlan/Downloads/press releases/';
const files = [
  'אינטל חשפה לראשונה פרטים על שיתוף הפעולה עם NVIDIA לצד נתוני ייצור חדשים..docx',
  'הודעה להודעה לעיתונות אינטל משיקה את AI Playground 3.0.docx',
  'אינטל משיקה את מעבדי Intel Core Ultra Series 3 שפותחו בישראל על במת לאס וגאס העולמית ב-CES 2026.docx',
  'גשרים חברתיים לעתיד טכנולוגי מתחילים בירושלים.docx',
  'יום הנתינה הבינלאומי באינטל.docx',
  'הודעה לעיתונות - יום נגישות מיוחד באינטל קריית גת.docx',
  'עובדי אינטל חיפה השתתפו ביום התנדבות מרגש לקראת חג פורים.docx',
  'עובדי אינטל סייעו בהקמת מרחב טיפול באמנות ביד מרדכי (2).docx',
  'אינטל פיצחה את הקוד- כך יוטמע סוכן ה-AI הוויראלי OpenClaw בארגונים ללא חשש.docx',
  'אינטל משקיעה מעל 350 מיליון דולר בחברת SambaNova הפועלת בשוק הרצת המודלים לבינה מלאכותית.docx',
];

for (const f of files) {
  const r = await mammoth.extractRawText({ path: base + f });
  const dateMatches = r.value.match(/\d{1,2}[.]\d{1,2}[.]\d{2,4}/g);
  const hebrewDateMatches = r.value.match(/\d{1,2}\s+(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)\s+\d{4}/g);
  console.log('FILE:', f.substring(0,60));
  console.log('  Num dates:', dateMatches);
  console.log('  Hebrew dates:', hebrewDateMatches);
  const lines = r.value.split('\n').filter(l => l.trim());
  console.log('  First lines:', lines.slice(0,3).join(' | '));
  console.log('');
}
