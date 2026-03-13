import mammoth from 'mammoth';
const r = await mammoth.extractRawText({ path: 'C:/Users/ggrimlan/Downloads/press releases/בינה מלאכותית ברשתות דור 5 ללא צורך בכרטיסים גרפיים יקרים.docx' });
const lines = r.value.split('\n').filter(l => l.trim());
console.log('First 200 chars:', r.value.substring(0, 200));
console.log('Has Xeon:', r.value.includes('Xeon'));
console.log('Has דור 5:', r.value.includes('דור 5'));
