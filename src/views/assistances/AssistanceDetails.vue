<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">
        <i class="fas fa-hands-helping me-2"></i>Détails de l'Assistance
      </h2>
      <router-link to="/mesAssistances" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour à la liste
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="assistance" class="row g-4">
      <!-- Main Information Card -->
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="fas fa-info-circle me-2"></i>Informations Générales
            </h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <!-- ID -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted">ID</label>
                <p class="mb-0">#{{ assistance.id }}</p>
              </div>

              <!-- Statut -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted">Statut</label>
                <div>
                  <span
                    class="badge rounded-1"
                    :class="getStatusClass(assistance.statut)"
                  >
                    {{ getStatusLabel(assistance.statut) }}
                  </span>
                </div>
              </div>

              <!-- Type d'Assistance -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted"
                  >Type d'Assistance</label
                >
                <p class="mb-0">
                  {{ assistance.type_assistance?.nom || "N/A" }}
                </p>
              </div>

              <!-- Montant -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted">Montant</label>
                <p class="mb-0 fs-5 text-primary fw-bold">
                  {{ formatMontant(assistance.montant) }}
                </p>
              </div>

              <!-- Date de Demande -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted"
                  >Date de Demande</label
                >
                <p class="mb-0">
                  <i class="far fa-calendar me-2"></i
                  >{{ formatDate(assistance.date_demande) }}
                </p>
              </div>

              <!-- Date d'Approbation -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted"
                  >Date d'Approbation</label
                >
                <p class="mb-0">
                  <i class="far fa-calendar-check me-2"></i>
                  {{
                    assistance.date_approbation
                      ? formatDate(assistance.date_approbation)
                      : "Non approuvée"
                  }}
                </p>
              </div>

              <!-- Date de Versement -->
              <div class="col-md-6">
                <label class="form-label fw-bold text-muted"
                  >Date de Versement</label
                >
                <p class="mb-0">
                  <i class="far fa-calendar-check me-2"></i>
                  {{
                    assistance.date_versement
                      ? formatDate(assistance.date_versement)
                      : "Non versée"
                  }}
                </p>
              </div>

              <!-- Motif de Rejet -->
              <div v-if="assistance.motif_rejet" class="col-12">
                <label class="form-label fw-bold text-muted"
                  >Motif de Rejet</label
                >
                <div class="alert alert-danger mb-0">
                  <i class="fas fa-exclamation-triangle me-2"></i
                  >{{ assistance.motif_rejet }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Document de Demande (Justificatif) -->
        <div v-if="assistance.justificatif" class="card shadow-sm mt-4">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">
              <i class="fas fa-file-alt me-2"></i>Justificatif de Demande
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <i class="fas fa-file-pdf text-danger fs-1 me-3"></i>
                <span class="fw-semibold">Document de Demande</span>
              </div>
              <div class="btn-group">
                <a
                  :href="getJustificatifUrl(assistance.justificatif)"
                  target="_blank"
                  class="btn btn-outline-primary btn-sm"
                >
                  <i class="fas fa-eye me-1"></i>Voir
                </a>
                <a
                  :href="getJustificatifUrl(assistance.justificatif)"
                  download
                  class="btn btn-primary btn-sm"
                >
                  <i class="fas fa-download me-1"></i>Télécharger
                </a>
              </div>
            </div>

            <!-- Viewer -->
            <div class="ratio ratio-16x9">
              <iframe
                :src="getJustificatifUrl(assistance.justificatif)"
                class="border rounded"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- Preuve de Paiement -->
        <div v-if="assistance.preuve_versement" class="card shadow-sm mt-4">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">
              <i class="fas fa-check-double me-2"></i>Preuve de Paiement
            </h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <i
                  class="fas fa-file-invoice-dollar text-success fs-1 me-3"
                ></i>
                <span class="fw-semibold"
                  >Preuve de Paiement (Chèque/Bordereau)</span
                >
              </div>
              <div class="btn-group">
                <a
                  :href="getJustificatifUrl(assistance.preuve_versement)"
                  target="_blank"
                  class="btn btn-outline-success btn-sm"
                >
                  <i class="fas fa-eye me-1"></i>Voir
                </a>
                <a
                  :href="getJustificatifUrl(assistance.preuve_versement)"
                  download
                  class="btn btn-success btn-sm"
                >
                  <i class="fas fa-download me-1"></i>Télécharger
                </a>
              </div>
            </div>

            <!-- Viewer -->
            <div class="ratio ratio-16x9">
              <iframe
                :src="getJustificatifUrl(assistance.preuve_versement)"
                class="border rounded"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <!-- Member Information Card -->
        <div class="card shadow-sm">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">
              <i class="fas fa-user me-2"></i>Informations du Membre
            </h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Nom Complet</label>
              <p class="mb-0">{{ assistance.membre?.full_name || "N/A" }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Matricule</label>
              <p class="mb-0">
                <span class="badge bg-secondary">{{
                  assistance.membre?.matricule || "N/A"
                }}</span>
              </p>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Email</label>
              <p class="mb-0">
                <i class="fas fa-envelope me-2"></i
                >{{ assistance.membre?.email || "N/A" }}
              </p>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Téléphone</label>
              <p class="mb-0">
                <i class="fas fa-phone me-2"></i
                >{{ assistance.membre?.telephone || "N/A" }}
              </p>
            </div>
            <div class="mb-0">
              <label class="form-label fw-bold text-muted">Statut Membre</label>
              <p class="mb-0">
                <span
                  class="badge"
                  :class="
                    assistance.membre?.statut === 'actif'
                      ? 'bg-success'
                      : 'bg-warning'
                  "
                >
                  {{ assistance.membre?.statut || "N/A" }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Type Assistance Details Card -->
        <div class="card shadow-sm mt-4">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">
              <i class="fas fa-clipboard-list me-2"></i>Type d'Assistance
            </h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Nom</label>
              <p class="mb-0">{{ assistance.type_assistance?.nom || "N/A" }}</p>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold text-muted"
                >Montant Standard</label
              >
              <p class="mb-0 fs-5 text-success fw-bold">
                {{
                  formatMontant(assistance.type_assistance?.montant_standard)
                }}
              </p>
            </div>
            <div v-if="assistance.type_assistance?.conditions" class="mb-3">
              <label class="form-label fw-bold text-muted">Conditions</label>
              <p class="mb-0">{{ assistance.type_assistance.conditions }}</p>
            </div>
            <div
              v-if="assistance.type_assistance?.documents_requis"
              class="mb-0"
            >
              <label class="form-label fw-bold text-muted"
                >Documents Requis</label
              >
              <p class="mb-0">
                {{ assistance.type_assistance.documents_requis }}
              </p>
            </div>
          </div>
        </div>

        <!-- Timestamps Card -->
        <div class="card shadow-sm mt-4">
          <div class="card-header bg-dark text-white">
            <h5 class="mb-0"><i class="fas fa-clock me-2"></i>Historique</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label fw-bold text-muted">Créé le</label>
              <p class="mb-0">
                <i class="far fa-calendar-plus me-2"></i
                >{{ formatDateTime(assistance.created_at) }}
              </p>
            </div>
            <div class="mb-0">
              <label class="form-label fw-bold text-muted">Modifié le</label>
              <p class="mb-0">
                <i class="far fa-calendar-alt me-2"></i
                >{{ formatDateTime(assistance.updated_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="alert alert-warning">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Aucune assistance trouvée.
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import api from "../../services/api";
import { useStore } from "vuex";
import { onMounted, computed, ref } from "vue";
import { useToast } from "vue-toastification";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const id = route?.params?.id;
const store = useStore();
const loading = ref(false);

onMounted(() => {
  getAssistance();
});

const getAssistance = async () => {
  loading.value = true;
  try {
    const response = await api.get(`/assistances/${id}`);
    store.state.data.assistance = response.data;
  } catch (error) {
    console.error("Error fetching assistance:", error);
    toast.error("Erreur lors du chargement des détails de l'assistance");
  } finally {
    loading.value = false;
  }
};

const assistance = computed(() => store.state.data.assistance);

// Helper functions
const formatMontant = (value) => {
  if (!value) return "N/A";
  return parseFloat(value).toLocaleString("fr-FR") + " FBU";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getJustificatifUrl = (path) => {
  if (!path) return "";
  // If it's already a full URL (from the backend accessor), return it
  if (path.toString().startsWith("http")) return path;
  return path;
};

const getStatusClass = (statut) => {
  switch (statut) {
    case "en_attente":
      return "bg-warning";
    case "en_cours":
      return "bg-primary";
    case "approuve":
      return "bg-success";
    case "rejete":
      return "bg-danger";
    case "verse":
      return "bg-info";
    default:
      return "bg-secondary";
  }
};

const getStatusLabel = (statut) => {
  switch (statut) {
    case "en_attente":
      return "En attente";
    case "en_cours":
      return "Attente responsable";
    case "approuve":
      return "Approuvé";
    case "rejete":
      return "Rejeté";
    case "verse":
      return "Versé";
    default:
      return statut;
  }
};
</script>

<style scoped>
.card {
  border: none;
  border-radius: 10px;
}

.card-header {
  border-radius: 10px 10px 0 0;
  padding: 1rem 1.25rem;
}

.form-label {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

iframe {
  border: 1px solid #dee2e6;
}
</style>
