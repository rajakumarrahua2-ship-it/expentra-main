/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563EB",     // Blue
                secondary: "#10B981",   // Green
                background: "#F9FAFB",  // Light Gray
                textColor: "#111827",   // Dark text
                card: "#FFFFFF",        // Card white
                danger: "#EF4444",      // Red — error/over-budget states
            },
        },
    },
    plugins: [],
}