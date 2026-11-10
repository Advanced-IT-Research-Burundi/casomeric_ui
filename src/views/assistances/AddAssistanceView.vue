<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Nouvelle Demande d'Assistance</h2>
      <router-link to="/assistances" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour à la liste
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-danger mb-4" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
          </div>

          <div class="row g-3">
            <!-- Membre -->
            <div class="col-md-6 position-relative">
              <label class="form-label">
                Membre <span class="text-danger">*</span>
              </label>

              <AutoComplete
                v-model="selectedMember"
                :suggestions="members"
                @complete="onMemberSearch"
                optionLabel="display_name"
                placeholder="Rechercher un membre (Nom, Matricule...)"
                class="w-100"
                inputClass="form-control"
                @item-select="onMemberSelect"
                forceSelection
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <div>
                      {{ slotProps.option.matricule }} -
                      {{ slotProps.option.nom }} {{ slotProps.option.prenom }}
                    </div>
                  </div>
                </template>
              </AutoComplete>

              <div v-if="loadingMembers" class="form-text">
                <i class="fas fa-spinner fa-spin me-1"></i> Chargement...
              </div>
            </div>

            <!-- Type d'Assistance -->
            <div class="col-md-6">
              <label for="type_assistance_id" class="form-label"
                >Type d'Assistance <span class="text-danger">*</span></label
              >
              <select
                id="type_assistance_id"
                class="form-select"
                v-model="formData.type_assistance_id"
                required
                :disabled="loadingTypes"
                @change="handleSelectAssistance"
              >
                <option value="" disabled>Sélectionnez un type</option>
                <option
                  v-for="type in assistanceTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.nom }}: {{ type.montant_standard }} FBU
                </option>
              </select>
              <div v-if="loadingTypes" class="form-text">
                <i class="fas fa-spinner fa-spin me-1"></i>Chargement des
                types...
              </div>
            </div>

            <!-- Montant -->
            <div class="col-md-6">
              <label for="montant" class="form-label"
                >Montant <span class="text-danger">*</span></label
              >
              <div class="input-group">
                <input
                  type="text"
                  v-model="formData.montant"
                  class="form-control"
                  disabled
                />
              </div>
            </div>

            <!-- Admin Only Fields -->
            <template v-if="authStore.hasAnyRole(['admin', 'gestionnaire'])">
              <!-- Statut -->
              <div class="col-md-6">
                <label for="statut" class="form-label"
                  >Statut <span class="text-danger">*</span></label
                >
                <select
                  id="statut"
                  class="form-select"
                  v-model="formData.statut"
                  disabled
                  title="Une nouvelle assistance commence toujours « En attente »"
                >
                  <option value="en_attente">En attente</option>
                  <option value="approuve">Approuvé</option>
                  <option value="rejete">Rejeté</option>
                  <option value="verse">Versé</option>
                </select>
              </div>

              <!-- Date d'Approbation -->
              <div class="col-md-4">
                <label for="date_approbation" class="form-label"
                  >Date d'Approbation</label
                >
                <Datepicker
                  v-model="formData.date_approbation"
                  :enable-time-picker="false"
                  :auto-apply="true"
                />
              </div>

              <!-- Date de Versement -->
              <div class="col-md-4">
                <label for="date_versement" class="form-label"
                  >Date de Versement</label
                >
                <Datepicker
                  v-model="formData.date_versement"
                  :enable-time-picker="false"
                  :auto-apply="true"
                />
              </div>
            </template>

            <!-- Date de Demande -->
            <div class="col-md-4">
              <label for="date_demande" class="form-label"
                >Date de Demande <span class="text-danger">*</span></label
              >
              <Datepicker
                v-model="formData.date_demande"
                :enable-time-picker="false"
                :auto-apply="true"
                placeholder="Choisir une date"
              />
            </div>

            <!-- Justificatif -->
            <div class="col-md-6">
              <label for="justificatif" class="form-label"
                >Justificatif <span class="text-danger">*</span></label
              >

              <div v-if="justificatifPreview" class="mt-2 mb-2">
                <img
                  :src="justificatifPreview"
                  alt="Justificatif Preview"
                  class="img-thumbnail"
                  style="max-height: 150px"
                />
              </div>
              <input
                type="file"
                class="form-control"
                id="justificatif"
                @change="handleFileChange"
                accept="image/*,.pdf"
                required
              />
            </div>

            <!-- Motif de Rejet (required only when statut === 'rejete') -->
            <div
              class="col-md-6"
              v-if="
                authStore.hasAnyRole(['admin', 'gestionnaire']) &&
                isMotifRequired
              "
            >
              <label for="motif_rejet" class="form-label"
                >Motif du Rejet
                <span v-if="isMotifRequired" class="text-danger">*</span></label
              >
              <textarea
                class="form-control"
                id="motif_rejet"
                v-model="formData.motif_rejet"
                rows="2"
                :required="isMotifRequired"
                placeholder="Raison du rejet de la demande"
              ></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="$router.push('/assistances')"
              :disabled="loading"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || loadingMembers || loadingTypes"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              {{ loading ? "Enregistrement..." : "Enregistrer" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "../../services/api";
import debounce from "lodash/debounce";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const loadingMembers = ref(true);
const loadingTypes = ref(true);
const error = ref("");

const assistanceTypes = ref([]);
const selectedMember = ref(null);
const members = ref([]);
const justificatifFile = ref(null);
const justificatifPreview = ref(null);

const formData = ref({
  membre_id: "",
  type_assistance_id: "",
  montant: 0,
  date_demande: new Date().toISOString().split("T")[0],
  date_approbation: new Date().toISOString().split("T")[0],
  date_versement: new Date().toISOString().split("T")[0],
  statut: "en_attente",
  motif_rejet: "",
});

const isMotifRequired = computed(() => formData.value.statut === "rejete");

const handleSelectAssistance = () => {
  const selectedId = formData.value.type_assistance_id;

  const selectedType = assistanceTypes.value.find(
    (item) => item.id === selectedId,
  );

  if (selectedType) {
    formData.value.montant = selectedType.montant_standard; // AUTO-FILL
  } else {
    formData.value.montant = 0;
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    justificatifFile.value = file;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        justificatifPreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      justificatifPreview.value = null;
    }
  }
};

const onMemberSearch = async (event) => {
  const query = event.query;
  if (!query || query.length < 2) return;

  loadingMembers.value = true;
  try {
    const res = await api.post("/membres/search?q=" + query);
    // res.data might be { success: true, data: [...] } or just [...]
    const data = res.data?.data || res.data || [];
    members.value = data.map((m) => ({
      ...m,
      display_name: `${m.nom} ${m.prenom} (${m.matricule})`,
    }));
  } catch (e) {
    console.error(e);
    members.value = [];
  } finally {
    loadingMembers.value = false;
  }
};

const onMemberSelect = (event) => {
  formData.value.membre_id = event.value.id;
};

const fetchData = async () => {
  loadingTypes.value = true;
  try {
    const [typesRes] = await Promise.all([api.get("/type-assistances")]);
    assistanceTypes.value =
      typesRes?.data?.data ?? typesRes?.data ?? typesRes ?? [];
  } catch (err) {
    console.error("Error fetching data:", err);
    toast.error("Erreur lors du chargement des données");
    assistanceTypes.value = [];
  } finally {
    loadingTypes.value = false;
  }
};

const handleSubmit = async () => {
  if (!formData.value.membre_id) {
    toast.warning("Veuillez sélectionner un membre");
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const data = new FormData();
    data.append("membre_id", formData.value.membre_id);
    data.append("type_assistance_id", formData.value.type_assistance_id);
    data.append("montant", formData.value.montant);
    data.append(
      "date_demande",
      new Date(formData.value.date_demande).toISOString().split("T")[0],
    );
    data.append("statut", formData.value.statut);

    if (formData.value.date_approbation) {
      data.append(
        "date_approbation",
        new Date(formData.value.date_approbation).toISOString().split("T")[0],
      );
    }
    if (formData.value.date_versement) {
      data.append(
        "date_versement",
        new Date(formData.value.date_versement).toISOString().split("T")[0],
      );
    }
    if (formData.value.motif_rejet)
      data.append("motif_rejet", formData.value.motif_rejet);

    if (justificatifFile.value) {
      data.append("justificatif", justificatifFile.value);
    }

    console.log("=====================");

    await api.post("/assistances", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("=====================");

    toast.success("Demande d'assistance enregistrée avec succès");
    router.push("/assistances");
  } catch (err) {
    console.error("Error saving assistance:", err);
    error.value =
      err.response?.data?.message || "Erreur lors de l'enregistrement";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

watch(
  () => formData.value.statut,
  (newVal) => {
    if (newVal === "approuve" && !formData.value.date_approbation) {
      formData.value.date_approbation = new Date().toISOString().split("T")[0];
    }
  },
);

onMounted(() => {
  fetchData();
});
</script>
<style scoped>
/* small layout fixes */
.card {
  border-radius: 8px;
}
.form-label {
  font-weight: 600;
}
</style>
