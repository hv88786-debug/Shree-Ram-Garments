/** Tailwind config extracted verbatim from the inline tailwind.config in the HTML pages. */
module.exports = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "inverse-on-surface": "#ffedec",
        "secondary-fixed": "#ffdea5",
        "surface": "#fff8f7",
        "on-primary-container": "#fb787c",
        "outline-variant": "#ddc0bf",
        "secondary-container": "#fed488",
        "background": "#fff8f7",
        "on-secondary": "#ffffff",
        "on-surface": "#241919",
        "on-error-container": "#93000a",
        "surface-container-highest": "#f4dddd",
        "outline": "#8a7171",
        "on-tertiary-container": "#a3a19d",
        "surface-tint": "#a5383f",
        "primary": "#4d000c",
        "primary-fixed": "#ffdad9",
        "on-primary-fixed": "#410009",
        "surface-container": "#ffe9e8",
        "on-primary": "#ffffff",
        "on-tertiary-fixed-variant": "#474743",
        "surface-container-low": "#fff0f0",
        "surface-bright": "#fff8f7",
        "surface-variant": "#f4dddd",
        "error-container": "#ffdad6",
        "tertiary-fixed-dim": "#c8c6c2",
        "surface-dim": "#ebd5d4",
        "on-error": "#ffffff",
        "on-secondary-fixed": "#261900",
        "tertiary": "#232320",
        "tertiary-fixed": "#e5e2dd",
        "on-secondary-fixed-variant": "#5d4201",
        "inverse-primary": "#ffb3b2",
        "on-surface-variant": "#574241",
        "on-background": "#241919",
        "on-primary-fixed-variant": "#85202a",
        "surface-container-high": "#fae3e2",
        "primary-fixed-dim": "#ffb3b2",
        "surface-container-lowest": "#ffffff",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#3b2d2d",
        "primary-container": "#700f1c",
        "secondary-fixed-dim": "#e9c176",
        "on-tertiary-fixed": "#1c1c19",
        "tertiary-container": "#383835",
        "error": "#ba1a1a",
        "on-secondary-container": "#785a1a",
        "secondary": "#775a19"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-sm": "0.5rem",
        "margin-md": "2rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "margin": "1rem",
        "space-xs": "0.25rem",
        "gutter-lg": "2rem",
        "gutter-md": "1.5rem",
        "gutter": "1rem",
        "space-xl": "2.5rem",
        "space-2xl": "4rem",
        "margin-lg": "4rem"
      },
      "fontFamily": {
        "headline-md": [
          "Playfair Display"
        ],
        "headline-sm": [
          "Playfair Display"
        ],
        "label-md": [
          "Plus Jakarta Sans"
        ],
        "body-sm": [
          "Plus Jakarta Sans"
        ],
        "price-display": [
          "Plus Jakarta Sans"
        ],
        "body-lg": [
          "Plus Jakarta Sans"
        ],
        "label-lg": [
          "Plus Jakarta Sans"
        ],
        "headline-lg-mobile": [
          "Playfair Display"
        ],
        "headline-xl": [
          "Playfair Display"
        ],
        "body-md": [
          "Plus Jakarta Sans"
        ],
        "label-sm": [
          "Plus Jakarta Sans"
        ],
        "headline-lg": [
          "Playfair Display"
        ],
        "headline-xl-mobile": [
          "Playfair Display"
        ]
      },
      "fontSize": {
        "headline-md": [
          "22px",
          {
            "lineHeight": "30px",
            "letterSpacing": "0.01em",
            "fontWeight": "500"
          }
        ],
        "headline-sm": [
          "18px",
          {
            "lineHeight": "26px",
            "letterSpacing": "0.02em",
            "fontWeight": "600"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.08em",
            "fontWeight": "600"
          }
        ],
        "body-sm": [
          "12px",
          {
            "lineHeight": "18px",
            "letterSpacing": "0.02em",
            "fontWeight": "400"
          }
        ],
        "price-display": [
          "15px",
          {
            "lineHeight": "20px",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "label-lg": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.06em",
            "fontWeight": "600"
          }
        ],
        "headline-lg-mobile": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "0em",
            "fontWeight": "600"
          }
        ],
        "headline-xl": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "body-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.01em",
            "fontWeight": "400"
          }
        ],
        "label-sm": [
          "10px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.12em",
            "fontWeight": "700"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "0em",
            "fontWeight": "600"
          }
        ],
        "headline-xl-mobile": [
          "32px",
          {
            "lineHeight": "38px",
            "letterSpacing": "0em",
            "fontWeight": "600"
          }
        ]
      }
    }
  },
  "content": [
    "./index.html",
    "./shop.html",
    "./product.html",
    "./assets/**/*.js"
  ]
};
