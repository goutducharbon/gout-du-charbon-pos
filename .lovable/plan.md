# Plan — Système de caisse Le Goût du Charbon

Objectif : caisse de niveau professionnel (multi-poste, sécurisée, sauvegardée, conforme), lié au rapport d'audit (juillet 2026).

## Phase 0 — Backend Supabase (EN COURS)

**0.1 Schéma DB** ← ce tour
- Types : app_role, employee_role, order_type, order_status, payment_method, discount_type, invoice_kind
- Tables : `profiles`, `user_roles`, `restaurant_settings`, `categories`, `menu_items`, `menu_extras`, `employees`, `pin_attempts`, `clients`, `cash_sessions`, `orders`, `stock_movements`, `invoices`, `audit_log`
- Fonction sécurisée `has_role()`, séquence `ticket_seq`, triggers `updated_at`
- RLS : lecture/écriture réservée aux utilisateurs authentifiés (staff), actions sensibles réservées à `owner`

**0.2 Seed du menu** (prochain tour)
- Import de `src/data/menu.ts` → tables `categories` / `menu_items` / `menu_extras` via migration idempotente

**0.3 Refactor code Zustand → Supabase** (tours suivants)
- Remplacer `pos-store` (orders, sessions, stocks) par TanStack Query + `createServerFn`
- Remplacer `admin-store` (menu overrides, employees, clients, invoices) par requêtes DB
- Conserver Zustand uniquement pour l'état UI éphémère (panier en cours, thème)

## Phase 1 — Sécurité (audit §3)

- **3.1** Retirer les identifiants owner en dur → auth Supabase (email/password + Google), rôle `owner` via `user_roles`
- **3.2** PIN manager avec **hash bcrypt** + verrouillage après 5 échecs (5 min) via table `pin_attempts`
- **3.3** Sauvegardes automatiques : la DB Supabase est sauvegardée quotidiennement + bouton "Export JSON complet" dans Réglages
- **3.5** Traçabilité : nom caissier auto depuis employé connecté, plus modifiable manuellement
- **4.5** Verrouillage auto de l'écran Admin après 10 min d'inactivité

## Phase 2 — Fonctionnel (audit §4)

- **4.1** Impression ESC/POS ticket client + bon cuisine séparé
- **4.2** Conformité DGI : tickets immuables (WORM), horodatage signé, journal `audit_log`
- **4.3** Tableau de bord Recharts (CA/heure, top vendeurs, écarts de caisse), export PDF/CSV multi-critères
- **4.4** Export/Import JSON complet dans Réglages
- **4.5** Confirmations sur toutes les suppressions destructives
- **4.6** Décrément de stock automatique à l'envoi cuisine, alertes seuil
- **4.7** Re-vérification PIN manager pour actions sensibles (remboursement, annulation, offert, ouverture tiroir, clôture caisse, modif menu)
- **4.8** Notifications cuisine : son (bip configurable) + badge compteur sur icône "Cuisine" quand nouveau ticket en préparation
- **4.9** UI : défilement horizontal amélioré des catégories (flèches gauche/droite + snap + indicateurs de scroll)

## Phase 3 — Multi-poste (audit §6 Phase 2)

- Synchronisation temps réel via Supabase Realtime (orders, sessions, stock)
- Mode hors-ligne dégradé avec re-sync (file d'attente locale)
- Support multi-succursale (colonne `location_id`)

## Phase 4 — Livraison

- Build final + déploiement sur URL d'aperçu Lovable
- Export du code source complet (zip) via `/mnt/documents`
- Documentation utilisateur (README + guide caissier PDF)

## État actuel
- ✅ Lovable Cloud activé
- ✅ Migration schéma exécutée
- ⏳ Seed du menu + bootstrap 1er owner (prochain tour)

