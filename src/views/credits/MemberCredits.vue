<template>
  <div class="">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Mes Crédits</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-success" @click="exporter('excel')" :disabled="exporting">
          <i class="bi bi-file-earmark-excel me-1"></i>Excel
        </button>
        <button class="btn btn-outline-danger" @click="exporter('pdf')" :disabled="exporting">
          <i class="bi bi-file-earmark-pdf me-1"></i>PDF
        </button>
        <router-link to="/credits/demande" class="btn btn-primary">
          <i class="fas fa-plus me-2"></i>Demander un crédit
        </router-link>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <!-- Date Search Filter -->
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="dateSearch" class="form-label"
              >Rechercher par date</label
            >
            <Datepicker
              id="dateSearch"
              v-model="dateSearch"
              :enable-time-picker="false"
              :auto-apply="true"
              @update:model-value="handleDateSearch"
            />
          </div>
        </div>

        <AdvancedTable
          :data="wrappedTableData"
          :columns="columns"
          :loading="loading"
          search-placeholder="Rechercher..."
          no-data-message="Aucun crédit trouvé"
          :show-filters="true"
          :has-actions="true"
          row-key="id"
          @show="handleShow"
          @search="handleSearch"
          @sort="handleSort"
          @page-change="handlePageChange"
          @per-page-change="handlePerPageChange"
        >
          <template #column-statut="{ value }">
            <span class="badge rounded-1" :class="getClassByStatut(value)">
              {{ getStatusLabel(value) }}
            </span>
          </template>

          <template #actions="{ item }">
            <button
              class="btn btn-outline-secondary btn-sm"
              @click="handleShow(item)"
              title="Voir détails"
            >
              <i class="fas fa-eye"></i>
            </button>
          </template>
        </AdvancedTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import api from "../../services/api";
import AdvancedTable from "../../components/advancedTable/AdvancedTable.vue";
import { exportExcel, exportPdf, formatMontant, formatDateExport, getMembreConnecte } from "../../utils/useExport";

const store = useStore();
const router = useRouter();
const loading = ref(false);
const dateSearch = ref("");

// Query parameters for API
const queryParams = ref({
  page: 1,
  per_page: 15,
  search: "",
  sort_field: "created_at",
  sort_order: "desc",
  date: "", // For date filtering
});

const columns = [
  { key: "id", label: "ID", sortable: true },
  {
    key: "montant_demande",
    label: "Montant Demandé",
    sortable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },
  {
    key: "montant_accorde",
    label: "Montant Accordé",
    sortable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },
  {
    key: "taux_interet",
    label: "Taux",
    sortable: true,
    formatter: (value) => value + " %",
  },
  {
    key: "duree_mois",
    label: "Durée",
    sortable: true,
    formatter: (value) => value + " mois",
  },
  {
    key: "montant_mensualite",
    label: "Mensualité",
    sortable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },
  {
    key: "statut",
    label: "Statut",
    sortable: true,
  },
  {
    key: "date_demande",
    label: "Date Demande",
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString(),
  },

  {
    key: "date_fin",
    label: "Date Fin",
    sortable: true,
    type: "date",
  },
];

const fetchCredits = async () => {
  loading.value = true;
  try {
    const params = {
      page: queryParams.value.page,
      per_page: queryParams.value.per_page,
      search: queryParams.value.search,
      sort_field: queryParams.value.sort_field,
      sort_order: queryParams.value.sort_order,
      date: queryParams.value.date,
    };

    const response = await api.get("/mescredits", { params });
    store.state.mescredits = response.data;
  } catch (error) {
    console.error("Error fetching credits:", error);
  } finally {
    loading.value = false;
  }
};

const getClassByStatut = (statut) => {
  switch (statut) {
    case "rejete":
      return "bg-danger";
    case "en_attente":
      return "bg-warning";
    case "en_cours":
      return "bg-info";
    case "approuve":
      return "bg-success";
    case "termine":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};

const getStatusLabel = (statut) => {
  switch (statut) {
    case "rejete":
      return "Rejeté";
    case "en_attente":
      return "En attente";
    case "en_cours":
      return "En cours";
    case "approuve":
      return "Approuvé";
    case "termine":
      return "Terminé";
    default:
      return statut;
  }
};

// Event Handlers
const handleSearch = (searchTerm) => {
  queryParams.value.search = searchTerm;
  queryParams.value.page = 1;
  fetchCredits();
};

const handleDateSearch = () => {
  queryParams.value.date = dateSearch.value;
  queryParams.value.page = 1;
  fetchCredits();
};

const handleSort = (sortData) => {
  queryParams.value.sort_field = sortData.field;
  queryParams.value.sort_order = sortData.order;
  fetchCredits();
};

const handlePageChange = (page) => {
  queryParams.value.page = page;
  fetchCredits();
};

const handlePerPageChange = (perPage) => {
  queryParams.value.per_page = perPage;
  queryParams.value.page = 1;
  fetchCredits();
};

const handleShow = (item) => {
  // Assuming there is a generic view or we can reuse ViewCredit if applicable,
  // or just show a modal. For now, let's navigate to a detail page if it exists,
  // or just log it. The user didn't specify a detail view for member credits specifically,
  // but we can reuse the admin one if accessible or create a new one.
  // For now, let's assume we can use the same route or a similar one.
  // Since the router has /credits/:id for ViewCredit, we might need to check permissions there.
  // But let's try to navigate to it.
  router.push({ name: "creditsShow", params: { id: item.id } });
};

const exporting = ref(false);

const exporter = async (format) => {
  exporting.value = true;
  try {
    const response = await api.get("/mescredits", { params: { per_page: 1000 } });
    const rows = response.data?.data || [];
    const montant = (key) => ({ value: (c) => parseFloat(c[key]) || 0, pdf: (c) => formatMontant(c[key]) });
    const columns = [
      { label: "N°", value: (c) => c.id },
      { label: "Date demande", value: (c) => formatDateExport(c.date_demande) },
      { label: "Montant demandé", ...montant("montant_demande") },
      { label: "Montant accordé", ...montant("montant_accorde") },
      { label: "Taux (%)", value: (c) => parseFloat(c.taux_interet) || 0 },
      { label: "Durée (mois)", value: (c) => c.duree_mois },
      { label: "Mensualité", ...montant("montant_mensualite") },
      { label: "Restant dû", ...montant("montant_restant") },
      { label: "Statut", value: (c) => getStatusLabel(c.statut) },
    ];
    if (format === "excel") {
      exportExcel({ fileName: "mes_credits", sheetName: "Crédits", columns, rows });
    } else {
      const restant = rows.reduce((t, c) => t + (parseFloat(c.montant_restant) || 0), 0);
      exportPdf({
        fileName: "mes_credits",
        title: "Mes crédits",
        membre: await getMembreConnecte(),
        summary: [["Nombre de crédits", rows.length], ["Total restant dû", formatMontant(restant)]],
        tables: [{ columns, rows }],
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'export des crédits:", error);
  } finally {
    exporting.value = false;
  }
};

// Computed Data for AdvancedTable
const wrappedTableData = computed(() => {
  const creditsData = store.state.mescredits || {};
  return {
    data: creditsData.data || [],
    current_page: creditsData.current_page || 1,
    last_page: creditsData.last_page || 1,
    per_page: creditsData.per_page || 15,
    total: creditsData.total || 0,
    from: creditsData.from || 0,
    to: creditsData.to || 0,
  };
});

onMounted(() => {
  fetchCredits();
});
</script>
