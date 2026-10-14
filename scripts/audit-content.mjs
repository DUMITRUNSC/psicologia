import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const project = path.resolve(import.meta.dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const file of ['pages.js', 'questions.js']) {
  vm.runInContext(fs.readFileSync(path.join(project, 'dist', file), 'utf8'), context, { filename: file });
}

const pages = context.window.NOTES_PAGES;
const questions = context.window.QUESTIONS;
const failures = [];
const requireCheck = (condition, message) => { if (!condition) failures.push(message); };

requireCheck(pages.length === 58, `Se esperaban 58 páginas y hay ${pages.length}`);
requireCheck(pages.every((p, i) => p.page === i + 1), 'La numeración de páginas no es continua');
requireCheck(pages.every(p => p.text.trim().length > 0), 'Hay páginas sin texto');
requireCheck(new Set(questions.map(q => q.id)).size === questions.length, 'Hay identificadores de pregunta duplicados');
requireCheck(questions.filter(q => q.official).length === 10, 'El número de preguntas oficiales no coincide con las capturas recuperadas');

for (const q of questions) {
  requireCheck(pages.some(p => p.page === q.page), `${q.id}: página ${q.page} inexistente`);
  requireCheck(q.options.length === 3, `${q.id}: debe tener tres alternativas`);
  requireCheck(q.options.filter(o => o[1]).length === 1, `${q.id}: debe tener exactamente una respuesta correcta`);
  requireCheck(q.options.every(o => typeof o[2] === 'string' && o[2].trim().length > 0), `${q.id}: falta una explicación`);
  requireCheck(q.modes.length > 0, `${q.id}: no está asignada a ningún modo`);
}

const summary = {
  pages: pages.length,
  nonEmptyPages: pages.filter(p => p.text.trim()).length,
  preservedCharacters: pages.reduce((n, p) => n + p.text.length, 0),
  questions: questions.length,
  officialQuestions: questions.filter(q => q.official).length,
  optionsWithExplanation: questions.reduce((n, q) => n + q.options.filter(o => o[2]?.trim()).length, 0),
  validPageReferences: questions.filter(q => pages.some(p => p.page === q.page)).length,
  failures
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exit(1);
