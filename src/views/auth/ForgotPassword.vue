<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <h1 class="h4 mb-3">Mot de passe oublié</h1>
            <p class="text-muted">
              Saisissez votre adresse e-mail pour recevoir un lien de
              réinitialisation.
            </p>

            <div v-if="message" class="alert alert-success" role="status">
              {{ message }}
            </div>
            <div v-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>

            <form @submit.prevent="submit" novalidate>
              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <input
                  id="email"
                  v-model.trim="email"
                  class="form-control"
                  type="email"
                  autocomplete="email"
                  required
                />
              </div>
              <button
                class="btn btn-primary w-100"
                type="submit"
                :disabled="loading"
              >
                {{ loading ? "Envoi..." : "Envoyer le lien" }}
              </button>
            </form>

            <div class="text-center mt-3">
              <router-link to="/login">Retour à la connexion</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "../../services/api";

const email = ref("");
const loading = ref(false);
const error = ref("");
const message = ref("");

async function submit() {
  loading.value = true;
  error.value = "";
  message.value = "";

  try {
    const response = await api.post("/forgot-password", {
      email: email.value,
    });
    message.value =
      response.message ||
      "Si cette adresse correspond à un compte, un lien sera envoyé.";
  } catch (requestError) {
    error.value =
      requestError.response?.data?.message ||
      "Impossible d’envoyer le lien pour le moment.";
  } finally {
    loading.value = false;
  }
}
</script>
