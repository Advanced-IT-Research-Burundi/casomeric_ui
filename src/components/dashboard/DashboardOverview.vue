<template>
  <section class="dashboard-overview">
    <div class="container-fluid dashboard-content">
      <div v-if="loading" class="dashboard-status" role="status">
        <div class="spinner-border text-primary" aria-hidden="true"></div>
        <span>Chargement du tableau de bord…</span>
      </div>
      <div v-else-if="error" class="alert alert-danger dashboard-error" role="alert">
        {{ error }}
        <button type="button" class="btn btn-sm btn-outline-danger ms-2" @click="loadDashboard">Réessayer</button>
      </div>
      <template v-else>
        <div class="dashboard-heading"><div><h1>Tableau de bord</h1><p>Vue synthétique de la situation de la caisse.</p></div></div>
        <div class="row g-3 stats-grid">
          <div v-for="card in statCards" :key="card.label" class="col-12 col-sm-6 col-lg-4">
            <article class="card stat-card h-100"><div class="card-body">
              <div class="stat-icon" :class="card.iconClass" aria-hidden="true"><i class="bi" :class="card.icon"></i></div>
              <p class="stat-label">{{ card.label }}</p><p class="stat-value" :class="card.valueClass">{{ card.value }}</p>
              <p class="stat-detail" :class="card.detailClass"><i v-if="card.detailIcon" class="bi me-1" :class="card.detailIcon"></i>{{ card.detail }}</p>
            </div></article>
          </div>
        </div>
        <h2 class="section-title"><i class="bi bi-bar-chart-line-fill" aria-hidden="true"></i>Tendances</h2>
        <div class="row g-3 charts-grid">
          <div class="col-12 col-lg-8"><article class="card chart-card"><header class="card-header"><i class="bi bi-graph-up me-2" aria-hidden="true"></i>Évolution des cotisations</header><div class="card-body chart-body"><canvas ref="cotisationsChart"></canvas></div></article></div>
          <div class="col-12 col-lg-4"><article class="card chart-card"><header class="card-header"><i class="bi bi-pie-chart-fill me-2" aria-hidden="true"></i>Répartition des membres</header><div class="card-body chart-body"><canvas ref="membresChart"></canvas></div></article></div>
          <div class="col-12"><article class="card chart-card"><header class="card-header"><i class="bi bi-calendar3 me-2" aria-hidden="true"></i>Vue annuelle : cotisations et dépenses</header><div class="card-body chart-body chart-body-wide"><canvas ref="tendanceChart"></canvas></div></article></div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Chart from "chart.js/auto";
import api from "../../services/api";

const loading = ref(true);
const error = ref("");
const chartInstances = [];
const cotisationsChart = ref(null);
const membresChart = ref(null);
const tendanceChart = ref(null);
const stats = ref({ cotisationsMois: 0, cotisationsCumulatif: 0, evolutionCotisations: 0, membresActifs: 0, membresInactifs: 0, creditsTotal: 0, creditsEnCours: 0, demandesAssistance: 0, aidesAccordees: 0, soldeDisponible: 0 });

const formatMontant = (montant) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "BIF", minimumFractionDigits: 0 }).format(Number(montant) || 0);
const statCards = computed(() => [
  { label: "Cotisations ce mois", value: formatMontant(stats.value.cotisationsMois), detail: `${stats.value.evolutionCotisations >= 0 ? "+" : ""}${stats.value.evolutionCotisations}% sur le mois précédent`, detailIcon: stats.value.evolutionCotisations >= 0 ? "bi-arrow-up" : "bi-arrow-down", detailClass: stats.value.evolutionCotisations >= 0 ? "text-success" : "text-danger", icon: "bi-wallet2", iconClass: "icon-primary", valueClass: "text-primary" },
  { label: "Caisse principale", value: formatMontant(stats.value.cotisationsCumulatif), detail: "Total encaissé", detailClass: "text-muted", icon: "bi-piggy-bank", iconClass: "icon-info", valueClass: "text-info" },
  { label: "Membres actifs", value: stats.value.membresActifs, detail: `${stats.value.membresInactifs} inactif(s)`, detailIcon: "bi-person-x", detailClass: "text-danger", icon: "bi-people-fill", iconClass: "icon-success", valueClass: "text-success" },
  { label: "Crédits accordés", value: formatMontant(stats.value.creditsTotal), detail: `${stats.value.creditsEnCours} en cours`, detailIcon: "bi-hourglass-split", detailClass: "text-warning", icon: "bi-credit-card", iconClass: "icon-warning", valueClass: "text-warning" },
  { label: "Demandes d’assistance", value: stats.value.demandesAssistance, detail: `${stats.value.aidesAccordees} accordée(s)`, detailIcon: "bi-check-circle", detailClass: "text-success", icon: "bi-hand-thumbs-up-fill", iconClass: "icon-purple", valueClass: "text-purple" },
  { label: "Solde disponible", value: formatMontant(stats.value.soldeDisponible), detail: stats.value.soldeDisponible >= 0 ? "Solde positif" : "Solde négatif", detailIcon: stats.value.soldeDisponible >= 0 ? "bi-shield-check" : "bi-exclamation-triangle-fill", detailClass: stats.value.soldeDisponible >= 0 ? "text-info" : "text-danger", icon: "bi-bank2", iconClass: "icon-dark", valueClass: stats.value.soldeDisponible >= 0 ? "text-dark" : "text-danger" },
]);

const destroyCharts = () => chartInstances.splice(0).forEach((chart) => chart.destroy());
const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 12, font: { size: 12 } } } } };
const createCharts = (data) => {
  destroyCharts();
  if (!cotisationsChart.value || !membresChart.value || !tendanceChart.value) return;
  chartInstances.push(new Chart(cotisationsChart.value, { type: "line", data: { labels: data.cotisations.labels, datasets: [{ label: "Cotisations (BIF)", data: data.cotisations.values, borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, .12)", fill: true, tension: .35, borderWidth: 2 }] }, options: { ...commonOptions, plugins: { legend: { display: false } } } }));
  chartInstances.push(new Chart(membresChart.value, { type: "doughnut", data: { labels: ["Actifs", "Inactifs"], datasets: [{ data: [data.membres.actifs, data.membres.inactifs], backgroundColor: ["#16a34a", "#dc2626"], borderColor: "#fff", borderWidth: 3 }] }, options: { ...commonOptions, cutout: "62%", plugins: { legend: { position: "bottom" } } } }));
  chartInstances.push(new Chart(tendanceChart.value, { type: "line", data: { labels: data.tendance.labels, datasets: [
    { label: "Cotisations", data: data.tendance.cotisations, borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, .08)", fill: true, tension: .35, borderWidth: 2 },
    { label: "Crédits", data: data.tendance.credits, borderColor: "#d97706", backgroundColor: "rgba(217, 119, 6, .08)", fill: true, tension: .35, borderWidth: 2 },
    { label: "Assistances", data: data.tendance.assistances, borderColor: "#7c3aed", backgroundColor: "rgba(124, 58, 237, .08)", fill: true, tension: .35, borderWidth: 2 },
  ] }, options: { ...commonOptions, scales: { y: { beginAtZero: true, ticks: { callback: (value) => `${Number(value).toLocaleString("fr-FR")} BIF` } }, x: { grid: { display: false } } } } }));
};
const loadDashboard = async () => {
  loading.value = true; error.value = ""; destroyCharts();
  try {
    const response = await api.get("/dashboard");
    // L'intercepteur Axios retourne déjà le corps de la réponse ; l'API
    // enveloppe ensuite les données métier dans sa propriété `data`.
    const envelope = response.data || response;
    const data = envelope.data || envelope;
    if (!data?.success || !data.stats || !data.charts) throw new Error("Réponse invalide");
    stats.value = { ...stats.value, ...data.stats };
    // Les canvas sont rendus par la branche v-else, donc ils ne sont
    // disponibles qu'après la désactivation de l'état de chargement.
    loading.value = false;
    await nextTick();
    createCharts(data.charts);
  } catch (requestError) {
    error.value = "Impossible de charger les données du tableau de bord.";
    console.error("Erreur lors de la récupération du tableau de bord:", requestError);
  } finally { loading.value = false; }
};
onMounted(loadDashboard);
onBeforeUnmount(destroyCharts);
</script>

<style scoped>
.dashboard-overview { min-height: 100%; background: #f8fafc; color: #1e293b; }.dashboard-content { max-width: 1440px; padding: 1.25rem; }.dashboard-heading { margin-bottom: 1rem; }.dashboard-heading h1 { margin: 0; font-size: clamp(1.35rem, 3vw, 1.75rem); font-weight: 700; }.dashboard-heading p { margin: .2rem 0 0; color: #64748b; font-size: .9rem; }.dashboard-status { min-height: 50vh; display: grid; place-content: center; justify-items: center; gap: .75rem; color: #475569; }.dashboard-error { max-width: 560px; margin: 2rem auto; }.stat-card, .chart-card { border: 0; border-radius: .75rem; box-shadow: 0 2px 8px rgba(15, 23, 42, .07); overflow: hidden; }.stat-card .card-body { padding: 1rem; }.stat-icon { width: 2.5rem; height: 2.5rem; display: grid; place-items: center; border-radius: .65rem; margin-bottom: .75rem; color: #fff; font-size: 1.2rem; }.icon-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }.icon-info { background: linear-gradient(135deg, #38bdf8, #0284c7); }.icon-success { background: linear-gradient(135deg, #4ade80, #16a34a); }.icon-warning { background: linear-gradient(135deg, #fbbf24, #d97706); }.icon-purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }.icon-dark { background: linear-gradient(135deg, #64748b, #334155); }.stat-label { margin: 0; color: #64748b; font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }.stat-value { margin: .25rem 0; font-size: clamp(1.2rem, 2.8vw, 1.55rem); font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }.stat-detail { margin: 0; font-size: .8rem; font-weight: 600; }.text-purple { color: #7c3aed; }.section-title { display: flex; align-items: center; gap: .5rem; margin: 1.75rem 0 .85rem; font-size: 1.1rem; font-weight: 700; }.section-title i { color: #2563eb; }.chart-card .card-header { padding: .8rem 1rem; background: #fff; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: .9rem; font-weight: 700; }.chart-body { position: relative; height: 250px; padding: .75rem; }.chart-body-wide { height: 280px; }@media (min-width: 576px) { .dashboard-content { padding: 1.5rem; }.stat-card .card-body { padding: 1.15rem; } }@media (max-width: 575.98px) { .chart-body { height: 220px; }.chart-body-wide { height: 250px; } }
</style>
