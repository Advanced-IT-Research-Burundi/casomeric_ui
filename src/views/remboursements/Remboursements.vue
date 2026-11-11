<template>
  <div class="">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestion des Remboursements</h2>

      <div class="d-flex gap-2">
        <router-link to="/remboursements/mensuel" class="btn btn-primary">
          <i class="fas fa-calendar me-2"></i>Remboursements mensuelles
        </router-link>
      </div>
      <div class="d-flex gap-2">
        <router-link to="/remboursements/add" class="btn btn-primary">
          <i class="fas fa-plus me-2"></i>Ajouter un remboursement
        </router-link>
      </div>
    </div>

    <div class="card">
      <AdvancedTable
        :data="tableData"
        :columns="columns"
        :loading="loading"
        search-placeholder="Rechercher..."
        no-data-message="Aucun remboursement trouvé"
        :show-filters="true"
        :has-actions="true"
        row-key="id"
        details-endpoint="remboursements"
        details-title="Détails du remboursement"
        @edit="handleEdit"
        @delete="handleDelete"
        @show="handleShowDetail"
        @search="handleSearch"
        @sort="handleSort"
        @filter="handleFilter"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #actions="{ item }">
          <div class="btn-group">
            <button
              v-if="item.statut !== 'paye'"
              class="btn btn-outline-success btn-sm"
              @click="handleApprove(item)"
              title="Approuver (Marquer comme payé)"
            >
              <i class="fas fa-check"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-sm"
              @click="handleShowDetail(item)"
              title="Voir détails du crédit"
            >
              <i class="fas fa-eye"></i>
            </button>
            <!-- <button
              class="btn btn-outline-primary btn-sm"
              @click="handleEdit(item)"
              title="Modifier"
            >
              <i class="fas fa-edit"></i>
            </button> -->
            <!-- <button
              class="btn btn-outline-danger btn-sm"
              @click="handleDelete(item)"
              title="Supprimer"
            >
              <i class="fas fa-trash"></i>
            </button> -->
          </div>
        </template>
      </AdvancedTable>
    </div>

    <!-- Modal d'approbation avec preuve de paiement -->
    <div v-if="showApproveModal" class="modal-backdrop fade show"></div>
    <div
      v-if="showApproveModal"
      class="modal fade show"
      style="display: block"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Approuver le paiement</h5>
            <button
              type="button"
              class="btn-close"
              @click="showApproveModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedRemboursement" class="mb-3">
              <p>
                <strong>Membre:</strong>
                {{ selectedRemboursement.credit?.membre?.full_name }}
              </p>
              <p>
                <strong>Montant à payer:</strong>
                {{ selectedRemboursement.montant_prevu }} BIF
              </p>
              <p>
                <strong>N° Échéance:</strong>
                {{ selectedRemboursement.numero_echeance }}
              </p>
            </div>

            <div class="mb-3">
              <label for="preuve_paiement" class="form-label"
                >Preuve de paiement (Image ou PDF)
                <span class="text-danger">*</span></label
              >
              <input
                type="file"
                class="form-control"
                id="preuve_paiement"
                @change="handleFileChange"
                accept="image/*,.pdf"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showApproveModal = false"
            >
              Annuler
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="loading || !preuveFile"
              @click="confirmApprove"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              Confirmer le paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import router from "../../router";
import { useToast } from "vue-toastification";
import api from "../../services/api";
import AdvancedTable from "../../components/advancedTable/AdvancedTable.vue";

const store = useStore();
const toast = useToast();
const remboursements = ref([]);
const loading = ref(false);
const showApproveModal = ref(false);
const selectedRemboursement = ref(null);
const preuveFile = ref(null);

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
  { key: "credit.membre.full_name", label: "Membre", sortable: true },
  { key: "credit_id", label: "ID Crédit", sortable: true, filterable: true },
  {
    key: "numero_echeance",
    label: "N° échéance",
    sortable: true,
    filterable: true,
  },
  { key: "montant_prevu", label: "Prévu", sortable: true, filterable: true },
  { key: "montant_paye", label: "Payé", sortable: true, filterable: true },
  {
    key: "date_echeance",
    label: "Échéance",
    sortable: true,
    formatter: (v) => (v ? new Date(v).toLocaleDateString() : ""),
  },
  {
    key: "date_paiement",
    label: "Paiement",
    sortable: true,
    formatter: (v) => (v ? new Date(v).toLocaleDateString() : ""),
  },
  { key: "statut", label: "Statut", sortable: true, filterable: true },
  { key: "penalite", label: "Pénalité", sortable: true, filterable: true },
];

const fetchRemboursements = async () => {
  loading.value = true;
  try {
    const params = {
      page: queryParams.value.page,
      per_page: queryParams.value.per_page,
    };
    if (queryParams.value.search) params.search = queryParams.value.search;
    if (queryParams.value.sort_field) {
      params.sort_field = queryParams.value.sort_field;
      params.sort_order = queryParams.value.sort_order;
    }
    Object.entries(queryParams.value.filters).forEach(([k, v]) => {
      if (v) params[`filter[${k}]`] = v;
    });

    const res = await api.get("/remboursements", { params });
    if (res?.data) {
      console.log(res.data);
      remboursements.value = res.data || [];
      store.state.remboursements = res.data || [];
    } else if (res?.success) {
      remboursements.value = res.data || [];
      store.state.remboursements = res.data || [];
    } else {
      remboursements.value = [];
      store.state.remboursements = [];
    }
  } catch (e) {
    console.error("Error fetching remboursements:", e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = (term) => {
  queryParams.value.search = term;
  queryParams.value.page = 1;
  fetchRemboursements();
};
const handleSort = ({ field, order }) => {
  queryParams.value.sort_field = field;
  queryParams.value.sort_order = order;
  queryParams.value.page = 1;
  fetchRemboursements();
};
const handleFilter = (filters) => {
  queryParams.value.filters = filters;
  queryParams.value.page = 1;
  fetchRemboursements();
};
const handlePageChange = (page) => {
  queryParams.value.page = page;
  fetchRemboursements();
};
const handlePerPageChange = (per) => {
  queryParams.value.per_page = per;
  queryParams.value.page = 1;
  fetchRemboursements();
};

const handleEdit = (row) =>
  router.push({ name: "remboursementsEdit", params: { id: row.id } });

const handleShowDetail = (row) => {
  router.push({ name: "remboursementDetail", params: { id: row.credit_id } });
};
const handleApprove = (row) => {
  selectedRemboursement.value = row;
  preuveFile.value = null;
  showApproveModal.value = true;
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
    loading.value = true;
    const formData = new FormData();
    formData.append("preuve_paiement", preuveFile.value);
    // Optionally add other fields expected by the backend
    formData.append("montant_paye", selectedRemboursement.value.montant_prevu);

    await api.post(
      `/remboursements/${selectedRemboursement.value.id}/approve`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    toast.success("Échéance approuvée avec succès");
    showApproveModal.value = false;
    fetchRemboursements();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.message || "Erreur lors de l'approbation");
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (row) => {
  if (!confirm("Supprimer ce remboursement ?")) return;
  try {
    await api.delete(`/remboursements/${row.id}`);
    toast.success("Remboursement supprimé");
    fetchRemboursements();
  } catch (e) {
    console.error(e);
    toast.error("Erreur lors de la suppression");
  }
};

const tableData = computed(() => {
  return store.state.remboursements || [];
});

onMounted(fetchRemboursements);
</script>
