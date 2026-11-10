<template>
  <div class="assistances-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestion des assistances</h2>
      <router-link to="/assistances/add" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i>Ajouter une assistance
      </router-link>
    </div>

    <div class="card">
      <AdvancedTable
        :data="tableData"
        :columns="columns"
        :loading="loading"
        search-placeholder="Rechercher des assistances..."
        no-data-message="Aucune assistance trouvée"
        :show-filters="true"
        :has-actions="true"
        row-key="id"
        details-endpoint="assistances"
        details-title="Détails de l'assistance"
        @edit="handleEdit"
        @delete="handleDelete"
        @search="handleSearch"
        @sort="handleSort"
        @filter="handleFilter"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <!-- Custom column slot -->
        <template #column-statut="{ value }">
          <span class="badge rounded-1" :class="getClassByStatut(value)">
            {{ getStatusLabel(value) }}
          </span>
        </template>

        <!-- Justificatif column slot -->
        <template #column-justificatif="{ item }">
          <a
            v-if="item.justificatif"
            :href="getJustificatifUrl(item.justificatif)"
            target="_blank"
            class="btn btn-link btn-sm text-primary p-0"
            title="Voir le document"
          >
            <i class="fas fa-file-pdf me-1"></i>Voir
          </a>
          <span v-else class="text-muted small">Aucun</span>
        </template>

        <template #actions="{ item, openDetails }">
          <div class="btn-group gap-1">
            <button
              class="btn btn-outline-secondary btn-sm"
              @click="openDetails(item)"
              title="Voir détails"
            >
              <i class="fas fa-eye"></i>
            </button>

            <!-- Approve / reject: gestionnaire on "en attente";
                 responsable / admin on "en attente" and "en cours" (final approval) -->
            <template v-if="canDecide(item)">
              <button
                class="btn btn-success btn-sm"
                @click="handleAction(item, 'approuve')"
                :title="item.statut === 'en_cours' ? 'Approbation finale' : 'Valider'"
              >
                <i class="fas fa-check"></i>
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="handleAction(item, 'rejete')"
                title="Refuser"
              >
                <i class="fas fa-times"></i>
              </button>
            </template>

            <!-- Pay out: only once approved -->
            <button
              v-if="item.statut === 'approuve' && isStaff"
              class="btn btn-primary btn-sm"
              @click="openVersement(item)"
              title="Verser l'assistance"
            >
              <i class="fas fa-hand-holding-usd"></i>
            </button>

            <!-- Proof of payment once paid -->
            <a
              v-if="item.statut === 'verse' && item.preuve_versement"
              :href="item.preuve_versement"
              target="_blank"
              class="btn btn-outline-primary btn-sm"
              title="Preuve de versement"
            >
              <i class="fas fa-receipt"></i>
            </a>

            <!-- Edit: only while nothing is decided -->
            <button
              v-if="item.statut === 'en_attente' && isStaff"
              class="btn btn-warning btn-sm"
              @click="handleModifier(item)"
              title="Modifier"
            >
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </template>
      </AdvancedTable>
    </div>

    <!-- Approval Modal -->
    <div
      class="modal fade"
      id="approveModal"
      tabindex="-1"
      aria-labelledby="approveModalLabel"
      aria-hidden="true"
      ref="approveModalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="approveModalLabel">
              Approbation d'Assistance
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p v-if="selectedItem">
              Vous allez approuver l'assistance pour
              <strong>{{ selectedItem.membre?.full_name }}</strong> d'un montant
              de
              <strong
                >{{
                  parseFloat(selectedItem.montant).toLocaleString()
                }}
                FBU</strong
              >.
            </p>
            <p class="text-muted small mb-0" v-if="selectedItem?.statut === 'en_attente' && isManager">
              Après votre validation, la demande sera envoyée au responsable pour
              l'approbation finale.
            </p>
            <p class="text-muted small mb-0" v-else>
              Après l'approbation, l'assistance pourra être versée (bouton
              <i class="fas fa-hand-holding-usd"></i>).
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Annuler
            </button>
            <button
              type="button"
              class="btn btn-success"
              @click="confirmApprobation"
              :disabled="submitting"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Confirmer l'approbation
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Versement (pay-out) Modal -->
    <div
      class="modal fade"
      id="versementModal"
      tabindex="-1"
      aria-hidden="true"
      ref="versementModalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Versement de l'assistance</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p v-if="selectedItem">
              Versement à <strong>{{ selectedItem.membre?.full_name }}</strong> de
              <strong>{{ parseFloat(selectedItem.montant).toLocaleString() }} FBU</strong>.
            </p>

            <!-- The money comes from the fund (caisse) -->
            <div
              v-if="caisse"
              class="alert py-2"
              :class="caisseSuffisante ? 'alert-info' : 'alert-danger'"
            >
              <i class="fas fa-cash-register me-1"></i>
              Solde de la caisse :
              <strong>{{ Number(caisse.solde).toLocaleString("fr-FR") }} FBU</strong>
              <div class="small" v-if="caisseSuffisante">
                Après ce versement :
                {{ (Number(caisse.solde) - Number(selectedItem?.montant || 0)).toLocaleString("fr-FR") }} FBU
              </div>
              <div class="small" v-else>
                Fonds insuffisants : le versement sera refusé.
              </div>
            </div>
            <div v-else-if="loadingCaisse" class="form-text mb-2">
              <i class="fas fa-spinner fa-spin me-1"></i>Lecture du solde de la caisse...
            </div>

            <div class="mb-3">
              <label class="form-label">Date du versement</label>
              <input type="date" class="form-control" v-model="dateVersement" />
            </div>
            <div class="mb-3">
              <label for="preuveVersement" class="form-label">
                Preuve de versement (Chèque/Bordereau) <span class="text-danger">*</span>
              </label>
              <input
                type="file"
                class="form-control"
                id="preuveVersement"
                @change="handleFileChange"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <div class="form-text">Formats acceptés : PDF, JPG, PNG (2 Mo max).</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button
              type="button"
              class="btn btn-primary"
              @click="confirmVersement"
              :disabled="submitting || !justificatifFile || (caisse && !caisseSuffisante)"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Confirmer le versement
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { onMounted } from "vue";
import { useStore } from "vuex";
import api from "../../services/api";
import AdvancedTable from "../../components/advancedTable/AdvancedTable.vue";
import router from "../../router";
import useAuthStore from "../../stores/auth";
import { useToast } from "vue-toastification";
import { Modal } from "bootstrap";

const store = useStore();
const auth = useAuthStore();
const toast = useToast();

const isAdmin = auth.hasAnyRole(["admin"]);
const isManager = auth.hasAnyRole(["gestionnaire"]);
const isResponsable = auth.hasAnyRole(["responsable"]);
const isMember = auth.hasAnyRole(["membre"]);
const isStaff = isAdmin || isManager || isResponsable;

// Same rule as the API: gestionnaire decides "en attente";
// responsable / admin decide "en attente" and "en cours" (final approval).
const canDecide = (item) => {
  if (item.statut === "en_attente") return isStaff;
  if (item.statut === "en_cours") return isAdmin || isResponsable;
  return false;
};

const assistances = ref([]);
const loading = ref(false);
const submitting = ref(false);
const selectedItem = ref(null);
const justificatifFile = ref(null);
const approveModalRef = ref(null);
let modalInstance = null;
const versementModalRef = ref(null);
let versementModalInstance = null;
const dateVersement = ref("");
const caisse = ref(null);
const loadingCaisse = ref(false);
const caisseSuffisante = computed(
  () =>
    !caisse.value ||
    Number(caisse.value.solde) >= Number(selectedItem.value?.montant || 0),
);

// Query parameters for API
const queryParams = ref({
  page: 1,
  per_page: 15,
  search: "",
  sort_field: "",
  sort_order: "asc",
  filters: {},
});

const columns = [
  { key: "id", label: "ID", sortable: true },
  { key: "membre.full_name", label: "Membre", width: "150px", sortable: true },
  {
    key: "type_assistance.nom",
    label: "Type d'assistance",
    width: "150px",
    sortable: true,
  },
  {
    key: "montant",
    label: "Montant",
    sortable: true,
    filterable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },
  {
    key: "date_approbation",
    label: "Date d'approbation",
    sortable: true,
    filterable: true,
    formatter: (value) => (value ? new Date(value).toLocaleDateString() : ""),
  },
  {
    key: "statut",
    label: "Statut",
    sortable: true,
    filterable: true,
  },
  {
    key: "justificatif",
    label: "Justificatif",
    width: "100px",
    sortable: false,
  },
  {
    key: "created_at",
    label: "Créé le",
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString(),
  },
];

// Fetch data from your API
const fetchAssistances = async () => {
  loading.value = true;

  try {
    const params = {
      page: queryParams.value.page,
      per_page: queryParams.value.per_page,
    };

    if (queryParams.value.search) {
      params.search = queryParams.value.search;
    }

    if (queryParams.value.sort_field) {
      params.sort_field = queryParams.value.sort_field;
      params.sort_order = queryParams.value.sort_order;
    }

    // Add filters
    Object.entries(queryParams.value.filters).forEach(([key, value]) => {
      if (value) {
        params[`filter[${key}]`] = value;
      }
    });

    const response = await api.get("/assistances", { params });

    // Handle your API response structure
    if (response.success) {
      assistances.value = response.data || [];
      store.state.assistances = response.data || [];
    } else {
      console.error("API Error:", response.message);
    }
  } catch (error) {
    console.error("Error fetching assistances:", error);
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (event) => {
  justificatifFile.value = event.target.files[0];
};

const handleAction = async (item, action) => {
  if (action === "approuve") {
    selectedItem.value = item;
    justificatifFile.value = null;
    if (!modalInstance) {
      modalInstance = new Modal(approveModalRef.value);
    }
    modalInstance.show();
    return;
  }

  if (!confirm(`Êtes-vous sûr de vouloir refuser cette assistance ?`)) {
    return;
  }

  try {
    if (action === "rejete") {
      const comment = prompt("Veuillez saisir le motif du rejet");
      if (!comment) {
        toast.warning("Veuillez saisir un motif de rejet.");
        return;
      }
      await api.post(`/assistances/rejete/${item.id}`, { comment });
      toast.success("Assistance rejetée avec succès.");
    }
    fetchAssistances();
  } catch (error) {
    console.error(`Error ${action} assistance:`, error);
    toast.error(error.response?.data?.message || `Erreur lors de l'action sur l'assistance.`);
  }
};

const confirmApprobation = async () => {
  submitting.value = true;
  try {
    const res = await api.post(`/assistances/approuve/${selectedItem.value.id}`);
    toast.success(res?.message || "Assistance approuvée avec succès.");
    modalInstance.hide();
    fetchAssistances();
  } catch (error) {
    console.error("Error approving assistance:", error);
    toast.error(error.response?.data?.message || "Erreur lors de l'approbation de l'assistance.");
  } finally {
    submitting.value = false;
  }
};

// Pay out an approved assistance, with the proof of payment.
const openVersement = (item) => {
  selectedItem.value = item;
  justificatifFile.value = null;
  dateVersement.value = new Date().toISOString().slice(0, 10);
  const input = document.getElementById("preuveVersement");
  if (input) input.value = "";
  if (!versementModalInstance) {
    versementModalInstance = new Modal(versementModalRef.value);
  }
  versementModalInstance.show();
  fetchCaisse();
};

// Fund balance shown before paying out (the API refuses if it is too low).
const fetchCaisse = async () => {
  caisse.value = null;
  loadingCaisse.value = true;
  try {
    const res = await api.get("/caisse");
    caisse.value = res?.data || null;
  } catch (error) {
    console.error("Error loading caisse:", error);
  } finally {
    loadingCaisse.value = false;
  }
};

const confirmVersement = async () => {
  if (!justificatifFile.value) {
    toast.warning("Veuillez joindre la preuve de versement.");
    return;
  }
  submitting.value = true;
  const formData = new FormData();
  formData.append("preuve_versement", justificatifFile.value);
  if (dateVersement.value) formData.append("date_versement", dateVersement.value);

  try {
    await api.post(`/assistances/${selectedItem.value.id}/verser`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Versement enregistré avec succès.");
    versementModalInstance.hide();
    fetchAssistances();
  } catch (error) {
    console.error("Error paying assistance:", error);
    toast.error(error.response?.data?.message || "Erreur lors du versement.");
  } finally {
    submitting.value = false;
  }
};

const handleModifier = (item) => {
  router.push({ name: "assistancesEdit", params: { id: item.id } });
};

const getClassByStatut = (statut) => {
  if (statut === "rejete") {
    return "bg-danger";
  } else if (statut === "en_attente") {
    return "bg-warning";
  } else if (statut === "en_cours") {
    return "bg-info";
  } else if (statut === "approuve") {
    return "bg-success";
  } else {
    return "bg-secondary";
  }
};

const getStatusLabel = (statut) => {
  if (statut === "rejete") {
    return "Rejeté";
  } else if (statut === "en_attente") {
    return "En attente";
  } else if (statut === "en_cours") {
    return "En cours";
  } else if (statut === "approuve") {
    return "Approuvé";
  } else if (statut === "verse") {
    return "Versé";
  } else {
    return statut;
  }
};

const getJustificatifUrl = (path) => {
  if (!path) return "#";
  // If it starts with 'uploads', it's usually in public/uploads
  if (path.startsWith("uploads")) {
    return `${path}`;
  }
  // If it's stored via Storage::disk('public'), it's in storage/
  return `${path}`;
};

// Event handlers
const handleSearch = (searchTerm) => {
  queryParams.value.search = searchTerm;
  queryParams.value.page = 1;
  fetchAssistances();
};

const handleSort = (sortData) => {
  queryParams.value.sort_field = sortData.field;
  queryParams.value.sort_order = sortData.order;
  queryParams.value.page = 1;
  fetchAssistances();
};

const handleFilter = (filters) => {
  queryParams.value.filters = filters;
  queryParams.value.page = 1;
  fetchAssistances();
};

const handlePageChange = (page) => {
  queryParams.value.page = page;
  fetchAssistances();
};

const handlePerPageChange = (perPage) => {
  queryParams.value.per_page = perPage;
  queryParams.value.page = 1;
  fetchAssistances();
};

const handleEdit = (assistance) => {
  router.push({ name: "assistancesEdit", params: { id: assistance.id } });
};

const handleDelete = (assistance) => {
  if (confirm("Etês-vous sûr de vouloir supprimer cette assistance?")) {
    api
      .delete(`/assistances/${assistance.id}`)
      .then((response) => {
        console.log("Assistance supprimée avec succès!");
        toast.success("Assistance supprimée avec succès!");
        fetchAssistances();
      })
      .catch((error) => {
        console.error(
          "Une erreur est survenue lors de la suppression de l'assistance:",
          error,
        );
        toast.error("Erreur lors de la suppression.");
      });
  }
};

onMounted(() => {
  fetchAssistances();
});

const tableData = computed(() => {
  const data = store.state.assistances || {};
  return {
    data: data.data || [],
    current_page: data.current_page || 1,
    last_page: data.last_page || 1,
    per_page: data.per_page || 15,
    total: data.total || 0,
    from: data.from || 0,
    to: data.to || 0,
  };
});
</script>
