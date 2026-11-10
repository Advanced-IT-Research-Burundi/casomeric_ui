<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h1 class="h4 mb-3">Définir un nouveau mot de passe</h1>

            <div v-if="!hasValidLink" class="alert alert-danger" role="alert">
              Ce lien est incomplet ou invalide. Demandez un nouveau lien de
              réinitialisation.
            </div>
            <div v-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>
            <div v-if="message" class="alert alert-success" role="status">
              {{ message }}
            </div>

            <form
              v-if="hasValidLink && !message"
              @submit.prevent="submit"
              novalidate
            >
              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <input
                  id="email"
                  :value="email"
                  class="form-control"
                  type="email"
                  autocomplete="email"
                  readonly
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  v-model="password"
                  class="form-control"
                  type="password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="password-confirmation" class="form-label">
                  Confirmer le mot de passe
                </label>
                <input
                  id="password-confirmation"
                  v-model="passwordConfirmation"
                  class="form-control"
                  type="password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                />
              </div>
              <button
                class="btn btn-primary w-100"
                type="submit"
                :disabled="loading"
              >
                {{ loading ? "Enregistrement..." : "Définir le mot de passe" }}
              </button>
            </form>

            <div class="text-center mt-3">
              <router-link to="/login">Retour à la connexion</router-link>
              <span v-if="!hasValidLink" class="mx-2">·</span>
              <router-link v-if="!hasValidLink" to="/forgot-password">
                Demander un nouveau lien
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../../services/api";

const route = useRoute();
const token = String(route.query.token || "");
const email = String(route.query.email || "");
const password = ref("");
const passwordConfirmation = ref("");
const loading = ref(false);
const error = ref("");
const message = ref("");
const hasValidLink = computed(() => Boolean(token && email));

async function submit() {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.post("/reset-password", {
      token,
      email,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    message.value = response.message || "Mot de passe défini avec succès.";
  } catch (requestError) {
    error.value =
      requestError.response?.data?.message ||
      "Impossible de réinitialiser le mot de passe.";
  } finally {
    loading.value = false;
  }
}
</script>
