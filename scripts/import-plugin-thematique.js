#!/usr/bin/env node
// Importe les cas de test "plugin thematique" dans MariaDB
// Projet cible : "Plugin Thematiques" (id=4)

const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const PROJECT_ID = Number(process.env.PROJECT_ID || 4);
const PRIORITY = { P1: 2, P2: 1, P3: 0 };

// ── Données brutes des cas de test ────────────────────────────────────────────
// Format : [id, priorite, profil, manipulation, resultat_attendu]

const SECTIONS = [
  {
    folder: 'Front Office',
    parent: true,
    subfolders: [
      {
        folder: '2. Accès, chargement et navigation générale',
        cases: [
          ['FO-01','P1','Anonyme','Aller sur la page publique du site, par exemple /spip.php?page=sommaire. Attendre la fin du chargement.','La page charge sans erreur visible. Le fond, la timeline, le menu haut et le menu bas apparaissent. Le texte Chargement disparait ou ne bloque pas l\'interface.'],
          ['FO-02','P1','Anonyme','Ouvrir les outils navigateur et recharger la page.','Pas d\'erreur JavaScript bloquante dans la console. Les scripts du plugin sont charges : timeline, menus, sidebar.'],
          ['FO-03','P1','Anonyme','Cliquer sur le logo CCN en haut a gauche.','Un nouvel onglet s\'ouvre vers la page Erasme/CCN. L\'onglet initial reste utilisable.'],
          ['FO-04','P2','Anonyme','Cliquer sur le bouton d\'aide si le site est _PROJET=laclasse.','La mediabox d\'aide s\'ouvre avec l\'image/document attendu. La fermeture ramene a la page.'],
          ['FO-05','P1','Tous','Ouvrir le selecteur d\'annee scolaire dans le menu haut, choisir une autre annee.','La page se recharge avec l\'annee selectionnee. Les missions, classes, blogs et ressources correspondent a cette annee. Le choix reste actif apres rechargement.'],
          ['FO-06','P1','Tous','Utiliser les boutons du menu bas Missions, Blog/Agenda, Projets finis.','La timeline change de mode. Les pictogrammes/objets visibles correspondent au mode choisi.'],
          ['FO-07','P1','Tous','Cliquer dans le vide de la timeline ou sur timeline_fixed si visible.','La timeline revient en vue globale et le mode consignes est restaure.'],
          ['FO-08','P1','Tous','Ouvrir une fiche dans la sidebar puis cliquer sur agrandir/reduire la modale.','La sidebar passe en mode etendu puis revient au format initial sans perdre le contenu charge.'],
          ['FO-09','P1','Tous','Ouvrir une fiche puis utiliser le bouton ou la zone de fermeture/masquage de sidebar.','La fiche se ferme ou se masque proprement. La page reste navigable.'],
          ['FO-10','P2','Tous','Ouvrir une fiche, utiliser le bouton precedent/suivant du navigateur.','L\'URL, le contenu de sidebar et la selection menu restent coherents avec l\'historique.'],
          ['FO-11','P2','Tous','Acceder directement a une URL profonde, par exemple spip.php?page=article&id_article=ID&mode=complet.','Le layout complet se charge et ouvre le contenu attendu sans page blanche.'],
          ['FO-12','P2','Tous','Tester la page sur mobile, tablette et desktop.','Les menus restent utilisables, la sidebar est lisible, aucun contenu essentiel n\'est hors ecran.'],
        ],
      },
      {
        folder: '3. Connexion et rôles front',
        cases: [
          ['FO-13','P1','Anonyme','Ouvrir le menu Me connecter.','Les options de connexion disponibles apparaissent : ENT CAS si cicas est actif, OpenID si cioidc est actif.'],
          ['FO-14','P1','Anonyme','Cliquer Se connecter a l\'ENT ou Se connecter a l\'ENT (OpenID).','Redirection vers le fournisseur de connexion puis retour au site apres authentification.'],
          ['FO-15','P1','Connecte','Ouvrir le menu utilisateur.','Le nom de l\'utilisateur connecte s\'affiche. L\'action Me deconnecter est disponible.'],
          ['FO-16','P1','Connecte','Cliquer Me deconnecter.','La session est fermee. Le menu redevient Me connecter. Les actions d\'edition disparaissent.'],
          ['FO-17','P1','Professeur','Se connecter avec un compte rattache a une classe.','Le role front est prof. Le profil de publication par defaut pointe vers sa classe. Le professeur voit les actions de reponse/publication autorisees pour sa rubrique.'],
          ['FO-18','P1','Intervenant','Se connecter avec un compte rattache a une rubrique consignes.','Le role front est intervenant. L\'intervenant voit les actions de publication de consignes/blog pedagogique qui lui sont permises.'],
          ['FO-19','P1','Admin complet','Se connecter comme webmestre/admin complet.','Le menu Publier permet de choisir largement les rubriques. Les actions d\'edition et de drag timeline sont disponibles.'],
          ['FO-20','P1','Eleve/visiteur','Se connecter comme compte 6forum.','Le role est eleve. Les actions d\'edition/publish non autorisees sont absentes ou refusees. Les commentaires autorises fonctionnent selon la configuration forum.'],
        ],
      },
      {
        folder: '4. Missions et consignes',
        cases: [
          ['FO-21','P1','Tous','Dans le menu Missions, cliquer chaque numero de mission.','La fiche consigne s\'ouvre dans la sidebar. Le titre, logo intervenant, date, texte et documents s\'affichent. Le pictogramme correspondant est selectionne.'],
          ['FO-22','P1','Tous','Cliquer directement une consigne sur la timeline.','Meme resultat que via le menu : sidebar consigne ouverte, zoom/position timeline coherents.'],
          ['FO-23','P1','Tous','Sur une consigne, verifier la section Reponses de la classe.','Les reponses existantes sont listees par classe. Les consignes sans reponse affichent le message indiquant qu\'il n\'y a pas encore de reponse.'],
          ['FO-24','P1','Professeur','Sur une consigne, cliquer Repondre a la consigne.','Le formulaire de creation de reponse s\'ouvre. Le contexte consigne et classe est conserve.'],
          ['FO-25','P1','Professeur','Dans le formulaire de reponse, saisir un titre puis enregistrer.','L\'article reponse est cree, publie, rattache a la consigne, et apparait dans la timeline et dans la fiche classe.'],
          ['FO-26','P1','Professeur','Apres creation de la reponse, ajouter un texte depuis le bloc Ajouter un texte.','Le texte est enregistre et rendu dans la fiche, avec mise en forme SPIP correcte.'],
          ['FO-27','P1','Professeur','Depuis une reponse, cliquer le lien En reponse a la consigne.','La consigne parente s\'ouvre. La navigation ne perd pas le contexte.'],
          ['FO-28','P2','Intervenant','Creer ou modifier une consigne avec la case J\'attends le livrable final de cette consigne.','Si cochee, le mot-cle livrable est associe ; la consigne apparait dans Projets finis/Livrables attendus. Si decochee, elle disparait de cette liste.'],
          ['FO-29','P2','Admin complet','Deplacer verticalement une consigne ou un item blog/evenement sur la timeline.','La position est sauvegardee. Apres rechargement, l\'item conserve sa position.'],
        ],
      },
      {
        folder: '5. Classes et travaux des classes',
        cases: [
          ['FO-30','P1','Tous','Dans Les classes participantes, cliquer chaque classe.','La vue classe s\'ouvre. Le titre, logo, descriptif et liste des reponses de la classe s\'affichent.'],
          ['FO-31','P1','Tous','Dans une classe, cliquer une reponse existante.','La reponse s\'ouvre en sidebar. Le mode double colonne s\'active si prevu, avec classe et reponse coherentes.'],
          ['FO-32','P1','Tous','Dans une classe, cliquer une consigne sans reponse.','La consigne correspondante s\'ouvre pour consultation.'],
          ['FO-33','P2','Admin/prof autorise','Dans une fiche classe, modifier le descriptif via Crayons si l\'action est visible.','Le descriptif est sauvegarde et reste visible apres rechargement.'],
          ['FO-34','P2','Tous','Si la rubrique classe contient une URL de production transversale, ouvrir Production transversale.','L\'iframe ou le contenu integre s\'affiche. Un contenu invalide ne casse pas la fiche.'],
          ['FO-35','P1','Tous','Dans la vue classe, utiliser les filtres Tous les medias, Les textes, Les images, Les sons, Les videos, Les documents.','La liste/affichage est filtre selon le type de contenu. Le filtre Tous restaure tous les items.'],
          ['FO-36','P1','Tous','Dans la vue classe, tester le tri Par date, Par notation, puis Ascendant/Descendant.','L\'ordre des items change conformement au critere et au sens choisis.'],
        ],
      },
      {
        folder: '6. Blogs, actualités et blog pédagogique',
        cases: [
          ['FO-37','P1','Tous','Cliquer le mode Blog/Agenda dans le menu Publier.','Les articles du blog public apparaissent sur la timeline.'],
          ['FO-38','P1','Tous','Cliquer un article de blog public.','La fiche article s\'ouvre avec titre, date, auteur si present, texte, documents, forum et notation.'],
          ['FO-39','P1','Anonyme/eleve','Verifier le blog pedagogique/evenements.','Les evenements prives ne sont pas visibles aux profils non autorises.'],
          ['FO-40','P1','Prof/intervenant/admin','Cliquer le mode Blog pedagogique si visible.','Les evenements pedagogiques apparaissent. Les articles et articles syndiques s\'ouvrent correctement.'],
          ['FO-41','P2','Admin complet','Deplacer un article blog/evenement dans la timeline.','La position Y est enregistree et conservee apres rechargement.'],
          ['FO-42','P2','Tous','Cliquer Toutes les actualites si le bloc actualites est present.','Les dernieres actualites se chargent et ouvrent les fiches correspondantes.'],
        ],
      },
      {
        folder: '7. Ressources et agora',
        cases: [
          ['FO-43','P1','Tous','Cliquer Ressources dans le menu bas.','La sidebar s\'etend et affiche les rubriques/articles de ressources.'],
          ['FO-44','P1','Tous','Cliquer une sous-rubrique de ressources.','La rubrique s\'ouvre, son titre et ses articles/sous-rubriques s\'affichent.'],
          ['FO-45','P1','Tous','Cliquer un article ressource.','La fiche article ressource s\'ouvre avec documents, texte, forum si applicable.'],
          ['FO-46','P1','Tous','Cliquer un article syndique dans les ressources si present.','La fiche syndic_article s\'ouvre sans erreur et pointe vers la source attendue.'],
          ['FO-47','P1','Tous','Cliquer Espace de discussion / Agora.','La sidebar affiche les contenus agora. Les articles et rubriques agora s\'ouvrent correctement.'],
          ['FO-48','P2','Admin/profil autorise','Depuis une fiche ressource/agora, verifier les actions d\'ajout de document et edition si visibles.','Les actions sont visibles uniquement aux profils autorises et fonctionnent comme sur les articles classiques.'],
          ['FO-49','P2','Tous','Cliquer le lien Espace Doc si une URL est configuree dans le descriptif de rubrique racine annuelle.','Un nouvel onglet s\'ouvre vers l\'espace documentaire attendu.'],
        ],
      },
      {
        folder: '8. Livrables',
        cases: [
          ['FO-50','P1','Tous','Cliquer Projets finis / icone livrables.','La vue Livrables attendus s\'ouvre dans la sidebar et liste les consignes marquees livrable, groupees par intervenant.'],
          ['FO-51','P1','Tous','Cliquer un livrable dans la liste.','La fiche consigne correspondante s\'ouvre. Le retour a la liste reste possible via l\'historique ou le menu.'],
          ['FO-52','P2','Intervenant/admin','Ajouter puis retirer le statut livrable d\'une consigne.','La liste livrables se met a jour apres rechargement.'],
        ],
      },
      {
        folder: '9. Documents et médias',
        cases: [
          ['FO-53','P1','Auteur autorise','Ouvrir un article modifiable, cliquer Ajouter un document, joindre une image.','L\'image est televerseee, apparait dans la galerie, s\'ouvre en mediabox.'],
          ['FO-54','P1','Auteur autorise','Ajouter un PDF.','Le PDF apparait avec vignette/nom de fichier et s\'ouvre en mediabox ou viewer PDF.'],
          ['FO-55','P1','Auteur autorise','Ajouter un document bureautique, par exemple DOCX/ODT.','Le document apparait avec une vignette et un lien de telechargement. Aucun viewer inadapte ne bloque l\'ouverture.'],
          ['FO-56','P2','Auteur autorise','Ajouter un fichier audio pris en charge.','Le lecteur audio HTML5 ou le rendu prevu permet la lecture, ou propose un lien de fallback.'],
          ['FO-57','P2','Auteur autorise','Ajouter une video prise en charge.','Le lecteur video HTML5 ou le rendu prevu permet la lecture, ou propose un lien de fallback.'],
          ['FO-58','P1','Auteur autorise','Supprimer un document depuis une fiche article. Confirmer la suppression.','Le document est dissocie de l\'article et disparait apres rechargement.'],
          ['FO-59','P1','Auteur autorise','Annuler la confirmation de suppression de document.','Le document reste associe et visible.'],
          ['FO-60','P2','Tous','Ouvrir une galerie avec plusieurs images/PDF.','Swiper/mediabox permet de parcourir les documents, fermer et revenir a la fiche.'],
        ],
      },
      {
        folder: '10. Contenus intégrés, liens et iframes',
        cases: [
          ['FO-61','P1','Auteur autorise','Dans un article modifiable, renseigner un Contenu lie / URL externe si le champ est disponible.','L\'URL est sauvegardee. La fiche affiche le lien et l\'iframe si l\'URL est autorisee/compatible.'],
          ['FO-62','P1','Tous','Ouvrir une fiche contenant un contenu integre HTTPS.','Le contenu s\'affiche dans l\'iframe sans bloquer la page. Le lien direct reste accessible si visible.'],
          ['FO-63','P2','Tous','Ouvrir une fiche contenant une URL non integrable ou refusee par le site tiers.','La fiche reste stable. L\'utilisateur dispose au minimum du lien externe.'],
        ],
      },
      {
        folder: '11. Forum, commentaires et notation',
        cases: [
          ['FO-64','P1','Tous','Ouvrir une fiche sans commentaire.','Le bloc forum affiche Personne n\'a encore commente. ou equivalent.'],
          ['FO-65','P1','Connecte autorise','Cliquer Forum, puis Commenter.','Le formulaire de commentaire s\'ouvre dans la fiche.'],
          ['FO-66','P1','Connecte autorise','Saisir un commentaire simple et valider.','Le commentaire est enregistre, affiche dans la liste, et le compteur de commentaires se met a jour.'],
          ['FO-67','P1','Connecte autorise','Ajouter une piece jointe autorisee au commentaire : PDF/JPG/PNG/GIF.','La piece jointe est acceptee et consultable.'],
          ['FO-68','P1','Connecte autorise','Tenter une piece jointe non autorisee au commentaire.','Le formulaire refuse le fichier avec un message clair. Aucun commentaire incomplet n\'est publie.'],
          ['FO-69','P2','Anonyme','Tenter de commenter.','Le commentaire est refuse ou une connexion est demandee, selon forums_publics=abo.'],
          ['FO-70','P1','Connecte','Cliquer J\'aime sur une fiche.','Le vote est enregistre, le bouton devient Je n\'aime plus, le compteur augmente.'],
          ['FO-71','P1','Connecte','Cliquer Je n\'aime plus.','Le vote est retire et le compteur diminue.'],
          ['FO-72','P2','Anonyme','Observer la notation sans etre connecte.','Le compteur s\'affiche si votes existants, mais l\'action de vote n\'est pas disponible.'],
        ],
      },
      {
        folder: '12. Édition front via Crayons',
        cases: [
          ['FO-73','P1','Auteur/admin autorise','Modifier un titre d\'article depuis la fiche front si Crayons est actif.','Le titre est sauvegarde et visible apres rechargement.'],
          ['FO-74','P1','Auteur/admin autorise','Modifier le texte d\'un article depuis la fiche front.','Le contenu est sauvegarde, rendu en HTML propre, et la barre d\'edition reste utilisable.'],
          ['FO-75','P2','Auteur/admin autorise','Modifier la date, le logo ou l\'URL liee quand ces champs sont editables.','La modification est prise en compte dans la fiche et, si pertinent, dans la timeline.'],
          ['FO-76','P1','Profil non autorise','Tenter d\'editer un contenu non autorise.','Aucun crayon/action d\'edition n\'est visible, ou la tentative est refusee.'],
        ],
      },
      {
        folder: '13. Cas spécifiques par projet',
        cases: [
          ['FO-77','P3','Projet novaterra.laclasse.com','Ouvrir un article avec police monospace.','Le rendu terminal ordinateur@novaterra:~$ apparait quand le mot-cle de police est present.'],
          ['FO-78','P3','Projet novaterra.laclasse.com','Sur un article modifiable, utiliser Ajouter a l\'encyclopedie.','Le select de thematique s\'affiche, le choix de mot-cle est sauvegarde et relu.'],
          ['FO-79','P3','Projet miam.laclasse.com','Ouvrir les contenus url_popup_chat / url_popup_chat2 selon profil.','Les liens Google Sheet/Drawing ou leur version publique s\'ouvrent selon le niveau d\'authentification.'],
          ['FO-80','P3','Tous projets avec fond editorial','Verifier l\'image de fond issue de images_background et son fallback.','L\'image de fond de l\'annee est affichee si presente ; sinon le fond generique est utilise.'],
        ],
      },
    ],
  },
  {
    folder: 'Back Office',
    parent: true,
    subfolders: [
      {
        folder: '14. Installation, activation et migrations',
        cases: [
          ['BO-01','P1','Webmestre','Aller dans Ecrire > Configuration > Gestion des plugins, activer Thematiques.','Le plugin s\'active sans erreur. Les dependances obligatoires sont presentes ou signalees.'],
          ['BO-02','P1','Webmestre','Apres activation, aller dans Maintenance > Vider le cache, puis revenir au site public.','Le site public charge avec le squelette thematique.'],
          ['BO-03','P1','Webmestre','Verifier en base ou via l\'interface Champs Extras les champs articles id_consigne, x/y ou X/Y, rubriques id_rubrique_lien, url_id_doc, auteurs ent, ent_statut.','Les champs existent et sont utilisables sans warning visible.'],
          ['BO-04','P1','Webmestre','Verifier les groupes de mots crees : Contenus, Presentation, site.','Les mots attendus existent : travail_en_cours, consignes, evenements, blogs, ressources, images_background, agora, livrable, etc.'],
          ['BO-05','P1','Webmestre','Verifier les rubriques racine creees automatiquement si l\'installation part d\'un site vide.','Les rubriques Travail des classes, Consignes, Espace Ressources, Agenda, Blog pedagogique, Contenu editorial, Discuter avec existent et ont les bons mots-cles.'],
          ['BO-06','P2','Webmestre','Desactiver puis reactiver le plugin sur une copie de recette.','La reactivation ne duplique pas les mots/rubriques. Les contenus existants restent accessibles.'],
        ],
      },
      {
        folder: '15. Configuration du plugin',
        cases: [
          ['BO-07','P1','Webmestre','Aller sur Ecrire > ?exec=configurer_thematique ou l\'entree de configuration du plugin.','La page Configuration Thematiques s\'affiche uniquement aux webmestres.'],
          ['BO-08','P1','Webmestre','Renseigner site_ent_nom, site_ent_url, espace_doc_url, puis enregistrer.','Message de succes. Les valeurs restent presentes apres rechargement.'],
          ['BO-09','P2','Admin non webmestre','Tenter d\'acceder a la configuration.','Acces refuse ou contenu non affiche.'],
          ['BO-10','P2','Webmestre','Utiliser Annuler dans le formulaire de configuration.','Les valeurs non enregistrees ne sont pas appliquees.'],
        ],
      },
      {
        folder: '16. Arborescence, rubriques et mots-clés',
        cases: [
          ['BO-11','P1','Admin','Aller dans Ecrire > Edition > Rubriques, ouvrir la rubrique annuelle.','Les rubriques metier sont presentes sous la bonne annee.'],
          ['BO-12','P1','Admin','Creer une rubrique classe sous Travail des classes, lui associer le bon mot-cle si necessaire.','La classe apparait ensuite dans le menu front Les classes participantes.'],
          ['BO-13','P1','Admin','Creer une rubrique intervenant sous Consignes.','Les consignes creees dans cette rubrique apparaissent dans Missions.'],
          ['BO-14','P1','Admin','Creer une sous-rubrique dans Ressources et y publier un article.','La rubrique et l\'article apparaissent dans le front Ressources.'],
          ['BO-15','P1','Admin','Creer une sous-rubrique dans Agora et y publier un article.','La rubrique et l\'article apparaissent dans le front Espace de discussion.'],
          ['BO-16','P2','Admin','Ajouter un logo a une rubrique classe/intervenant/ressource.','Le logo apparait en front dans les menus/fiches.'],
          ['BO-17','P2','Admin','Renseigner le texte descriptif d\'une rubrique classe.','Le descriptif apparait dans la fiche classe.'],
          ['BO-18','P2','Admin','Renseigner une URL de production transversale dans le descriptif de rubrique classe si ce format est attendu.','L\'iframe de production transversale apparait en front.'],
          ['BO-19','P2','Admin','Modifier id_rubrique_lien sur une rubrique si le projet utilise les reponses binomes.','Les reponses liees s\'affichent correctement en mode binome.'],
        ],
      },
      {
        folder: '17. Articles back office',
        cases: [
          ['BO-20','P1','Admin/intervenant','Aller dans Ecrire > Edition > Articles, creer une consigne dans une rubrique consignes, la publier.','La consigne apparait dans la timeline Missions.'],
          ['BO-21','P1','Admin/prof','Creer un article de reponse dans une rubrique classe, renseigner id_consigne, publier.','La reponse apparait sous la consigne et dans la fiche classe.'],
          ['BO-22','P1','Admin','Creer un article dans blogs, publier.','L\'article apparait dans le mode Blog/Agenda public.'],
          ['BO-23','P1','Admin/prof/intervenant autorise','Creer un article dans evenements, publier.','L\'article apparait dans le blog pedagogique uniquement pour les profils autorises.'],
          ['BO-24','P1','Admin','Creer un article ressource, publier, ajouter texte et documents.','L\'article apparait dans Ressources et sa fiche est complete.'],
          ['BO-25','P2','Admin','Associer le mot-cle livrable a une consigne.','La consigne apparait dans la vue Livrables.'],
          ['BO-26','P2','Admin','Modifier les champs de position X/Y ou x/y d\'un article.','La position timeline est coherente apres recalcul/rechargement.'],
          ['BO-27','P1','Admin','Verifier la page de contenu article dans le back office.','La surcharge prive/contenu/article.html affiche les champs attendus, y compris ID_CONSIGNE si present.'],
          ['BO-28','P1','Admin','Modifier un article via le formulaire back office standard.','Le formulaire fonctionne, sauvegarde et retour sans erreur.'],
          ['BO-29','P2','Admin','Mettre un article hors date de l\'annee scolaire.','En front, l\'article n\'apparait pas dans les vues filtrees par dates attendues.'],
        ],
      },
      {
        folder: '18. Documents back office',
        cases: [
          ['BO-30','P1','Admin/auteur','Depuis un article, ajouter une image.','Le document est associe a l\'article et visible en front.'],
          ['BO-31','P1','Admin/auteur','Depuis un article, ajouter un PDF.','Le document est associe, vignette correcte, visible en front.'],
          ['BO-32','P2','Admin/auteur','Depuis un article, ajouter audio/video/doc bureautique.','Les vignettes privees et le rendu front correspondent au type de fichier.'],
          ['BO-33','P1','Admin/auteur','Supprimer/dissocier un document depuis le back office.','Le document disparait du front apres recalcul/cache vide si necessaire.'],
          ['BO-34','P2','Admin','Ajouter un document a une rubrique images_background, avec titre egal a l\'annee scolaire.','Ce document est utilise comme fond de page pour l\'annee concernee.'],
        ],
      },
      {
        folder: '19. Sites syndiqués et articles syndiqués',
        cases: [
          ['BO-35','P2','Admin','Aller dans Ecrire > Edition > Sites references, creer un site syndique sous blogs.','Les articles syndiques apparaissent dans le XML blog et en front si non doublons.'],
          ['BO-36','P2','Admin','Creer un site syndique sous evenements.','Les articles syndiques apparaissent dans le blog pedagogique pour les admins/profils autorises.'],
          ['BO-37','P2','Admin','Creer un site syndique sous ressources.','Les articles syndiques apparaissent dans Ressources et s\'ouvrent via syndic_article.'],
          ['BO-38','P2','Admin','Publier un article local avec le meme titre qu\'un article syndique.','Le doublon syndique est exclu si le squelette le prevoit.'],
        ],
      },
      {
        folder: '20. Auteurs, rôles et restrictions',
        cases: [
          ['BO-39','P1','Admin','Aller dans Ecrire > Auteurs, ouvrir un professeur, le lier a une rubrique classe.','En front, le professeur est reconnu prof et peut publier dans sa classe.'],
          ['BO-40','P1','Admin','Lier un intervenant a une rubrique sous Consignes.','En front, le role intervenant est detecte.'],
          ['BO-41','P1','Admin','Donner a un admin restreint des droits sur une ou plusieurs rubriques.','Le menu Publier front propose uniquement les rubriques autorisees.'],
          ['BO-42','P1','Admin','Verifier un compte eleve/visiteur 6forum.','En front, il peut seulement consulter/commenter selon droits, pas publier ni editer.'],
          ['BO-43','P2','Webmestre','Modifier les champs extras auteur ent et ent_statut.','Les champs sont visibles/modifiables uniquement par les profils autorises et sauvegardes.'],
          ['BO-44','P2','Webmestre','Tester une connexion OpenID avec donnees ENTClassesGroupes d\'un enseignant.','Le pipeline rattache l\'auteur au Blog pedagogique et aux rubriques classes correspondantes.'],
          ['BO-45','P1','Admin','Tenter, avec un compte restreint, de publier dans une rubrique non autorisee.','L\'action est absente ou refusee. Aucun article n\'est cree dans la mauvaise rubrique.'],
        ],
      },
      {
        folder: '21. Forums et modération',
        cases: [
          ['BO-46','P1','Admin','Aller dans la configuration des forums publics.','Le mode attendu est abo et les formats joints autorises incluent .pdf,.jpg,.jpeg,.png,.gif.'],
          ['BO-47','P1','Admin','Valider/moderer un commentaire si le workflow SPIP le demande.','Le commentaire apparait en front apres validation.'],
          ['BO-48','P1','Admin','Supprimer un commentaire depuis le back office.','Le commentaire disparait du front et le compteur se met a jour.'],
        ],
      },
      {
        folder: '22. Notifications',
        cases: [
          ['BO-49','P1','Admin/intervenant/prof','Publier un nouvel article depuis le back office.','Une notification article_publie est envoyee aux destinataires attendus : email global et admins restreints concernes.'],
          ['BO-50','P1','Connecte autorise','Publier/valider un commentaire sur un article.','Une notification de forum valide est envoyee aux destinataires attendus.'],
          ['BO-51','P2','Admin','Verifier les logs SPIP thematique apres publication et commentaire.','Les logs indiquent les destinataires/rubriques traitees sans erreur PHP.'],
          ['BO-52','P2','Admin','Tester le cas sans email_envoi configure sur une copie.','Le site ne doit pas planter ; un warning eventuel est note comme anomalie a corriger.'],
        ],
      },
      {
        folder: '23. Flux, URLs et pages techniques',
        cases: [
          ['BO-53','P1','Tous','Ouvrir spip.php?page=xml&mode=projet.','Le XML contient projet, dates, URLs popup, IDs ressources/agora, image de fond. Pas d\'erreur XML.'],
          ['BO-54','P1','Tous','Ouvrir spip.php?page=xml&mode=consignes.','Le XML liste les consignes et leurs reponses attendues.'],
          ['BO-55','P1','Tous','Ouvrir spip.php?page=xml&mode=articles_blog.','Le XML liste articles blog et syndiques attendus, sans doublons.'],
          ['BO-56','P1','Admin/profil autorise','Ouvrir spip.php?page=xml&mode=articles_evenement.','Les evenements sont presents pour les profils autorises et absents/non exploitables pour les non autorises.'],
          ['BO-57','P1','Tous','Ouvrir spip.php?page=xml&mode=classes.','Le XML liste intervenants, classes et rubrique travail_en_cours_id.'],
          ['BO-58','P2','Tous','Ouvrir les flux rss_forum, rss_maj, rss_laclasse_actu, rss_laclasse_recherche si encore utilises.','Les flux repondent en XML valide, sans erreur de squelette ni contenu HTTP bloque.'],
          ['BO-59','P2','Tous','Ouvrir spip.php?page=favicon.ico.','Une favicon est renvoyee avec le bon type et sans erreur.'],
        ],
      },
    ],
  },
  {
    folder: 'Non-régression droits et sécurité',
    parent: false,
    cases: [
      ['SEC-01','P1','Anonyme','Tenter d\'appeler directement une URL d\'ajout/publication spip.php?page=publier&mode=ajax-detail&id_rubrique=...','Aucun formulaire utilisable n\'est affiche si le profil n\'est pas autorise.'],
      ['SEC-02','P1','Eleve','Tenter de creer une reponse en modifiant l\'URL avec id_consigne et id_rubrique.','La creation est refusee hors droits.'],
      ['SEC-03','P1','Professeur','Tenter de publier dans la rubrique d\'une autre classe via changement d\'URL/cookie de rubrique.','La publication est refusee ou redirigee vers sa rubrique autorisee.'],
      ['SEC-04','P1','Intervenant','Tenter de modifier une reponse de classe qui ne lui appartient pas.','Modification refusee.'],
      ['SEC-05','P1','Admin restreint','Tenter de supprimer un document d\'un article hors rubrique autorisee.','Suppression refusee.'],
      ['SEC-06','P1','Non admin','Tenter d\'appeler article-sauve-coordonnees ou article-sauve-mot directement.','Aucune modification en base. Reponse neutre.'],
      ['SEC-07','P1','Admin','Appeler article-sauve-coordonnees avec valeurs non numeriques.','Aucune erreur PHP visible, aucune donnee invalide sauvegardee.'],
    ],
  },
  {
    folder: 'Tests transverses qualité avant production',
    parent: false,
    cases: [
      ['TQ-01','P1','Tous','Derouler FO-01 a FO-12 avec la console navigateur ouverte.','Aucune erreur JS bloquante. Les erreurs 404 sur assets sont absentes ou corrigees.'],
      ['TQ-02','P1','Tous','Tester les principaux parcours au clavier : connexion, selection annee, ouverture consigne, ouverture classe, commentaire.','Les actions essentielles sont atteignables et activables.'],
      ['TQ-03','P1','Tous','Tester zoom navigateur 200%.','Menus, sidebar, formulaires et documents restent utilisables.'],
      ['TQ-04','P1','Tous','Tester contraste/focus visible sur les boutons iconographiques.','Le focus est visible et l\'action comprehensible.'],
      ['TQ-05','P2','Tous','Tester en Chrome, Firefox, Safari/Edge si cible.','Rendu et interactions equivalents.'],
      ['TQ-06','P2','Tous','Tester une connexion lente ou throttling reseau.','La timeline finit par charger, les etats de chargement sont comprehensibles, pas de blocage indefini.'],
      ['TQ-07','P2','Tous','Vider le cache SPIP et navigateur, puis refaire un parcours public complet.','Les ressources CSS/JS/images se rechargent correctement.'],
      ['TQ-08','P2','Admin','Verifier les logs PHP/SPIP apres la recette.','Pas de warning/erreur recurrente liee au plugin.'],
      ['TQ-09','P2','Tous','Tester les pages avec des contenus longs : titres longs, nombreux documents, nombreux commentaires.','Pas de chevauchement majeur, la sidebar reste scrollable.'],
      ['TQ-10','P3','Tous','Imprimer ou exporter une fiche si le besoin metier existe.','Le contenu essentiel est lisible ou le besoin est documente comme non supporte.'],
    ],
  },
];

// ── Insertion ─────────────────────────────────────────────────────────────────

async function insertFolder(conn, name, projectId, parentFolderId = null) {
  const [res] = await conn.execute(
    'INSERT INTO folders (name, projectId, parentFolderId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
    [name, projectId, parentFolderId],
  );
  return res.insertId;
}

async function insertCase(conn, caseData, folderId) {
  const [id, prio, profil, manipulation, resultat] = caseData;
  const priority = PRIORITY[prio] ?? 1;
  await conn.execute(
    `INSERT INTO cases (title, description, preConditions, expectedResults, priority, state, type, automationStatus, template, folderId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, NOW(), NOW())`,
    [id, manipulation, profil, resultat, priority, folderId],
  );
}

async function main() {
  const conn = await mysql.createConnection(DB);
  let total = 0;

  try {
    for (const section of SECTIONS) {
      if (section.parent) {
        // Section avec dossier parent et sous-dossiers
        const parentId = await insertFolder(conn, section.folder, PROJECT_ID, null);
        console.log(`Dossier parent créé : ${section.folder} (id=${parentId})`);

        for (const sub of section.subfolders) {
          const subId = await insertFolder(conn, sub.folder, PROJECT_ID, parentId);
          console.log(`  Sous-dossier : ${sub.folder} (id=${subId})`);

          for (const c of sub.cases) {
            await insertCase(conn, c, subId);
            total++;
          }
          console.log(`    → ${sub.cases.length} cas insérés`);
        }
      } else {
        // Section plate (pas de parent)
        const folderId = await insertFolder(conn, section.folder, PROJECT_ID, null);
        console.log(`Dossier créé : ${section.folder} (id=${folderId})`);

        for (const c of section.cases) {
          await insertCase(conn, c, folderId);
          total++;
        }
        console.log(`  → ${section.cases.length} cas insérés`);
      }
    }

    console.log(`\nTerminé. ${total} cas de test insérés dans le projet "Plugin Thematiques".`);
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
