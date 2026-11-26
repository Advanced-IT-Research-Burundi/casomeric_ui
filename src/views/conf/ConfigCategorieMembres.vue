<template>
  <div class="container-fluid py-4 px-4">
    <div
      class="d-flex justify-content-between align-items-center mb-4 animate-fade-in"
    >
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1">
            <li class="breadcrumb-item">
              <router-link :to="{ name: 'configHub' }"
                >Configuration</router-link
              >
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              Catégories Membres
            </li>
          </ol>
        </nav>
        <h2 class="fw-bold text-dark">Catégories de Membres</h2>
      </div>
      <div class="d-flex gap-2">
        <router-link
          :to="{ name: 'configHub' }"
          class="btn btn-outline-secondary rounded-pill px-4"
        >
          <i class="bi bi-arrow-left me-2"></i>Retour
        </router-link>
        <button class="btn btn-success rounded-pill px-4" @click="openModal()">
          <i class="bi bi-plus-lg me-2"></i>Nouvelle Catégorie
        </button>
      </div>
    </div>

    <div class="card border-0 shadow-sm custom-card animate-slide-up">
      <div class="card-body p-0">
        <AdvancedTable
          :data="tableData"
          :columns="columns"
          :loading="loading"
          search-placeholder="Rechercher une catégorie..."
          no-data-message="Aucune catégorie trouvée"
          :show-filters="false"
          :has-actions="true"
          row-key="id"
          @edit="openModal"
          @delete="removeConfig"
        >
          <template #column-nom="{ value }">
            <span class="fw-bold text-dark">{{ value }}</span>
          </template>

          <template #column-montant_cotisation="{ item }">
            <div>
              <span class="fw-bold text-success">{{ formatAmount(item.montant_cotisation) }} {{ item.devise }}</span>
              <small v-if="item.frequence_paiement === 'semestriel'" class="d-block text-muted">
                {{ formatAmount(item.montant_cotisation * 6) }} {{ item.devise }} / semestre
              </small>
            </div>
          </template>

          <template #column-frequence_paiement="{ value }">
            <span
              class="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2"
            >
              {{ value === "mensuel" ? "Mensuel" : "Semestriel" }}
            </span>
          </template>

          <template #actions="{ item }">
            <div
              class="btn-group shadow-sm rounded-pill overflow-hidden border"
            >
              <button
                class="btn btn-white btn-sm px-3 hover-primary"
                @click="openModal(item)"
                title="Modifier"
              >
                <i class="bi bi-pencil-square text-primary"></i>
              </button>
              <button
                class="btn btn-white btn-sm px-3 hover-danger border-start"
                @click="removeConfig(item)"
                title="Supprimer"
              >
                <i class="bi bi-trash3 text-danger"></i>
              </button>
            </div>
          </template>
        </AdvancedTable>
      </div>
    </div>

    <!-- Modal -->
    <div
      class="modal fade custom-modal"
      id="configModal"
      tabindex="-1"
      aria-hidden="true"
      ref="modalEl"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 pb-0 pe-4 pt-4">
            <h4 class="modal-title fw-bold">
              {{
                editing.id
                  ? "Modifier la catégorie"
                  : "Nouvelle catégorie de membre"
              }}
            </h4>
            <button
              type="button"
              class="btn-close shadow-none"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form @submit.prevent="saveConfig">
            <div class="modal-body p-4">
              <div class="mb-4">
                <label
                  class="form-label fw-bold small text-uppercase text-muted"
                  >Nom de la Catégorie</label
                >
                <input
                  v-model="editing.nom"
                  type="text"
                  class="form-control border-0 bg-light px-3 py-2"
                  placeholder="ex: Cadre A1"
                  required
                />
              </div>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label
                    class="form-label fw-bold small text-uppercase text-muted"
                    >Cotisation mensuelle de référence</label
                  >
                  <div class="input-group">
                    <input
                      v-model="editing.montant_cotisation"
                      type="number"
                      class="form-control border-0 bg-light px-3 py-2"
                      required
                    />
                  </div>
                  <small v-if="editing.frequence_paiement === 'semestriel'" class="form-text text-muted">
                    Montant encaissé par semestre : {{ formatAmount(editing.montant_cotisation * 6) }} {{ editing.devise }}.
                  </small>
                </div>
                <div class="col-md-6">
                  <label
                    class="form-label fw-bold small text-uppercase text-muted"
                    >Devise</label
                  >
                  <select
                    v-model="editing.devise"
                    class="form-select border-0 bg-light px-3 py-2"
                    required
                  >
                    <option value="FBU">FBU</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div class="mb-4">
                <label
                  class="form-label fw-bold small text-uppercase text-muted"
                  >Fréquence de paiement</label
                >
                <select
                  v-model="editing.frequence_paiement"
                  class="form-select border-0 bg-light px-3 py-2"
                  required
                >
                  <option value="mensuel">Mensuel</option>
                  <option value="semestriel">Semestriel</option>
                </select>
              </div>

              <div class="mb-3">
                <label
                  class="form-label fw-bold small text-uppercase text-muted"
                  >Description</label
                >
                <textarea
                  v-model="editing.description"
                  class="form-control border-0 bg-light px-3 py-2"
                  rows="3"
                  placeholder="Informations complémentaires..."
                ></textarea>
              </div>

              <div
                v-if="modalError"
                class="alert alert-danger-custom d-flex align-items-center mb-0 mt-3 border-0"
              >
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{{ modalError }}</div>
              </div>
            </div>

            <div class="modal-footer border-0 p-4 pt-0">
              <button
                type="button"
                class="btn btn-light rounded-pill px-4 fw-semibold"
                data-bs-dismiss="modal"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="btn btn-success rounded-pill px-4 fw-bold"
              >
                {{ editing.id ? "Enregistrer" : "Créer" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../../services/api";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import AdvancedTable from "../../components/advancedTable/AdvancedTable.vue";
import { useToast } from "vue-toastification";

const toast = useToast();
const configs = ref([]);
const loading = ref(false);
const error = ref("");
const modalError = ref("");
const modalEl = ref(null);
let modalInstance = null;

const columns = [
  { key: "nom", label: "NOM", sortable: true },
  { key: "montant_cotisation", label: "COTISATION", sortable: true },
  { key: "frequence_paiement", label: "FRÉQUENCE", sortable: true },
  { key: "description", label: "DESCRIPTION", sortable: false },
];

const tableData = computed(() => {
  return {
    data: configs.value,
    total: configs.value.length,
    per_page: 999,
    current_page: 1,
    last_page: 1,
  };
});

const editing = ref({
  id: null,
  nom: "",
  montant_cotisation: 0,
  devise: "FBU",
  frequence_paiement: "mensuel",
  description: "",
});

onMounted(() => {
  fetchConfigs();
});

async function fetchConfigs() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get("/categorie-membres");
    configs.value = res.data ?? [];
  } catch (err) {
    console.error("fetchConfigs error", err);
    error.value = "Impossible de charger les catégories.";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

function openModal(cfg = null) {
  modalError.value = "";
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalEl.value);
  }

  if (cfg) {
    editing.value = {
      id: cfg.id,
      nom: cfg.nom ?? "",
      montant_cotisation: cfg.montant_cotisation ?? 0,
      devise: cfg.devise ?? "FBU",
      frequence_paiement: cfg.frequence_paiement ?? "mensuel",
      description: cfg.description ?? "",
    };
  } else {
    editing.value = {
      id: null,
      nom: "",
      montant_cotisation: 0,
      devise: "FBU",
      frequence_paiement: "mensuel",
      description: "",
    };
  }
  modalInstance.show();
}

async function saveConfig() {
  modalError.value = "";
  const payload = { ...editing.value };
  try {
    if (editing.value.id) {
      await api.put(`/categorie-membres/${editing.value.id}`, payload);
      toast.success("Catégorie mise à jour");
    } else {
      await api.post("/categorie-membres", payload);
      toast.success("Catégorie créée avec succès");
    }
    await fetchConfigs();
    modalInstance.hide();
  } catch (err) {
    console.error("saveConfig error", err);
    modalError.value =
      err?.response?.data?.message || "Erreur lors de l'enregistrement.";
  }
}

async function removeConfig(cfg) {
  if (!confirm(`Confirmer la suppression de "${cfg.nom}" ?`)) return;
  try {
    if (cfg.id) {
      await api.delete(`/categorie-membres/${cfg.id}`);
      toast.success("Catégorie supprimée");
      configs.value = configs.value.filter((c) => c.id !== cfg.id);
    }
  } catch (err) {
    console.error("removeConfig error", err);
    toast.error("Erreur lors de la suppression.");
  }
}

const formatAmount = (val) => {
  return new Intl.NumberFormat("fr-BE").format(val);
};
</script>

<style scoped>
.custom-card {
  border-radius: 20px;
  overflow: hidden;
}
.custom-modal .modal-content {
  border-radius: 24px;
}
.alert-danger-custom {
  background-color: #fff5f5;
  color: #e53e3e;
  border-radius: 12px;
}
.hover-primary:hover {
  background-color: #f0f7ff !important;
}
.hover-danger:hover {
  background-color: #fff5f5 !important;
}
.btn-white {
  background-color: white;
  border: none;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}
.breadcrumb-item a {
  text-decoration: none;
  font-weight: 600;
  color: #6c757d;
}
.breadcrumb-item.active {
  font-weight: 600;
}
</style>
