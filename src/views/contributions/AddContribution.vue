<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Nouvelle Cotisation</h2>
      <router-link to="/contributions" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour à la liste
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <div v-if="currentStep === 1" class="row g-3">
          <div class="col-md-12">
            <div class="input-group">
              <span class="input-group-text"
                ><i class="fas fa-search"></i
              ></span>
              <input
                type="search"
                class="form-control py-2"
                placeholder="Rechercher un membre (au moins 2 caractères)"
                aria-label="Membre"
                v-model="searchMember"
                @input="onSearchInput"
              />
            </div>

            <div v-if="loadingMembers" class="form-text mt-2">
              <i class="fas fa-spinner fa-spin me-1"></i>Chargement des
              membres...
            </div>

            <ul
              v-if="filteredMembers.length > 0"
              class="list-group mt-2"
              style="max-height: 240px; overflow-y: auto"
            >
              <li
                v-for="member in filteredMembers"
                :key="member.id"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                :class="{ active: formData.membre_id === member.id }"
                role="button"
                @click="selectMember(member)"
              >
                <span>
                  Nom :<strong>{{ member.full_name }}</strong> | Matricule :
                  <strong>{{ member.matricule }}</strong> | Téléphone :
                  <strong>{{ member.telephone }}</strong> | Catégorie :
                  <strong> {{ member.categorie_nom }}</strong>
                </span>
                <i
                  v-if="formData.membre_id === member.id"
                  class="fas fa-check"
                ></i>
              </li>
            </ul>

            <div
              v-if="
                !loadingMembers &&
                searchMember &&
                searchMember.trim().length >= 2 &&
                filteredMembers.length === 0
              "
              class="form-text text-muted mt-2"
            >
              Aucun membre trouvé pour "**{{ searchMember }}**"
            </div>

            <div
              v-if="formData.membre_id"
              class="alert alert-info d-flex align-items-center mt-2"
              role="alert"
            >
              <i class="fas fa-user me-2"></i>
              <div>
                Membre sélectionné :
                <strong>{{ formData.membre?.full_name }}</strong>
              </div>
            </div>
          </div>

          <div class="col-12 text-end">
            <button
              type="button"
              class="btn btn-primary"
              @click="goNext"
              :disabled="!formData.membre_id"
            >
              Continuer <i class="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>

        <div v-if="currentStep === 2">
          <form @submit.prevent="handleSubmit" class="row g-3">
            <div
              v-if="formData.membre_id"
              class="alert alert-info d-flex align-items-center mt-2"
              role="alert"
            >
              <i class="fas fa-user me-2"></i>
              <div>
                Membre sélectionné :
                <strong>{{ formData.membre?.full_name }}</strong>
              </div>
            </div>

            <div class="col-md-6">
              <label for="montant" class="form-label"
                >Montant <span class="text-danger">*</span></label
              >
              <div class="input-group">
                <input
                  type="number"
                  class="form-control"
                  id="montant"
                  min="0"
                  step="0.01"
                  required
                  v-model="formData.montant"
                />
                <select
                  class="form-select"
                  style="max-width: 100px"
                  v-model="formData.devise"
                  required
                  disabled
                >
                  <option value="FBU">FBU</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div class="col-md-6">
              <label for="date_paiement" class="form-label"
                >Date de Paiement <span class="text-danger">*</span></label
              >

              <Datepicker
                v-model="formData.date_paiement"
                :enable-time-picker="false"
                :auto-apply="true"
              />
            </div>

            <div class="col-md-6">
              <label for="mode_paiement" class="form-label"
                >Mode de Paiement <span class="text-danger">*</span></label
              >
              <select
                id="mode_paiement"
                class="form-select"
                v-model="formData.mode_paiement"
                required
              >
                <option value="1">Espèces</option>
                <option value="2">Virement</option>
                <option value="3">Chèque</option>
                <option value="4">Mobile Money</option>
              </select>
            </div>

            <div class="col-md-6">
              <label for="reference_paiement" class="form-label"
                >Référence de Paiement <span class="text-danger">*</span></label
              >
              <input
                type="string"
                class="form-control"
                id="reference_paiement"
                v-model="formData.reference_paiement"
                placeholder="Numéro de référence ou de transaction"
              />
            </div>

            <!--<div class="col-md-6">
              <label for="statut" class="form-label"
                >Statut <span class="text-danger">*</span></label
              >
              <div class="d-flex gap-4">
                <div class="form-radio">
                  <input
                    type="radio"
                    name="statut"
                    class="form-check-input"
                    id="paye"
                    v-model="formData.statut"
                    value="paye"
                  />
                  <label for="paye" class="form-check-label ps-1">Payé</label>
                </div>
                <div class="form-radio">
                  <input
                    type="radio"
                    name="statut"
                    class="form-check-input"
                    id="en_attente"
                    v-model="formData.statut"
                    value="en_attente"
                  />
                  <label for="en_attente" class="form-check-label ps-1"
                    >En attente</label
                  >
                </div>
                <div class="form-radio">
                  <input
                    type="radio"
                    name="statut"
                    class="form-check-input"
                    id="en_retard"
                    v-model="formData.statut"
                    value="en_retard"
                  />
                  <label for="en_retard" class="form-check-label ps-1"
                    >En retard</label
                  >
                </div>
              </div>
            </div>-->

            <div class="col-12">
              <label for="notes" class="form-label">Notes</label>
              <textarea
                class="form-control"
                id="notes"
                v-model="formData.notes"
                rows="3"
                placeholder="Notes supplémentaires..."
              ></textarea>
            </div>

            <div class="d-flex justify-content-between gap-2 mt-4">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="currentStep = 1"
              >
                Précédent
              </button>

              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="$router.push('/contributions')"
                  :disabled="loading"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="loading || loadingMembers"
                >
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  {{ loading ? "Enregistrement..." : "Enregistrer" }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <form @submit.prevent="handleSubmit" class="d-none"></form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "../../services/api";
import { useStore } from "vuex";

const store = useStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const loadingMembers = ref(false);

const allMembers = ref([]);
const filteredMembers = ref([]);

const members = ref([]);

const searchTimeout = ref(null);
const searchMember = ref("");
const searchedMemberData = computed(() => store.state.searchedMember);

const formData = ref({
  membre: null,
  membre_id: "",
  montant: 0,
  devise: "FBU",
  date_paiement: new Date().toISOString().split("T")[0],
  mode_paiement: "1",
  reference_paiement: "",
  statut: "paye",
  notes: "",
  categorie: [],
});

const currentStep = ref(1);

const goNext = () => {
  if (!formData.value.membre_id) {
    toast.error("Veuillez sélectionner un membre avant de continuer");
    return;
  }
  currentStep.value = 2;
};

const fetchAllMembers = async () => {
  loadingMembers.value = true;
  try {
    const res = await api.get("/membres", {
      params: {
        per_page: 100,
      },
    });

    allMembers.value = res.data.data || res.data || [];

    allMembers.value.forEach((member) => {
      if (!member.full_name) {
        member.full_name = `${member.nom} ${member.prenom}`;
      }
    });
  } catch (err) {
    console.error("Error fetching all members:", err);
    toast.error("Erreur lors du chargement initial des membres");
  } finally {
    loadingMembers.value = false;
  }
};

const onSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  const trimmedSearch = searchMember.value.trim().toLowerCase();

  if (trimmedSearch.length < 2) {
    filteredMembers.value = [];
    return;
  }

  loadingMembers.value = true;

  searchTimeout.value = setTimeout(() => {
    filteredMembers.value = allMembers.value.filter((member) => {
      const fullName = member.full_name ? member.full_name.toLowerCase() : "";
      const matricule = member.matricule
        ? String(member.matricule).toLowerCase()
        : "";
      const telephone = member.telephone
        ? String(member.telephone).toLowerCase()
        : "";

      return (
        fullName.includes(trimmedSearch) ||
        matricule.includes(trimmedSearch) ||
        telephone.includes(trimmedSearch)
      );
    });

    loadingMembers.value = false;
  }, 300);
};

// API search
const searchMembers = async (searchTerm) => {
  loadingMembers.value = true;
  try {
    const res = await api.get("/membres", {
      params: { search: searchTerm, per_page: 20 },
    });

    members.value = res.data.data || [];
  } catch (err) {
    console.error("Error searching members:", err);
    toast.error("Erreur lors du chargement des membres");
    members.value = [];
  } finally {
    loadingMembers.value = false;
  }
};

// Select a member from results

const selectMember = (member) => {
  if (!member.full_name) {
    member.full_name = `${member.nom} ${member.prenom}`;
  }

  formData.value.membre = member;
  formData.value.membre_id = member.id;

  // Save in Vuex store
  store.commit("SET_SEARCHED_MEMBER", member);

  // Automatically fill montant + devise
  formData.value.montant = member.categorie_cotisation || 0;
  formData.value.devise = member.categorie_devise || "FBU";

  // Clear list and move forward
  filteredMembers.value = [];
  searchMember.value = member.full_name;

  currentStep.value = 2;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(
    dateString.includes("T") ? dateString : `${dateString}T00:00:00Z`,
  );
  return date.toLocaleDateString("fr-FR");
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const { membre, ...payload } = formData.value;
    const response = await api.post("/cotisations", payload);

    if (response.data) {
      toast.success("Cotisation enregistrée avec succès");
      router.push("/contributions");
    } else {
      throw new Error("Réponse inattendue du serveur");
    }
  } catch (err) {
    console.error("Error saving contribution:", err);
    toast.error(
      err.response?.data?.message ||
        "Erreur lors de l'enregistrement de la cotisation",
    );
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllMembers();
});
</script>
