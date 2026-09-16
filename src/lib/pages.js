// @ts-nocheck
import index from '../../index.html?raw';
import bio from '../../bio.html?raw';
import store from '../../store.html?raw';
import work from '../../work.html?raw';
import projectArteoStudio from '../../project-arteo-studio.html?raw';
import projectBetterEats from '../../project-better-eats.html?raw';
import projectDairyApp from '../../project-dairy-app.html?raw';
import projectDeveloperPortfolio from '../../project-developer-portfolio.html?raw';
import projectEden from '../../project-eden.html?raw';
import projectElshp from '../../project-elshp.html?raw';
import projectFuelfix from '../../project-fuelfix.html?raw';
import projectGlcChurch from '../../project-glc-church.html?raw';
import projectGodrejFoundations from '../../project-godrej-foundations.html?raw';
import projectMealProject from '../../project-meal-project.html?raw';
import projectMyLimb from '../../project-my-limb.html?raw';
import projectThoughtfulRobots from '../../project-thoughtful-robots.html?raw';
import projectVibrantLiving from '../../project-vibrant-living.html?raw';
import projectWowClub from '../../project-wow-club.html?raw';
import logoGoodHealthPhysicians from '../../logo-good-health-physicians.html?raw';
import logoHyperKart from '../../logo-hyper-kart.html?raw';
import logoMylimb from '../../logo-mylimb.html?raw';
import logoThoughtfulRobots from '../../logo-thoughtful-robots.html?raw';

function toPage(html, titleFallback) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? titleFallback;
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return {
    title: title.replace(/&amp;/g, '&'),
    html: body
      .replace(/<script[^>]*src=["']js\/main\.js["'][^>]*><\/script>/gi, '')
      .replaceAll('src="assets/', 'src="/assets/')
      .replaceAll("src='assets/", "src='/assets/")
      .replaceAll('href="assets/', 'href="/assets/')
      .replaceAll("href='assets/", "href='/assets/")
      .replaceAll('href="index.html', 'href="/')
      .replaceAll("href='index.html", "href='/")
      .replace(/href=(["'])((?:project|logo)-[a-z0-9-]+|work|bio|store)\.html/g, 'href=$1/$2')
  };
}

export const pages = Object.fromEntries(Object.entries({
  index, bio, store, work,
  'project-arteo-studio': projectArteoStudio,
  'project-better-eats': projectBetterEats,
  'project-dairy-app': projectDairyApp,
  'project-developer-portfolio': projectDeveloperPortfolio,
  'project-eden': projectEden,
  'project-elshp': projectElshp,
  'project-fuelfix': projectFuelfix,
  'project-glc-church': projectGlcChurch,
  'project-godrej-foundations': projectGodrejFoundations,
  'project-meal-project': projectMealProject,
  'project-my-limb': projectMyLimb,
  'project-thoughtful-robots': projectThoughtfulRobots,
  'project-vibrant-living': projectVibrantLiving,
  'project-wow-club': projectWowClub,
  'logo-good-health-physicians': logoGoodHealthPhysicians,
  'logo-hyper-kart': logoHyperKart,
  'logo-mylimb': logoMylimb,
  'logo-thoughtful-robots': logoThoughtfulRobots
}).map(([key, value]) => [key, toPage(value, key)]));
