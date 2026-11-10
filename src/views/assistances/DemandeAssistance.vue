<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Nouvelle Demande d'Assistance</h2>
      <router-link to="/mesAssistances" class="btn btn-outline-secondary">
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

            <!-- Date d'Approbation -->

            <!-- Date de Versement -->

            <!-- Justificatif -->
            <div class="col-12">
              <label for="justificatif" class="form-label">Justification</label>
              <textarea
                name="justificatif"
                id="justificatif"
                v-model="formData.justificatif"
                placeholder="Justification"
                class="form-control form-control-sm"
              ></textarea>
            </div>
            <div class="col-6">
              <label for="document_justificatif" class="form-label"
                >Document Justificatif (PDF ou image) <span class="text-danger">*</span></label
              >
              <input
                type="file"
                name="document_justificatif"
                id="document_justificatif"
                @change="handleFileChange"
                accept=".pdf,application/pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                class="form-control form-control-sm"
              />
              <small v-if="formData.document_justificatif" class="text-success">
                <i class="fas fa-check-circle me-1"></i
                >{{ formData.document_justificatif.name }}
              </small>
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

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const loadingMembers = ref(true);
const loadingTypes = ref(true);
const error = ref("");

const members = ref([]);
const assistanceTypes = ref([]);

const formData = ref({
  type_assistance_id: "",
  montant: 0,
  justificatif: "",
  document_justificatif: null,
});

const handleSelectAssistance = () => {
  const selectedId = formData.value.type_assistance_id;

  const selectedType = assistanceTypes.value.find(
    (item) => item.id === selectedId
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
    // Validate file type: PDF or image (photo of the document), same list as the API
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Veuillez sélectionner un fichier PDF ou une image (JPG, PNG, WEBP)");
      event.target.value = ""; // Reset input
      formData.value.document_justificatif = null;
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Le fichier ne doit pas dépasser 5MB");
      event.target.value = ""; // Reset input
      formData.value.document_justificatif = null;
      return;
    }

    formData.value.document_justificatif = file;
  }
};

const fetchData = async () => {
  loadingMembers.value = loadingTypes.value = true;
  try {
    // Only the assistance types are needed: the API knows which member is asking
    // (the full member list is not loaded here any more).
    const typesRes = await api.get("/type-assistances");

    // types: try data or direct
    assistanceTypes.value =
      typesRes?.data?.data ?? typesRes?.data ?? typesRes ?? [];
  } catch (err) {
    console.error("Error fetching data:", err);
    toast.error("Erreur lors du chargement des données");
    members.value = assistanceTypes.value = [];
  } finally {
    loadingMembers.value = false;
    loadingTypes.value = false;
  }
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = "";

  try {
    // Create FormData for multipart/form-data submission
    const formDataToSend = new FormData();

    // Append form fields
    formDataToSend.append(
      "type_assistance_id",
      formData.value.type_assistance_id
    );
    formDataToSend.append("montant", formData.value.montant);

    // Append optional fields only if they have values
    if (formData.value.justificatif) {
      formDataToSend.append("justificatif", formData.value.justificatif);
    }

    // Append file if selected
    if (formData.value.document_justificatif) {
      formDataToSend.append(
        "document_justificatif",
        formData.value.document_justificatif
      );
    }

    // Send request with FormData
    await api.post("/demande-assistance", formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Demande d'assistance enregistrée avec succès");
    router.push("/mesAssistances");
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
  }
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
