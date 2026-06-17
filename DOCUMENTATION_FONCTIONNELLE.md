# MédiSahel Clinique Bamako V2 – Documentation Fonctionnelle & Technique Complète
*Date : 12 Juin 2026*  
*Auteur : Équipe d'Ingénierie Clinique AI Studio*

---

## 1. SCÉNARIO COMPLET DU PATIENT (D’AVANT-GARDE À L’ARCHIVAGE)

Le cycle de soins d'un patient au sein de **MédiSahel Clinique Bamako V2** est entièrement numérisé, assurant un suivi strict de l'arrivée du patient jusqu'à l'archivage légal de son dossier.

```
Arrivée ──► Admissions ──► Consultation (DMG) ──► Bilans (Labo) ──► Ordonnance ──► Vente (FEFO) ──► Sortie/Archivage
```

### Étape par Étape :

1. **Arrivée du patient**
   * **Utilisateur :** Secrétaire / Assistant d'accueil / Infirmier de Triage.
   * **Module utilisé :** Admissions / Fiche Patient.
   * **Données créées :** Demande de consultation, constante de tri (Pouls, Tension Artérielle, Température, saturation en oxygène SpO2).
   * **Données transmises :** Dossier de tri inséré directement dans la file d'attente du service médical.

2. **Admission**
   * **Utilisateur :** Secrétaire / Caissier.
   * **Module utilisé :** Patients & Admissions.
   * **Données créées :** Ticket d'admission courante, affectation de file d'attente.
   * **Données modifiées :** Volume de la file d'attente.
   * **Données transmises :** Synchronisation vers le cabinet du médecin traitant ou du Médecin Chef.

3. **Création du dossier précieux**
   * **Utilisateur :** Secrétaire / Archiviste.
   * **Module utilisé :** Patients (DME).
   * **Données créées :** IPP (Identifiant Permanent Patient), groupe sanguin, allergies, antécédents familiaux, mutuelle/couverture tiers-payant.
   * **Données modifiées :** Répertoire d'indexation central des dossiers patients.
   * **Données transmises :** Partage sécurisé du dossier permanent accessible par l'équipe clinique.

4. **Consultation**
   * **Utilisateur :** Médecin / Médecin Chef / Stagiaire.
   * **Module utilisé :** Médecine Générale (DMG).
   * **Données créées :** Fiche de consultation (Symptômes décrits, examen clinique, diagnostics principaux et différentiels).
   * **Données modifiées :** Historique médical consolidé dans le DME.
   * **Données transmises :** Génération électronique de bons de laboratoire et d'ordonnance d'apothicaire.

5. **Demande d'analyses**
   * **Utilisateur :** Médecin traitant.
   * **Module utilisé :** DMG & DME.
   * **Données créées :** Prescription de biologie médicale informatisée.
   * **Données modifiées :** Index d'examens requis.
   * **Données transmises :** Bons transmis à l'agent de facturation pour encaissement préalable obligatoire.

6. **Paiement**
   * **Utilisateur :** Caissier / Agent de facturation.
   * **Module utilisé :** Facturation & Caisse.
   * **Données créées :** Écritures de caisse, quittance de caisse numérotée, journal d'encaissement de la séance.
   * **Données modifiées :** Statut de règlement des prestations (Actes médicaux / Ordonnances / Analyses).
   * **Données transmises :** Déblocage automatisé des bons de laboratoire (marqués comme payés) et transmission à la file de dispensation pharmacie.

7. **Laboratoire (Réalisation)**
   * **Utilisateur :** Laborantin.
   * **Module utilisé :** Station Laboratoire (LabStation).
   * **Données créées :** Heure de prélèvement, identification des tubes cliniques, fiches de paillasse.
   * **Données modifiées :** Statut d'acheminent des échantillons.

8. **Résultats**
   * **Utilisateur :** Laborantin (Saisie) e-Signé par le Biologiste.
   * **Module utilisé :** LabStation.
   * **Données créées :** valeurs physiologiques, interprétation bioclinique, visa numérique.
   * **Données modifiées :** Statut du bilan (Clôturé & Signé).
   * **Données transmises :** Injection en temps réel du rapport d'analyse validé dans le DME du patient consultant.

9. **Prescription**
   * **Utilisateur :** Médecin consultant.
   * **Module utilisé :** Médecine Générale (DMG) / DME.
   * **Données créées :** Ordonnance de médicaments informatisée.
   * **Données modifiées :** Plan de traitement du patient.
   * **Données transmises :** Transmission directe sécurisée vers l'interface « Vente Pharmacie » (Guichet Unique).

10. **Vente pharmacie**
    * **Utilisateur :** Caissier d'officine / Agent de facturation (Le pharmacien gère le stock et ne touche pas aux montants).
    * **Module utilisé :** Vente Pharmacie.
    * **Données créées :** Facture de pharmacie, reçu d'encaissement, journal d'annulation ou de déstockage, trace légale d'audit.
    * **Données modifiées :** Niveaux de stocks de médicaments d'officine (moteur FEFO sélectif par lot).
    * **Données transmises :** Émission du reçu multicanal (Impression directe, PDF et envoi de fiches SMS/WhatsApp/Email).

11. **Hospitalisation**
    * **Utilisateur :** Médecin (Avis d'admettre) / Infirmier (Attribution lit).
    * **Module utilisé :** Hospitalisation & Lits.
    * **Données créées :** dossier de séjour d'hospitalisation, affectation de lit clinique.
    * **Données modifiées :** Taux d'occupation en temps réel.
    * **Données transmises :** Dossier clinique visible par le personnel soignant de la clinique.

12. **Soins infirmiers**
    * **Utilisateur :** Infirmier / Aide-Soignant.
    * **Module utilisé :** Hospitalisation (Cahier de transmission).
    * **Données créées :** Constantes cycliques (Température, Tension, FC, douleur, SpO2), administration de traitements d'ordonnance.
    * **Données modifiées :** Suivi clinique infidèle.
    * **Données transmises :** Consultables par le médecin traitant lors de ses visites.

13. **Sortie**
    * **Utilisateur :** Médecin Chef (Autorisation clinique) / Caissier.
    * **Module utilisé :** Hospitalisation & Facturation.
    * **Données créées :** Résumé d'hospitalisation, facture finale d'apurement de séjour.
    * **Données modifiées :** Libération du lit clinique (Statut : Disponible).
    * **Données transmises :** Registre permanent des séjours cliniques.

14. **Archivage**
    * **Utilisateur :** Archiviste / Secrétaire.
    * **Module utilisé :** GECD & Courriers (Document Manager).
    * **Données créées :** Dossier PDF d'archive indexé, fichiers additionnels scannés.
    * **Données modifiées :** Compteur général de l'établissement.
    * **Données transmises :** Coffre de données immuable sécurisé.

---

## 2. SCÉNARIO PAR RÔLE DANS L'APPLICATION (MATRICE RBAC)

La plateforme applique une distinction nette et granulaire des droits d'accès à la clinique.

| Rôle | Modules Visibles | Modules Masqués/Cachés | Actions Principales Autorisées | Actions Strictement Interdites | Documents Modifiables/Créables | Documents en Lecture Seule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PROMOTEUR / DG** | **TOUS** (Consolidé financier, KPI) | Aucun | Audit d'activité clinique, rapports de caisse, statistiques stratégiques, validation générale | Interdiction déontologique de pratiquer des soins médicaux directs | Configurations générales de l'établissement | DME cliniques, résultats d'examens biologiques |
| **ADMINISTRATEUR IT** | **TOUS** (Console technique, RBAC, Profils) | Aucun | Gestion des comptes, attributions des droits d'utilisateurs, gestion de la marque (Branding) | Modifier des notes cliniques ou valeurs de labo (Sécurité d'Audit) | Profils de connexion, en-tête des documents cliniques | Fiches financières confidentielles, DME de patients |
| **MÉDECIN CHEF** | Dashboard, Patients, DME, DMG, Hospitalisation, Agenda, Biologie (lecture), GECD | Paie & RH internes, RBAC IT, Configuration Branding | Prescription médicale globale, direction des soins cliniques, signature bioclinique de laboratoire | Saisie d'écritures de caisse, modifications manuelles de stocks | Comptes-rendus de consultations, ordonnances, fiches de sortie | Historique de caisse, grands-livres d'officine |
| **MÉDECIN** | Dashboard Clinique, Patients, DME, DMG, Hospitalisation, Agenda, GECD | RH & Paie, RBAC IT, Vente Pharmacie (Caisse), Stocks | Diagnostic, antécédents, examens complémentaires, ordonnances, actes de soins | Encaissement d'officine, gestion comptable des fournisseurs | Notes cliniques, ordonnances informatisées, avis d'admettre | Factures et quittances clients, logs de sécurité |
| **INFIRMIER** | Patients, DME, Hospitalisation, Agenda, Présences (Badge) | DMG (Consultation), Stocks, Laboratoire (saisie), Caisse, RH | Saisie de constante aux admissions, validation d'actes infirmiers, cahier de trans | Prescription thérapeutique autonome, encaissements | Feuille de constantes vitales, dossier de soins cliniques | Compte-rendu médical signé, tarifs des actes |
| **AIDE-SOIGNANT** | Patients, Hospitalisation, Tri Admissions | DME confidentiel, DMG, Pharmacie, Labo, Caisse, RH | Saisie de température/tension, installation du patient en lit | Administration de médicaments, signature médicale | Feuille de constantes de base (T°) | Ordonnances, diagnostics, fiches de salaires |
| **STAGIAIRE** | Patients, DME, DMG (lecture-écriture supervisée) | Hospitalisation, Caisse, Pharmacie, Labo, RH, GECD | Analyse clinique, élaboration de projets cliniques de consultation | Signature d'ordonnance d'officine, validation définitive de diagnostic | Projets cliniques (soumis à visa supérieur) | Résultats de biologie fine, historique des paiements |
| **LABORANTIN** | LabStation (Saisie/Validation), GECD | DMG, Pharmacie, Hospitalisation, Caisse, RH | Réception tubes, saisie de résultats d'analyses biomédicales | Modification de la prescription médicale initiale, encaissements | Formulaire d'examens biologiques | Ordonnances d'apothicaire, dossiers personnels |
| **PHARMACIEN** | Gestion des Stocks Pharmacie, Lots FEFO, Fournisseurs, Alertes, Inventaires | Vente Pharmacie (Caisse), DME confidentiel, DMG, LabStation | Catalogue produits d'officine, commandes, réceptions de colis fournisseurs, inventaires | Encaissement de paiements d'ordonnances (Séparation des Droits) | Fiches articles d'officine, bons de commande de médicaments | Profil d'utilisateur, journal de caisse |
| **CAISSIER** | Facturation & Caisse, Vente Pharmacie (Guichet Unique), GECD, Agenda | Gestion des Stocks, DMG, DME clinique fin, LabStation, RH | Dispensation d'ordonnances, ventes comptoir, encaissements de biologie, reçus multicanaux | Saisie d'inventaire, modification de notes médicales ou examens | Mode de règlement de facture, reçu de paiement client | Fiche de diagnostic médical, dossiers d'absences du personnel |
| **RH** | Gestion des Présences, Gestion de la Paie, GECD | Tous les modules médicaux et financiers cliniques (DME, Caisse) | Validation de pointage de présence, calcul de virements de salaires | Accéder au DME ou aux résultats du laboratoire du personnel | Fiche d'heures, bulletin de paie | Journal d'activités médicales des médecins |
| **COMPTABLE** | Facturation (Rapports de caisse), Mouvements | Modules de soins cliniques | Audit financier des grands livres, livre des ventes comptoir d'officine | Dispenser des médicaments | Écritures comptables, exportations de bilans financiers | Dossier médical clinique d'hospitalisation |
| **ARCHIVISTE** | GECD (Document Manager), Patients, Admissions | Pharmacie, Labo, RH/Paie, Matrice RBAC | Indexation de fichiers dématérialisés, numérisation d'examens | Actes médicaux ou d'officine | Fiche d'identification patient, registres d'index | Bulletins de salaires des pharmaciens |
| **SECRÉTAIRE** | Admissions, Patients, Agenda, Courriers, GECD | Laboratoire, Pharmacie Stocks, RH complexes, RBAC IT | Triage d'accueil, prise de rendez-vous clinique, envoi de SMS | Validation de résultats de biologie médicale | Fiche de premier contact patient, plage d'agenda | Diagnostics rédigés, fiches d'inventaires |
| **STOCKISTE** (Gest. Stock) | Gestion des Stocks, Inventaires, Alertes | Caisse & Ventes, DME clinique, Laboratoire | Enregistrement de lots, commandes, relevé physique des péremptions | Vendre des produits d'officine au comptoir | Fiche de stock clinique, bons de réception | Fiche de quittance de caisse client |

---

## 3. MATRICE COMPLÈTE DES RELATIONS ET DES ÉCHANGES ENTRE MODULES

La cohérence de MédiSahel est garantie par des flux inter-modules rigoureux et transactionnels.

```
                   [ admissions ]
                         │  (IPP & Tri Vital)
                         ▼
                    [ dme/dmg ]
               ┌─────────┴─────────┐
               │ (Bons d'Examens)  │ (Prescription d'Ordonnance)
               ▼                   ▼
      [ labo: impayé ]    [ vente pharmacie: impayé ]
               │                   │
               └─────────┬─────────┘
                         │ (Vérification et Règlement financier)
                         ▼
            [ facturation & caisse ]
               ┌─────────┴─────────┐
               │ (Quittance Payée) │ (Quittance d'Officine)
               ▼                   ▼
    [ labo: exécution ]   [ stocks: déstockage fefo ]
               │                   │
               ▼ (Résultats)       ▼ (Audit log)
          [ dme/dmg ]       [ dme / audit trail ]
```

---

## 4. SCÉNARIO D'OPÉRATION DE LA PHARMACIE (GUICHET UNIQUE)

Afin d'éviter tout conflit d'intérêts et fraude d'inventaire, la pharmacie fonctionne selon le principe du **Guichet Unique Clinique** avec séparation absolue de la finance et de la logistique :

1. **La Prescription clinique :** Le clinicien valide l'ordonnance depuis le module DMG. L'ordonnance est injectée de manière immuable dans l'interface d'officine.
2. **L'Encaissement (Le Caissier vend et encaisse) :**
   * Le caissier d'officine (ou caissier de caisse centrale) consulte l'ordonnance en attente.
   * Il valide la présence physique en stock central, choisit les quantitatifs réellement délivrés à la demande du patient.
   * Il encaisse le paiement total via **Moov, Orange Money, Wave, Espèces, Chèque ou Carte**.
   * Le caissier émet instantanément le reçu papier, PDF, ou de manière moderne par fiches SMS/WhatsApp/Mail.
3. **Le Déstockage automatique FEFO (Le Pharmacien gère le stock) :**
   * Au moment précis de l'encaissement par le caissier, le moteur d'inventaire parcourt la table des lots disponibles.
   * Le système sélectionne **automatiquement** le lot possédant la **date d'expiration la plus proche** (politique d'excellence logistique **FEFO - First Expired First Out**).
   * La quantité est déduite et le lot FEFO utilisé est gravé de manière indélébile dans l'historique d'officine, le DME du patient et le Registre d'Audit.
4. **Tarifs et Régulations :** 
   * Seuls les administrateurs IT et directeurs généraux peuvent éditer le catalogue général de prix. Le guichetier de vente d'officine ne peut en aucun cas manipuler les barèmes.
   * Toute dérogation de stock (destruction de périmés ou ajustements d'écarts de fin d'inventaire) doit être documentée avec motif clinique par le Pharmacien Responsable.

---

## 5. SCÉNARIO D'OPÉRATION DU LABORATOIRE (BIO-CONFORMITÉ)

La traçabilité assure l'exactitude des examens :

* **Entrée des bilans :** La demande est initiée dans le DMG par le clinicien. Elle est invisible au technologue de laboratoire tant que la facture correspondante n'a pas été acquittée à la caisse centrale (sécurisation des revenus cliniques, hors cas d'urgence signalée).
* **Réception et prélèvement :** Le Laborantin valide l'échantillon clinique (conformité du tube).
* **Saisie :** Le Technologue saisit manuellement les valeurs constatées dans l'onglet *LabStation*.
* **Signature :** Le Directeur Technique (Médecin Biologiste) valide et signe sous sa responsabilité bioclinique l'ensemble du bilan. 
* **Lecture & Résultat :** Une fois validés et e-signés, les résultats cliniques s'inscrivent instantanément dans le dossier DME du clinicien prescripteur. Aucune modification extérieure n'est possible, figeant la responsabilité légale.

---

## 6. SCÉNARIO D'OPÉRATION DE L'HOSPITALISATION (EXCELLENCE DE SÉJOUR)

L'hospitalisation assure une surveillance optimale :

* **Attribution des Lits :** L'Infirmier ou le Major du service affecte un lit clinique via la cartographie interactive du tracker d'hospitalisation (ex. Lit B-02, Chambre Standard).
* **Soins & Saisie des Constantes :** L'infirmier et l'aide-soignant effectuent les rondes régulières et consignent les constantes de surveillance (Fièvre, Tension contractée, FC, douleur déclarée, SpO2) directement dans la fiche clinique du lit.
* **Validation des Actes :** Chaque injection ou pansement validé par l'infirmier de garde s'enregistre de manière univoque dans le registre de soins d'hospitalisation de MédiSahel.
* **Clôture :** Le médecin émet son bulletin d'autorisation de sortie après évaluation de rétablissement clinique. Le caissier central comptabilise et valide les cautions de séjour hospitalier permettant de clôturer définitivement le séjour clinique.

---

## 7. SCÉNARIO DU CONTRÔLE DE SÉCURITÉ RBAC (LOGIQUE INTERNE)

Le système MédiSahel applique une politique de sécurité dite *Contrôle d'Accès Basé sur les Rôles (RBAC)* granulaire.

```
┌──────────────┐      ┌────────────────────────┬─────────────────────┐
│  Utilisateur │ ───► │ Global ADMIN (*:ADMIN) │ => ACCÈS TOTAL      │
└──────────────┘      └────────────────────────┴─────────────────────┘
                                   │ (Non-Admin)
                                   ▼
                      ┌────────────────────────┐
                      │ Dans allowedModules ?  │ ───► NON => Onglet Caché
                      └────────────────────────┘             et Redirection
                                   │ OUI
                                   ▼
                      ┌────────────────────────┐
                      │  Possède droit WRITE ? │ ────► OUI => Module ACTIF
                      └────────────────────────┘
                                   │ NON
                                   ▼
                              READ_ONLY (Lecture seule)
```

### Logique d'application de la fonction `getUserPermissionConfig` :

1. **Détection du statut Administrateur Global (`isGlobalAdmin`) :**
   * Elle évalue si le rôle de l'utilisateur correspond strictly à `"ADMIN"` ou s'il détient le wildcard de grand-privilège `"*:ADMIN"` dans son tableau de permissions individuelles. Si c'est le cas, par défaut, le système considère tous les modules comme `"ACTIVE"` et assigne toutes les actions individuelles (créer, éditer, signer, etc.) à `true`.

2. **Vérification d'accès Module (`allowedModules`) :**
   * Pour les collaborateurs n'étant pas administrateurs globaux, le programme confronte chaque module à son tableau des `user.allowedModules`.
   * Si le module est absent de la liste configurée par l'administrateur, il est exclu de l'interface graphique (onglet invisible). Si le collaborateur tente de charger l'URL à l'aide d'un favori ou d'une saisie directe, le module de sécurité le redirige immédiatement vers l'onglet clinique autorisé le plus proche.

3. **Calcul des privilèges d'écriture et de lecture-seule (`READ_ONLY` vs `ACTIVE`) :**
   * Si le collaborateur est autorisé à visualiser le module, le moteur évalue s'il détient une permission d'administration locale (ex: `lab:ADMIN` ou `lab:WRITE` ou un ensemble de permissions d'édition pour ce module spécifique).
   * Si une écriture est détectée, le module est marqué `"ACTIVE"`, lui permettant de soumettre des formulaires.
   * Si aucune autorisation d'écriture n'est validée pour ce module, le module se fige en mode lecture seule (`"READ_ONLY"`), l'empêchant de falsifier les informations cliniques ou comptables.
