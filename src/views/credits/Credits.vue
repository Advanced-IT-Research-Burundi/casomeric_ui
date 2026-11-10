<template>
  <div class="">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Gestion des Crédits</h2>

      <div class="d-flex gap-2">
        <router-link to="/remboursements/mensuel" class="btn btn-primary">
          <i class="fas fa-calendar me-2"></i>Remboursements mensuelles
        </router-link>
      </div>

      <router-link
        :to="
          isAdmin || isManager || isResponsable
            ? '/credits/add'
            : '/credits/demande'
        "
        class="btn btn-primary"
      >
        <i class="fas fa-plus me-2"></i>Demande de crédit
      </router-link>

      <router-link to="/remboursements/add" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i>Remboursement manuel
      </router-link>
    </div>

    <!-- Filters Section -->
    <div class="row g-3 mb-3">
      <div class="col-md-3 col-sm-6">
        <label class="form-label">Statut</label>
        <select
          v-model="filters.statut"
          class="form-select"
          @change="handleFilterChange"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvé</option>
          <option value="rejete">Rejeté</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
      </div>
      <div class="col-md-3 col-sm-6">
        <label class="form-label">Date Demande (Du)</label>
        <Datepicker
          v-model="filters.date_demande_start"
          :enable-time-picker="false"
          :auto-apply="true"
        />
      </div>
      <div class="col-md-3 col-sm-6">
        <label class="form-label">Date Demande (Au)</label>
        <Datepicker
          v-model="filters.date_demande_end"
          :enable-time-picker="false"
          :auto-apply="true"
        />
      </div>
      <div class="col-md-3 col-sm-6">
        <label class="form-label">Date Fin (Après)</label>
        <Datepicker
          v-model="filters.date_fin"
          :enable-time-picker="false"
          :auto-apply="true"
        />
      </div>
    </div>

    <BaseModal v-show="modalOpened" @close="modalOpened = false">
      <div class="modal-content">
        <span class="close" @click="modalOpened = false">&times;</span>
        <p>Modal content...</p>
      </div>
    </BaseModal>

    <div class="card">
      <AdvancedTable
        :data="wrappedTableData"
        :columns="columns"
        :loading="loading"
        search-placeholder="Rechercher des crédits..."
        no-data-message="Aucun crédit trouvé"
        :show-filters="true"
        :has-actions="true"
        row-key="id"
        details-endpoint="credits"
        details-title="Détails du Crédit"
        @search="handleSearch"
        @sort="handleSort"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #column-statut="{ value, item }">
          <span class="badge rounded-1" :class="getClassByStatut(value)">
            {{
              isWaitingResponsable(item)
                ? "Attente responsable"
                : isInRepayment(item) && value === "en_cours"
                  ? "En remboursement"
                  : getStatusLabel(value)
            }}
          </span>
        </template>

        <template #actions="{ item }">
          <div class="btn-group">
            <button
              class="btn btn-outline-secondary btn-sm"
              @click="handleShow(item)"
              title="Voir détails"
            >
              <i class="fas fa-eye"></i>
            </button>

            <!-- Repayment actions: only once the credit is granted -->
            <button
              v-if="canSeeRepayments(item)"
              class="btn btn-outline-info btn-sm"
              @click="handleRemboursements(item)"
              title="Remboursements"
            >
              <i class="fas fa-history"></i>
            </button>

            <button
              v-if="canRepayManually(item)"
              class="btn btn-outline-primary btn-sm"
              @click="handleManualRemboursement(item)"
              title="Remboursement Manuel"
            >
              <i class="fas fa-hand-holding-usd"></i>
            </button>

            <!-- Decision: gestionnaire on "en attente", responsable/admin also on "en cours" (2nd step) -->
            <template v-if="canDecide(item)">
              <button
                class="btn btn-success btn-sm"
                @click="handleAction(item, 'approuve')"
                :title="isWaitingResponsable(item) ? 'Approbation finale' : 'Accepter'"
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

            <!-- Edit / delete: only while nothing has been decided -->
            <template v-if="canEdit(item)">
              <button
                class="btn btn-warning btn-sm"
                @click="handleModifier(item)"
                title="Modifier"
              >
                <i class="fas fa-edit"></i>
              </button>

              <button
                class="btn btn-outline-danger btn-sm"
                @click="handleDelete(item)"
                title="Supprimer"
              >
                <i class="fas fa-trash"></i>
              </button>
            </template>
          </div>
        </template>
      </AdvancedTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import api from "../../services/api";
import AdvancedTable from "../../components/advancedTable/AdvancedTable.vue";
import router from "../../router";
import useAuthStore from "../../stores/auth";
import { useToast } from "vue-toastification";
import { value } from "@primeuix/themes/aura/knob";
import BaseModal from "../../components/common/BaseModal.vue";

const auth = useAuthStore();
// Role names must match the API: admin, gestionnaire, responsable, membre.
const isAdmin = auth.hasAnyRole("admin");
const isManager = auth.hasAnyRole("gestionnaire");
const isResponsable = auth.hasAnyRole("responsable");
const isMember = auth.hasAnyRole("membre");

/*
 * Which actions a credit row shows, step by step:
 *  en_attente                      -> view, approve/reject, edit, delete
 *  en_cours without approval date  -> waiting for the responsable: view (+ approve/reject for responsable/admin)
 *  approuve, or en_cours with date -> being repaid: view, repayments, manual repayment
 *  termine                         -> view, repayments
 *  rejete                          -> view
 * Note: the API uses "en_cours" both for "sent to the responsable" and "being repaid";
 * date_approbation tells the two apart.
 */
const isWaitingResponsable = (credit) =>
  credit.statut === "en_cours" && !credit.date_approbation;

const isInRepayment = (credit) =>
  credit.statut === "approuve" ||
  (credit.statut === "en_cours" && !!credit.date_approbation);

const canDecide = (credit) => {
  if (credit.statut === "en_attente") return isAdmin || isManager || isResponsable;
  if (isWaitingResponsable(credit)) return isAdmin || isResponsable;
  return false;
};

const canEdit = (credit) =>
  credit.statut === "en_attente" && (isAdmin || isManager || isResponsable);

const canSeeRepayments = (credit) =>
  isInRepayment(credit) || credit.statut === "termine";

const canRepayManually = (credit) =>
  isInRepayment(credit) && (isAdmin || isManager || isResponsable);
const store = useStore();
const toast = useToast();
const loading = ref(false);
const modalOpened = ref(true);

// Filters
const filters = ref({
  statut: "",
  date_demande_start: "",
  date_demande_end: "",
  date_fin: "",
});

// Query parameters for API
const queryParams = ref({
  page: 1,
  per_page: 15,
  search: "",
  sort_field: "created_at",
  sort_order: "desc",
});

const columns = [
  { key: "id", label: "ID", sortable: true },
  {
    key: "membre.full_name",
    label: "Membre",
    sortable: true,
    formatter: (value) => trimName(value),
  },
  //{
  //  key: "montant_demande",
  //  label: "Montant Demandé",
  //  sortable: true,
  //  formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  //},
  {
    key: "montant_accorde",
    label: "Montant Accordé",
    sortable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },

  {
    key: "montant_total_rembourser",
    label: "Total à rembourser",
    sortable: true,
    formatter: (value) => parseFloat(value).toLocaleString() + " FBU",
  },

  {
    key: "montant_restant",
    label: "Montant Restant",
    sortable: true,
    // Arrondi au millier supérieur ; une valeur vide ou invalide s'affiche "0 FBU" au lieu de "NaN FBU".
    formatter: (value) => {
      const n = parseFloat(value);
      return (Number.isFinite(n) ? Math.ceil(n / 1000) * 1000 : 0) + " FBU";
    },
  },
  {
    key: "date_demande",
    label: "Date Demande",
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString(),
  },

  {
    key: "date_fin",
    label: "Date de Fin",
    sortable: true,
    type: "date",
  },
  {
    key: "statut",
    label: "Statut",
    sortable: true,
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
      ...filters.value, // Spread filters into params
    };

    const response = await api.get("/credits", { params });

    // Handle the response structure provided by user
    // { success: true, data: { current_page: 1, data: [...] } }
    if (response.data && response.data.data) {
      store.state.credits = response.data;
    } else {
      // Fallback if structure is different (e.g. direct pagination object)
      store.state.credits = response.data || {};
    }
  } catch (error) {
    console.error("Error fetching credits:", error);
    toast.error("Erreur lors du chargement des crédits.");
  } finally {
    loading.value = false;
  }
};

function trimName(value, maxLength = 15) {
  if (!value) return ""; // Handle empty or null value

  const trimmedValue = value.trim();
  if (trimmedValue.length <= maxLength) {
    return trimmedValue; // No need to trim further if it's already short
  }

  // Split the string by spaces and rebuild it until it reaches maxLength
  const words = trimmedValue.split(" ");
  let result = "";

  for (let word of words) {
    if ((result + word).length + 1 <= maxLength) {
      result += (result ? " " : "") + word; // Add word with space
    } else {
      break; // Stop if adding this word exceeds maxLength
    }
  }

  return result; // Return the trimmed value without cutting words in half
}

const handleModifier = async (item) => {
  router.push(`/credits/${item.id}/edit`);
};

const handleAction = async (item, action) => {
  if (
    !confirm(
      `Êtes-vous sûr de vouloir ${
        action === "approuve" ? "accepter" : "refuser"
      } ce crédit ?`,
    )
  ) {
    return;
  }

  try {
    if (action === "approuve") {
      await api.post(`/credits/approuve/${item.id}`);
    } else if (action === "rejete") {
      const comment = prompt("Veuillez saisir le motif du rejet");
      if (!comment) {
        toast.warning("Veuillez saisir un motif de rejet.");
        return;
      }
      await api.post(`/credits/rejete/${item.id}`, { comment });
    }

    toast.success(
      `Crédit ${action === "approuve" ? "accepté" : "refusé"} avec succès.`,
    );
    fetchCredits();
  } catch (error) {
    console.error(`Error ${action} credit:`, error);
    toast.error(`Erreur lors de l'action sur le crédit.`);
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
const handleFilterChange = () => {
  queryParams.value.page = 1;
  fetchCredits();
};

const handleSearch = (searchTerm) => {
  queryParams.value.search = searchTerm;
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
  router.push({ name: "creditsShow", params: { id: item.id } });
};

const handleRemboursements = (item) => {
  router.push({ name: "remboursementDetail", params: { id: item.id } });
};

const handleManualRemboursement = (item) => {
  router.push({ path: "/remboursements/add", query: { credit_id: item.id } });
};

// Computed Data for AdvancedTable
const wrappedTableData = computed(() => {
  const creditsData = store.state.credits || {};
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
