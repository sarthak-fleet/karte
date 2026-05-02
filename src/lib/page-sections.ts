export const PAGE_SECTION_TYPES = [
  {
    value: 'text',
    label: 'Text Block',
    description: 'A headline with supporting copy.',
  },
  {
    value: 'social',
    label: 'Social Row',
    description: 'A row of social or profile links.',
  },
  {
    value: 'testimonial',
    label: 'Testimonial',
    description: 'A quote with a person or company name.',
  },
  {
    value: 'blog',
    label: 'Blog Posts',
    description: 'A curated list of essays, updates, or writing.',
  },
  {
    value: 'cta',
    label: 'Call To Action',
    description: 'A highlighted block with a button.',
  },
  {
    value: 'contact',
    label: 'Contact Form',
    description: 'A public form visitors can use to contact you.',
  },
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number]['value'];

export function isPageSectionType(value: string): value is PageSectionType {
  return PAGE_SECTION_TYPES.some((section) => section.value === value);
}

export function getPageSectionLabel(type: string) {
  return PAGE_SECTION_TYPES.find((section) => section.value === type)?.label ?? type;
}
