/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      accent: "var(--accent)",
      "accent-foreground": "var(--accent-foreground)",
      muted: "var(--muted)",
      "muted-foreground": "var(--muted-foreground)",
      border: "var(--border)",
    },
    fontFamily: {
      app: "var(--font-google-sans-code)",
    },
  },
  plugins: [],
};
