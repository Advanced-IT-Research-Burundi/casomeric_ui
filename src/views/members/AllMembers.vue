<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white py-3">
        <div
          class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3"
        >
          <h5 class="mb-0 fw-bold text-primary">
            <i class="bi bi-people-fill me-2"></i>Liste des Membres
          </h5>
          <div class="d-flex gap-2 w-100 w-md-auto">
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control border-start-0 ps-0"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="Rechercher..."
              />
            </div>
            <button
              class="btn btn-primary text-nowrap"
              @click="openModal('create')"
            >
              <i class="bi bi-plus-lg me-1"></i> Nouveau
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th
                  class="ps-4 py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7"
                >
                  Matricule
                </th>
                <th
                  class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7"
                >
                  Nom Complet
                </th>
                <th
                  class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7"
                >
                  Contact
                </th>
                <th
                  class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7"
                >
                  Catégorie
                </th>
                <th
                  class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7 text-center"
                >
                  Statut
                </th>
                <th
                  class="py-3 text-end pe-4 text-uppercase text-xs font-weight-bolder opacity-7"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody v-if="membersData.length > 0">
              <tr v-for="member in membersData" :key="member.id">
                <td class="ps-4">
                  <span class="badge bg-light text-dark border">{{
                    member.matricule
                  }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div
                      class="avatar-circle me-2 bg-primary text-white d-flex justify-content-center align-items-center rounded-circle small-avatar"
                    >
                      {{ getInitials(member) }}
                    </div>
                    <div>
                      <h6 class="mb-0 text-sm">{{ member.full_name }}</h6>
                      <small class="text-xs text-muted"
                        >Inscrit le
                        {{ formatDate(member.date_adhesion) }}</small
                      >
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-xs mb-1"
                      ><i class="bi bi-envelope me-1 text-muted"></i>
                      {{ member.email }}</span
                    >
                    <span class="text-xs"
                      ><i class="bi bi-telephone me-1 text-muted"></i>
                      {{ member.telephone }}</span
                    >
                  </div>
                </td>
                <td>
                  <span class="text-sm fw-medium text-dark">{{
                    member.categorie?.nom || member.categorie_id
                  }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="getStatusBadge(member.statut)">
                    {{ formatStatus(member.statut) }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-light text-primary"
                      @click="routeToMember(member)"
                      title="Voir"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-light text-info"
                      @click="editMember(member)"
                      title="Modifier"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-light text-danger"
                      @click="confirmDelete(member)"
                      title="Supprimer"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="loading">
              <tr>
                <td colspan="6" class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-people fs-1 d-block mb-2"></i>
                  Aucun membre trouvé.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div
        class="card-footer bg-white py-3 border-top-0"
        v-if="pagination.total > 0"
      >
        <div
          class="d-flex justify-content-between align-items-center flex-wrap gap-2"
        >
          <small class="text-muted">
            Affichage de {{ pagination.from || 0 }} à
            {{ pagination.to || 0 }} sur {{ pagination.total }} résultats
          </small>
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0">
              <li
                class="page-item"
                :class="{ disabled: !pagination.prev_page_url }"
              >
                <button
                  class="page-link"
                  @click="fetchMembers(pagination.current_page - 1)"
                  :disabled="!pagination.prev_page_url"
                >
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>

              <li
                v-for="(page, index) in getPageNumbers"
                :key="index"
                class="page-item"
                :class="{
                  active: page === pagination.current_page,
                  disabled: page === '...',
                }"
              >
                <button
                  v-if="page !== '...'"
                  class="page-link"
                  @click="fetchMembers(page)"
                  :disabled="page === pagination.current_page"
                >
                  {{ page }}
                </button>
                <span v-else class="page-link">{{ page }}</span>
              </li>

              <li
                class="page-item"
                :class="{ disabled: !pagination.next_page_url }"
              >
                <button
                  class="page-link"
                  @click="fetchMembers(pagination.current_page + 1)"
                  :disabled="!pagination.next_page_url"
                >
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modals -->

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-backdrop fade show"></div>
    <div
      v-if="showViewModal"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Détails du membre</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body" v-if="selectedMember">
            <div class="text-center mb-4">
              <div
                class="avatar-xl bg-primary text-white mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 display-5"
              >
                {{ getInitials(selectedMember) }}
              </div>
              <h4>{{ selectedMember.full_name }}</h4>
              <p class="text-muted">{{ selectedMember.matricule }}</p>
              <span
                class="badge"
                :class="getStatusBadge(selectedMember.statut)"
                >{{ formatStatus(selectedMember.statut) }}</span
              >
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between px-0">
                <span class="text-muted">Email</span>
                <span class="fw-medium">{{ selectedMember.email }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between px-0">
                <span class="text-muted">Téléphone</span>
                <span class="fw-medium">{{ selectedMember.telephone }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between px-0">
                <span class="text-muted">Catégorie</span>
                <span class="fw-medium">{{
                  selectedMember.categorie?.nom || "-"
                }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between px-0">
                <span class="text-muted">Date d'adhésion</span>
                <span class="fw-medium">{{
                  formatDate(selectedMember.date_adhesion)
                }}</span>
              </li>
            </ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Fermer
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="
                openModal('edit', selectedMember);
                showViewModal = false;
              "
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div v-if="showFormModal" class="modal-backdrop fade show"></div>
    <div
      v-if="showFormModal"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      @click.self="closeModal"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditing ? "Modifier le membre" : "Nouveau membre" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nom</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="formData.nom"
                    required
                    :disabled="isEditing && !isAdmin"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Prénom</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="formData.prenom"
                    required
                    :disabled="isEditing && !isAdmin"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    v-model="formData.email"
                    required
                    :disabled="isEditing && !isAdmin"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Téléphone</label>
                  <input
                    type="tel"
                    class="form-control"
                    v-model="formData.telephone"
                    required
                    :disabled="isEditing && !isAdmin"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Matricule</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="formData.matricule"
                    :disabled="isEditing"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Date d'adhésion</label>
                  <Datepicker
                    v-model="formData.date_adhesion"
                    :enable-time-picker="false"
                    :auto-apply="true"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Catégorie</label>
                  <select
                    class="form-select"
                    v-model="formData.categorie_id"
                    required
                  >
                    <option value="" disabled>Sélectionner...</option>
                    <option
                      v-for="cat in categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.nom }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Statut</label>
                  <select
                    class="form-select"
                    v-model="formData.statut"
                    required
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
                <div v-if="!isEditing && isAdmin" class="col-12">
                  <div class="form-check">
                    <input
                      id="create-user-account"
                      v-model="formData.create_user"
                      class="form-check-input"
                      type="checkbox"
                    />
                    <label class="form-check-label" for="create-user-account">
                      Créer également un compte utilisateur
                    </label>
                    <div class="form-text">
                      Un lien de définition du mot de passe sera envoyé à
                      l’adresse e-mail du membre.
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 text-end">
                <button
                  type="button"
                  class="btn btn-secondary me-2"
                  @click="closeModal"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="formLoading"
                >
                  <span
                    v-if="formLoading"
                    class="spinner-border spinner-border-sm me-1"
                  ></span>
                  {{ isEditing ? "Mettre à jour" : "Créer" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>
    <div v-if="showDeleteModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">Confirmer la suppression</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Êtes-vous sûr de vouloir supprimer le membre
              <strong>{{ selectedMember?.full_name }}</strong> ?
            </p>
            <p class="text-danger small mb-0">
              <i class="bi bi-exclamation-triangle me-1"></i> Cette action est
              irréversible.
            </p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" @click="closeModal">
              Annuler
            </button>
            <button type="button" class="btn btn-danger" @click="deleteMember">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from "vue";
import { useStore } from "vuex";
import api from "../../services/api";
import _ from "lodash";
import { useToast } from "vue-toastification";
import useAuthStore from "../../stores/auth.js";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.hasAnyRole("admin"));
const store = useStore();
const toast = useToast();

const loading = ref(false);
const formLoading = ref(false);
const searchQuery = ref("");
const categories = ref([]);

// Modal control
const showViewModal = ref(false);
const showFormModal = ref(false);
const showDeleteModal = ref(false);
const selectedMember = ref(null);
const isEditing = ref(false);

const router = useRouter();

const formData = reactive({
  id: null,
  matricule: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  categorie_id: "",
  statut: "actif",
  date_adhesion: "",
  create_user: false,
});

// Initial Data Fetch
onMounted(async () => {
  await fetchMembers();
  // Try fetching categories for the dropdown.
  try {
    const resp = await api.get("/categories");
    // Adjust structure based on API response
    categories.value = resp.data || resp;
  } catch (e) {
    console.warn("Could not fetch categories", e);
    // Fallback mock categories if needed
    categories.value = [
      { id: 1, nom: "Cadre" },
      { id: 2, nom: "Collaborateur" },
      { id: 3, nom: "Chauffeur/Planton" },
      { id: 4, nom: "Service Externe" },
    ];
  }
});

const fetchMembers = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const response = await api.get("/membres", { params });
    store.state.data.membres = response.data?.data ? response.data : response;
  } catch (error) {
    console.error("Error fetching members:", error);
    toast.error("Erreur lors du chargement des membres.");
  } finally {
    loading.value = false;
  }
};

// Debounced search
const handleSearch = _.debounce(() => {
  fetchMembers(1);
}, 500);

const membersData = computed(() => store.state.data?.membres?.data || []);

const pagination = computed(() => {
  const paginationData = store.state.data?.membres || {};
  return {
    current_page: paginationData.current_page || 1,
    last_page: paginationData.last_page || 1,
    per_page: paginationData.per_page || 15,
    total: paginationData.total || 0,
    from: paginationData.from || 0,
    to: paginationData.to || 0,
    next_page_url: paginationData.next_page_url || null,
    prev_page_url: paginationData.prev_page_url || null,
  };
});

const getPageNumbers = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages = [];
  const maxVisible = 5;

  if (last <= maxVisible) {
    // Show all pages if 5 or fewer
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    // Show current page and surrounding pages
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < last) {
      if (end < last - 1) pages.push("...");
      pages.push(last);
    }
  }

  return pages;
});

// Actions

const routeToMember = (member) => {
  if (!member || !member.id) return;
  router.push(`/members/${member.id}`);
};

const editMember = (member) => {
  router.push(`/members/${member.id}/edit`);
};

const openModal = (type, member = null) => {
  selectedMember.value = member;

  if (type === "view") {
    showViewModal.value = true;
  } else if (type === "create") {
    resetForm();
    isEditing.value = false;
    showFormModal.value = true;
  } else if (type === "edit") {
    fillForm(member);
    isEditing.value = true;
    showFormModal.value = true;
  } else if (type === "delete") {
    showDeleteModal.value = true;
  }
};

const confirmDelete = (member) => {
  selectedMember.value = member;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showViewModal.value = false;
  showFormModal.value = false;
  showDeleteModal.value = false;
  selectedMember.value = null;
};

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    categorie_id: "",
    statut: "actif",
    date_adhesion: new Date().toISOString().slice(0, 10),
    create_user: false,
  });
};

const fillForm = (member) => {
  Object.assign(formData, {
    id: member.id,
    matricule: member.matricule,
    nom: member.nom,
    prenom: member.prenom,
    email: member.email,
    telephone: member.telephone,
    categorie_id: member.categorie_id,
    statut: member.statut,
    create_user: false,
    // Optional chaining in case date is null
    date_adhesion: member.date_adhesion
      ? member.date_adhesion.slice(0, 10)
      : "",
  });
};

const submitForm = async () => {
  formLoading.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/membres/${formData.id}`, formData);
      toast.success("Membre mis à jour avec succès");
    } else {
      const response = await api.post("/membres", formData);
      toast.success(response?.message || "Membre créé avec succès");
    }
    await fetchMembers(pagination.value.current_page);
    closeModal();
  } catch (error) {
    console.error(error);
    toast.error(
      error.response?.data?.message || "Une erreur est survenue."
    );
  } finally {
    formLoading.value = false;
  }
};

const deleteMember = async () => {
  try {
    await api.delete(`/membres/${selectedMember.value.id}`);
    toast.success("Membre supprimé avec succès");
    // Check if page becomes empty
    if (membersData.value.length === 1 && pagination.value.current_page > 1) {
      await fetchMembers(pagination.value.current_page - 1);
    } else {
      await fetchMembers(pagination.value.current_page);
    }
    closeModal();
  } catch (error) {
    console.error(error);
    toast.error(
      "Impossible de supprimer ce membre à cause des données relier avec lui",
    );
  }
};

// Utilities
const getInitials = (member) => {
  if (!member) return "";
  const n = member.nom ? member.nom.charAt(0) : "";
  const p = member.prenom ? member.prenom.charAt(0) : "";
  return (n + p).toUpperCase();
};

const formatStatus = (status) => {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusBadge = (status) => {
  switch (status) {
    case "actif":
      return "bg-success-subtle text-success border border-success";
    case "inactif":
      return "bg-danger-subtle text-danger border border-danger";
    case "suspendu":
      return "bg-warning-subtle text-warning border border-warning";
    default:
      return "bg-secondary";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  font-weight: 600;
}
.small-avatar {
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
}
.avatar-xl {
  width: 80px;
  height: 80px;
  font-size: 2rem;
}
.text-xs {
  font-size: 0.75rem !important;
}
.bg-success-subtle {
  background-color: #d1e7dd !important;
}
.bg-danger-subtle {
  background-color: #f8d7da !important;
}
.bg-warning-subtle {
  background-color: #fff3cd !important;
}
</style>
