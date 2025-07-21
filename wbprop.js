console.log("WBProp: Hello!");
import { MDCTopAppBar } from '@material/top-app-bar';
import { MDCDrawer } from "@material/drawer";
const drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));

const topAppBar = MDCTopAppBar.attachTo(document.getElementById('app-bar'));
topAppBar.setScrollTarget(document.getElementById('main-content'));
topAppBar.listen('MDCTopAppBar:nav', () => {
  drawer.open = !drawer.open;
});

// Import the renderChart function from main.js
import { fetchDatatypeData, fetchPropertyData, fetchProjectPropertyData, fetchLanguageData, fetchPropertyStatementData, renderBarChart } from './public/js/main.js';

document.addEventListener('DOMContentLoaded', async function () {
  // Calls renderBarChart for the Datatypes chart
  const datatypeData = await fetchDatatypeData();
  renderBarChart('d3-chart-datatypes', datatypeData, 'Datatypes by Property Count');

  // Calls renderBarChart for the Properties chart
  const propertyData = await fetchPropertyData();
  renderBarChart('d3-chart-properties', propertyData, 'Properties by Property Classes Count');

  const projectData = await fetchProjectPropertyData();
  renderBarChart('d3-chart-projects', projectData, 'WikiProjects by Property Count');

  const propertyStatementsData = await fetchPropertyStatementData();
  renderBarChart('d3-chart-statements', propertyStatementsData, 'Property Statements Count');

  const languageData = await fetchLanguageData();
  renderBarChart('d3-chart-languages', languageData, 'Property Translation Count');
});
