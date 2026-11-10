<template>
  <div class="container py-4 px-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Ajouter un utilisateur</h2>
      <button class="btn btn-outline-secondary" @click="$router.push('/users')">
        <i class="fas fa-arrow-left me-2"></i>Retour à la liste
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-4">
      <div v-if="error" class="alert alert-danger mb-4" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label"
            >Prénom <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            v-model.trim="form.prenom"
            required
          />
        </div>

        <div class="col-md-6">
          <label class="form-label"
            >Nom <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            v-model.trim="form.nom"
            required
          />
        </div>

        <div class="col-md-6">
          <label class="form-label"
            >Email <span class="text-danger">*</span></label
          >
          <input
            type="email"
            class="form-control"
            v-model.trim="form.email"
            required
          />
        </div>

        <div class="col-md-6">
          <label class="form-label">Téléphone</label>
          <input
            type="tel"
            class="form-control"
            v-model.trim="form.telephone"
          />
        </div>

        <div class="col-md-6">
          <label class="form-label"
            >Rôle <span class="text-danger">*</span></label
          >
          <select class="form-select" v-model="form.role" required>
            <option value="" disabled>Sélectionner un rôle</option>
            <option value="admin">Admin</option>
            <option value="gestionnaire">Gestionnaire</option>
            <option value="responsable">Responsable</option>
            <!-- <option value="membre">Membre</option> -->
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Statut</label>
          <select class="form-select" v-model="form.statut">
            <option value="" disabled>Sélectionner un statut</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Mot de passe</label>
          <input
            type="password"
            class="form-control"
            v-model="form.password"
            minlength="6"
            placeholder="Au moins 6 caractères"
          />
        </div>

        <div class="col-md-6 d-flex align-items-center">
          <div class="form-check mt-4">
            <input
              class="form-check-input"
              type="checkbox"
              id="is_active"
              v-model="form.is_active"
            />
            <label class="form-check-label" for="is_active">
              Compte actif
            </label>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="$router.push('/users')"
        >
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          <span
            v-if="isLoading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
          ></span>
          {{ isLoading ? "Enregistrement..." : "Créer" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";
import { useToast } from "vue-toastification";

const router = useRouter();
const toast = useToast();

const isLoading = ref(false);
const error = ref("");

const form = ref({
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  password: "",
  role: "membre",
  is_active: true,
  statut: "actif",
});

async function handleSubmit() {
  error.value = "";
  isLoading.value = true;
  try {
    const payload = { ...form.value };
    if (!payload.password) delete payload.password;
    const res = await api.post("/users", payload);
    const message = res?.message || "Utilisateur créé avec succès";
    toast.success(message);
    router.push("/users");
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Erreur lors de la création de l'utilisateur";
    error.value = msg;
    toast.error(msg);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: none;
}
</style>
