<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Ajouter un nouveau membre</h2>
      <router-link to="/members" class="btn btn-outline-secondary">
        <i class="fas fa-arrow-left me-2"></i>Retour à la liste
      </router-link>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-4">
      <div v-if="error" class="alert alert-danger mb-4" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
      </div>

      <div v-if="success" class="alert alert-success mb-4" role="alert">
        <i class="fas fa-check-circle me-2"></i>{{ success }}
      </div>
      <div class="row g-3">
        <div class="col-12">
          <h5 class="mb-3">Informations personnelles</h5>
        </div>

        <div class="col-md-6">
          <label for="nom" class="form-label"
            >Nom <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            id="nom"
            v-model="formData.nom"
            required
          />
        </div>

        <div class="col-md-6">
          <label for="prenom" class="form-label"
            >Prénom <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            id="prenom"
            v-model="formData.prenom"
            required
          />
        </div>

        <div class="col-md-6">
          <label for="email" class="form-label"
            >Email <span class="text-danger">*</span></label
          >
          <input
            type="email"
            class="form-control"
            id="email"
            v-model="formData.email"
            required
          />
        </div>

        <div class="col-md-6">
          <label for="telephone" class="form-label">Téléphone</label>
          <input
            type="tel"
            class="form-control"
            id="telephone"
            v-model="formData.telephone"
          />
        </div>

        <div class="col-12 mt-4">
          <h5 class="mb-3">Informations d'adhésion</h5>
        </div>

        <div class="col-md-6">
          <label for="matricule" class="form-label">Matricule</label>
          <input
            type="text"
            class="form-control"
            id="matricule"
            v-model="formData.matricule"
          />
        </div>

        <div class="col-md-6">
          <label for="categorie_id" class="form-label"
            >Catégorie <span class="text-danger">*</span></label
          >
          <select
            class="form-select"
            id="categorie_id"
            v-model="formData.categorie_id"
            required
          >
            <option value="" disabled>Sélectionnez une catégorie</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.description }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label for="statut" class="form-label"
            >Statut <span class="text-danger">*</span></label
          >
          <select
            class="form-select"
            id="statut"
            v-model="formData.statut"
            required
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>

        <div class="col-md-6">
          <label for="date_adhesion" class="form-label"
            >Date d'adhésion <span class="text-danger">*</span></label
          >
          <Datepicker
            v-model="formData.date_adhesion"
            :enable-time-picker="false"
            :auto-apply="true"
          />
        </div>

        <div v-if="isAdmin" class="col-12">
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
              Un lien de définition du mot de passe sera envoyé à l’adresse
              e-mail du membre.
            </div>
          </div>
        </div>

        <div class="col-12 mt-4">
          <div class="d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="$router.push('/members')"
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
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api.js";
import { useToast } from "vue-toastification";
import useAuthStore from "../../stores/auth.js";

export default {
  name: "CreateMember",

  setup() {
    const router = useRouter();
    const toast = useToast();
    const authStore = useAuthStore();
    const isAdmin = computed(() => authStore.hasAnyRole("admin"));
    const loading = ref(false);
    const error = ref("");
    const success = ref("");
    const categories = ref([]);

    const formData = ref({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      matricule: "",
      categorie_id: "",
      statut: "actif",
      date_adhesion: new Date().toISOString().split("T")[0],
      create_user: false,
    });

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categorie-membres");
        if (response.data) {
          categories.value = response.data || [];
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        error.value = "Erreur lors du chargement des catégories";
      }
    };

    const handleSubmit = async () => {
      loading.value = true;
      error.value = "";
      success.value = "";

      try {
        const response = await api.post("/membres", formData.value);

        if (response.success) {
          success.value = response.message || "Membre créé avec succès";
          // Reset form
          formData.value = {
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            matricule: "",
            categorie_id: "",
            statut: "actif",
            date_adhesion: new Date().toISOString().split("T")[0],
            create_user: false,
          };

          // Redirect to members list after 2 seconds
          router.push("/members");
          toast.success(success.value);
        } else {
          throw new Error(
            response?.message || "Erreur lors de la création du membre"
          );
        }
      } catch (err) {
        console.error("Error creating member:", err);
        error.value =
          err.response?.data?.message ||
          "Une erreur est survenue lors de la création du membre";
        toast.error(error.value);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchCategories();
    });

    return {
      formData,
      categories,
      isAdmin,
      loading,
      error,
      success,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>
