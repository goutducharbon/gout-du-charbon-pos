# Plan d'exécution — Finalisation Goût du Charbon

Objectif : livrer un système de caisse « digne des grosses boîtes », plus un rapport PDF final récapitulatif.

## 1. Authentification (Google + Email)

- Activer Google OAuth via le tool social auth (managé Lovable Cloud, aucun secret à saisir).
- Créer la route publique `/auth` : onglets **Connexion** / **Inscription** (email + mot de passe) + bouton **Continuer avec Google**.
- Layout `_authenticated` déjà géré par l'intégration (SSR off, redirect `/auth`).
- Bouton **Déconnexion** dans le header admin/POS avec teardown du cache TanStack Query + `navigate('/auth', { replace: true })`.
- Écouteur `onAuthStateChange` unique dans `__root.tsx` filtré (SIGNED_IN / SIGNED_OUT / USER_UPDATED).

## 2. Écran Bootstrap Owner

- Route `/bootstrap` publique.
- Si aucun `user_roles` avec role='owner' n'existe → affiche formulaire création (nom restaurant, ICE, adresse, tél).
- À la validation : crée compte email/pass, assigne role `owner`, initialise `restaurant_settings` (id=1) et redirige vers `/admin`.
- Si un owner existe déjà → redirige vers `/auth`.
- Server function `bootstrapOwner` (unauthenticated mais idempotente : refuse si owner existe).

## 3. Re-vérification PIN pour actions sensibles

- Composant `<PinReverifyDialog>` (modal shadcn) : saisie 4 chiffres, feedback erreur, décompte tentatives.
- Hook `usePinReverify(action)` : renvoie une promesse résolue si PIN valide dans les **5 dernières minutes**, sinon ouvre le modal.
- Actions protégées : annulation ticket, remise, retrait caisse, suppression produit, modification prix, clôture session.
- Server function `verifyPin({ pin, employee_id })` avec :
  - Bcrypt compare (`pin_hash`).
  - Rate-limit via `pin_attempts` : 5 tentatives / 15 min → verrouillage employé 15 min.
  - Log dans `audit_log`.
- Durée validité stockée en mémoire (Zustand), effacée à la déconnexion et à la fermeture d'onglet.

## 4. Notifications cuisine temps réel

- Table `orders` : ajouter au `supabase_realtime` publication (migration).
- Route `/kitchen` (protégée) : liste des commandes `status IN ('en_attente','en_preparation')`, tri FIFO.
- Realtime channel `orders` → INSERT/UPDATE :
  - Badge compteur dans le header (rouge + pulsation).
  - Son via `<audio>` déclenché sur nouvelle commande (préchargé, mute-toggle).
  - Toast shadcn « Nouvelle commande #123 ».
- Boutons cuisine : **Prise en charge**, **Prêt**, **Servi** → mutation optimistic + invalidate.
- UX : cartes colorées par ancienneté (vert <5min, jaune <10min, rouge >10min).

## 5. Dashboard + Exports

- Route `/admin/dashboard` avec Recharts :
  - CA du jour / semaine / mois (BarChart).
  - Top 10 produits (BarChart horizontal).
  - Répartition modes de paiement (PieChart).
  - Courbe des commandes / heure (LineChart).
  - KPI cards : CA, tickets, panier moyen, % annulations.
- Sélecteur de période (aujourd'hui, 7j, 30j, custom).
- Server functions authentifiées : `getDashboardStats`, `getOrdersRange`.
- **Export CSV** : commandes filtrées → blob téléchargé côté client (papaparse).
- **Export PDF** : jsPDF + autoTable → rapport de chiffre d'affaires (en-tête restaurant, période, total, TVA, liste commandes).

## 6. Rapport PDF final récapitulatif

À la toute fin, je génère `/mnt/documents/rapport-gout-du-charbon.pdf` (via reportlab côté sandbox) contenant :

**Partie A — Backend Supabase**
- Fait : tables créées, RLS, triggers, séquences, fonctions, seed menu, sécurité corrigée.
- Reste à faire : monitoring logs, sauvegardes planifiées, migrations futures.
- À compléter : politiques anon pour menu public si besoin borne QR.

**Partie B — Système de caisse (frontend)**
- Fait : POS existant, auth Google+email, bootstrap owner, PIN sensible, cuisine temps réel, dashboard, exports.
- Reste à faire : impression thermique ESC/POS, conformité DGI (numérotation factures certifiée), mode hors-ligne offline-first.
- À compléter : tests E2E, documentation utilisateur, formation staff.

Livré en tant que `<presentation-artifact>` téléchargeable.

## Détails techniques

- Ordre d'exécution : Auth → Bootstrap → PIN → Cuisine Realtime → Dashboard → Rapport PDF.
- Toutes les mutations passent par `createServerFn` + `requireSupabaseAuth`.
- Realtime activé via `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders`.
- Hash PIN : `bcrypt` (dépendance `bcryptjs` côté serverFn).
- PDF exports : `jspdf` + `jspdf-autotable`.
- Charts : `recharts` (déjà installé probable, à vérifier).
- CSV : `papaparse`.

## Ordre visible dans le chat

1. Activer Google auth + migration realtime.
2. Créer routes `/auth`, `/bootstrap`, screens.
3. Server functions auth + bootstrap + PIN + dashboard.
4. Composants PIN modal, kitchen, dashboard.
5. Wiring header (sign-out, badge cuisine).
6. Génération rapport PDF final.

Confirme et je fonce.