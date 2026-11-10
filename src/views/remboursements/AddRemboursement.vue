<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Remboursement manuel</h2>
      <router-link to="/credits" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour aux crédits
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <!-- Étape 1 : choisir un crédit en remboursement -->
        <div v-if="currentStep === 1" class="row g-3">
          <div class="col-md-12">
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-search"></i></span>
              <input
                type="search"
                class="form-control py-2"
                placeholder="Rechercher un crédit par ID, nom, prénom ou matricule (au moins 2 caractères)"
                aria-label="Crédit"
                v-model="searchCredit"
                @input="onSearchInput"
              />
            </div>
            <div class="form-text">
              Seuls les crédits accordés qui ne sont pas encore soldés sont proposés.
            </div>

            <div v-if="loadingCredits" class="form-text mt-2">
              <i class="fas fa-spinner fa-spin me-1"></i>Chargement des crédits...
            </div>

            <ul
              v-if="credits.length > 0"
              class="list-group mt-2"
              style="max-height: 240px; overflow-y: auto"
            >
              <li
                v-for="c in credits"
                :key="c.id"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                role="button"
                @click="selectCredit(c)"
              >
                <span>
                  Crédit #{{ c.id }} — {{ memberName(c) }}
                  <span class="text-muted">({{ c.membre?.matricule || "—" }})</span>
                </span>
                <span class="text-muted small">
                  Reste : {{ formatMoney(c.montant_restant) }}
                </span>
              </li>
            </ul>

            <div
              v-if="!loadingCredits && searchCredit.trim().length >= 2 && credits.length === 0"
              class="form-text text-muted mt-2"
            >
              Aucun crédit en remboursement trouvé pour "{{ searchCredit }}"
            </div>
          </div>
        </div>

        <!-- Étape 2 : montant payé -->
        <form v-if="currentStep === 2 && credit" @submit.prevent="handleSubmit">
          <div v-if="error" class="alert alert-danger mb-4">{{ error }}</div>

          <div class="alert alert-info mb-3" role="alert">
            <i class="fas fa-file-invoice-dollar me-2"></i>
            Crédit <strong>#{{ credit.id }}</strong> — {{ memberName(credit) }}
            <div class="row mt-2 small">
              <div class="col-sm-4">Total à rembourser : <strong>{{ formatMoney(credit.montant_total_rembourser) }}</strong></div>
              <div class="col-sm-4">Mensualité : <strong>{{ formatMoney(credit.montant_mensualite) }}</strong></div>
              <div class="col-sm-4">Reste à payer : <strong>{{ formatMoney(credit.montant_restant) }}</strong></div>
            </div>
          </div>

          <p class="text-muted small">
            Le montant est réparti automatiquement sur les échéances non payées,
            de la plus ancienne à la plus récente.
          </p>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Montant payé <span class="text-danger">*</span></label>
              <div class="input-group">
                <input
                  type="number"
                  class="form-control"
                  v-model.number="form.montant_paye"
                  min="1"
                  :max="Number(credit.montant_restant)"
                  step="1"
                  required
                />
                <span class="input-group-text">FBU</span>
              </div>
              <button
                type="button"
                class="btn btn-link btn-sm px-0"
                @click="form.montant_paye = Number(credit.montant_mensualite)"
              >
                Mettre une mensualité
              </button>
            </div>

            <div class="col-md-6">
              <label class="form-label">Date de paiement</label>
              <Datepicker
                v-model="form.date_paiement"
                :enable-time-picker="false"
                :auto-apply="true"
              />
            </div>

            <div class="col-md-12">
              <label class="form-label">Preuve de paiement (PDF ou image, 2 Mo max)</label>
              <input
                type="file"
                class="form-control"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="onFileChange"
              />
            </div>
          </div>

          <div class="d-flex justify-content-between gap-2 mt-4">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="currentStep = 1"
              :disabled="saving"
            >
              Précédent
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? "Enregistrement..." : "Enregistrer le paiement" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import api from "../../services/api";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const saving = ref(false);
const error = ref("");
const loadingCredits = ref(false);
const credits = ref([]);
const currentStep = ref(1);
const searchCredit = ref("");
const credit = ref(null);
const preuve = ref(null);

const form = ref({
  montant_paye: null,
  date_paiement: new Date(),
});

const memberName = (c) =>
  `${c?.membre?.nom || ""} ${c?.membre?.prenom || ""}`.trim() || "N/A";

const formatMoney = (v) =>
  `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FBU`;

// Same rule as the API: granted and not fully repaid.
const isRepayable = (c) =>
  Number(c.montant_restant) > 0 &&
  (c.statut === "approuve" || (c.statut === "en_cours" && !!c.date_approbation));

let searchTimer = null;
const onSearchInput = () => {
  clearTimeout(searchTimer);
  const term = searchCredit.value.trim();
  if (term.length < 2) {
    credits.value = [];
    return;
  }
  // Search on the server, so credits beyond the first page are found too.
  searchTimer = setTimeout(async () => {
    loadingCredits.value = true;
    try {
      const res = await api.get("/credits", { params: { search: term, per_page: 50 } });
      const list = res?.data?.data || [];
      credits.value = list.filter(isRepayable);
    } catch (e) {
      console.error("Error searching credits", e);
      toast.error("Erreur lors de la recherche des crédits");
    } finally {
      loadingCredits.value = false;
    }
  }, 300);
};

const selectCredit = (c) => {
  credit.value = c;
  form.value.montant_paye = Math.min(
    Number(c.montant_mensualite) || 0,
    Number(c.montant_restant) || 0,
  ) || null;
  credits.value = [];
  currentStep.value = 2;
};

const onFileChange = (event) => {
  preuve.value = event.target.files[0] || null;
};

const toDateString = (d) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const handleSubmit = async () => {
  saving.value = true;
  error.value = "";
  try {
    const data = new FormData();
    data.append("credit_id", credit.value.id);
    data.append("montant_paye", form.value.montant_paye);
    if (form.value.date_paiement) {
      data.append("date_paiement", toDateString(form.value.date_paiement));
    }
    if (preuve.value) {
      data.append("preuve_paiement", preuve.value);
    }

    await api.post("/remboursements", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Remboursement enregistré et réparti sur les échéances");
    router.push({ name: "remboursementDetail", params: { id: credit.value.id } });
  } catch (e) {
    console.error("Error saving remboursement", e);
    const errors = e?.response?.data?.errors;
    error.value =
      (errors && Object.values(errors).flat()[0]) ||
      e?.response?.data?.message ||
      "Erreur lors de l'enregistrement";
    toast.error(error.value);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  // Coming from the 🤲 button on a credit: load that credit directly.
  if (route.query.credit_id) {
    try {
      const res = await api.get(`/credits/${route.query.credit_id}`);
      const c = res?.data;
      if (c && isRepayable(c)) {
        selectCredit(c);
      } else if (c) {
        toast.warning("Ce crédit n'est pas en remboursement.");
      }
    } catch (e) {
      console.error("Error loading credit", e);
    }
  }
});
</script>
