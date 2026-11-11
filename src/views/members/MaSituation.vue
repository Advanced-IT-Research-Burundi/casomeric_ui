<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-0">Ma situation financière</h2>
        <small class="text-muted" v-if="situation">
          {{ situation.membre.nom }} · Matricule {{ situation.membre.matricule }}
        </small>
      </div>
      <button v-if="situation" class="btn btn-outline-danger" @click="exporterReleve" :disabled="exporting">
        <i class="bi bi-file-earmark-pdf me-1"></i>Relevé PDF
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="situation">
      <div v-if="stats.anomalies > 0" class="alert alert-warning">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <span v-if="stats.echeancesEnRetard">
          {{ stats.echeancesEnRetard }} échéance(s) de crédit en retard.
        </span>
        <span v-if="stats.cotisationsEnRetard">
          Cotisation non enregistrée pour :
          {{ stats.periodesNonPayees.map((p) => p.periode).join(", ") }}.
        </span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6 col-xl-3" v-for="card in cards" :key="card.label">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <small class="text-muted d-block mb-1">
                <i :class="card.icon" class="me-1"></i>{{ card.label }}
              </small>
              <span class="fs-5 fw-bold" :class="card.class">{{ card.value }}</span>
              <small class="text-muted d-block" v-if="card.hint">{{ card.hint }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-4">
          <router-link to="/mesCotisations" class="btn btn-outline-primary w-100">
            <i class="bi bi-wallet2 me-2"></i>Historique des cotisations
          </router-link>
        </div>
        <div class="col-md-4">
          <router-link to="/credits/mescredits" class="btn btn-outline-primary w-100">
            <i class="bi bi-credit-card me-2"></i>Mes crédits et échéanciers
          </router-link>
        </div>
        <div class="col-md-4">
          <router-link to="/mesAssistances" class="btn btn-outline-primary w-100">
            <i class="bi bi-life-preserver me-2"></i>Mes assistances
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../../services/api";
import { exportReleveSituation, chargerCreditsEnCours } from "../../utils/useExport";

const situation = ref(null);
const error = ref("");

const stats = computed(() => situation.value?.stats || {});

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "BIF",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "-";

const cards = computed(() => {
  const s = stats.value;
  const prochaine = s.prochaineEcheance;
  return [
    {
      label: "Cotisations versées",
      icon: "bi bi-wallet2",
      value: formatCurrency(s.cotisationsTotal),
      hint: `Ce mois : ${formatCurrency(s.cotisationsMois)}`,
      class: "text-success",
    },
    {
      label: "Restant dû sur crédits",
      icon: "bi bi-credit-card",
      value: formatCurrency(s.creditsEnCours),
      hint: `Déjà remboursé : ${formatCurrency(s.creditsTotalPaye)}`,
      class: s.creditsEnCours > 0 ? "text-danger" : "",
    },
    {
      label: "Prochaine échéance",
      icon: "bi bi-calendar-event",
      value: prochaine ? formatCurrency(prochaine.montant) : "Aucune",
      hint: prochaine ? `Le ${formatDate(prochaine.date)}` : "",
      class: "",
    },
    {
      label: "Assistances reçues",
      icon: "bi bi-life-preserver",
      value: formatCurrency(s.montantsAssistancesRecus),
      class: "text-primary",
    },
  ];
});

const exporting = ref(false);

// Relevé de situation (section 7.3), avec l'échéancier de chaque crédit en cours.
const exporterReleve = async () => {
  exporting.value = true;
  try {
    const credits = (await api.get("/mescredits", { params: { per_page: 1000 } })).data?.data || [];
    exportReleveSituation(situation.value, await chargerCreditsEnCours(credits));
  } catch (err) {
    console.error("Erreur lors de l'export du relevé:", err);
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  try {
    const response = await api.get("/dashboard-member");
    situation.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Impossible de charger votre situation financière.";
  }
});
</script>
