// Describes every editable part of the site for the admin panel.
// Field types: text, textarea, paragraphs, lines, number, image, images, icon,
// toggle, select, list (with nested `fields`). Dotted keys ("cta.title") reach
// into nested objects.

const t = (k, label, help) => ({ k, t: 'text', label, help })
const area = (k, label, help) => ({ k, t: 'textarea', label, help })
const heading = (k = 'title', label = 'Heading') => ({ k, t: 'lines', label, help: 'One line per row — each row slides in on its own.' })
const eyebrow = { k: 'eyebrow', t: 'text', label: 'Small label above the heading' }
const img = (k, label = 'Photo', help) => ({ k, t: 'image', label, help })

const hero = (imageField = img('image', 'Hero photo')) => ({
  key: 'hero',
  label: 'Page header',
  fields: [eyebrow, heading('title', 'Page title'), area('text', 'Intro text'), ...[].concat(imageField)],
})

const cta = {
  key: 'cta',
  label: 'Enquiry band (bottom of page)',
  description: 'The full-width photo band with the enquiry buttons. Leave the heading or text empty to use the site-wide wording from Settings → Site-wide text.',
  fields: [
    img('image', 'Background photo'),
    { k: 'title', t: 'lines', label: 'Heading (optional)', help: 'Empty = site-wide heading.' },
    area('text', 'Text (optional)', 'Empty = site-wide text.'),
  ],
}

export const pageSchemas = [
  {
    id: 'home',
    label: 'Home',
    url: '/',
    sections: [
      {
        key: 'hero',
        label: 'Hero slideshow',
        description: 'The full-screen photo slideshow at the top of the home page.',
        fields: [
          eyebrow,
          { k: 'title', t: 'lines', label: 'Main heading', help: 'One line per row. The heading types itself out.' },
          area('text', 'Intro text'),
          t('primaryLabel', 'WhatsApp button label'),
          area('whatsappMessage', 'WhatsApp message', 'Pre-filled when a guest taps the WhatsApp button.'),
          t('secondaryLabel', 'Email button label'),
          t('location', 'Caption at the bottom left'),
          {
            k: 'slides',
            t: 'list',
            label: 'Slides',
            itemLabel: (s) => s.alt || 'Slide',
            newItem: { src: '', alt: '' },
            bulkImageKey: 'src',
            fields: [img('src', 'Photo'), t('alt', 'Description', 'Read out by screen readers.')],
          },
        ],
      },
      {
        key: 'welcome',
        label: 'Welcome',
        fields: [
          eyebrow,
          heading(),
          { k: 'paragraphs', t: 'paragraphs', label: 'Text', help: 'Leave a blank line between paragraphs.' },
          t('linkLabel', 'Link label (goes to About)'),
          img('image', 'Main photo'),
          t('imageAlt', 'Main photo description'),
          img('inset', 'Small overlapping photo'),
          t('insetAlt', 'Small photo description'),
          t('badgeSmall', 'Badge — small text'),
          t('badgeLarge', 'Badge — large text'),
          {
            k: 'stats',
            t: 'list',
            label: 'Counters',
            itemLabel: (s) => `${s.n ?? ''}${s.s ?? ''} ${s.label ?? ''}`.trim() || 'Counter',
            newItem: { n: 0, s: '', label: '' },
            fields: [{ k: 'n', t: 'number', label: 'Number' }, t('s', 'Suffix', 'For example ° or h or +'), t('label', 'Label')],
          },
        ],
      },
      { key: 'banner', label: 'Full-screen photo', fields: [img('image'), t('alt', 'Photo description'), t('eyebrow', 'Small caption'), t('text', 'Large caption')] },
      {
        key: 'rooms',
        label: 'Suites showcase',
        description: 'The suites themselves are edited under Content → Suites.',
        fields: [eyebrow, t('titleStart', 'Heading — start'), t('titleAccent', 'Heading — highlighted words'), t('titleEnd', 'Heading — end'), area('text', 'Text'), t('linkLabel', 'Link label')],
      },
      { key: 'services', label: 'Services', description: 'The service tiles are edited under Content → Services.', fields: [eyebrow, heading(), area('text', 'Text')] },
      { key: 'quote', label: 'Quote over photo', fields: [img('image', 'Background photo'), heading('lines', 'Quote'), t('caption', 'Caption')] },
      { key: 'experiences', label: 'Experiences list', description: 'The experiences are edited under Content → Experiences.', fields: [eyebrow, heading(), t('linkLabel', 'Link label')] },
      { key: 'day', label: 'A day at the villa', description: 'The timeline is edited under Content → A day at the villa.', fields: [eyebrow, heading(), area('text', 'Text')] },
      {
        key: 'dining',
        label: 'Dining teaser',
        fields: [img('image', 'Background photo'), eyebrow, heading(), area('text', 'Text'), { k: 'items', t: 'lines', label: 'Bullet points', help: 'One per line.' }, t('linkLabel', 'Link label')],
      },
      { key: 'testimonials', label: 'Guest stories', description: 'The stories are edited under Content → Testimonials.', fields: [eyebrow, t('hint', 'Swipe hint')] },
      { key: 'location', label: 'Location', description: 'The places list is edited under Content → Nearby places.', fields: [img('image', 'Photo'), eyebrow, heading(), area('text', 'Text'), t('linkLabel', 'Link label')] },
      {
        key: 'gallery',
        label: 'Gallery slideshow',
        description: 'Shows the first photos from Content → Gallery photos.',
        fields: [eyebrow, t('title', 'Heading'), t('linkLabel', 'Link label'), { k: 'count', t: 'number', label: 'How many photos to show' }],
      },
      cta,
    ],
  },
  {
    id: 'about',
    label: 'About',
    url: '/about',
    sections: [
      hero([img('image1', 'Left photo'), img('image2', 'Right photo')]),
      {
        key: 'intro',
        label: 'Philosophy',
        fields: [eyebrow, heading(), { k: 'paragraphs', t: 'paragraphs', label: 'Text', help: 'Leave a blank line between paragraphs.' }, t('signature', 'Signature'), img('image'), t('imageAlt', 'Photo description')],
      },
      {
        key: 'story',
        label: 'Our journey',
        fields: [
          eyebrow,
          t('title', 'Heading'),
          { k: 'items', t: 'list', label: 'Steps', itemLabel: (s) => s.year || 'Step', newItem: { year: '', text: '' }, fields: [t('year', 'Heading'), area('text', 'Text')] },
        ],
      },
      { key: 'statement', label: 'Statement over photo', fields: [img('image', 'Background photo'), heading('lines', 'Statement')] },
      {
        key: 'values',
        label: 'Our values',
        fields: [
          eyebrow,
          t('title', 'Heading'),
          {
            k: 'items',
            t: 'list',
            label: 'Values',
            itemLabel: (s) => s.title || 'Value',
            newItem: { icon: 'leaf', title: '', text: '' },
            fields: [{ k: 'icon', t: 'icon', label: 'Icon' }, t('title', 'Title'), area('text', 'Text')],
          },
        ],
      },
      {
        key: 'haputale',
        label: 'Haputale',
        fields: [
          img('image'),
          t('imageAlt', 'Photo description'),
          eyebrow,
          heading(),
          { k: 'paragraphs', t: 'paragraphs', label: 'Text', help: 'Leave a blank line between paragraphs.' },
          { k: 'facts', t: 'list', label: 'Facts', itemLabel: (s) => `${s.value || ''} ${s.label || ''}`.trim() || 'Fact', newItem: { value: '', label: '' }, fields: [t('value', 'Value'), t('label', 'Label')] },
        ],
      },
      { key: 'closing', label: 'Closing quote', fields: [area('quote', 'Quote')] },
      cta,
    ],
  },
  {
    id: 'rooms',
    label: 'Rooms & Suites',
    url: '/rooms',
    sections: [
      hero(),
      {
        key: 'list',
        label: 'Suite list',
        description: 'Each suite (photos, details, features) is edited under Content → Suites. These are the button labels.',
        fields: [t('enquireLabel', 'Enquiry button'), t('whatsappLabel', 'WhatsApp button'), area('whatsappMessage', 'WhatsApp message', '{room} is replaced with the suite name.')],
      },
      { key: 'amenities', label: 'Amenities', fields: [eyebrow, t('title', 'Heading'), { k: 'items', t: 'lines', label: 'Amenities', help: 'One per line.' }] },
      {
        key: 'policies',
        label: 'Policies',
        fields: [
          {
            k: 'items',
            t: 'list',
            label: 'Policies',
            itemLabel: (s) => s.title || 'Policy',
            newItem: { title: '', text: '' },
            fields: [t('title', 'Title'), area('text', 'Text', 'You can use {checkIn}, {checkOut}, {phone} and {email}.')],
          },
        ],
      },
      cta,
    ],
  },
  {
    id: 'experiences',
    label: 'Experiences',
    url: '/experiences',
    sections: [
      hero(),
      { key: 'list', label: 'Experience cards', description: 'The experiences are edited under Content → Experiences.', fields: [t('allLabel', 'Label of the “All” filter')] },
      {
        key: 'spa',
        label: 'Spa',
        fields: [
          img('image'),
          t('imageAlt', 'Photo description'),
          eyebrow,
          heading(),
          area('text', 'Text'),
          {
            k: 'treatments',
            t: 'list',
            label: 'Treatments',
            itemLabel: (s) => s.name || 'Treatment',
            newItem: { name: '', time: '', text: '' },
            fields: [t('name', 'Name'), t('time', 'Duration'), area('text', 'Description')],
          },
        ],
      },
      { key: 'services', label: 'Services', description: 'The services are edited under Content → Services.', fields: [eyebrow, heading()] },
      { key: 'celebrations', label: 'Celebrations', fields: [eyebrow, heading(), area('text', 'Text'), img('image1', 'Left photo'), img('image2', 'Right photo')] },
      cta,
    ],
  },
  {
    id: 'dining',
    label: 'Dining',
    url: '/dining',
    sections: [
      hero(),
      {
        key: 'kitchen',
        label: 'Our kitchen',
        fields: [eyebrow, heading(), area('text', 'Text'), img('image1', 'Left photo'), t('image1Alt', 'Left photo description'), img('image2', 'Right photo'), t('image2Alt', 'Right photo description')],
      },
      {
        key: 'menu',
        label: 'Sample menu',
        fields: [
          eyebrow,
          heading(),
          {
            k: 'menus',
            t: 'list',
            label: 'Menu tabs',
            itemLabel: (m) => m.name || 'Menu',
            newItem: { name: '', items: [] },
            fields: [
              t('name', 'Tab name'),
              { k: 'items', t: 'list', label: 'Dishes', itemLabel: (d) => d.n || 'Dish', newItem: { n: '', d: '' }, fields: [t('n', 'Dish'), t('d', 'Description')] },
            ],
          },
          area('note', 'Note under the menu'),
        ],
      },
      {
        key: 'venues',
        label: 'Where to dine',
        fields: [
          eyebrow,
          t('title', 'Heading'),
          { k: 'items', t: 'list', label: 'Places', itemLabel: (v) => v.title || 'Place', newItem: { title: '', text: '', image: '' }, fields: [img('image'), t('title', 'Name'), area('text', 'Text')] },
        ],
      },
      { key: 'quote', label: 'Quote over photo', fields: [img('image', 'Background photo'), heading('lines', 'Quote')] },
      cta,
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    url: '/gallery',
    sections: [
      hero(),
      { key: 'grid', label: 'Photo grid', description: 'The photos are managed under Content → Gallery photos.', fields: [t('allLabel', 'Label of the “All” filter')] },
      cta,
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    url: '/contact',
    sections: [
      hero(),
      {
        key: 'cards',
        label: 'Contact cards',
        description: 'Phone, email and map link come from Settings → Contact & social.',
        fields: [t('callLabel', 'Phone card label'), t('emailLabel', 'Email card label'), t('visitLabel', 'Visit card label'), t('visitText', 'Visit card text'), t('hoursLabel', 'Hours card label'), t('hoursText', 'Hours card text')],
      },
      {
        key: 'form',
        label: 'Message form & map',
        fields: [
          eyebrow,
          heading(),
          { k: 'subjects', t: 'lines', label: 'Subject choices', help: 'One per line.' },
          t('buttonLabel', 'Send button'),
          area('thanksText', 'Thank-you message', '{email} becomes your email address as a link.'),
        ],
      },
      {
        key: 'faq',
        label: 'FAQ',
        fields: [
          eyebrow,
          heading(),
          { k: 'items', t: 'list', label: 'Questions', itemLabel: (f) => f.q || 'Question', newItem: { q: '', a: '' }, fields: [t('q', 'Question'), area('a', 'Answer')] },
        ],
      },
    ],
  },
  {
    id: 'booking',
    label: 'Enquiry page',
    url: '/book',
    sections: [
      { key: 'intro', label: 'Page header', fields: [eyebrow, heading('title', 'Page title'), area('text', 'Intro text')] },
      {
        key: 'form',
        label: 'Enquiry form',
        fields: [
          t('step1', 'Step 1 title'),
          t('step2', 'Step 2 title'),
          t('step3', 'Step 3 title'),
          t('step4', 'Step 4 title'),
          t('anyRoomName', '“Any suite” option name'),
          t('anyRoomText', '“Any suite” option text'),
          img('anyRoomImage', '“Any suite” photo'),
          { k: 'interests', t: 'lines', label: 'Extras guests can tick', help: 'One per line.' },
          { k: 'perks', t: 'lines', label: 'Reassurance points', help: 'One per line. {phone} becomes your phone number.' },
        ],
      },
    ],
  },
  {
    id: 'notFound',
    label: '404 page',
    url: '/page-that-does-not-exist',
    sections: [
      { key: 'main', label: 'Not-found page', fields: [eyebrow, t('titleStart', 'Heading'), t('titleAccent', 'Heading — highlighted words'), area('text', 'Text'), t('buttonLabel', 'Button label')] },
    ],
  },
]

// Lists of things shown across several pages.
export const collectionSchemas = [
  {
    id: 'rooms',
    label: 'Suites',
    url: '/rooms',
    description: 'Shown on the home page, the Rooms & Suites page and the enquiry form.',
    itemLabel: (r) => r.name || 'New suite',
    newItem: { name: 'New suite', slug: '', tagline: '', image: '', gallery: [], size: '', guests: '', bed: '', view: '', description: '', features: [] },
    fields: [
      t('name', 'Name'),
      { k: 'slug', t: 'slug', label: 'Link name', help: 'Used in enquiry links. Lowercase letters and dashes; filled in from the name if left empty.', from: 'name' },
      t('tagline', 'Tagline'),
      img('image', 'Main photo', 'Used on the home page and enquiry form.'),
      { k: 'gallery', t: 'images', label: 'Photo gallery', help: 'Shown on the Rooms page, with thumbnails to switch between them.' },
      t('size', 'Size'),
      t('guests', 'Guests'),
      t('bed', 'Bed'),
      t('view', 'View'),
      area('description', 'Description'),
      { k: 'features', t: 'lines', label: 'Features', help: 'One per line.' },
    ],
  },
  {
    id: 'experiences',
    label: 'Experiences',
    url: '/experiences',
    description: 'Shown on the home page and the Experiences page. Categories become the filter buttons.',
    itemLabel: (e) => e.title || 'New experience',
    newItem: { title: 'New experience', category: '', image: '', text: '', duration: '' },
    fields: [t('title', 'Title'), { k: 'category', t: 'text', label: 'Category', suggest: 'category' }, t('duration', 'Duration'), img('image'), area('text', 'Description')],
  },
  {
    id: 'services',
    label: 'Services',
    url: '/experiences',
    description: 'Shown on the home page and the Experiences page.',
    itemLabel: (s) => s.title || 'New service',
    newItem: { icon: 'concierge', title: 'New service', text: '' },
    fields: [{ k: 'icon', t: 'icon', label: 'Icon' }, t('title', 'Title'), area('text', 'Text')],
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    url: '/',
    description: 'Guest stories on the home page.',
    itemLabel: (s) => s.name || 'New story',
    newItem: { quote: '', name: '', from: '' },
    fields: [area('quote', 'Quote'), t('name', 'Guest name'), t('from', 'Where they are from')],
  },
  {
    id: 'dayAtVilla',
    label: 'A day at the villa',
    url: '/',
    description: 'The timeline on the home page.',
    itemLabel: (d) => [d.time, d.title].filter(Boolean).join(' · ') || 'New moment',
    newItem: { time: '', title: '', text: '' },
    fields: [t('time', 'Time'), t('title', 'Title'), area('text', 'Text')],
  },
  {
    id: 'attractions',
    label: 'Nearby places',
    url: '/',
    description: 'The list in the Location section of the home page.',
    itemLabel: (a) => [a.name, a.distance].filter(Boolean).join(' — ') || 'New place',
    newItem: { name: '', distance: '' },
    fields: [t('name', 'Place'), t('distance', 'Travel time')],
  },
  {
    id: 'gallery',
    label: 'Gallery photos',
    url: '/gallery',
    description: 'The Gallery page grid and the home page slideshow. Categories become the filter buttons.',
    itemLabel: (g) => g.alt || 'Photo',
    newItem: { src: '', cat: 'Villa', alt: '' },
    bulkImageKey: 'src',
    grid: true,
    fields: [img('src', 'Photo'), t('alt', 'Caption'), { k: 'cat', t: 'text', label: 'Category', suggest: 'cat' }],
  },
]

export const settingsSchemas = [
  {
    id: 'contact',
    label: 'Contact & social',
    sections: [
      {
        path: ['contact'],
        label: 'Contact details',
        description: 'Used in the header menu, footer, contact page, enquiry form and every WhatsApp button.',
        fields: [
          t('phone', 'Phone number'),
          { k: 'whatsapp', t: 'text', label: 'WhatsApp number', help: 'Digits only, with country code — for example 94771234567.' },
          t('email', 'Email address'),
          area('address', 'Address'),
          t('checkIn', 'Check-in time'),
          t('checkOut', 'Check-out time'),
          t('mapLink', 'Google Maps link', 'Opens when guests tap “Visit”.'),
          { k: 'mapEmbed', t: 'text', label: 'Map embed address', help: 'In Google Maps: Share → Embed a map → copy only the address inside src="…".' },
        ],
      },
      {
        path: ['contact', 'social'],
        label: 'Social profiles',
        description: 'Leave one empty to hide its icon.',
        fields: [t('facebook', 'Facebook'), t('instagram', 'Instagram'), t('tiktok', 'TikTok')],
      },
    ],
  },
  {
    id: 'site',
    label: 'Site-wide text',
    sections: [
      {
        path: ['site'],
        label: 'Search engines & browser tab',
        fields: [t('seoTitle', 'Page title'), area('seoDescription', 'Description', 'Shown under the title in Google results.')],
      },
      {
        path: ['site'],
        label: 'Header & footer',
        fields: [
          t('navButtonLabel', 'Header button'),
          t('menuButtonLabel', 'Mobile menu button'),
          area('footerTagline', 'Footer tagline'),
          t('footerEnquiriesLabel', 'Footer enquiries link'),
          t('footerMotto', 'Footer motto'),
          t('copyright', 'Copyright line', 'The year is added automatically.'),
          { k: 'showWhatsappButton', t: 'toggle', label: 'Show the floating WhatsApp button' },
        ],
      },
      {
        path: ['site', 'cta'],
        label: 'Enquiry band (default wording)',
        description: 'The photo band at the bottom of most pages. Each page can override the heading and text.',
        fields: [eyebrow, heading(), area('text', 'Text'), t('primaryLabel', 'Main button'), t('secondaryLabel', 'WhatsApp button')],
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    sections: [
      {
        path: ['navLinks'],
        label: 'Menu links',
        description: 'Rename, reorder or hide the menu links. Hidden pages still work if someone has the link.',
        list: {
          itemLabel: (l) => l.label || l.to,
          fixed: true,
          fields: [t('label', 'Label'), { k: 'to', t: 'readonly', label: 'Page' }, { k: 'hidden', t: 'toggle', label: 'Hide from the menu' }],
        },
      },
    ],
  },
]
