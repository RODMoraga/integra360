/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
        quicksand: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      spacing: {
        "spacing-2xs": "0.25rem",
        "spacing-xs": "0.5rem",
        "spacing-sm": "0.75rem",
        "spacing-md": "1rem",
        "spacing-lg": "1.5rem",
        "spacing-xl": "2rem",
        "spacing-2xl": "3rem",
        section: "1.5rem",
        container: "1rem",
        card: "1.25rem"
      },
      borderRadius: {
        "radius-sm": "0.5rem",
        "radius-md": "0.75rem",
        "radius-lg": "1rem",
        "radius-xl": "1.25rem",
        "radius-2xl": "1.5rem",
        card: "1rem",
        panel: "1.25rem",
        pill: "9999px"
      },
      boxShadow: {
        soft: "0 4px 16px rgba(9, 22, 93, 0.08)",
        elevated: "0 16px 32px rgba(9, 22, 93, 0.14)",
        focus: "0 0 0 4px rgba(23, 54, 232, 0.24)",
        card: "0 8px 24px rgba(9, 22, 93, 0.10)",
        panel: "0 18px 36px rgba(9, 22, 93, 0.12)"
      },
      colors: {
        primary: {
          50: "#e8ebfd",
          100: "#d1d7fa",
          200: "#a2aff6",
          300: "#7487f1",
          400: "#455eed",
          500: "#1736e8",
          600: "#122bba",
          700: "#0e218b",
          800: "#09165d",
          900: "#050b2e",
          950: "#030820",
          DEFAULT: "#1736e8"
        },
        secondary: {
          50: "#fce8ef",
          100: "#fad1df",
          200: "#f5a3c0",
          300: "#f075a0",
          400: "#eb4781",
          500: "#e61961",
          600: "#b8144e",
          700: "#8a0f3a",
          800: "#5c0a27",
          900: "#2e0513",
          950: "#20040e",
          DEFAULT: "#e61961"
        },
        danger: {
          50: "#fee6e9",
          100: "#fdced3",
          200: "#fb9da6",
          300: "#fa6b7a",
          400: "#f83a4d",
          500: "#f60921",
          600: "#c5071a",
          700: "#940514",
          800: "#62040d",
          900: "#310207",
          950: "#220105",
          DEFAULT: "#f60921"
        },
        warning: {
          50: "#fef4e6",
          100: "#fee9cd",
          200: "#fcd29c",
          300: "#fbbc6a",
          400: "#faa638",
          500: "#f99006",
          600: "#c77305",
          700: "#955604",
          800: "#633903",
          900: "#321d01",
          950: "#231401",
          DEFAULT: "#f99006"
        },
        surface: {
          base: "#f8fbff",
          soft: "#e8ebfd",
          elevated: "#ffffff",
          border: "#d1d7fa"
        },
        "on-surface": {
          DEFAULT: "#050b2e",
          muted: "#455eed",
          subtle: "#7487f1",
          inverse: "#f8fbff"
        },
        "ink-black": {
          50: "#e8ebfd",
          100: "#d1d7fa",
          200: "#a2aff6",
          300: "#7487f1",
          400: "#455eed",
          500: "#1736e8",
          600: "#122bba",
          700: "#0e218b",
          800: "#09165d",
          900: "#050b2e",
          950: "#030820"
        },
        "night-bordeaux": {
          50: "#fce8ef",
          100: "#fad1df",
          200: "#f5a3c0",
          300: "#f075a0",
          400: "#eb4781",
          500: "#e61961",
          600: "#b8144e",
          700: "#8a0f3a",
          800: "#5c0a27",
          900: "#2e0513",
          950: "#20040e"
        },
        "black-cherry": {
          50: "#fee6e9",
          100: "#fdced3",
          200: "#fb9da6",
          300: "#fa6b7a",
          400: "#f83a4d",
          500: "#f60921",
          600: "#c5071a",
          700: "#940514",
          800: "#62040d",
          900: "#310207",
          950: "#220105"
        },
        oxblood: {
          50: "#ffe6e7",
          100: "#fecdce",
          200: "#fd9b9e",
          300: "#fd686d",
          400: "#fc363d",
          500: "#fb040c",
          600: "#c9030a",
          700: "#970207",
          800: "#640205",
          900: "#320102",
          950: "#230102"
        },
        "brick-ember": {
          50: "#ffe5e5",
          100: "#ffcccc",
          200: "#ff9999",
          300: "#ff6666",
          400: "#ff3333",
          500: "#ff0000",
          600: "#cc0000",
          700: "#990000",
          800: "#660000",
          900: "#330000",
          950: "#240000"
        },
        "red-ochre": {
          50: "#ffebe6",
          100: "#fed7cd",
          200: "#feae9a",
          300: "#fd8668",
          400: "#fd5d35",
          500: "#fc3503",
          600: "#ca2a02",
          700: "#972002",
          800: "#651501",
          900: "#320b01",
          950: "#230700"
        },
        "cayenne-red": {
          50: "#ffefe6",
          100: "#fee0cd",
          200: "#fdc09b",
          300: "#fda168",
          400: "#fc8236",
          500: "#fb6304",
          600: "#c94f03",
          700: "#973b02",
          800: "#642702",
          900: "#321401",
          950: "#230e01"
        },
        "deep-saffron": {
          50: "#fef4e6",
          100: "#fee9cd",
          200: "#fcd29c",
          300: "#fbbc6a",
          400: "#faa638",
          500: "#f99006",
          600: "#c77305",
          700: "#955604",
          800: "#633903",
          900: "#321d01",
          950: "#231401"
        },
        orange: {
          50: "#fef6e6",
          100: "#feedcd",
          200: "#fddb9b",
          300: "#fcc969",
          400: "#fbb637",
          500: "#faa405",
          600: "#c88304",
          700: "#966303",
          800: "#644202",
          900: "#322101",
          950: "#231701"
        },
        "amber-flame": {
          50: "#fff8e5",
          100: "#fff1cc",
          200: "#ffe299",
          300: "#ffd466",
          400: "#ffc533",
          500: "#ffb700",
          600: "#cc9200",
          700: "#996e00",
          800: "#664900",
          900: "#332500",
          950: "#241a00"
        }
      }
    }
  },
  plugins: []
};
