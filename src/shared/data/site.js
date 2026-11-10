// ---------------------------------------------------------------------------
// Villa Cavo — default site content
// These are the built-in defaults. Anything published from the admin panel
// (/admin) is layered on top of them at runtime, so edits made there win.
// Built-in photos live in /public/images; uploaded photos live in Vercel Blob.
// ---------------------------------------------------------------------------

const img = (name) => `/images/${name}.jpg`

export const contact = {
  phone: '+94 77 000 0000', // TODO: real number
  whatsapp: '94770000000', // TODO: digits only, with country code
  email: 'stay@villacavo.lk', // TODO: real email
  address: 'Villa Cavo, Haputale, Badulla District, Uva Province, Sri Lanka',
  mapEmbed: 'https://www.google.com/maps?q=Haputale,Sri+Lanka&z=13&output=embed',
  mapLink: 'https://maps.google.com/?q=Haputale,Sri+Lanka',
  checkIn: '2:00 PM',
  checkOut: '11:00 AM',
  social: {
    // TODO: replace with Villa Cavo's real profile links
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
  },
}

export const images = {
  aerial: img('aerial-forest'), // villa from the air, forest and road
  villaDusk: img('villa-dusk'), // villa exterior at dusk
  villaDusk2: img('villa-dusk-2'), // villa exterior at dusk, wider angle
  jacuzzi: img('jacuzzi-sunset'), // hot tub and deck at sunset (portrait)
  rooftopSunset: img('rooftop-sunset'), // rooftop chairs, mountain view at dusk
  rooftopBar: img('rooftop-bar'), // rooftop lounge and bar at night
  dining: img('dining-table'), // candlelit dining table (portrait)
  suiteLiving: img('suite-living'), // suite with lounge, dining nook and view
  suiteLounge: img('suite-lounge'), // suite armchairs by the glass wall
  bedroomView: img('bedroom-view'), // king bedroom opening onto the hills
  bedroomDesk: img('bedroom-desk'), // bedroom with desk and mirror
  bedroomDancer: img('bedroom-dancer'), // bedroom with wardrobe and red painting
  bedroomNight: img('bedroom-night'), // bedroom in evening light
  bedroomDetail: img('bedroom-detail'), // wardrobe and vase detail (portrait)
  walkway: img('walkway'), // red walkway with timber door, daytime
  verandaDusk: img('veranda-dusk'), // long veranda at dusk (portrait)
  verandaEvening: img('veranda-evening'), // long veranda at dusk, lamps on
  verandaNight: img('veranda-night'), // veranda at night
}

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/rooms', label: 'Rooms & Suites' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/dining', label: 'Dining' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

export const rooms = [
  {
    slug: 'misty-peak-suite',
    name: 'Misty Peak Suite',
    tagline: 'Our signature suite, framed by the Haputale gap',
    image: images.suiteLiving,
    gallery: [images.suiteLiving, images.suiteLounge, images.jacuzzi],
    size: '62 m²',
    guests: '2 Adults',
    bed: 'King Bed',
    view: 'Panoramic Mountain View',
    description:
      'Wake above the clouds. Floor-to-ceiling glass opens onto a private terrace where the morning mist drifts through the valley below. A deep soaking tub, a reading nook by the fireplace and hand-loomed linens complete the most coveted room at Villa Cavo.',
    features: ['Private terrace', 'Fireplace', 'Soaking tub', 'Rain shower', 'Butler service', 'Minibar'],
  },
  {
    slug: 'tea-garden-deluxe',
    name: 'Tea Garden Deluxe',
    tagline: 'Opening onto rolling emerald tea terraces',
    image: images.bedroomView,
    gallery: [images.bedroomView, images.bedroomDetail, images.verandaDusk],
    size: '45 m²',
    guests: '2 Adults',
    bed: 'King or Twin',
    view: 'Tea Estate View',
    description:
      'Step from your room straight into the garden. Warm timber, colonial-era detailing and a private veranda overlooking the tea estates make the Deluxe rooms a serene retreat — perfect for slow mornings with a pot of freshly brewed Uva tea.',
    features: ['Garden veranda', 'Writing desk', 'Walk-in shower', 'Tea & coffee bar', 'Smart TV', 'Wi-Fi'],
  },
  {
    slug: 'highland-family-villa',
    name: 'Highland Family Villa',
    tagline: 'Two bedrooms, one unforgettable view',
    image: images.bedroomDancer,
    gallery: [images.bedroomDancer, images.bedroomNight, images.walkway],
    size: '95 m²',
    guests: '4 Adults + 2 Children',
    bed: '1 King + 2 Twin',
    view: 'Valley & Garden View',
    description:
      'A home among the hills for families and friends. Two bedrooms share a living lounge with a fireplace and dining table, opening onto a wide deck where evenings are spent watching the lights of the valley flicker on.',
    features: ['Two bedrooms', 'Living lounge', 'Fireplace', 'Large deck', 'Kids amenities', 'In-villa dining'],
  },
  {
    slug: 'cloud-loft',
    name: 'The Cloud Loft',
    tagline: 'A hideaway under the eaves, for two',
    image: images.bedroomDesk,
    gallery: [images.bedroomDesk, images.verandaNight, images.rooftopBar],
    size: '50 m²',
    guests: '2 Adults',
    bed: 'King Bed',
    view: 'Forest & Sky View',
    description:
      'Tucked beneath vaulted timber beams, the Cloud Loft is an intimate escape with a skylight above the bed — for stargazing on clear nights and watching the clouds roll in by day. Ideal for honeymooners.',
    features: ['Skylight', 'Vaulted ceiling', 'Freestanding tub', 'Honeymoon setup', 'Bluetooth speaker', 'Wi-Fi'],
  },
]

export const experiences = [
  {
    title: 'Sunrise at Lipton’s Seat',
    category: 'Excursion',
    image: images.rooftopSunset,
    text: 'Rise before dawn and drive through the Dambatenne tea estate to the viewpoint where Sir Thomas Lipton once surveyed his empire — seven provinces at your feet as the sun breaks the mist.',
    duration: 'Half day',
  },
  {
    title: 'Tea Estate Walk & Tasting',
    category: 'Culture',
    image: images.aerial,
    text: 'Walk the emerald terraces with a local planter, meet the tea pluckers and finish at a century-old factory with a guided tasting of high-grown Uva teas.',
    duration: '3 hours',
  },
  {
    title: 'Adisham Bungalow & Monastery',
    category: 'Heritage',
    image: images.walkway,
    text: 'Visit the Tudor-style Adisham Bungalow — now St. Benedict’s Monastery — set in a forest reserve, with its English gardens, orchards and homemade jams.',
    duration: '2 hours',
  },
  {
    title: 'Diyaluma Falls',
    category: 'Adventure',
    image: images.verandaEvening,
    text: 'Swim in the natural infinity pools at the top of Sri Lanka’s second-highest waterfall, with views stretching all the way to the southern plains.',
    duration: 'Full day',
  },
  {
    title: 'Highland Spa Rituals',
    category: 'Wellness',
    image: images.jacuzzi,
    text: 'Ayurvedic treatments using herbs from our garden — warm oil massages, herbal steam and tea-infused body scrubs to restore you after a day in the hills.',
    duration: '60 – 120 min',
  },
  {
    title: 'The Hill Country Train',
    category: 'Journey',
    image: images.villaDusk2,
    text: 'Ride one of the world’s most scenic railways from Haputale station, winding through tunnels, tea estates and cloud forest toward Ella and Demodara’s Nine Arch Bridge.',
    duration: 'Flexible',
  },
]

export const services = [
  { icon: 'concierge', title: 'Personal Butler', text: 'A dedicated host attends to every detail of your stay.' },
  { icon: 'dining', title: 'In-Villa Dining', text: 'Private chef menus served wherever you wish to dine.' },
  { icon: 'fire', title: 'Bonfire Evenings', text: 'Starlit nights by the fire with hot toddies and stories.' },
  { icon: 'map', title: 'Curated Tours', text: 'Guided excursions to the hill country’s hidden gems.' },
  { icon: 'wifi', title: 'High-Speed Wi-Fi', text: 'Stay connected — even among the clouds.' },
  { icon: 'heart', title: 'Celebrations', text: 'Honeymoons, proposals & private events, beautifully staged.' },
]

export const attractions = [
  { name: 'Haputale Railway Station', distance: '5 min' },
  { name: 'Adisham Bungalow', distance: '15 min' },
  { name: 'Dambatenne Tea Factory', distance: '20 min' },
  { name: 'Lipton’s Seat', distance: '35 min' },
  { name: 'Diyaluma Falls', distance: '1 hr' },
  { name: 'Ella & Nine Arch Bridge', distance: '1 hr 15 min' },
  { name: 'Horton Plains National Park', distance: '1 hr 30 min' },
]

export const testimonials = [
  {
    quote:
      'We woke every morning to clouds drifting below our terrace. The staff anticipated every need before we knew we had it. Truly the finest stay of our Sri Lanka journey.',
    name: 'Charlotte & James',
    from: 'London, United Kingdom',
  },
  {
    quote:
      'The food, the silence, the views — Villa Cavo is pure magic. Dinner by the fireplace after the Lipton’s Seat sunrise is a memory we will treasure forever.',
    name: 'Anika Weber',
    from: 'Munich, Germany',
  },
  {
    quote:
      'Elegant, warm and deeply personal. It feels like staying at a private estate rather than a hotel. We are already planning our return.',
    name: 'Rohan Perera',
    from: 'Colombo, Sri Lanka',
  },
]

export const dayAtVilla = [
  { time: '6:00 AM', title: 'Dawn Mist', text: 'Bed tea delivered to your terrace as the valley disappears beneath a sea of clouds.' },
  { time: '8:30 AM', title: 'Highland Breakfast', text: 'Hoppers, fresh tropical fruit and estate coffee on the garden lawn.' },
  { time: '4:00 PM', title: 'High Tea', text: 'A colonial-style afternoon tea service with Uva’s finest single-estate brews.' },
  { time: '7:30 PM', title: 'Fireside Dinner', text: 'A candlelit Sri Lankan feast, followed by a bonfire under the stars.' },
]

export const gallery = [
  { src: images.villaDusk, cat: 'Villa', alt: 'Villa Cavo lit up at dusk' },
  { src: images.jacuzzi, cat: 'Views', alt: 'Hot tub and deck at sunset' },
  { src: images.suiteLiving, cat: 'Rooms', alt: 'Misty Peak Suite' },
  { src: images.dining, cat: 'Dining', alt: 'Candlelit dining table' },
  { src: images.rooftopSunset, cat: 'Views', alt: 'Rooftop seating above the hills at dusk' },
  { src: images.verandaEvening, cat: 'Villa', alt: 'The long veranda at dusk' },
  { src: images.bedroomView, cat: 'Rooms', alt: 'Tea Garden Deluxe' },
  { src: images.rooftopBar, cat: 'Dining', alt: 'Rooftop lounge and bar' },
  { src: images.aerial, cat: 'Views', alt: 'Villa Cavo in the forest, from above' },
  { src: images.walkway, cat: 'Villa', alt: 'Red walkway and timber door' },
  { src: images.bedroomDancer, cat: 'Rooms', alt: 'Highland Family Villa' },
  { src: images.verandaDusk, cat: 'Villa', alt: 'Veranda beside the glass walls' },
  { src: images.suiteLounge, cat: 'Rooms', alt: 'Suite lounge by the glass wall' },
  { src: images.villaDusk2, cat: 'Views', alt: 'Villa Cavo on the hillside at dusk' },
  { src: images.bedroomDesk, cat: 'Rooms', alt: 'The Cloud Loft' },
  { src: images.verandaNight, cat: 'Villa', alt: 'Veranda at night' },
  { src: images.bedroomDetail, cat: 'Rooms', alt: 'Teak wardrobe and clay vase' },
  { src: images.bedroomNight, cat: 'Rooms', alt: 'Bedroom in evening light' },
]
