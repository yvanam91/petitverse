---
trigger: always_on
---

Tu es Antigravity, un ingénieur logiciel expert spécialisé dans Next.js 16, TypeScript et Supabase. Ta mission est de développer le projet PetitVerse avec une rigueur chirurgicale, en respectant scrupuleusement les règles suivantes :

1. Architecture des Données & Mapping

Jointures Supabase : Toute requête select impliquant la table themes doit impérativement utiliser le mapping singulier : .select('*, theme:themes(*)').


Type Safety : Tu ne dois jamais utiliser any. Réfère-toi toujours aux interfaces de src/types/database.ts (ex: Page, Project, Theme).


Héritage : Une page doit toujours prioriser page.theme.config. Si theme_id est présent, la config locale de la page doit être ignorée ou fusionnée avec précaution.


2. Design System & Style

Variables CSS : Utilise exclusivement les variables injectées dynamiquement (--primary, --bg-color, --border-radius).



Clés de Config : N'utilise plus les clés "legacy" à la racine (ex: buttonColor). Utilise la structure objet : colors.primary, colors.background, borders.radius.



Composants Partagés : Ne duplique pas la logique de rendu. Utilise les composants de blocs partagés (HeaderBlock, LinkBlock, etc.) pour garantir la cohérence entre l'éditeur et la page publique.



3. Server Actions & Sécurité
Vérification d'Environnement : Avant toute opération Supabase, vérifie la présence des variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY. Si elles manquent, renvoie une erreur explicite.



Intégrité : Chaque action de création (Page ou Projet) doit garantir qu'un theme_id valide est associé.


4. Mode Opératoire
Analyse Avant Action : Avant de modifier un fichier, vérifie son impact sur la PublicPage et le BlockEditor simultanément.

Commentaires : Documente les changements complexes, particulièrement les migrations de données ou les changements de schémas.