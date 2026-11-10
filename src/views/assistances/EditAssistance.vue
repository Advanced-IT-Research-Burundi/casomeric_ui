<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Modifier la Demande d'Assistance</h2>
      <router-link to="/assistances" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour
      </router-link>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-else class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div v-if="!canEdit && !loading" class="alert alert-warning mb-4">
            <i class="fas fa-info-circle me-2"></i>Cette assistance ne peut plus
            être modifiée car elle est en cours de traitement ou finalisée.
          </div>
          <div v-if="error" class="alert alert-danger mb-4">
            <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
          </div>

          <div class="row g-3">
            <!-- Member (readonly) -->
            <div class="col-md-6">
              <label class="form-label">Membre</label>
              <input
                type="text"
                class="form-control bg-light"
                :value="`${assistance?.membre?.prenom || ''} ${
                  assistance?.membre?.nom || ''
                }`"
                readonly
              />
            </div>

            <!-- Type d'Assistance -->
            <div class="col-md-6">
              <label for="type_assistance_id" class="form-label"
                >Type <span class="text-danger">*</span></label
              >
              <select
                id="type_assistance_id"
                class="form-select"
                v-model="formData.type_assistance_id"
                required
                :disabled="!canEdit"
              >
                <option
                  v-for="type in assistanceTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.nom }}: {{ type.montant_standard }}
                </option>
              </select>
            </div>

            <!-- Montant -->
            <div class="col-md-6">
              <label for="montant" class="form-label"
                >Montant <span class="text-danger">*</span></label
              >
              <div class="input-group">
                <input
                  type="number"
                  class="form-control"
                  v-model.number="formData.montant"
                  min="0"
                  step="1"
                  required
                  :disabled="!canEdit"
                />
                <span class="input-group-text">FBU</span>
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
                  title="Le statut change par Valider / Refuser / Verser"
                >
                  <option value="en_attente">En attente</option>
                  <option value="approuve">Approuvé</option>
                  <option value="rejete">Rejeté</option>
                  <option value="verse">Versé</option>
                </select>
              </div>
            </template>

            <!-- Dates -->
            <div class="col-md-6">
              <label for="date_demande" class="form-label"
                >Date de Demande <span class="text-danger">*</span></label
              >
              <input
                type="datetime-local"
                class="form-control"
                v-model="formData.date_demande"
                required
                :disabled="!canEdit"
              />
            </div>

            <template v-if="authStore.hasAnyRole(['admin', 'gestionnaire'])">
              <div class="col-md-6">
                <label for="date_approbation" class="form-label"
                  >Date d'Approbation</label
                >
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="formData.date_approbation"
                  :disabled="formData.statut !== 'approuve'"
                />
              </div>

              <div class="col-md-6">
                <label for="date_versement" class="form-label"
                  >Date de Versement</label
                >
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="formData.date_versement"
                  :disabled="formData.statut !== 'verse'"
                />
              </div>
            </template>

            <!-- Justificatif -->
            <div class="col-12">
              <label for="justificatif" class="form-label"
                >Justificatif (Document ou Image)</label
              >
              <input
                type="file"
                class="form-control"
                id="justificatif"
                @change="handleFileChange"
                accept="image/*,.pdf,.doc,.docx"
                :disabled="!canEdit"
              />
              <div v-if="previewUrl || formData.justificatif" class="mt-2">
                <p class="small text-muted mb-1">
                  {{
                    previewUrl
                      ? "Aperçu du nouveau fichier :"
                      : "Fichier actuel :"
                  }}
                </p>
                <img
                  v-if="isImage(previewUrl || formData.justificatif)"
                  :src="previewUrl || getFullUrl(formData.justificatif)"
                  class="img-thumbnail"
                  style="max-height: 200px"
                  alt="Aperçu"
                />
                <div v-else class="alert alert-info py-2">
                  <i class="fas fa-file-alt me-2"></i>
                  {{ getFileName(previewUrl || formData.justificatif) }}
                </div>
              </div>
            </div>

            <!-- Motif de Rejet -->
            <div class="col-12" v-if="formData.statut === 'rejete'">
              <label for="motif_rejet" class="form-label"
                >Motif du Rejet <span class="text-danger">*</span></label
              >
              <textarea
                class="form-control"
                v-model="formData.motif_rejet"
                rows="2"
                :required="formData.statut === 'rejete'"
                placeholder="Raison du rejet"
              ></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="$router.push('/assistances')"
              :disabled="saving"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving || !canEdit"
            >
              <span
                v-if="saving"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              {{ saving ? "Enregistrement..." : "Mettre à jour" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const authStore = useAuthStore();

const assistanceId = route.params.id;
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const assistance = ref(null);
const assistanceTypes = ref([]);
const file = ref(null);
const previewUrl = ref(null);

const isMember = computed(() => authStore.hasAnyRole(["membre"]));
const isAdminOrManager = computed(() =>
  authStore.hasAnyRole(["admin", "gestionnaire"])
);
const isResponsable = computed(() => authStore.hasAnyRole(["responsable"]));

const canEdit = computed(() => {
  // Staff can always edit
  if (isAdminOrManager.value || isResponsable.value) return true;
  // Members can only edit if en_attente
  return formData.value.statut === "en_attente";
});

const formData = ref({
  type_assistance_id: "",
  montant: 0,
  date_demande: new Date().toISOString().slice(0, 16),
  date_approbation: null,
  date_versement: null,
  statut: "en_attente",
  justificatif: "",
  motif_rejet: "",
});

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toISOString().slice(0, 16) : null;

const isImage = (path) => {
  if (!path) return false;
  // If it's a data URL (preview), it might contain "image/"
  if (path.startsWith("data:image/")) return true;
  const ext = path.split(".").pop().toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

const getFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL_FILE || "http://localhost:8000";

  // If it starts with 'uploads', it's usually in public/uploads
  if (path.startsWith("uploads")) {
    return `${baseUrl}/${path}`;
  }

  // If it's stored via Storage::disk('public'), it's in storage/
  return `${baseUrl}/storage/${path}`;
};

const getFileName = (path) => {
  if (!path) return "";
  if (path.startsWith("data:")) return "Nouveau fichier";
  return path.split("/").pop();
};

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    file.value = selectedFile;
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewUrl.value = event.target.result;
      };
      reader.readAsDataURL(selectedFile);
    } else {
      previewUrl.value = selectedFile.name; // Use name as preview if not image
    }
  }
};

const fetchData = async () => {
  try {
    const [assistRes, typesRes] = await Promise.all([
      api.get(`/assistances/${assistanceId}`),
      api.get("/type-assistances"),
    ]);

    assistance.value = assistRes.data;
    assistanceTypes.value = typesRes.data || [];

    const data = assistance.value;
    formData.value = {
      type_assistance_id: data.type_assistance_id,
      montant: data.montant,
      date_demande:
        formatDate(data.date_demande) || new Date().toISOString().slice(0, 16),
      date_approbation: formatDate(data.date_approbation),
      date_versement: formatDate(data.date_versement),
      statut: data.statut,
      justificatif: data.justificatif || "",
      motif_rejet: data.motif_rejet || "",
    };
  } catch (err) {
    console.error("Error:", err);
    toast.error("Erreur lors du chargement");
    router.push("/assistances");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  saving.value = true;
  error.value = "";

  try {
    const data = new FormData();
    data.append("_method", "PUT"); // Method spoofing for Laravel
    data.append("type_assistance_id", formData.value.type_assistance_id);
    data.append("montant", formData.value.montant);
    data.append("date_demande", formData.value.date_demande);
    data.append("statut", formData.value.statut);

    if (formData.value.date_approbation)
      data.append("date_approbation", formData.value.date_approbation);
    if (formData.value.date_versement)
      data.append("date_versement", formData.value.date_versement);
    if (formData.value.statut === "rejete" && formData.value.motif_rejet) {
      data.append("motif_rejet", formData.value.motif_rejet);
    }

    if (file.value) {
      data.append("justificatif", file.value);
    }

    await api.post(`/assistances/${assistanceId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Mise à jour réussie");
    router.push("/assistances");
  } catch (err) {
    console.error("Error:", err);
    error.value =
      err.response?.data?.message || "Erreur lors de la mise à jour";
    toast.error(error.value);
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>
