<template>
  <div class="container-fluid mt-4">
    <div class="row" v-if="credit">
      <!-- Member Information Card -->
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-light fw-bold text-primary">
            <i class="bi bi-person-badge me-2"></i>Information Membre
          </div>
          <div class="card-body text-center" v-if="credit.membre">
            <div
              class="avatar-placeholder mb-3 mx-auto bg-primary text-white d-flex align-items-center justify-content-center rounded-circle"
              style="width: 80px; height: 80px; font-size: 2rem"
            >
              {{ credit.membre.nom.charAt(0)
              }}{{ credit.membre.prenom.charAt(0) }}
            </div>
            <h5 class="card-title">{{ credit.membre.full_name }}</h5>
            <p class="text-muted mb-1">{{ credit.membre.matricule }}</p>
            <hr />
            <div class="text-start">
              <p class="mb-2">
                <i class="bi bi-telephone me-2 text-muted"></i>
                {{ credit.membre.telephone }}
              </p>
              <p class="mb-2">
                <i class="bi bi-envelope me-2 text-muted"></i>
                {{ credit.membre.email }}
              </p>
              <p class="mb-0">
                <i class="bi bi-geo-alt me-2 text-muted"></i> Catégorie:
                {{ credit.membre.categorie_id }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Credit Details Card -->
      <div class="col-md-8 mb-3">
        <div class="card shadow-sm border-0 h-100">
          <div
            class="card-header bg-white py-3 d-flex justify-content-between align-items-center"
          >
            <h5 class="mb-0 text-primary fw-bold">
              <i class="bi bi-cash-stack me-2"></i>Détails du Crédit
            </h5>
            <span
              class="badge rounded-pill"
              :class="getStatusBadge(credit.statut)"
            >
              {{ formatStatus(credit.statut) }}
            </span>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block uppercase"
                    >Montant Demandé</small
                  >
                  <span class="fw-bold fs-5">{{
                    formatCurrency(credit.montant_demande)
                  }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                  <small class="text-muted d-block uppercase"
                    >Montant Accordé</small
                  >
                  <span class="fw-bold fs-5 text-success">{{
                    formatCurrency(credit.montant_accorde)
                  }}</span>
                </div>
              </div>

              <div class="col-md-4">
                <label class="text-muted text-small">Taux d'intérêt</label>
                <p class="fw-bold">{{ credit.taux_interet }}%</p>
              </div>
              <div class="col-md-4">
                <label class="text-muted text-small">Durée</label>
                <p class="fw-bold">{{ credit.duree_mois }} mois</p>
              </div>
              <div class="col-md-4">
                <label class="text-muted text-small">Mensualité estimée</label>
                <p class="fw-bold">
                  {{ formatCurrency(credit.montant_mensualite) }}
                </p>
              </div>

              <div class="col-md-6">
                <label class="text-muted text-small"
                  >Montant Total à Rembourser</label
                >
                <p class="fw-bold text-dark">
                  {{ formatCurrency(credit.montant_total_rembourser) }}
                </p>
              </div>
              <div class="col-md-6">
                <label class="text-muted text-small">Montant Restant</label>
                <p class="fw-bold text-danger">
                  {{ formatCurrency(credit.montant_restant) }}
                </p>
              </div>

              <div class="col-12">
                <hr class="my-2" />
              </div>

              <div class="col-md-6">
                <small class="text-muted"
                  ><i class="bi bi-calendar-event me-1"></i> Date Demande</small
                >
                <p>{{ formatDate(credit.date_demande) }}</p>
              </div>
              <div class="col-md-6" v-if="credit.date_approbation">
                <small class="text-muted"
                  ><i class="bi bi-check-circle me-1"></i> Date
                  Approbation</small
                >
                <p>{{ formatDate(credit.date_approbation) }}</p>
              </div>

              <div class="col-md-6" v-if="credit.date_fin">
                <small class="text-muted"
                  ><i class="bi bi-check-circle me-1"></i> Date Fin</small
                >
                <p>{{ formatDate(credit.date_fin) }}</p>
              </div>

              <div class="col-12" v-if="credit.motif">
                <label class="fw-bold mb-1">Motif</label>
                <p class="bg-light p-2 rounded fst-italic mb-0">
                  {{ credit.motif }}
                </p>
              </div>

              <div class="col-12" v-if="credit.commentaire">
                <label class="fw-bold mb-1">Commentaire</label>
                <p class="bg-light p-2 rounded fst-italic mb-0">
                  {{ credit.commentaire }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Échéancier -->
      <div class="col-12 mb-3" v-if="echeances.length">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-primary fw-bold">
              <i class="bi bi-calendar3 me-2"></i>Échéancier de remboursement
            </h5>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-success" @click="exporterEcheancier('excel')">
                <i class="bi bi-file-earmark-excel me-1"></i>Excel
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="exporterEcheancier('pdf')">
                <i class="bi bi-file-earmark-pdf me-1"></i>PDF
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-3">
              <div class="col-md-3">
                <small class="text-muted d-block">Solde restant dû</small>
                <span class="fw-bold text-danger">{{ formatCurrency(credit.montant_restant) }}</span>
              </div>
              <div class="col-md-3">
                <small class="text-muted d-block">Déjà payé</small>
                <span class="fw-bold text-success">{{ formatCurrency(credit.montant_deja_paye) }}</span>
              </div>
              <div class="col-md-3">
                <small class="text-muted d-block">Prochaine échéance</small>
                <span class="fw-bold" v-if="prochaineEcheance">
                  {{ formatCurrency(resteEcheance(prochaineEcheance)) }} le
                  {{ formatDate(prochaineEcheance.date_echeance) }}
                </span>
                <span class="fw-bold" v-else>-</span>
              </div>
              <div class="col-md-3">
                <small class="text-muted d-block">Échéances restantes / en retard</small>
                <span class="fw-bold">{{ credit.echeances_restantes }}</span> /
                <span class="fw-bold" :class="{ 'text-danger': credit.echeances_en_retard }">{{
                  credit.echeances_en_retard
                }}</span>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>N°</th>
                    <th>Date d'échéance</th>
                    <th class="text-end">Montant prévu</th>
                    <th class="text-end">Montant payé</th>
                    <th>Date de paiement</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="e in echeances"
                    :key="e.id"
                    :class="{ 'table-primary': prochaineEcheance && e.id === prochaineEcheance.id }"
                  >
                    <td>{{ e.numero_echeance }}</td>
                    <td>{{ formatDate(e.date_echeance) }}</td>
                    <td class="text-end">{{ formatCurrency(e.montant_prevu) }}</td>
                    <td class="text-end">{{ formatCurrency(e.montant_paye) }}</td>
                    <td>{{ formatDate(e.date_paiement) }}</td>
                    <td>
                      <span class="badge" :class="getRemboursementStatusBadge(e.statut)">
                        {{ formatStatus(e.statut) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="d-flex justify-content-center align-items-center"
      style="min-height: 200px"
    >
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import api from "../../services/api";
import { useStore } from "vuex";
import { exportExcel, exportPdf, formatMontant, formatDateExport } from "../../utils/useExport";

const route = useRoute();
const store = useStore();

const credit = computed(() => store.state.credit);

const echeances = computed(() =>
  [...(credit.value?.remboursements || [])].sort(
    (a, b) => (a.numero_echeance || 0) - (b.numero_echeance || 0),
  ),
);

const resteEcheance = (e) =>
  Math.max(0, parseFloat(e.montant_prevu || 0) - parseFloat(e.montant_paye || 0));

// Première échéance non soldée, dans l'ordre des dates.
const prochaineEcheance = computed(() =>
  echeances.value.find((e) => e.statut !== "paye" && resteEcheance(e) > 0) || null,
);

const formatCurrency = (value) => {
  if (!value) return "0 FBU";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "BIF",
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "";
  return status.replace(/_/g, " ").toUpperCase();
};

const getStatusBadge = (status) => {
  switch (status) {
    case "en_attente":
      return "bg-warning text-dark";
    case "approuve":
      return "bg-success";
    case "rejete":
      return "bg-danger";
    case "paye":
      return "bg-info";
    default:
      return "bg-secondary";
  }
};

const getRemboursementStatusBadge = (status) => {
  switch (status) {
    case "prevu":
      return "bg-secondary";
    case "paye":
      return "bg-success";
    case "en_retard":
      return "bg-danger";
    default:
      return "bg-light text-dark";
  }
};

const exporterEcheancier = (format) => {
  const c = credit.value;
  const columns = [
    { label: "N°", value: (e) => e.numero_echeance },
    { label: "Date d'échéance", value: (e) => formatDateExport(e.date_echeance) },
    { label: "Montant prévu", value: (e) => parseFloat(e.montant_prevu) || 0, pdf: (e) => formatMontant(e.montant_prevu) },
    { label: "Montant payé", value: (e) => parseFloat(e.montant_paye) || 0, pdf: (e) => formatMontant(e.montant_paye) },
    { label: "Date de paiement", value: (e) => formatDateExport(e.date_paiement) },
    { label: "Statut", value: (e) => formatStatus(e.statut) },
  ];
  const fileName = `echeancier_credit_${c.id}`;
  if (format === "excel") {
    exportExcel({ fileName, sheetName: "Échéancier", columns, rows: echeances.value });
    return;
  }
  exportPdf({
    fileName,
    title: `Échéancier du crédit n° ${c.id}`,
    membre: c.membre ? { nom: `${c.membre.nom} ${c.membre.prenom}`, matricule: c.membre.matricule } : null,
    summary: [
      ["Montant accordé", formatMontant(c.montant_accorde)],
      ["Taux / durée", `${c.taux_interet} % sur ${c.duree_mois} mois`],
      ["Total à rembourser", formatMontant(c.montant_total_rembourser)],
      ["Déjà payé", formatMontant(c.montant_deja_paye)],
      ["Solde restant dû", formatMontant(c.montant_restant)],
      [
        "Prochaine échéance",
        prochaineEcheance.value
          ? `${formatMontant(resteEcheance(prochaineEcheance.value))} le ${formatDateExport(prochaineEcheance.value.date_echeance)}`
          : "-",
      ],
    ],
    tables: [{ columns, rows: echeances.value }],
  });
};

onMounted(async () => {
  try {
    const response = await api.get(`/credits/${route.params.id}`);
    store.state.credit = response.data;
  } catch (error) {
    console.error("Erreur lors du chargement du crédit:", error);
  }
});
</script>

<style scoped>
.text-small {
  font-size: 0.85rem;
}
.avatar-placeholder {
  background: linear-gradient(45deg, #0d6efd, #0dcaf0);
}
</style>
