export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  corePlugins: { preflight: false }, // avoid CSS reset clash with Bootstrap
  plugins: [],
}
