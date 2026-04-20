export interface ThemeConfig {
  name: string;
  value: string;
  dots: {
    light: string[];
    dark: string[];
  };
}

/**
 *
 * * Each theme object includes a `dots` property containing `light` and `dark` arrays.
 * These arrays provide a curated snapshot of the theme's core OKLCH color values.
 * * Data Structure:
 * @property {string} name - The display name of the theme (e.g., 'Ocean Breeze').
 * @property {string} value - The data-theme attribute value (e.g., 'ocean-breeze').
 * @property {Object} dots - Contains the color palette for both modes.
 * * Dot Array Index Mapping:
 * [0] --primary   : The main brand color used for key actions and focus states.
 * [1] --accent    : A highlight color used for secondary emphasis and call-to-actions.
 * [2] --secondary : A supportive color used for backgrounds of secondary UI elements.
 * [3] --border    : The specific color used for component outlines, inputs, and dividers.
 *
 *
 */

export const THEMES: ThemeConfig[] = [
  {
    name: 'Default',
    value: 'default',
    dots: {
      light: ['oklch(0.4349 0.2384 285.78)', 'oklch(0.9232 0.0042 236.5)', 'oklch(0.9232 0.0042 236.5)', 'oklch(0.87 0.01 258)'],
      dark: ['oklch(0.5337 0.2808 293.24)', 'oklch(0.3917 0.0168 268.13)', 'oklch(0.2915 0.0168 264.2705)', 'oklch(0.311 0.0184 264.2611)'],
    },
  },
  {
    name: 'Ocean Breeze',
    value: 'ocean-breeze',
    dots: {
      light: ['oklch(0.7227 0.192 149.5793)', 'oklch(0.9505 0.0507 163.0508)', 'oklch(0.9514 0.025 236.8242)', 'oklch(0.9276 0.0058 264.5313)'],
      dark: ['oklch(0.7729 0.1535 163.2231)', 'oklch(0.3729 0.0306 259.7328)', 'oklch(0.3351 0.0331 260.912)', 'oklch(0.4461 0.0263 256.8018)'],
    },
  },
  {
    name: 'Amber Minimal',
    value: 'amber-minimal',
    dots: {
      light: ['oklch(0.7686 0.1647 70.0804)', 'oklch(0.9869 0.0214 95.2774)', 'oklch(0.967 0.0029 264.5419)', 'oklch(0.9276 0.0058 264.5313)'],
      dark: ['oklch(0.7686 0.1647 70.0804)', 'oklch(0.4732 0.1247 46.2007)', 'oklch(0.2686 0 0)', 'oklch(0.3715 0 0)'],
    },
  },
  {
    name: 'Amethyst Haze',
    value: 'amethyst-haze',
    dots: {
      light: ['oklch(0.6104 0.0767 299.7335)', 'oklch(0.7889 0.0802 359.9375)', 'oklch(0.8957 0.0265 300.2416)', 'oklch(0.8447 0.0226 300.1421)'],
      dark: ['oklch(0.7058 0.0777 302.0489)', 'oklch(0.3181 0.0321 308.6149)', 'oklch(0.4604 0.0472 295.5578)', 'oklch(0.3063 0.0359 293.3367)'],
    },
  },
  {
    name: 'Bold Tech',
    value: 'bold-tech',
    dots: {
      light: ['oklch(0.6056 0.2189 292.7172)', 'oklch(0.9319 0.0316 255.5855)', 'oklch(0.9618 0.0202 295.1913)', 'oklch(0.9299 0.0334 272.7879)'],
      dark: ['oklch(0.6056 0.2189 292.7172)', 'oklch(0.4568 0.2146 277.0229)', 'oklch(0.2573 0.0861 281.2883)', 'oklch(0.2827 0.1351 291.0894)'],
    },
  },
  {
    name: 'Bubblegum',
    value: 'bubblegum',
    dots: {
      light: ['oklch(0.6209 0.1801 348.1385)', 'oklch(0.9195 0.0801 87.667)', 'oklch(0.8095 0.0694 198.1863)', 'oklch(0.6209 0.1801 348.1385)'],
      dark: ['oklch(0.9195 0.0801 87.667)', 'oklch(0.6699 0.0988 356.9762)', 'oklch(0.7794 0.0803 4.133)', 'oklch(0.3907 0.0399 242.2181)'],
    },
  },
  {
    name: 'Caffeine',
    value: 'caffeine',
    dots: {
      light: ['oklch(0.4341 0.0392 41.9938)', 'oklch(0.931 0 0)', 'oklch(0.92 0.0651 74.3695)', 'oklch(0.8822 0 0)'],
      dark: ['oklch(0.9247 0.0524 66.1732)', 'oklch(0.285 0 0)', 'oklch(0.3163 0.019 63.6992)', 'oklch(0.2351 0.0115 91.7467)'],
    },
  },
  {
    name: 'Candyland',
    value: 'candyland',
    dots: {
      light: ['oklch(0.8677 0.0735 7.0855)', 'oklch(0.968 0.211 109.7692)', 'oklch(0.8148 0.0819 225.7537)', 'oklch(0.8699 0 0)'],
      dark: ['oklch(0.8027 0.1355 349.2347)', 'oklch(0.8148 0.0819 225.7537)', 'oklch(0.7395 0.2268 142.8504)', 'oklch(0.3867 0 0)'],
    },
  },
  {
    name: 'Catppuccin',
    value: 'catppuccin',
    dots: {
      light: ['oklch(0.5547 0.2503 297.0156)', 'oklch(0.682 0.1448 235.3822)', 'oklch(0.8575 0.0145 268.4756)', 'oklch(0.8083 0.0174 271.1982)'],
      dark: ['oklch(0.7871 0.1187 304.7693)', 'oklch(0.8467 0.0833 210.2545)', 'oklch(0.4765 0.034 278.643)', 'oklch(0.324 0.0319 281.9784)'],
    },
  },
  {
    name: 'Claude',
    value: 'claude',
    dots: {
      light: ['oklch(0.6171 0.1375 39.0427)', 'oklch(0.9245 0.0138 92.9892)', 'oklch(0.9245 0.0138 92.9892)', 'oklch(0.8847 0.0069 97.3627)'],
      dark: ['oklch(0.6724 0.1308 38.7559)', 'oklch(0.213 0.0078 95.4245)', 'oklch(0.9818 0.0054 95.0986)', 'oklch(0.3618 0.0101 106.8928)'],
    },
  },
  {
    name: 'Claymorphism',
    value: 'claymorphism',
    dots: {
      light: ['oklch(0.5854 0.2041 277.1173)', 'oklch(0.9376 0.026 321.9388)', 'oklch(0.8687 0.0043 56.366)', 'oklch(0.8687 0.0043 56.366)'],
      dark: ['oklch(0.6801 0.1583 276.9349)', 'oklch(0.3896 0.0074 59.4734)', 'oklch(0.3359 0.0077 59.4197)', 'oklch(0.3359 0.0077 59.4197)'],
    },
  },
  {
    name: 'Supabase',
    value: 'supabase',
    dots: {
      light: ['oklch(0.8348 0.1302 160.908)', 'oklch(0.9461 0 0)', 'oklch(0.994 0 0)', 'oklch(0.9037 0 0)'],
      dark: ['oklch(0.4365 0.1044 156.7556)', 'oklch(0.3132 0 0)', 'oklch(0.2603 0 0)', 'oklch(0.2809 0 0)'],
    },
  },
  {
    name: 'Twitter',
    value: 'twitter',
    dots: {
      light: ['oklch(0.6723 0.1606 244.9955)', 'oklch(0.9392 0.0166 250.8453)', 'oklch(0.1884 0.0128 248.5103)', 'oklch(0.9317 0.0118 231.6594)'],
      dark: ['oklch(0.6692 0.1607 245.011)', 'oklch(0.1928 0.0331 242.5459)', 'oklch(0.9622 0.0035 219.5331)', 'oklch(0.2674 0.0047 248.0045)'],
    },
  },
  {
    name: 'Vercel',
    value: 'vercel',
    dots: {
      light: ['oklch(0 0 0)', 'oklch(0.94 0 0)', 'oklch(0.94 0 0)', 'oklch(0.92 0 0)'],
      dark: ['oklch(1 0 0)', 'oklch(0.32 0 0)', 'oklch(0.25 0 0)', 'oklch(0.26 0 0)'],
    },
  },
  {
    name: 'Vintage Paper',
    value: 'vintage-paper',
    dots: {
      light: ['oklch(0.618 0.0778 65.5444)', 'oklch(0.8348 0.0426 88.8064)', 'oklch(0.8846 0.0302 85.5655)', 'oklch(0.8606 0.0321 84.5881)'],
      dark: ['oklch(0.7264 0.0581 66.6967)', 'oklch(0.4186 0.0281 56.3404)', 'oklch(0.3795 0.0181 57.128)', 'oklch(0.3795 0.0181 57.128)'],
    },
  },
];

export const DEFAULT_THEME = 'default';
