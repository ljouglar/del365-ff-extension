/**
 * Del365 - Extension Firefox
 * Supprime les données de navigation liées à Office 365 et Microsoft
 */

// Domaines ciblés (le domaine lui-même et tous ses sous-domaines)
const TARGET_DOMAINS = [
  "office365.com",
  "office.com",
  "office.net",
  "outlook.com",
  "microsoft.com",
  "microsoftonline.com", // authentification Entra ID (login.microsoftonline.com)
  "cloud.microsoft", // outlook.cloud.microsoft, teams.cloud.microsoft...
  "static.microsoft",
  "live.com",
  "sharepoint.com",
  "office-web.sips-services.com",
  "koesio.com",
];

// Hôtes dont on vide aussi le stockage (localStorage, IndexedDB, service workers).
// browsingData.remove ne garantit pas la prise en compte des sous-domaines,
// on liste donc explicitement les hôtes utilisés par Outlook / Teams / le SSO.
const STORAGE_HOSTNAMES = [
  ...TARGET_DOMAINS,
  "login.microsoftonline.com",
  "login.live.com",
  "outlook.office.com",
  "outlook.office365.com",
  "outlook.cloud.microsoft",
  "m365.cloud.microsoft",
  "teams.cloud.microsoft",
  "teams.microsoft.com",
  "www.office.com",
  "portail.koesio.com",
];

function matchesTarget(host) {
  const h = (host || "").replace(/^\./, "").toLowerCase();
  return TARGET_DOMAINS.some((d) => h === d || h.endsWith("." + d));
}

/**
 * Récupère les cookies de tous les magasins (défaut + conteneurs),
 * y compris les cookies partitionnés (Total Cookie Protection).
 */
async function getAllTargetCookies() {
  const stores = await browser.cookies.getAllCookieStores();
  const cookies = [];
  for (const store of stores) {
    try {
      const storeCookies = await browser.cookies.getAll({
        storeId: store.id,
        firstPartyDomain: null,
        partitionKey: {},
      });
      cookies.push(...storeCookies);
    } catch (e) {
      console.error(`Lecture impossible du magasin ${store.id}:`, e);
    }
  }
  return cookies.filter(
    (c) =>
      matchesTarget(c.domain) ||
      matchesTarget(c.partitionKey && c.partitionKey.topLevelSite
        ? new URL(c.partitionKey.topLevelSite).hostname
        : ""),
  );
}

async function removeCookie(cookie) {
  const host = cookie.domain.replace(/^\./, "");
  const details = {
    url: `http${cookie.secure ? "s" : ""}://${host}${cookie.path}`,
    name: cookie.name,
    storeId: cookie.storeId,
  };
  if (cookie.firstPartyDomain !== undefined) {
    details.firstPartyDomain = cookie.firstPartyDomain;
  }
  if (cookie.partitionKey) {
    details.partitionKey = cookie.partitionKey;
  }
  return browser.cookies.remove(details);
}

/**
 * Fonction principale de suppression des données Office 365
 */
async function deleteOffice365Data() {
  try {
    let deletionCount = 0;

    const cookies = await getAllTargetCookies();
    console.log(`Cookies ciblés: ${cookies.length}`);

    for (const cookie of cookies) {
      try {
        const removed = await removeCookie(cookie);
        if (removed) {
          deletionCount++;
          console.log(
            `Cookie supprimé: ${cookie.name} de ${cookie.domain}` +
              (cookie.partitionKey ? ` (partition ${cookie.partitionKey.topLevelSite})` : "") +
              ` [${cookie.storeId}]`,
          );
        }
      } catch (e) {
        console.error(`Erreur suppression cookie ${cookie.name}:`, e);
      }
    }

    // Stockage des sites : jetons MSAL d'Outlook, service worker, etc.
    let storageCleared = true;
    try {
      await browser.browsingData.remove(
        { hostnames: STORAGE_HOSTNAMES },
        { localStorage: true, indexedDB: true, serviceWorkers: true },
      );
    } catch (e) {
      storageCleared = false;
      console.error("Erreur suppression du stockage des sites:", e);
    }

    console.log(`Total cookies supprimés: ${deletionCount}`);

    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: "Del365",
      message:
        (deletionCount > 0
          ? `${deletionCount} cookie${deletionCount > 1 ? "s" : ""} Microsoft/Office 365 supprimé${deletionCount > 1 ? "s" : ""}.`
          : "Aucun cookie Microsoft/Office 365 trouvé.") +
        (storageCleared ? " Stockage des sites vidé." : " Échec du vidage du stockage."),
    });
  } catch (error) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: "Del365 - Erreur",
      message: "Erreur : " + error.message,
    });
    console.error("Erreur lors de la suppression des données Office 365:", error);
  }
}

browser.browserAction.onClicked.addListener(() => {
  deleteOffice365Data();
});

browser.commands.onCommand.addListener((command) => {
  if (command === "delete-office365-data") {
    deleteOffice365Data();
  }
});

console.log("Del365 extension chargée");
