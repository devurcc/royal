/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-class-pattern': null,
    'font-family-no-missing-generic-family-keyword': null,
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'no-descending-specificity': null,
    'keyframes-name-pattern': null,
    'font-family-name-quotes': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'media-feature-range-notation': null,
  },
};
