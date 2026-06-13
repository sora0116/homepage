export const dadsComponentRegistry = {
  "accordion": [
    "playground",
    "stacked"
  ],
  "blockquote": [
    "multiple-paragraphs",
    "playground",
    "with-list"
  ],
  "breadcrumb": [
    "plain",
    "with-home-icon",
    "with-visible-label"
  ],
  "button": [
    "all-buttons-using-button",
    "all-buttons-using-link",
    "playground"
  ],
  "calendar": [
    "playground"
  ],
  "card": [
    "example-1",
    "example-2",
    "example-3",
    "example-4",
    "example-5",
    "example-6"
  ],
  "carousel": [
    "container",
    "key-visual-multi",
    "key-visual-single"
  ],
  "checkbox": [
    "all-checkboxes",
    "errored",
    "indeterminate",
    "playground",
    "stacked",
    "standalone"
  ],
  "chip-label": [
    "all-chip-labels",
    "playground"
  ],
  "date-picker": [
    "playground-consolidated",
    "playground-separated",
    "readonly",
    "with-form-control-label"
  ],
  "description-list": [
    "playground"
  ],
  "disclosure": [
    "playground"
  ],
  "divider": [
    "all-dividers",
    "playground"
  ],
  "drawer": [
    "playground"
  ],
  "emergency-banner": [
    "playground"
  ],
  "file-upload": [
    "playground",
    "with-existing-files"
  ],
  "form-control-label": [
    "multiple",
    "single"
  ],
  "hamburger-menu-button": [
    "desktop-and-mobile",
    "mobile-conditional-en",
    "mobile-conditional"
  ],
  "heading": [
    "playground"
  ],
  "horizontal-menu": [
    "playground"
  ],
  "image": [
    "playground",
    "with-picture-element"
  ],
  "input-text": [
    "playground",
    "readonly",
    "with-form-control-label"
  ],
  "language-selector": [
    "playground"
  ],
  "link": [
    "playground"
  ],
  "list": [
    "all-lists"
  ],
  "menu-list": [
    "has-children",
    "playground"
  ],
  "menu-list-box": [
    "playground"
  ],
  "notification-banner": [
    "error",
    "info-1",
    "info-2",
    "mobile-compact",
    "success",
    "warning"
  ],
  "page-navigation": [
    "arrow-button",
    "outlined-button",
    "text-button"
  ],
  "progress-indicator": [
    "interactive-demo",
    "linear-fill",
    "linear-loop",
    "spinner-fill",
    "spinner-loop",
    "static"
  ],
  "radio": [
    "all-radios",
    "errored",
    "playground",
    "stacked",
    "standalone"
  ],
  "resource-list": [
    "multiple-items",
    "playground",
    "with-control"
  ],
  "search-box": [
    "playground"
  ],
  "select": [
    "playground",
    "with-form-control-label"
  ],
  "step-navigation": [
    "playground-full",
    "playground-single"
  ],
  "tab": [
    "example",
    "playground-aria",
    "playground-static",
    "playground"
  ],
  "table": [
    "border-on-row-and-column",
    "condensed-table",
    "first-column-as-header-cell",
    "first-row-and-column-as-header-cell",
    "first-row-as-header-cell",
    "highlight-hovered-row",
    "indented-rows",
    "linked-text-in-cell",
    "overflow-on-mobile",
    "plain",
    "playground",
    "selectable-table",
    "sortable-header-dense",
    "sortable-header",
    "stripe-table",
    "table-header-with-colspan",
    "table-header-with-rowspan",
    "with-caption"
  ],
  "textarea": [
    "playground",
    "readonly",
    "with-counter",
    "with-form-control-label"
  ],
  "utility-link": [
    "multiple",
    "playground"
  ]
} as const;

export type DadsComponentName = keyof typeof dadsComponentRegistry;
