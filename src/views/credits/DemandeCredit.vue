<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Demande de Crédit</h2>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-danger mb-4" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label for="montant_demande" class="form-label"
                >Montant Demandé <span class="text-danger">*</span></label
              >
              <div class="input-group">
                <input
                  type="number"
                  class="form-control"
                  id="montant_demande"
                  v-model.number="formData.montant_demande"
                  min="0"
                  step="1"
                  required
                  @input="calculatePayments"
                />
                <span class="input-group-text">FBU</span>
              </div>
            </div>

            <!-- Taux d'Intérêt -->
            <div class="col-md-6">
              <label for="taux_interet" class="form-label"
                >Taux d'Intérêt (%) <span class="text-danger">*</span></label
              >
              <div class="input-group">
                <input
                  type="number"
                  class="form-control"
                  id="taux_interet"
                  v-model.number="formData.taux_interet"
                  min="0"
                  max="100"
                  step="1"
                  disabled
                  @input="calculatePayments"
                />
                <span class="input-group-text">%</span>
              </div>
            </div>

            <div class="col-md-6">
              <label for="duree_mois" class="form-label"
                >Durée (mois) <span class="text-danger">*</span></label
              >
              <input
                type="number"
                class="form-control"
                id="duree_mois"
                v-model.number="formData.duree_mois"
                min="1"
                required
                disabled
              />
            </div>

            <div class="col-md-6">
              <label class="form-label">Montant Total à Rembourser (estimation)</label>
              <div class="form-control bg-light">
                {{ formData.montant_total_rembourser }} FBU
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label">Mensualité (estimation)</label>
              <div class="form-control bg-light">
                {{ formData.montant_mensualite }} FBU
              </div>
            </div>

            <!-- Date de Demande -->
            <div class="col-md-6">
              <label for="date_demande" class="form-label"
                >Date de Demande <span class="text-danger">*</span></label
              >
              <Datepicker
                v-model="formData.date_demande"
                :enable-time-picker="false"
                :auto-apply="true"
                required
              />
            </div>

            <div class="col-12">
              <label for="motif" class="form-label"
                >Motif du Crédit <span class="text-danger">*</span></label
              >
              <textarea
                class="form-control"
                id="motif"
                v-model="formData.motif"
                rows="3"
                required
                placeholder="Décrivez la raison du crédit..."
              ></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="$router.push('/credits')"
              :disabled="loading"
            >
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "../../services/api";
import useAuthStore from "../../stores/auth";

const authStore = useAuthStore();
const isAdmin = ref(authStore.hasAnyRole["Admin"]);
const isManager = ref(authStore.hasAnyRole["Manager"]);
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const error = ref("");

const formData = ref({
  montant_demande: 0,
  taux_interet: 3,
  duree_mois: 12,
  montant_total_rembourser: 0,
  montant_mensualite: 0,
  date_demande: new Date().toISOString().split("T")[0],
  statut: "en_attente",
  motif: "",
});

// Calculate total amount and monthly payment
const calculatePayments = () => {
  const montant = parseFloat(formData.value.montant_demande) || 0;
  const taux = parseFloat(formData.value.taux_interet) || 0;
  const duree = parseInt(formData.value.duree_mois) || 1;

  // Calculate total amount with interest
  const interet = (montant * taux * duree) / (12 * 100);
  const total = montant + interet;

  // Calculate monthly payment
  const mensualite = duree > 0 ? total / duree : 0;

  formData.value.montant_total_rembourser = total.toFixed(0);
  formData.value.montant_mensualite = mensualite.toFixed(0);
};

// Handle form submission
const handleSubmit = async () => {
  loading.value = true;
  error.value = "";

  try {
    // Prepare the data for API (Les nombres sont déjà gérés par v-model.number)
    const payload = {
      ...formData.value,
    };

    console.log("Payload envoyé :", payload);

    const response = await api.post("/demande-credit", payload);

    // Vérification de la réponse (l'API devrait retourner un objet de crédit en cas de succès)
    if (response.data) {
      toast.success("Crédit enregistré avec succès");
      router.push("/credits/mescredits");
    } else {
      // Une réponse sans 'data' peut indiquer un problème non HTTP 4xx/5xx
      throw new Error("Réponse inattendue du serveur");
    }
  } catch (err) {
    console.error("Error saving credit:", err);
    // Gérer les erreurs spécifiques de l'API (ex: Laravel validation errors)
    const apiErrorMessage =
      err.response?.data?.message ||
      err.message ||
      "Erreur lors de l'enregistrement du crédit";
    error.value = apiErrorMessage;
    toast.error(apiErrorMessage);
  } finally {
    loading.value = false;
  }
};

// The rate comes from the configuration; the server recalculates the
// total and the monthly payment, so the values shown here are an estimate.
const fetchDefaultRate = async () => {
  try {
    const res = await api.get("/configurations");
    const settings = res.data?.data || res.data || [];
    const rate = Array.isArray(settings)
      ? settings.find((s) => s.cle === "taux_interet_credit")
      : null;
    if (rate && !isNaN(parseFloat(rate.valeur))) {
      formData.value.taux_interet = parseFloat(rate.valeur);
    }
  } catch (err) {
    console.error("Error fetching interest rate:", err);
  } finally {
    calculatePayments();
  }
};

onMounted(() => {
  fetchDefaultRate();
});
</script>
