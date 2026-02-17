/**
 * Del365 - Extension Firefox
 * Supprime les données de navigation liées à Office 365 et Microsoft
 */

/**
 * Fonction principale de suppression des données Office 365
 */
async function deleteOffice365Data() {
  try {
    let deletionCount = 0;

    // Domaines à supprimer
    const targetDomains = [
      "office365.com",
      "office.com",
      "outlook.com",
      "office-web.sips-services.com",
      "koesio.com",
    ];

    // Récupérer tous les cookies
    const allCookies = await browser.cookies.getAll({});
    console.log(`Total de cookies dans le navigateur: ${allCookies.length}`);

    for (const cookie of allCookies) {
      // Vérifier si le domaine du cookie correspond à un des domaines cibles
      const shouldDelete = targetDomains.some((domain) =>
        cookie.domain.includes(domain),
      );

      if (shouldDelete) {
        const url = `http${cookie.secure ? "s" : ""}://${cookie.domain.startsWith(".") ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
        try {
          await browser.cookies.remove({
            url: url,
            name: cookie.name,
            storeId: cookie.storeId,
          });
          deletionCount++;
          console.log(`Cookie supprimé: ${cookie.name} de ${cookie.domain}`);
        } catch (e) {
          console.error(`Erreur suppression cookie ${cookie.name}:`, e);
        }
      }
    }

    console.log(`Total cookies supprimés: ${deletionCount}`);

    // Notification de succès
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: "Del365",
      message:
        deletionCount > 0
          ? `${deletionCount} cookie${deletionCount > 1 ? "s" : ""} Microsoft/Office 365 supprimé${deletionCount > 1 ? "s" : ""}.`
          : "Aucun cookie Microsoft/Office 365 trouvé.",
    });

    console.log(`Suppression terminée: ${deletionCount} cookies`);
  } catch (error) {
    // Notification d'erreur
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: "Del365 - Erreur",
      message: "Erreur : " + error.message,
    });

    console.error(
      "Erreur lors de la suppression des données Office 365:",
      error,
    );
  }
}

/**
 * Écoute du clic sur l'icône de l'extension
 */
browser.browserAction.onClicked.addListener(() => {
  deleteOffice365Data();
});

/**
 * Écoute du raccourci clavier
 */
browser.commands.onCommand.addListener((command) => {
  if (command === "delete-office365-data") {
    deleteOffice365Data();
  }
});

console.log("Del365 extension chargée");
