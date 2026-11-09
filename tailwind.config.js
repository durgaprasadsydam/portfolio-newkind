/** Tailwind CSS v3 config — rebuild with:  npx tailwindcss@3 -i src/input.css -o css/tailwind.css --minify */
module.exports = {
  content: ["./*.html", "./js/main.js"],
  theme: {
    extend: {
      colors: {
        // Brand: Rose = primary, Sage = secondary. Ink / Page = neutrals.
        rose:  { DEFAULT: "#C16AA1", deep: "#A9548A", 50: "#F8EBF3" },
        sage:  { DEFAULT: "#9AC1BE", deep: "#4A7B77", 50: "#EEF5F4" },
        ink:   { DEFAULT: "#242833", soft: "#2F3340" },
        page:  "#F8F9FB",
      },
      fontFamily: {
        sans: ['"Sora"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
      maxWidth: { site: "1320px" },
    },
  },
  plugins: [],
};
