// Fixtures académicos: precios en COP y existencias simuladas por talla EU.
export const brands = [
  { id: "nike", name: "Nike" },
  { id: "adidas", name: "adidas" },
  { id: "new-balance", name: "New Balance" },
  { id: "jordan", name: "Jordan" },
  { id: "asics", name: "ASICS" },
];

export const categories = [
  {
    id: "urban",
    name: "Esenciales",
    description: "Siluetas versátiles para tu día a día.",
  },
  {
    id: "court",
    name: "Court classics",
    description: "La estética de la cancha, en la calle.",
  },
  {
    id: "retro",
    name: "Retro running",
    description: "Capas, texturas y una mirada a los dos mil.",
  },
];

export const products = [
  {
    id: "dunk-panda",
    name: "Dunk Low Retro",
    brandId: "nike",
    categoryId: "court",
    color: "White / Black «Panda»",
    price: 649900,
    sku: "DD1391-100",
    tag: "EN LA ROTACIÓN",
    description:
      "Blanco y negro, sin complicaciones. Una silueta de corte bajo que funciona con denim amplio, pantalones rectos y todos esos planes que no necesitan dress code.",
    image: "/assets/images/dunk-panda.webp",
    alt: "Nike Dunk Low con base blanca, paneles negros y Swoosh negro, vista lateral",
    sizes: [
      { size: 38, stock: 2 },
      { size: 39, stock: 3 },
      { size: 40, stock: 4 },
      { size: 41, stock: 0 },
      { size: 42, stock: 2 },
      { size: 43, stock: 1 },
    ],
  },
  {
    id: "samba-og",
    name: "Samba OG",
    brandId: "adidas",
    categoryId: "urban",
    color: "Cloud White / Core Black",
    price: 589900,
    sku: "B75806",
    tag: "EL ESENCIAL",
    description:
      "Perfil bajo, tres franjas y una suela color caramelo. El par para llevar con un pantalón sastre un día y con tus jeans favoritos al siguiente.",
    image: "/assets/images/samba-og.webp",
    alt: "adidas Samba blanco con tres franjas negras, puntera gris y suela caramelo",
    sizes: [
      { size: 37, stock: 2 },
      { size: 38, stock: 4 },
      { size: 39, stock: 2 },
      { size: 40, stock: 2 },
      { size: 41, stock: 3 },
      { size: 42, stock: 0 },
    ],
  },
  {
    id: "nb-550",
    name: "550",
    brandId: "new-balance",
    categoryId: "court",
    color: "White / Green",
    price: 729900,
    sku: "BB550WT1",
    tag: "TOQUE DE COLOR",
    description:
      "Una base blanca con acentos verdes y presencia de sobra. Su forma de inspiración basketball le da equilibrio a una rotación de tonos neutros.",
    image: "/assets/images/nb-550.webp",
    alt: "New Balance 550 blanco con emblema N y detalles verdes en el talón y la suela",
    sizes: [
      { size: 38, stock: 1 },
      { size: 39, stock: 2 },
      { size: 40, stock: 3 },
      { size: 41, stock: 2 },
      { size: 42, stock: 1 },
      { size: 43, stock: 0 },
    ],
  },
  {
    id: "jordan-green",
    name: "Air Jordan 1 Retro High",
    brandId: "jordan",
    categoryId: "court",
    color: "Black / Lucky Green",
    price: 989900,
    sku: "DZ5485-031",
    tag: "AURA PICK",
    description:
      "Un verde que cambia toda la combinación. Caña alta, paneles en contraste y una silueta protagonista para cuando quieres que el par hable primero.",
    image: "/assets/images/jordan-green.webp",
    alt: "Air Jordan 1 High con talón y cordones verdes, paneles blancos y negros",
    sizes: [
      { size: 39, stock: 0 },
      { size: 40, stock: 2 },
      { size: 41, stock: 2 },
      { size: 42, stock: 1 },
      { size: 43, stock: 2 },
      { size: 44, stock: 1 },
    ],
  },
  {
    id: "gel-1130",
    name: "GEL-1130",
    brandId: "asics",
    categoryId: "retro",
    color: "White / Pure Silver",
    price: 679900,
    sku: "1201B020-100",
    tag: "RETRO ENERGY",
    description:
      "Malla blanca, capas plateadas y estética dosmilera. Un contraste interesante con prendas simples, medias a la vista y una agenda abierta.",
    image: "/assets/images/gel-1130.jpg",
    alt: "ASICS GEL-1130 blanco de malla con refuerzos plateados y detalles negros",
    sizes: [
      { size: 38, stock: 3 },
      { size: 39, stock: 1 },
      { size: 40, stock: 2 },
      { size: 41, stock: 2 },
      { size: 42, stock: 3 },
      { size: 43, stock: 1 },
    ],
  },
  {
    id: "air-force",
    name: "Air Force 1 ’07",
    brandId: "nike",
    categoryId: "urban",
    color: "Triple White",
    price: 559900,
    sku: "CW2288-111",
    tag: "SIEMPRE VIGENTE",
    description:
      "Todo en blanco, con la presencia justa. El punto de partida de una buena rotación: fácil de combinar y listo para acompañar tu uniforme de todos los días.",
    image: "/assets/images/air-force.webp",
    alt: "Nike Air Force 1 de corte bajo completamente blanco con suela gruesa y Swoosh lateral",
    sizes: [
      { size: 37, stock: 2 },
      { size: 38, stock: 3 },
      { size: 39, stock: 4 },
      { size: 40, stock: 4 },
      { size: 41, stock: 3 },
      { size: 42, stock: 2 },
    ],
  },
];


