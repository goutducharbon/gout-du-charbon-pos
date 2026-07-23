## Contexte

Demande très large : ajout de catégories/produits manquants + une couche "Admin" complète (dashboard, gestion caisses, sessions, employés, rapports, gestion catégories/plats, devis/factures, rupture de stock, inventaire). Actuellement la caisse est 100% locale (Zustand + `localStorage`), sans authentification, sans backend, mono-caisse.

Je propose de livrer en **2 phases** pour garder un rythme utilisable rapidement.

---

## Phase 1 — Contenus manquants + Admin local (livrable immédiat)

Tout reste en local (`localStorage`), pas de backend. C'est cohérent avec l'app actuelle et déployable tout de suite.

### 1.1 Menu — ajouts
- Nouvelle catégorie **Toppings** (à me confirmer : liste + prix).
- Ajout dans la catégorie **Tacos** (ou nouvelle cat. Tacos si absente) : **Tacos Poulet**, **Tacos Viande Hachée**, **Tacos Mixte** — prix à me confirmer.

### 1.2 Authentification Admin (local)
- Écran de login admin (email + mot de passe) avec les identifiants fournis :
  `goutducharbon@gmail.com` / `Vendredi94.`
- Session admin persistée (localStorage) + bouton "Déconnexion".
- Rôle **caissier** = accès caisse normal (pas de login requis, comme aujourd'hui). Rôle **admin** = accès en plus à `/admin`.
- Note sécurité : identifiants stockés côté client → OK pour un usage interne mono‑poste, à migrer vers un vrai backend en Phase 2.

### 1.3 Panneau Admin `/admin`
Nouvelle route protégée avec navigation latérale et sous-pages :

**a) Tableau de bord**
- CA du jour / semaine / mois, nb tickets, ticket moyen
- Top 10 produits vendus (période sélectionnable)
- Produits en rupture (liste)
- Nb commandes en attente en cuisine
- État de la caisse (ouverte/fermée, fond, CA session)
- Répartition paiements (espèces / carte / autres)
- Remboursements & annulations du jour

**b) Gestion catégories & plats**
- Liste catégories : renommer, réordonner, activer/désactiver, changer icône.
- Liste plats par catégorie : éditer nom, prix, image, extras, cuissons, description.
- **Rupture de stock** : toggle par plat (grise le plat côté caisse + badge "Rupture").
- Ajouter / supprimer un plat ou une catégorie.

**c) Rapports & exports**
- Filtres : **jour / semaine / mois / plage personnalisée / par caissier**.
- Détail : nb plats vendus (par plat et par catégorie), CA, remises, offerts, moyens de paiement, sessions.
- Export **CSV** et **PDF** (impression navigateur formatée A4).

**d) Sessions de caisse**
- Historique complet : ouverture, fermeture, caissier, fond, ventes espèces/carte, remboursements, écart théorique vs réel, bénéfice brut.
- Réouverture / clôture forcée.

**e) Employés (caissiers)**
- CRUD des caissiers (nom + PIN à 4 chiffres optionnel).
- Sélection du caissier à l'ouverture de session.
- Rapports filtrables par caissier.

**f) Devis & Factures**
- Génération depuis le panier ou l'historique.
- Champs client (nom, adresse, ICE, tél).
- Numérotation `DEV-YYYY-####` / `FAC-YYYY-####`.
- Impression / export PDF, en-tête et pied paramétrables (déjà dans Réglages).

**g) Inventaire (léger)**
- Stock par plat (quantité, seuil d'alerte).
- Décrément automatique à chaque vente encaissée.
- Alertes rupture sur dashboard.
- Ajustement manuel + historique des mouvements.

### 1.4 Rapport DOCX
À la fin de la phase, `rapport-caisse-v3.docx` couvrant : historique des demandes, ce qui est fait, ce qui reste, roadmap Phase 2.

---

## Phase 2 — Multi‑caisses / multi‑magasins (backend Lovable Cloud)

À déclencher quand tu passes en franchise (plusieurs caisses = obligatoirement un backend, sinon chaque caisse a sa propre base isolée).

Contenu prévu (à replanifier au moment venu) :
- Activation Lovable Cloud (Supabase managé).
- Migration menu, commandes, sessions, employés, stock vers Postgres.
- Vrai système d'authentification (email + mot de passe hashé, rôles).
- Multi‑caisses / multi‑magasins : chaque caisse s'identifie, données centralisées, dashboard admin consolidé.
- Fusion / transfert de tickets entre caisses, déplacement de tables.
- Rôles complets : admin, manager, caissier, serveur, cuisine, préparateur, livreur.
- Synchronisation temps réel (Realtime) entre caisses & cuisine.

---

## Questions avant de lancer la Phase 1

1. **Toppings** : peux-tu me donner la liste et les prix (ex : "Cheddar +5 DH, Œuf +5 DH, Bacon +8 DH…") ?
2. **Tacos Poulet / Viande Hachée / Mixte** : prix de chacun ? Tailles (M/L) ? Cuisson / suppléments dispo ?
3. **Admin unique ou plusieurs admins** en Phase 1 ? (par défaut : uniquement le compte fourni.)
4. On lance la **Phase 1 en direct** avec les infos ci-dessus, ou tu préfères que je démarre déjà sur ce que je peux (menu + auth admin + gestion catégories/plats + dashboard + rapports) et tu me donnes les prix Toppings/Tacos en parallèle ?
