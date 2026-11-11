<template>
  <div class="notifications-page">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1 fw-bold text-dark">
          <i class="bi bi-bell-fill me-2 text-primary"></i>Notifications
        </h2>
        <p class="text-muted mb-0">Gérez vos alertes et messages importants</p>
      </div>
      <div class="d-flex gap-2">
        <button
          class="btn btn-outline-secondary"
          @click="markAllAsRead"
          :disabled="!hasUnread || loading"
        >
          <i class="bi bi-check-all me-2"></i>Tout marquer comme lu
        </button>
        <button
          class="btn btn-light"
          @click="fetchNotifications"
          :disabled="loading"
        >
          <i class="bi bi-arrow-clockwise" :class="{ spin: loading }"></i>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body p-2">
        <div class="d-flex gap-2 filters-scroll">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="btn btn-sm rounded-pill px-3"
            :class="
              currentFilter === filter.value ? 'btn-primary' : 'btn-light'
            "
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading && !notifications.length" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-2 text-muted">Récupération des notifications...</p>
    </div>

    <div
      v-else-if="filteredNotifications.length === 0"
      class="text-center py-5 empty-state"
    >
      <div
        class="empty-icon bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
      >
        <i class="bi bi-bell-slash text-muted" style="font-size: 2rem"></i>
      </div>
      <h5 class="text-muted">Aucune notification</h5>
      <p class="text-muted small">
        Vous n'avez aucune notification pour le moment.
      </p>
    </div>

    <div v-else class="notification-list">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="card border-0 shadow-sm mb-3 notification-card"
        :class="{ unread: !notification.read }"
        @click="markAsRead(notification)"
      >
        <div class="card-body p-3">
          <div class="d-flex gap-3">
            <!-- Icon -->
            <div
              class="notification-icon rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              :class="getIconClass(notification.type)"
            >
              <i :class="getIcon(notification.type)"></i>
            </div>

            <!-- Content -->
            <div class="flex-grow-1">
              <div
                class="d-flex justify-content-between align-items-start mb-1"
              >
                <h6 class="mb-0 fw-semibold text-dark">
                  {{ notification.title || "Notification" }}
                </h6>
                <span class="text-muted small ms-2 whitespace-nowrap">
                  {{ formatTime(notification.created_at) }}
                </span>
              </div>
              <p class="mb-2 text-secondary text-sm">
                {{ notification.message || "Nouveau message reçu." }}
              </p>

              <!-- Actions based on type (Optional) -->
              <div v-if="notification.data?.action_url" class="mt-2">
                <router-link
                  :to="notification.data.action_url"
                  class="btn btn-sm btn-link p-0 text-decoration-none"
                  @click.stop="markAsRead(notification)"
                >
                  Voir les détails <i class="bi bi-arrow-right ms-1"></i>
                </router-link>
              </div>
            </div>

            <!-- Status Dot -->
            <div v-if="!notification.read" class="align-self-center">
              <span class="status-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination (Optional - simplified for now) -->
      <div v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
        <nav aria-label="Page navigation">
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="changePage(currentPage - 1)">
                Précédent
              </button>
            </li>
            <li class="page-item disabled">
              <span class="page-link"
                >{{ currentPage }} / {{ totalPages }}</span
              >
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
            >
              <button class="page-link" @click="changePage(currentPage + 1)">
                Suivant
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import api from "../../services/api";
import { useToast } from "vue-toastification";
import { timeAgo } from "../../utils/useTimeFomat.js";

const store = useStore();
const toast = useToast();

const loading = ref(false);
const notifications = ref([]);
const currentFilter = ref("all");
const currentPage = ref(1);
const totalPages = ref(1);

const filters = [
  { label: "Toutes", value: "all" },
  { label: "Non lues", value: "unread" },
  { label: "Lues", value: "read" },
];

// Computed
const filteredNotifications = computed(() => {
  if (currentFilter.value === "unread") {
    return notifications.value.filter((n) => !n.read);
  } else if (currentFilter.value === "read") {
    return notifications.value.filter((n) => n.read);
  }
  return notifications.value;
});

const hasUnread = computed(() => {
  return notifications.value.some((n) => !n.read);
});

// Methods
const formatTime = (dateString) => {
  return timeAgo(dateString);
};

const getIcon = (type) => {
  // Map notification types to Bootstrap Icons
  // Using generic mapping as types seem to be filler text in the provided JSON
  const typeStr = type?.toLowerCase() || "";
  if (typeStr.includes("payment") || typeStr.includes("contribution"))
    return "bi bi-cash-stack";
  if (typeStr.includes("credit") || typeStr.includes("loan"))
    return "bi bi-credit-card";
  if (typeStr.includes("assistance")) return "bi bi-heart-pulse";
  if (typeStr.includes("user")) return "bi bi-person";
  if (typeStr.includes("security")) return "bi bi-shield-lock";

  // Fallback based on ID for visual variety if type is generic
  return "bi bi-bell-fill";
};

const getIconClass = (type) => {
  // Map types to colors
  if (type?.includes("Payment")) return "bg-success-subtle text-success";
  if (type?.includes("Credit")) return "bg-primary-subtle text-primary";
  if (type?.includes("Assistance")) return "bg-danger-subtle text-danger";
  if (type?.includes("Warning")) return "bg-warning-subtle text-warning";
  return "bg-secondary-subtle text-secondary";
};

const fetchNotifications = async (page = 1) => {
  loading.value = true;
  try {
    // Assuming API supports pagination: /notifications?page=1
    const response = await api.get("/notifications", { params: { page } });

    // Adjust based on your actual API response structure
    // Case 1: Standard Laravel Pagination
    if (response.data?.data) {
      notifications.value = response.data.data;
      currentPage.value = response.data.current_page;
      totalPages.value = response.data.last_page;
    }
    // Case 2: Simple Array
    else if (Array.isArray(response.data)) {
      notifications.value = response.data;
    }
    // Case 3: Wrapped simple array
    else {
      notifications.value = [];
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    toast.error("Impossible de charger les notifications.");
  } finally {
    loading.value = false;
  }
};

const markAsRead = async (notification) => {
  if (notification.read) return; // Already read

  try {
    // Optimistic update
    notification.read = true;

    await api.put(`/notifications/${notification.id}/mark-read`);

    // Update global store count if needed
    // store.dispatch('updateNotificationCount');
  } catch (error) {
    console.error("Error marking as read:", error);
    // Revert on error
    notification.read = false;
  }
};

const markAllAsRead = async () => {
  if (!hasUnread.value) return;

  try {
    // Optimistic update
    notifications.value.forEach((n) => {
      n.read = true;
    });

    await api.post("/notifications/mark-all-read");
    toast.success("Toutes les notifications ont été marquées comme lues.");
  } catch (error) {
    console.error("Error marking all as read:", error);
    toast.error("Erreur lors de la mise à jour.");
    fetchNotifications(currentPage.value); // Refresh to sync
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchNotifications(page);
  }
};

// Lifecycle
onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;
}

.notification-card {
  transition: all 0.2s ease;
  cursor: pointer;
  border-left: 4px solid transparent !important;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.notification-card.unread {
  background-color: #f8faff;
  border-left-color: #3b82f6 !important;
}

.notification-icon {
  width: 48px;
  height: 48px;
  font-size: 1.25rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  background-color: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.empty-icon {
  width: 80px;
  height: 80px;
}

.filters-scroll {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 2px; /* Scrollbar space */
}

/* Utilities */
.text-sm {
  font-size: 0.875rem;
}

.whitespace-nowrap {
  white-space: nowrap;
}

@media (max-width: 576px) {
  .notification-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
