// Full menu for Le Goût du Charbon — synchronisé avec le site web officiel (photos, prix, descriptions).
// Source : page Menu du site web (src/data/menu.ts) — resynchronisé le 22/07/2026.

export type ExtraOption = { id: string; name: string; price: number; img?: string; group?: "topping" | "sauce" };

export const CUISSON_OPTIONS = ["Bleu", "Saignant", "À point", "Bien cuit"] as const;
export type Cuisson = (typeof CUISSON_OPTIONS)[number];

export const TOPPINGS: ExtraOption[] = [
  { id: "top-jalapenos", name: "Jalapeños", price: 7, img: "/images/dish-topping-jalapenos.jpg", group: "topping" },
  { id: "top-bacon", name: "Bacon", price: 12, img: "/images/dish-topping-bacon.jpg", group: "topping" },
  { id: "top-cheddar", name: "Cheddar", price: 10, img: "/images/dish-topping-cheddar.jpg", group: "topping" },
  { id: "top-oignon-caramelise", name: "Oignon caramélisé", price: 7, img: "/images/dish-topping-oignon-caramelise.jpg", group: "topping" },
  { id: "top-champignon-saute", name: "Champignon sauté", price: 8, img: "/images/dish-topping-champignon-saute.jpg", group: "topping" },
  { id: "top-sauce-fromage", name: "Sauce fromagère", price: 12, img: "/images/dish-topping-sauce-fromage.jpg", group: "sauce" },
  { id: "top-sauce-champignon", name: "Sauce champignon", price: 12, img: "/images/dish-topping-sauce-champignon.jpg", group: "sauce" },
  { id: "top-sauce-signature", name: "Sauce Goût du Charbon", price: 8, img: "/images/dish-topping-sauce-signature.jpg", group: "sauce" },
  { id: "top-sauce-bigtasty", name: "Sauce Big Tasty", price: 7, img: "/images/dish-topping-sauce-bigtasty.jpg", group: "sauce" },
  { id: "top-sauce-algerienne", name: "Sauce algérienne", price: 6, group: "sauce" },
  { id: "top-sauce-mayo", name: "Mayo maison", price: 5, group: "sauce" },
  { id: "top-sauce-berger", name: "Sauce berger", price: 6, group: "sauce" },
  { id: "top-sauce-moutarde", name: "Moutarde", price: 5, group: "sauce" },
];

// Sauces incluses (au choix, offertes) — utilisées pour les tacos (3 au choix)
export const FREE_SAUCES: string[] = [
  "Sauce fromagère",
  "Sauce Goût du Charbon",
  "Sauce algérienne",
  "Mayo maison",
  "Sauce berger",
  "Moutarde",
  "Ketchup",
  "Harissa",
  "Barbecue",
  "Samouraï",
];

export type MenuItem = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  img?: string; // URL vers la photo du plat
  hasExtras?: boolean;
  hasCuisson?: boolean;
  hasSauces?: boolean; // choix de 3 sauces offertes (tacos)
};

export type MenuCategory = {
  id: string;
  label: string;
  note?: string;
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  {
    id: "petits-dejeuners",
    label: "Petits Déjeuners",
    note: "Tous nos petits déjeuners sont servis avec belboula.",
    items: [
      { id: "pd-marocain", name: "Marocain", desc: "Baghrir, rghifa, harcha, jben, zit beldia, miel + jus d'orange ou carotte frais + boisson chaude.", price: 26, img: "/images/dish-breakfast.jpg" },
      { id: "pd-chamali", name: "Chamali", desc: "Œufs, jben, lanchon, olives, zit beldia, fromage rouge + panier de pain + jus frais + boisson chaude.", price: 34, img: "/images/dish-breakfast-chamali.jpg" },
      { id: "pd-beldi", name: "Beldi", desc: "2 œufs mslou9, bissara, zit beldia, olives + panier de pain + jus frais + boisson chaude.", price: 28, img: "/images/dish-breakfast-beldi.jpg" },
    ],
  },
  {
    id: "entrees",
    label: "Les Entrées",
    items: [
      { id: "ent-variee", name: "Salade variée", desc: "Carotte râpée, betterave, pomme de terre, tomate cerise, haricot vert, œuf dur, concombre.", price: 35, img: "/images/dish-salade-variee.jpg" },
      { id: "ent-cesar", name: "Salade César", desc: "Laitue, croûton, poulet, fromage, parmesan frais, tomate cerise.", price: 42, img: "/images/dish-salade-cesar.jpg" },
      { id: "ent-gdc", name: "Salade Goût du Charbon", desc: "Avocat, pomme, carotte râpée, crevette, maïs, fromage rouge, cœur de palmier, noix, raisin sec.", price: 55, img: "/images/dish-salade-gout-du-charbon.jpg" },
      { id: "ent-assortiment", name: "Assortiment marocain", desc: "Trilogie de salades marocaines : zaâlouk d'aubergines, carotte marinée aux épices et taktouka de poivrons.", price: 30, img: "/images/dish-salade.jpg" },
    ],
  },
  {
    id: "entree-chaude",
    label: "Entrée Chaude",
    items: [
      { id: "ec-soupe-legumes", name: "Soupe de légumes", desc: "Velouté de légumes de saison, doux et réconfortant.", price: 18, img: "/images/dish-soup-legumes.jpg" },
      { id: "ec-soupe-champignons", name: "Soupe champignons", desc: "Crème onctueuse de champignons frais parfumée à la muscade.", price: 22, img: "/images/dish-soupe-champignons.jpg" },
      { id: "ec-nems-fdm", name: "Nems fruits de mer", desc: "3 pièces croustillantes garnies aux fruits de mer, sauce aigre-douce maison.", price: 43, img: "/images/dish-nems-fruits-de-mer.jpg" },
      { id: "ec-nems-viande", name: "Nems viande hachée", desc: "3 pièces croustillantes à la viande hachée épicée, sauce aigre-douce.", price: 30, img: "/images/dish-nems-viande.jpg" },
      { id: "ec-briwate", name: "Briwate poulet", desc: "3 feuilletés triangulaires au poulet et aux épices marocaines.", price: 30, img: "/images/dish-nems.jpg" },
      { id: "ec-wings-honey", name: "Honey chicken wings", desc: "8 ailes de poulet marinées au miel et grillées, croustillantes et sucrées-salées.", price: 40, img: "/images/dish-wings-honey.jpg" },
      { id: "ec-crispy", name: "Crispy chicken", desc: "3 pièces de poulet panées, ultra croustillantes.", price: 45, img: "/images/dish-wings-crispy.jpg" },
    ],
  },
  {
    id: "sandwichs",
    label: "Sandwichs",
    note: "Tous nos sandwichs sont servis avec frites. Personnalisez avec des suppléments.",
    items: [
      { id: "sw-vh-smen", name: "Viande hachée avec smen", desc: "Viande hachée grillée au charbon, assaisonnée au beurre clarifié traditionnel.", price: 52, img: "/images/dish-sandwich-viande-hachee-smen.jpg", hasExtras: true },
      { id: "sw-vh", name: "Viande hachée", desc: "Viande hachée fraîche grillée au feu de bois.", price: 49, img: "/images/dish-sandwich-kefta.jpg", hasExtras: true },
      { id: "sw-cheese-poulet", name: "Filet cheese steack poulet", desc: "Fines tranches de poulet grillées, oignons et fromage fondu.", price: 55, img: "/images/dish-sandwich-filet-cheese-poulet.jpg", hasExtras: true },
      { id: "sw-foie", name: "Foie", desc: "Foie d'agneau frais grillé au charbon.", price: 55, img: "/images/dish-sandwich-foie.jpg", hasExtras: true },
      { id: "sw-boulfaf", name: "Boulfaf", desc: "Foie d'agneau enveloppé de crépine, une spécialité grillée.", price: 55, img: "/images/dish-sandwich-boulfaf.jpg", hasExtras: true },
      { id: "sw-poulet", name: "Poulet", desc: "Filet de poulet mariné et grillé.", price: 45, img: "/images/dish-sandwich-poulet.jpg", hasExtras: true },
      { id: "sw-cheese-steack", name: "Cheese steack", desc: "Tranches de bœuf, cheddar fondu et poivron vert.", price: 65, img: "/images/dish-sandwich-cheese-steack.jpg", hasExtras: true, hasCuisson: true },
      { id: "sw-saucisse-boeuf", name: "Saucisse de bœuf", desc: "Merguez de bœuf maison grillées.", price: 45, img: "/images/dish-sandwich-saucisse-boeuf.jpg", hasExtras: true },
      { id: "sw-mixte", name: "Mixte", desc: "Un mélange savoureux de nos meilleures viandes grillées.", price: 55, img: "/images/dish-sandwich-mixte.jpg", hasExtras: true, hasCuisson: true },
      { id: "sw-filet-boeuf", name: "Filet de bœuf", desc: "Morceaux de filet de bœuf tendre grillés au charbon.", price: 52, img: "/images/dish-sandwich-filet-boeuf.jpg", hasExtras: true, hasCuisson: true },
    ],
  },
  {
    id: "burgers",
    label: "Burgers",
    note: "Tous nos burgers sont servis avec des frites. Personnalisez avec suppléments et cuisson.",
    items: [
      { id: "bg-cheese", name: "Cheese Burger", desc: "Steak de bœuf grillé au charbon, cheddar fondu, salade, tomate, oignon et sauce maison.", price: 52, img: "/images/dish-burger-cheese.jpg", hasExtras: true, hasCuisson: true },
      { id: "bg-double", name: "Double Cheese", desc: "Double steak de bœuf grillé, double cheddar fondu pour les grosses faims.", price: 65, img: "/images/dish-burger-double-cheese.jpg", hasExtras: true, hasCuisson: true },
      { id: "bg-chicken", name: "Chicken Burger", desc: "Filet de poulet croustillant ou grillé, salade, tomate, sauce spéciale.", price: 45, img: "/images/dish-chicken-burger.jpg", hasExtras: true },
      { id: "bg-gdc", name: "Burger Goût du Charbon", desc: "Notre burger signature : double steak, champignons sautés, sauce champignon, cheddar, oignons caramélisés et sauce signature.", price: 75, img: "/images/dish-burger-gout-du-charbon.jpg", hasExtras: true, hasCuisson: true },
    ],
  },
  {
    id: "brochettes",
    label: "Les Brochettes",
    note: "Tous nos plats sont servis avec riz, purée maison ou légumes sautés.",
    items: [
      { id: "br-poulet", name: "Poulet", desc: "Brochettes de poulet marinées aux herbes et grillées au charbon.", price: 65, img: "/images/dish-brochettes-poulet.jpg", hasExtras: true },
      { id: "br-filet-boeuf", name: "Filet de bœuf", desc: "Morceaux de filet de bœuf extra tendre grillés au feu de bois.", price: 85, img: "/images/dish-brochettes-filet-boeuf.jpg", hasExtras: true, hasCuisson: true },
      { id: "br-vh", name: "Viande hachée", desc: "Kefta maison assaisonnée et grillée au charbon.", price: 70, img: "/images/dish-brochettes-kefta.jpg", hasExtras: true },
      { id: "br-vh-smen", name: "Viande hachée avec smen", desc: "Kefta grillée avec une touche de beurre clarifié traditionnel.", price: 75, img: "/images/dish-brochettes-kefta-smen.jpg", hasExtras: true },
      { id: "br-saucisse", name: "Saucisse de bœuf", desc: "Merguez de bœuf pur, grillées et savoureuses.", price: 60, img: "/images/dish-brochettes-saucisse-boeuf.jpg", hasExtras: true },
      { id: "br-foie", name: "Foie", desc: "Foie d'agneau frais grillé à la perfection.", price: 75, img: "/images/dish-brochettes-foie.jpg", hasExtras: true },
      { id: "br-boulfaf", name: "Boulfaf", desc: "Foie enveloppé de crépine, grillé au charbon de bois.", price: 85, img: "/images/dish-brochettes-boulfaf.jpg", hasExtras: true },
      { id: "br-mixte", name: "Mixte", desc: "Un assortiment royal de nos meilleures brochettes grillées.", price: 80, img: "/images/dish-brochettes-mixte.jpg", hasExtras: true, hasCuisson: true },
    ],
  },
  {
    id: "mkila",
    label: "Mkila",
    items: [
      { id: "mk-vh-tomate", name: "Viande hachée avec sauce tomate", desc: "Viande hachée mijotée dans une sauce tomate parfumée à l'ail et coriandre.", price: 42, img: "/images/dish-mkila-viande-tomate.jpg", hasExtras: true },
      { id: "mk-cervelle", name: "Cervelle marinée", desc: "Cervelle d'agneau mijotée avec épices marocaines, tomate, olives et citron confit.", price: 49, img: "/images/dish-mkila-cervelle.jpg", hasExtras: true },
      { id: "mk-foie", name: "Foie mariné", desc: "Foie d'agneau émincé et mijoté aux épices, tomate et olives.", price: 52, img: "/images/dish-mkila-foie.jpg", hasExtras: true },
    ],
  },
  {
    id: "plats",
    label: "Plats",
    note: "Tous nos plats sont servis avec du riz et légumes sautés.",
    items: [
      { id: "pl-emince-boeuf", name: "Émincé de bœuf", desc: "Fines tranches de bœuf saisies au charbon, servies avec riz et légumes.", price: 68, img: "/images/dish-grill-emince-boeuf.jpg", hasExtras: true, hasCuisson: true },
      { id: "pl-emince-poulet", name: "Émincé de poulet", desc: "Poulet émincé mariné et grillé, accompagné de riz et légumes.", price: 60, img: "/images/dish-grill-emince-poulet.jpg", hasExtras: true },
      { id: "pl-cotelette", name: "Côtelette (300gr)", desc: "Côtelettes d'agneau grillées au feu de bois, tendres et juteuses.", price: 95, img: "/images/dish-cotelette.jpg", hasExtras: true, hasCuisson: true },
      { id: "pl-entrecote", name: "Entrecôte (250gr)", desc: "Pièce de bœuf noble grillée au charbon selon votre convenance.", price: 105, img: "/images/dish-entrecote-boeuf.jpg", hasExtras: true, hasCuisson: true },
    ],
  },
  {
    id: "pates",
    label: "Pâtes",
    items: [
      { id: "pa-spag-poulet", name: "Spaghetti poulet", desc: "Spaghetti al dente, sauce blanche crémeuse et champignons.", price: 45, img: "/images/dish-pasta-spaghetti-poulet.jpg", hasExtras: true },
      { id: "pa-tagl-crevette", name: "Tagliatelle crevette", desc: "Tagliatelle aux crevettes, tomate cerise, brocoli, huile d'olive et citron.", price: 55, img: "/images/dish-pasta-tagliatelle-crevette.jpg", hasExtras: true },
      { id: "pa-penne-4f", name: "Penne aux quatre fromages", desc: "Penne nappées d'une sauce onctueuse aux quatre fromages fondants.", price: 40, img: "/images/dish-pasta.jpg", hasExtras: true },
      { id: "pa-mac", name: "Mac and Cheese à la sauce", desc: "Macaroni gratinés dans une sauce fromage crémeuse, gratinés au four.", price: 45, img: "/images/dish-pasta-mac-cheese.jpg", hasExtras: true },
    ],
  },
  {
    id: "tacos",
    label: "Tacos",
    note: "Tortilla dorée, viande grillée au charbon, sauce fromagère fondante et frites croustillantes à l'intérieur. Tous nos tacos sont servis avec des frites et 3 sauces au choix. Personnalisez avec des suppléments.",
    items: [
      { id: "tc-poulet", name: "Tacos poulet", desc: "Émincé de poulet mariné et grillé, cheddar fondu, frites maison à l'intérieur, salade et tomate, enveloppé dans une tortilla dorée. Servi avec frites et 3 sauces au choix.", price: 45, img: "/images/dish-tacos-poulet.jpg", hasExtras: true, hasSauces: true },
      { id: "tc-vh", name: "Tacos viande hachée", desc: "Viande hachée assaisonnée, cheddar fondu, frites maison à l'intérieur, salade et tomate, dans une tortilla dorée. Servi avec frites et 3 sauces au choix.", price: 49, img: "/images/dish-tacos-viande-hachee.jpg", hasExtras: true, hasSauces: true },
      { id: "tc-mix", name: "Tacos mix (poulet + viande hachée)", desc: "Le meilleur des deux mondes : poulet grillé et viande hachée, cheddar fondu, frites maison à l'intérieur, salade et tomate. Servi avec frites et 3 sauces au choix.", price: 52, img: "/images/dish-tacos-mix.jpg", hasExtras: true, hasSauces: true },
    ],
  },
  {
    id: "specialites",
    label: "Spécialités du Jour",
    items: [
      { id: "sp-rfissa", name: "Rfissa poulet", desc: "Plat traditionnel au poulet beldi, lentilles et msemmen. Disponible chaque mercredi.", price: 40, img: "/images/dish-specialite-rfissa.jpg" },
      { id: "sp-couscous", name: "Couscous viande + tfaya + lben", desc: "Couscous royal aux sept légumes et oignons caramélisés, accompagné de lben. Chaque vendredi.", price: 45, img: "/images/dish-specialite-couscous.jpg" },
      { id: "sp-hrira", name: "Hrira marocaine + date + œuf dur + chabakia", desc: "Soupe traditionnelle complète servie avec dattes, œuf dur et chabakia. Chaque jour dès 18h00.", price: 25, img: "/images/dish-hrira.jpg" },
    ],
  },
  {
    id: "menu-enfant",
    label: "Menu Enfant",
    note: "Servi avec jus d'orange ou eau + frites + jouet.",
    items: [
      { id: "me-mini-burger", name: "Mini burger viande hachée", desc: "Petit burger adapté aux enfants, viande hachée grillée et pain moelleux.", price: 45, img: "/images/dish-burger.jpg", hasExtras: true },
      { id: "me-nuggets", name: "Nuggets (6 pièces)", desc: "6 nuggets de poulet croustillants, servis avec ketchup.", price: 45, img: "/images/dish-nuggets.jpg", hasExtras: true },
    ],
  },
  {
    id: "frites",
    label: "Frites Faites Maison",
    note: "Personnalisez vos frites avec des suppléments.",
    items: [
      { id: "fr-normal", name: "Frite normal", desc: "Frites fraîches maison, dorées et croustillantes.", price: 12, img: "/images/dish-frites-normal.jpg", hasExtras: true },
      { id: "fr-cheese", name: "Frite sauce fromage", desc: "Frites maison nappées d'une sauce fromage onctueuse.", price: 17, img: "/images/dish-frites-cheese.jpg", hasExtras: true },
      { id: "fr-bacon", name: "Frite sauce fromage + bacon + parmesan", desc: "Frites, sauce fromage, éclats de bacon croustillant et parmesan râpé.", price: 26, img: "/images/dish-frites-bacon.jpg", hasExtras: true },
      { id: "fr-jalapenos", name: "Frite sauce fromage + jalapeños + parmesan", desc: "Frites, sauce fromage, jalapeños et parmesan râpé pour les amateurs de piquant.", price: 25, img: "/images/dish-frites-jalapenos.jpg", hasExtras: true },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    items: [
      { id: "de-tiramisu", name: "Tiramisu", desc: "Le classique italien revisité par notre chef.", price: 32, img: "/images/dish-dessert-tiramisu.jpg" },
      { id: "de-fondant", name: "Fondant au chocolat", desc: "Cœur coulant au chocolat noir, servi avec une boule vanille.", price: 35, img: "/images/dish-dessert-fondant.jpg" },
      { id: "de-cheesecake", name: "Cheesecake", desc: "Gâteau au fromage onctueux sur un biscuit croquant.", price: 28, img: "/images/dish-dessert-cheesecake.jpg" },
      { id: "de-creme-brulee", name: "Crème brûlée", desc: "Crème onctueuse à la vanille avec sa croûte de sucre caramélisé.", price: 25, img: "/images/dish-dessert.jpg" },
      { id: "de-panna", name: "Panna cotta", desc: "Dessert léger à la crème avec son coulis de fruits rouges.", price: 22, img: "/images/dish-dessert-panna-cotta.jpg" },
    ],
  },
  {
    id: "a-la-carte",
    label: "À la Carte",
    items: [
      { id: "ac-crepe", name: "Crêpe américaine — fruits de saison", desc: "Crêpe moelleuse aux fruits de saison. Miel, caramel ou chocolat au choix.", price: 42, img: "/images/dish-crepe-americaine.jpg" },
      { id: "ac-painperdu", name: "Pain perdu — fruits de saison", desc: "Pain perdu doré aux fruits de saison. Miel, caramel ou chocolat au choix.", price: 42, img: "/images/dish-pain-perdu.jpg" },
      { id: "ac-gaufre", name: "Gaufre belge — fruits de saison", desc: "Gaufre belge croustillante aux fruits de saison. Miel, caramel ou chocolat au choix.", price: 42, img: "/images/dish-gaufre.jpg" },
    ],
  },
  {
    id: "boissons-chaudes",
    label: "Boissons Chaudes",
    items: [
      { id: "bc-the-menthe", name: "Thé à la menthe", desc: "Thé vert marocain infusé à la menthe fraîche.", price: 12, img: "/images/dish-tea-menthe.jpg" },
      { id: "bc-cafe-creme", name: "Café crème", desc: "Café expresso allongé d'une mousse de lait onctueuse.", price: 12, img: "/images/dish-cafe-creme.jpg" },
      { id: "bc-chocolat", name: "Chocolat à l'ancienne", desc: "Chocolat chaud épais préparé à l'ancienne, généreux et réconfortant.", price: 28, img: "/images/dish-chocolat-chaud.jpg" },
      { id: "bc-espresso", name: "Espresso", desc: "Café expresso serré, corsé et aromatique.", price: 10, img: "/images/dish-espresso.jpg" },
    ],
  },
  {
    id: "boissons-fraiches",
    label: "Boissons Fraîches",
    items: [
      { id: "bf-icecoffee", name: "Ice Coffee", desc: "Café glacé onctueux, servi avec glaçons.", price: 18, img: "/images/dish-ice-coffee.jpg" },
      { id: "bf-citron", name: "Jus de citron (citronnade)", desc: "Citronnade fraîche pressée minute, douce-acidulée.", price: 17, img: "/images/dish-juice-citron.jpg" },
      { id: "bf-orange", name: "Jus d'orange", desc: "Jus d'orange 100% pressé minute.", price: 17, img: "/images/dish-juice-orange.jpg" },
      { id: "bf-ananas", name: "Jus d'ananas", desc: "Jus d'ananas frais, sucré et rafraîchissant.", price: 18, img: "/images/dish-juice-ananas.jpg" },
      { id: "bf-avocat", name: "Jus d'avocat", desc: "Smoothie d'avocat crémeux au lait et sucre.", price: 22, img: "/images/dish-juice-avocat.jpg" },
      { id: "bf-carotte", name: "Jus de carotte", desc: "Jus de carotte pressé minute, vitaminé et naturel.", price: 18, img: "/images/dish-juice-carotte.jpg" },
      { id: "bf-fraise", name: "Jus de fraise", desc: "Jus de fraises fraîches selon arrivage.", price: 20, img: "/images/dish-juice-fraise.jpg" },
      { id: "bf-banane", name: "Jus de banane", desc: "Smoothie banane onctueux au lait.", price: 15, img: "/images/dish-juice-banane.jpg" },
      { id: "bf-cocktail", name: "Cocktail de fruits", desc: "Mélange maison de fruits frais de saison en couches colorées.", price: 22, img: "/images/dish-juice-cocktail.jpg" },
      { id: "bf-mangue", name: "Jus de mangue", desc: "Jus de mangue épais et parfumé, doux et sucré.", price: 18, img: "/images/dish-juice-mangue.jpg" },
      { id: "bf-pomme", name: "Jus de pomme", desc: "Jus de pomme frais légèrement pétillant.", price: 15, img: "/images/dish-juice-pomme.jpg" },
      { id: "bf-soda", name: "Soda", desc: "Canette de soda au choix (Coca, Sprite, Fanta…).", price: 12, img: "/images/dish-soda-canette.jpg" },
      { id: "bf-eau", name: "Eau minérale", desc: "Bouteille d'eau minérale plate ou gazeuse.", price: 10, img: "/images/dish-eau.jpg" },
    ],
  },
];

export const CATEGORY_ICONS: Record<string, string> = {
  "petits-dejeuners": "🍳",
  "entrees": "🥗",
  "entree-chaude": "🍲",
  "sandwichs": "🥪",
  "burgers": "🍔",
  "brochettes": "🍢",
  "mkila": "🥘",
  "plats": "🍽️",
  "pates": "🍝",
  "specialites": "⭐",
  "menu-enfant": "🧒",
  "frites": "🍟",
  "desserts": "🍰",
  "a-la-carte": "🥞",
  "boissons-chaudes": "☕",
  "boissons-fraiches": "🥤",
  "tacos": "🌮",
};

// Lookup helpers
export const ALL_ITEMS: MenuItem[] = MENU.flatMap((c) => c.items);
export const findItem = (id: string) => ALL_ITEMS.find((i) => i.id === id);
