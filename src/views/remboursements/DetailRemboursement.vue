<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Détails du remboursement</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="handleFreePay">
          <i class="fas fa-hand-holding-usd me-2"></i>Payer un montant libre
        </button>
        <button @click="$router.back()" class="btn btn-outline-secondary">
          <i class="fas fa-arrow-left me-2"></i>Retour
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
    </div>

    <div v-else-if="credit">
      <!-- Simple Summary Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="p-3 bg-white shadow-sm rounded h-100 border-start border-primary border-4">
            <small class="text-muted d-block text-uppercase fw-bold" style="font-size: 0.7rem;">Montant total endetté</small>
            <span class="fw-bold fs-5">{{ formatCurrency(credit.montant_total_rembourser) }}</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-white shadow-sm rounded h-100 border-start border-success border-4">
            <small class="text-muted d-block text-uppercase fw-bold" style="font-size: 0.7rem;">Montant déjà payé</small>
            <span class="fw-bold fs-5 text-success">{{ formatCurrency(credit.montant_deja_paye) }}</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-white shadow-sm rounded h-100 border-start border-info border-4">
            <small class="text-muted d-block text-uppercase fw-bold" style="font-size: 0.7rem;">Échéances restantes</small>
            <span class="fw-bold fs-5">{{ totalRemainingCount }} / {{ totalCount }}</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-white shadow-sm rounded h-100 border-start border-danger border-4">
            <small class="text-muted d-block text-uppercase fw-bold" style="font-size: 0.7rem;">En retard</small>
            <span class="fw-bold fs-5 text-danger">{{ lateCount }}</span>
          </div>
        </div>
      </div>

      <!-- Repayments Table -->
      <div class="card shadow-sm border-0">
        <div class="card-header bg-white py-3">
          <h5 class="mb-0 text-primary fw-bold">
            <i class="fas fa-calendar-alt me-2"></i>Échéancier des remboursements
          </h5>
        </div>
        <div class="card-body">
          <div class="table-responsive" v-if="credit.remboursements && credit.remboursements.length">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Date échéance</th>
                  <th>Montant prévu</th>
                  <th>Montant payé</th>
                  <th>Date paiement</th>
                  <th>Statut</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="echeance in sortedRemboursements" :key="echeance.id">
                  <td>{{ echeance.numero_echeance }}</td>
                  <td>{{ formatDateShort(echeance.date_echeance) }}</td>
                  <td>{{ formatCurrency(echeance.montant_prevu) }}</td>
                  <td>{{ echeance.montant_paye ? formatCurrency(echeance.montant_paye) : '-' }}</td>
                  <td>{{ echeance.date_paiement ? formatDateShort(echeance.date_paiement) : '-' }}</td>
                  <td>
                    <span class="badge rounded-pill" :class="getRemboursementStatusBadge(echeance.statut)">
                      {{ formatStatus(echeance.statut) }}
                    </span>
                  </td>
                  <td class="text-end">
                    <div class="btn-group">
                      <a v-if="echeance.preuve_paiement_url" 
                         :href="echeance.preuve_paiement_url" 
                         target="_blank" 
                         class="btn btn-sm btn-outline-info"
                         title="Voir preuve">
                        <i class="fas fa-file-invoice"></i>
                      </a>
                      <button v-if="echeance.statut !== 'paye'" 
                              class="btn btn-sm btn-success"
                              @click="handleApprove(echeance)"
                              title="Marquer comme payé">
                        <i class="fas fa-check-circle me-1"></i>Payer
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-4 text-muted">
            Aucune échéance trouvée pour ce crédit.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'approbation pour une échéance spécifique -->
    <div v-if="showApproveModal" class="modal-backdrop fade show"></div>
    <div v-if="showApproveModal" class="modal fade show" style="display: block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">Valider cette échéance</h5>
            <button type="button" class="btn-close btn-close-white" @click="showApproveModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedRemboursement" class="mb-4 p-3 bg-light rounded">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Échéance N°:</span>
                <span class="fw-bold">{{ selectedRemboursement.numero_echeance }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Montant à payer:</span>
                <span class="fw-bold text-success">{{ formatCurrency(resteDu(selectedRemboursement)) }}</span>
              </div>
            </div>

            <div class="mb-3">
              <label for="preuve_paiement" class="form-label fw-bold">
                Preuve de paiement <span class="text-danger">*</span>
              </label>
              <input type="file" class="form-control" id="preuve_paiement" @change="handleFileChange" accept="image/*,.pdf" required />
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" @click="showApproveModal = false">Annuler</button>
            <button type="button" class="btn btn-success px-4" :disabled="submitting || !preuveFile" @click="confirmApprove">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour Paiement Libre (Montant Libre) -->
    <div v-if="showFreePayModal" class="modal-backdrop fade show"></div>
    <div v-if="showFreePayModal" class="modal fade show" style="display: block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Paiement Libre / Global</h5>
            <button type="button" class="btn-close btn-close-white" @click="showFreePayModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Montant à payer (BIF) <span class="text-danger">*</span></label>
              <input type="number" class="form-control" v-model="freePayAmount" placeholder="Ex: 50000" required />
              <small class="text-muted">Ce montant sera automatiquement distribué sur les prochaines échéances.</small>
            </div>

            <div class="mb-3">
              <label for="preuve_paiement_free" class="form-label fw-bold">
                Preuve de paiement <span class="text-danger">*</span>
              </label>
              <input type="file" class="form-control" id="preuve_paiement_free" @change="handleFileChange" accept="image/*,.pdf" required />
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" @click="showFreePayModal = false">Annuler</button>
            <button type="button" class="btn btn-primary px-4" :disabled="submitting || !preuveFile || !freePayAmount" @click="confirmFreePay">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              Valider le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import api from "../../services/api";
import { useToast } from "vue-toastification";

const route = useRoute();
const toast = useToast();
const creditId = route.params.id;
const loading = ref(true);
const submitting = ref(false);
const error = ref(null);
const credit = ref(null);

const showApproveModal = ref(false);

// What is still due on one installment (planned minus already paid).
const resteDu = (echeance) =>
  Math.max(0, Number(echeance?.montant_prevu || 0) - Number(echeance?.montant_paye || 0));
const showFreePayModal = ref(false);
const selectedRemboursement = ref(null);
const freePayAmount = ref(null);
const preuveFile = ref(null);

const formatCurrency = (value) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "BIF",
  }).format(value || 0);
};

const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const formatStatus = (status) => {
  if (!status) return "";
  return status.replace(/_/g, " ").toUpperCase();
};

const getRemboursementStatusBadge = (status) => {
  switch (status) {
    case "paye":
      return "bg-success";
    case "en_retard":
      return "bg-danger";
    case "en_attente":
      return "bg-warning text-dark";
    default:
      return "bg-secondary";
  }
};

const sortedRemboursements = computed(() => {
  if (!credit.value || !credit.value.remboursements) return [];
  return [...credit.value.remboursements].sort((a, b) => a.numero_echeance - b.numero_echeance);
});

const paidCount = computed(() => credit.value?.remboursements?.filter((r) => r.statut === "paye").length || 0);
const totalCount = computed(() => credit.value?.remboursements?.length || 0);
const lateCount = computed(() => credit.value?.remboursements?.filter((r) => r.statut === "en_retard").length || 0);
const totalRemainingCount = computed(() => credit.value?.remboursements?.filter((r) => r.statut !== 'paye').length || 0);

const fetchCreditDetails = async () => {
  try {
    loading.value = true;
    const response = await api.get(`/credits/${creditId}`);
    credit.value = response.data;
  } catch (err) {
    console.error("Error fetching credit details:", err);
    error.value = "Impossible de charger les détails du remboursement.";
  } finally {
    loading.value = false;
  }
};

const handleApprove = (row) => {
  selectedRemboursement.value = row;
  preuveFile.value = null;
  showApproveModal.value = true;
};

const handleFreePay = () => {
  freePayAmount.value = null;
  preuveFile.value = null;
  showFreePayModal.value = true;
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    preuveFile.value = file;
  }
};

const confirmApprove = async () => {
  if (!preuveFile.value) {
    toast.warning("Veuillez sélectionner une preuve de paiement");
    return;
  }

  try {
    submitting.value = true;
    const formData = new FormData();
    formData.append("preuve_paiement", preuveFile.value);
    // Pay what is still due on this installment (it may already be partly paid).
    formData.append("montant_paye", resteDu(selectedRemboursement.value));

    await api.post(`/remboursements/${selectedRemboursement.value.id}/approve`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Remboursement validé avec succès");
    showApproveModal.value = false;
    fetchCreditDetails();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || "Erreur lors de la validation du paiement");
  } finally {
    submitting.value = false;
  }
};

const confirmFreePay = async () => {
  if (!preuveFile.value || !freePayAmount.value) {
    toast.warning("Veuillez remplir tous les champs obligatoires");
    return;
  }

  try {
    submitting.value = true;
    const formData = new FormData();
    formData.append("preuve_paiement", preuveFile.value);
    formData.append("montant_paye", freePayAmount.value);

    await api.post(`/credits/${creditId}/payer`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Paiement global effectué et distribué avec succès");
    showFreePayModal.value = false;
    fetchCreditDetails();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || "Erreur lors du traitement du paiement");
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchCreditDetails);
</script>

<style scoped>
.container {
  max-width: 1200px;
}
.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}
.badge {
  font-weight: 500;
}
</style>
