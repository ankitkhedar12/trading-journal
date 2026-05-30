module.exports = {
  "frontend/**/*.{ts,tsx}": () => "npm run --prefix frontend type-check",
  "backend/**/*.ts": () => "npm run --prefix backend type-check"
};
