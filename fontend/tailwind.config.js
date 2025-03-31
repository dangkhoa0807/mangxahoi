/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      width: {
        "6/12": "50%",
        "7/12": "58.333333%", // Giá trị tương ứng với 7 phần trên 12
      },
      gridTemplateColumns: {
        15: "repeat(15, minmax(0, 1fr))",
      },
      gridColumn: {
        // Định nghĩa span 15 cột
        "span-15": "span 15 / span 15",
      },
    },
  },
  plugins: [],
};
