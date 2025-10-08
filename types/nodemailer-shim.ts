// Fallback-Typen, falls @types/nodemailer unter ModuleResolution "bundler" nicht gefunden wird.
// Diese Datei kann entfernt werden, wenn die Typen korrekt aufgelöst werden.
declare module 'nodemailer' {
  const nodemailer: any
  export default nodemailer
}