<template>
  <div class="login-page d-flex align-items-center justify-content-center">
    <div class="login-card">
      <!-- Panneau gauche -->
      <div class="login-info d-none d-lg-flex flex-column p-5">
        <div class="text-center mb-5">
          <div class="logo-circle mb-3">
            <i class="fas fa-coins fa-3x"></i>
          </div>

          <h1 class="h2 fw-bold mb-2 text-white">{{ APP_CONFIG.name }}</h1>
          <p class="text-white-75 mb-0">{{ APP_CONFIG.description }}</p>
          <small class="text-white-50">Version {{ APP_CONFIG.version }}</small>
        </div>

        <div class="flex-grow-1">
          <h5 class="mb-4 fw-bold text-white">Fonctionnalités principales</h5>
          <div
            v-for="(feature, index) in FEATURES"
            :key="index"
            class="d-flex align-items-start mb-4 feature-item"
          >
            <div class="feature-icon me-3">
              <i :class="feature.icon"></i>
            </div>
            <div>
              <h6 class="mb-1 fw-bold text-white">{{ feature.label }}</h6>
              <p class="mb-0 small text-white-75">{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <div class="mt-auto d-flex align-items-center text-white-75">
          <i class="fas fa-shield-alt me-2"></i>
          <small>Connexion sécurisée SSL</small>
        </div>
      </div>

      <!-- Panneau droit -->
      <div
        class="login-form-wrapper d-flex flex-column justify-content-center p-5"
      >
        <div class="text-center mb-5">
          <h2 class="h3 fw-bold mb-2 text-dark">Connexion</h2>
          <p class="text-muted mb-0">
            Accédez à votre espace de gestion des cotisations
          </p>
        </div>

        <form @submit.prevent="login" class="login-form">
          <div v-if="error" class="error-message">{{ error }}</div>

          <!-- EMAIL -->
          <div class="form-field mb-3">
            <input
              type="email"
              placeholder="Email"
              v-model="email"
              required
              :disabled="isLoading"
              class="custom-input"
            />
          </div>

          <!-- PASSWORD -->
          <div class="form-field mb-4 position-relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mot de passe"
              v-model="password"
              required
              :disabled="isLoading"
              class="custom-input"
            />
            <i
              :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
              class="toggle-password"
              @click="showPassword = !showPassword"
            ></i>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="remember" />
              <label class="form-check-label text-muted ms-2" for="remember">
                Se souvenir de moi
              </label>
            </div>
            <router-link
              to="/forgot-password"
              class="text-decoration-none fw-semibold"
              style="color: #3b82f6"
            >
              Mot de passe oublié ?
            </router-link>
          </div>

          <!-- BUTTON -->
          <button type="submit" class="submit-btn w-100" :disabled="isLoading">
            <span v-if="!isLoading">Se connecter</span>
            <div v-else class="loading-content">
              <div class="spinner"></div>
              <span>Connexion...</span>
            </div>
          </button>

          <div class="form-links mt-4 text-center">
            <small class="text-muted">
              Pas encore de compte ?
              <router-link
                to="/register"
                style="color: #3b82f6"
                class="fw-semibold"
              >
                Créer un compte
              </router-link>
            </small>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

// --- Composables ---
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// --- Configuration & Constants ---
const APP_CONFIG = {
  name: "CASOMIREC",
  description: "Système de gestion des cotisations et adhérents",
  version: "1.0.0",
};

const FEATURES = [
  {
    icon: "fas fa-wallet",
    label: "Gestion des cotisations",
    description: "Enregistrement et suivi des paiements",
  },
  {
    icon: "fas fa-users",
    label: "Gestion des membres",
    description: "Base de données des adhérents",
  },
  {
    icon: "fas fa-chart-bar",
    label: "Rapports",
    description: "Suivi des performances financières",
  },
  {
    icon: "fas fa-lock",
    label: "Sécurité",
    description: "Accès sécurisé et rôles utilisateurs",
  },
];

// --- Reactive State ---
const email = ref("");
const password = ref("");
const isLoading = ref(false);
const error = ref("");
const showPassword = ref(false);

// --- Login Function ---
async function login() {
  if (isLoading.value) return;
  isLoading.value = true;
  error.value = "";

  try {
    // Attempt login via AuthStore
    const success = await authStore.login(email.value, password.value);
    if (!success) throw new Error("Email ou mot de passe incorrect");

    // Redirect based on User Role
    if (
      authStore.user.role === "admin" ||
      authStore.user.role === "responsable"
    ) {
      window.location.href = "/dashboard";
    } else if (authStore.user.role === "gestionnaire") {
      window.location.href = "/manager/dashboard";
    } else {
      window.location.href = "/ma-situation";
    }
  } catch (err) {
    console.error("Login error:", err);
    error.value =
      err.response?.data?.message || err.message || "Erreur de connexion";
    toast.error(error.value);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Inter", system-ui, sans-serif;
}

.login-card {
  display: flex;
  width: 100%;
  max-width: 1000px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  background-color: #fff;
}

/* Panel gauche */
.login-info {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
}

/* FORMULAIRE – Inputs customisés */
.form-field {
  width: 100%;
  position: relative;
}

.custom-input {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  color: #000000;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.custom-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Icône œil */
.toggle-password {
  cursor: pointer;
  color: #6b7280;
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
}

/* Button */
.submit-btn {
  padding: 1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
}

/* Error */
.error-message {
  background: #ef4444;
  color: white;
  padding: 0.75rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
  }
  .login-info {
    display: none;
  }
}
</style>
