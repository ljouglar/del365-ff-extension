/**
 * Del365 - Extension Firefox
 * Supprime les données de navigation liées à Office 365 et Microsoft
 */

// Nettoyage complet : toute la session Microsoft (SSO compris).
// Domaines ciblés = le domaine lui-même et tous ses sous-domaines.
const FULL_DOMAINS = [
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

// Nettoyage léger : Outlook / M365 uniquement, sans casser la session SSO
// (Teams, SharePoint et les autres outils Microsoft restent connectés).
const LIGHT_DOMAINS = ["cloud.microsoft", "office.com", "office365.com"];

// Hôtes dont on vide aussi le stockage (localStorage, IndexedDB, service workers).
// browsingData.remove ne garantit pas la prise en compte des sous-domaines,
// on liste donc explicitement les hôtes utilisés par Outlook / Teams / le SSO.
const LIGHT_STORAGE_HOSTNAMES = [
  ...LIGHT_DOMAINS,
  "outlook.cloud.microsoft",
  "m365.cloud.microsoft",
  "teams.cloud.microsoft",
  "outlook.office.com",
  "outlook.office365.com",
  "www.office.com",
];

const FULL_STORAGE_HOSTNAMES = [
  ...new Set([
    ...FULL_DOMAINS,
    ...LIGHT_STORAGE_HOSTNAMES,
    "login.microsoftonline.com",
    "login.live.com",
    "teams.microsoft.com",
    "portail.koesio.com",
  ]),
];

const MODES = {
  light: {
    label: "Nettoyage léger",
    domains: LIGHT_DOMAINS,
    storageHostnames: LIGHT_STORAGE_HOSTNAMES,
  },
  full: {
    label: "Reset complet",
    domains: FULL_DOMAINS,
    storageHostnames: FULL_STORAGE_HOSTNAMES,
  },
};

function matchesDomains(host, domains) {
  const h = (host || "").replace(/^\./, "").toLowerCase();
  return domains.some((d) => h === d || h.endsWith("." + d));
}

/**
 * Récupère les cookies de tous les magasins (défaut + conteneurs),
 * y compris les cookies partitionnés (Total Cookie Protection),
 * qui appartiennent aux domaines ciblés ou ont été déposés dans leur contexte.
 */
async function getTargetCookies(domains) {
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
      matchesDomains(c.domain, domains) ||
      matchesDomains(
        c.partitionKey && c.partitionKey.topLevelSite
          ? new URL(c.partitionKey.topLevelSite).hostname
          : "",
        domains,
      ),
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
 * Supprime les cookies et le stockage des sites pour le niveau demandé.
 * @param {"light" | "full"} modeName
 */
async function deleteOffice365Data(modeName) {
  const mode = MODES[modeName];
  try {
    let deletionCount = 0;

    const cookies = await getTargetCookies(mode.domains);
    console.log(`[${mode.label}] Cookies ciblés: ${cookies.length}`);

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
        { hostnames: mode.storageHostnames },
        { localStorage: true, indexedDB: true, serviceWorkers: true },
      );
    } catch (e) {
      storageCleared = false;
      console.error("Erreur suppression du stockage des sites:", e);
    }

    console.log(`[${mode.label}] Total cookies supprimés: ${deletionCount}`);

    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: `Del365 - ${mode.label}`,
      message:
        (deletionCount > 0
          ? `${deletionCount} cookie${deletionCount > 1 ? "s" : ""} supprimé${deletionCount > 1 ? "s" : ""}.`
          : "Aucun cookie trouvé.") +
        (storageCleared ? " Stockage des sites vidé." : " Échec du vidage du stockage."),
    });
  } catch (error) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icons/icon-48.png"),
      title: "Del365 - Erreur",
      message: "Erreur : " + error.message,
    });
    console.error(`[${mode.label}] Erreur lors de la suppression:`, error);
  }
}

// Clic sur le bouton : nettoyage léger.
browser.browserAction.onClicked.addListener(() => {
  deleteOffice365Data("light");
});

// Clic droit sur le bouton : reset complet.
browser.menus.create({
  id: "del365-full-reset",
  title: "Reset complet (déconnecte tous les services Microsoft)",
  contexts: ["browser_action"],
});

browser.menus.onClicked.addListener((info) => {
  if (info.menuItemId === "del365-full-reset") {
    deleteOffice365Data("full");
  }
});

browser.commands.onCommand.addListener((command) => {
  if (command === "delete-office365-data") {
    deleteOffice365Data("light");
  } else if (command === "delete-office365-data-full") {
    deleteOffice365Data("full");
  }
});

console.log("Del365 extension chargée");
