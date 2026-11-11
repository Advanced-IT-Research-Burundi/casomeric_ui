<template>
  <div class="app-layout">
    <!-- Overlay for mobile sidebar -->
    <div
      class="sidebar-overlay"
      :class="{ show: !isCollapsed && isMobile }"
      @click="toggleSidebar"
    ></div>
    <!-- Sidebar -->
    <div
      class="sidebar"
      :class="{
        collapsed: isCollapsed,
        'mobile-open': !isCollapsed && isMobile,
      }"
    >
      <div class="logo-container">
        <div class="logo-wrapper">
          <i class="bi bi-droplet-fill logo-icon"></i>
          <h2 v-show="!isCollapsed" class="logo-text">CASOMIREC</h2>
        </div>
      </div>

      <nav class="nav-menu custom-scrollbar">
        <div class="menu-label" v-if="!isCollapsed">MENU PRINCIPAL</div>

        <template v-for="(item, index) in menuItems" :key="index">
          <router-link
            :to="item.path"
            class="menu-item-link"
            v-if="item.requireAdmin"
            v-slot="{ isActive, navigate }"
            custom
          >
            <div
              class="menu-item"
              :class="{
                active: isRouteActive(item.path),
                collapsed: isCollapsed,
              }"
              @click="navigate"
              :title="isCollapsed ? item.title : ''"
            >
              <div class="icon-wrapper" v-html="item.icon"></div>
              <span v-show="!isCollapsed" class="menu-title">{{
                item.title
              }}</span>
              <div
                v-if="isActive && !isCollapsed"
                class="active-indicator"
              ></div>
            </div>
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer" v-if="!isCollapsed">
        <div class="version-info">
          <i class="bi bi-shield-check"></i>
          <span>Version 1.0.0</span>
        </div>
      </div>
    </div>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper" :class="{ collapsed: isCollapsed }">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="btn-toggle">
            <i
              class="bi"
              :class="isCollapsed ? 'bi-list' : 'bi-text-indent-right'"
            ></i>
          </button>

          <!-- <div class="current-page-title d-none d-md-block">
            <i class="bi bi-circle-fill pulse-dot"></i>
            {{ currentRouteName }}
          </div> -->
        </div>

        <div class="header-right">
          <!-- Notification Icon -->
          <div class="header-action-item" ref="notificationRef">
            <button
              class="btn-icon notification-btn"
              @click.stop="toggleNotificationDropdown"
              :class="{ active: showNotificationDropdown }"
            >
              <i class="bi bi-bell-fill"></i>
              <span v-if="notificationCount > 0" class="notification-badge">
                {{ notificationCount }}
              </span>
            </button>

            <!-- Notification Dropdown -->
            <transition name="fade-slide">
              <div
                class="dropdown-menu-custom notification-menu"
                v-if="showNotificationDropdown"
                @click.stop
              >
                <div class="dropdown-header">
                  <div class="header-title">
                    <i class="bi bi-bell-fill"></i>
                    <h3>Notifications</h3>
                  </div>
                  <button
                    v-if="notificationCount > 0"
                    class="btn-text"
                    @click="markAllAsRead"
                  >
                    <i class="bi bi-check-all"></i>
                    Tout marquer
                  </button>
                </div>

                <div class="notification-list custom-scrollbar">
                  <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    class="notification-item"
                    :class="{ unread: !notification.read }"
                    @click="handleNotificationClick(notification)"
                  >
                    <div
                      class="notification-icon-wrapper"
                      :class="notification.type"
                    >
                      <i :class="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="notification-content">
                      <div class="notification-top">
                        <span class="notification-title">{{
                          notification.title
                        }}</span>
                        <span class="notification-time">{{
                          notification.time
                        }}</span>
                      </div>
                      <p class="notification-message">
                        {{ notification.message }}
                      </p>
                    </div>
                    <div class="unread-dot" v-if="!notification.read"></div>
                  </div>

                  <div v-if="notifications.length === 0" class="empty-state">
                    <div class="empty-icon">
                      <i class="bi bi-bell-slash"></i>
                    </div>
                    <p>Aucune notification</p>
                  </div>
                </div>

                <div class="dropdown-footer">
                  <router-link
                    to="/notifications"
                    class="view-all-link"
                    @click="showNotificationDropdown = false"
                  >
                    Voir toutes les notifications
                    <i class="bi bi-arrow-right"></i>
                  </router-link>
                </div>
              </div>
            </transition>
          </div>

          <div class="divider-vertical"></div>
          <div>
            <button
              @click="refreshPage"
              class="header-action-item btn btn-outline-secondary"
            >
              <i class="bi bi-repeat"></i>
            </button>
          </div>
          <div class="divider-vertical"></div>

          <!-- User Profile -->
          <div class="header-action-item" ref="profileRef">
            <div
              class="user-profile-trigger"
              @click.stop="toggleUserDropdown"
              :class="{ active: showUserDropdown }"
            >
              <div class="user-avatar">
                <span>{{ userInitials }}</span>
              </div>
              <div class="user-info d-none d-md-flex">
                <span class="name">{{ userName }}</span>
                <span class="role">{{ userRole }}</span>
              </div>
              <i class="bi bi-chevron-down"></i>
            </div>

            <transition name="fade-slide">
              <div
                class="dropdown-menu-custom user-menu"
                v-if="showUserDropdown"
                @click.stop
              >
                <div class="user-menu-header">
                  <div class="user-avatar large">
                    <span>{{ userInitials }}</span>
                  </div>
                  <div class="user-menu-info">
                    <span class="name">{{ userName }}</span>
                    <span class="email text-muted small">{{ userEmail }}</span>
                  </div>
                </div>

                <div class="user-menu-items">
                  <div class="menu-item" @click="navigateToProfile">
                    <i class="bi bi-person-circle"></i>
                    <span>Mon Profil</span>
                  </div>

                  <div
                    class="menu-item"
                    @click="navigateToUserManagement"
                    v-if="isAdmin"
                  >
                    <i class="bi bi-people-fill"></i>
                    <span>Gestion des Utilisateurs</span>
                  </div>
                  <div
                    class="menu-item"
                    @click="navigateToConfig"
                    v-if="isAdmin"
                  >
                    <i class="bi bi-gear"></i>
                    <span>Configuration</span>
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-item danger" @click="handleLogout">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Déconnexion</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <div class="">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useStore } from "vuex";
import useAuthGuard from "../../utils/useAuthGuard.js";
import api from "../../services/api.js";
import { timeAgo } from "../../utils/useTimeFomat.js";
import {
  fetchNotifications,
  startNotificationListener,
  stopNotificationListener,
} from "../../services/notificationService";

defineOptions({
  name: "AppLayout",
});

const refreshPage = () => {
  window.location.reload();
};

// Router composables
const router = useRouter();
const route = useRoute();

// Store composables
const store = useStore();
const authStore = useAuthStore();
const { isAdmin, isResponsable, isMember, isManager, isGuest, isAuth } =
  useAuthGuard();

// Responsive state
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 992);

// Reactive data
const isCollapsed = ref(false);
const showUserDropdown = ref(false);
const showNotificationDropdown = ref(false);
const profileRef = ref(null);
const notificationRef = ref(null);

// Initialize collapsed state based on screen size
const initSidebarState = () => {
  if (window.innerWidth <= 992) {
    isCollapsed.value = true;
  }
};

onMounted(async () => {
  window.addEventListener("resize", handleResize);
  initSidebarState();
  document.addEventListener("click", onClickOutside);

  const userId = authStore.user?.id;
  if (userId) {
    await fetchNotifications(userId, store);
    startNotificationListener(userId, store);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", onClickOutside);

  const userId = authStore.user?.id;
  if (userId) {
    stopNotificationListener(userId);
  }
});

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value <= 992) {
    isCollapsed.value = true;
  }
};

// Route matching helper
const isRouteActive = (path) => {
  return route.path.startsWith(path);
};

// Notifications (Mock Data)
const notifications = computed(() =>
  store.state.data.notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    time: timeAgo(notification.created_at),
    read: notification.read,
  })),
);

const notificationCount = computed(() => notifications.value.length);

const menuItems = ref([
  {
    icon: '<i class="bi bi-grid-fill"></i>',
    title: "Tableau de bord",
    path: "/dashboard",
    requireAdmin: isAdmin.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-grid-fill"></i>',
    title: "Tableau de bord",
    path: "/manager/dashboard",
    requireAdmin: isManager.value,
  },
  {
    icon: '<i class="bi bi-people-fill"></i>',
    title: "Membres",
    path: "/members",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-wallet-fill"></i>',
    title: "Cotisations",
    path: "/contributions",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-grid-fill"></i>',
    title: "Ma situation",
    path: "/ma-situation",
    requireAdmin: isMember.value,
  },
  {
    icon: '<i class="bi bi-wallet-fill"></i>',
    title: "Mes Cotisations",
    path: "/mesCotisations",
    requireAdmin: isMember.value,
  },

  {
    icon: '<i class="bi bi-wallet-fill"></i>',
    title: "Mes assistances",
    path: "/mesAssistances",
    requireAdmin: isMember.value,
  },
  {
    icon: '<i class="bi bi-credit-card-2-front-fill"></i>',
    title: "Crédits",
    path: "/credits",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-credit-card-2-front"></i>',
    title: "Mes Crédits",
    path: "/credits/mescredits",
    requireAdmin: isMember.value,
  },
  {
    icon: '<i class="bi bi-plus-square-dotted"></i>',
    title: "Demande Crédit",
    path: "/credits/demande",
    requireAdmin: isMember.value,
  },

  {
    icon: '<i class="bi bi-plus-square-dotted"></i>',
    title: "Demande Assistance",
    path: "/assistance/demande",
    requireAdmin: isMember.value,
  },
  {
    icon: '<i class="bi bi-arrow-repeat"></i>',
    title: "Remboursements",
    path: "/remboursements",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-life-preserver"></i>',
    title: "Assistances",
    path: "/assistances",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  {
    icon: '<i class="bi bi-file-earmark-spreadsheet-fill"></i>',
    title: "Importation Mensuelle",
    path: "/importationMensuel",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  // {
  //   icon: '<i class="bi bi-cash-stack"></i>',
  //   title: "Fiche Mensuelle",
  //   path: "/cotisationMensuelle",
  //   requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  // },
  {
    icon: '<i class="bi bi-graph-up"></i>',
    title: "Rapports",
    path: "/reports",
    requireAdmin: isAdmin.value || isManager.value || isResponsable.value,
  },
  // {
  //   icon: '<i class="bi bi-shield-check"></i>',
  //   title: "Administration",
  //   path: "/admin",
  //   requireAdmin: isAdmin.value,
  // },
  // {
  //   icon: '<i class="bi bi-person-badge-fill"></i>',
  //   title: "Utilisateurs",
  //   path: "/users",
  //   requireAdmin: isAdmin.value || isResponsable.value,
  // },
]);

// Computed properties
const currentRouteName = computed(() => {
  const name = route.meta.title || route.name || "";
  return capitalizeFirstLetter(name);
});

const userInitials = computed(() => {
  const user = authStore.user || {};
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return authStore.user?.name
    ? authStore.user.name.charAt(0).toUpperCase()
    : "U";
});

const userName = computed(() => {
  const user = authStore.user || {};
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return authStore.user?.name ?? "Utilisateur";
});

const userEmail = computed(() => {
  return authStore.user?.email ?? "utilisateur@example.com";
});

const userRole = computed(() => {
  const user = authStore.user || {};
  if (user.role) {
    return capitalizeFirstLetter(user.role);
  }
  return "Membre";
});

// Methods
const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
  showNotificationDropdown.value = false;
};

const toggleNotificationDropdown = () => {
  showNotificationDropdown.value = !showNotificationDropdown.value;
  showUserDropdown.value = false;
};

const getNotificationIcon = (type) => {
  const icons = {
    credit: "bi bi-credit-card-fill",
    contribution: "bi bi-wallet2",
    info: "bi bi-info-circle-fill",
  };
  return icons[type] || "bi bi-bell-fill";
};

const handleNotificationClick = async (notification) => {
  // send request to chage to read true
  const response = await api.put(`notifications/${notification.id}/mark-read`);

  notification.read = true;
};

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.read = true));
};

const navigateToProfile = () => {
  router.push("/profile");
  showUserDropdown.value = false;
};

const navigateToUserManagement = () => {
  router.push("/users");
  showUserDropdown.value = false;
};

const navigateToConfig = () => {
  router.push("/config");
  showUserDropdown.value = false;
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const onClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    showUserDropdown.value = false;
  }
  if (notificationRef.value && !notificationRef.value.contains(event.target)) {
    showNotificationDropdown.value = false;
  }
  // Close sidebar on mobile when clicking outside
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.querySelector(".btn-toggle");
  if (
    isMobile.value &&
    !isCollapsed.value &&
    sidebar &&
    !sidebar.contains(event.target) &&
    !toggleBtn.contains(event.target)
  ) {
    isCollapsed.value = true;
  }
};
</script>

<style scoped>
/* Importing Inter font for a modern feel */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

:root {
  /* Couleurs harmonieuses basées sur CASOMIREC */
  --primary-color: #2563eb;
  --primary-hover: #1e40af;
  --primary-light: #eff6ff;
  --primary-dark: #1e3a8a;

  --secondary-color: #10b981;
  --secondary-hover: #059669;

  --accent-purple: #8b5cf6;
  --accent-orange: #f59e0b;

  --bg-color: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;

  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --info: #3b82f6;

  --border-color: #e5e7eb;

  --header-height: 70px;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 80px;
  --transition-speed: 0.3s;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
}

/* Sidebar Styling */
.sidebar {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 50;
  transition: all var(--transition-speed) ease;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.logo-container {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: white;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.menu-label {
  padding: 0 24px;
  margin-bottom: 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.menu-item-link {
  text-decoration: none;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin: 4px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.menu-item:hover::before {
  width: 4px;
}

.menu-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-item.collapsed {
  padding: 12px;
  justify-content: center;
  margin: 4px 10px;
}

.menu-item .icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  min-width: 24px;
}

.menu-title {
  margin-left: 12px;
  white-space: nowrap;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 4px;
  background: white;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  background: rgba(0, 0, 0, 0.05);
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.version-info i {
  font-size: 14px;
}

/* Scrollbar Customization */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin var(--transition-speed) ease;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  min-height: 100vh;
}

.main-wrapper.collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

/* Header Styling */
.app-header {
  height: var(--header-height);
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-toggle {
  background: var(--bg-color);
  border: none;
  font-size: 22px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.btn-toggle:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
  transform: scale(1.05);
}

.current-page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  font-size: 8px;
  color: var(--primary-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-vertical {
  width: 1px;
  height: 32px;
  background-color: var(--border-color);
  margin: 0 8px;
}

.header-action-item {
  position: relative;
}

.btn-icon {
  background: var(--bg-color);
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-secondary);
  position: relative;
  font-size: 18px;
}

.btn-icon:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-icon.active {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  height: 18px;
  min-width: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Dropdowns */
.dropdown-menu-custom {
  position: absolute;
  top: 125%;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
  z-index: 100;
  overflow: hidden;
  transform-origin: top right;
}

.notification-menu {
  width: 380px;
}

.dropdown-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--bg-color) 0%, #e5e7eb 100%);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title i {
  font-size: 20px;
  color: var(--primary-color);
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-text:hover {
  background: var(--primary-light);
}

.notification-list {
  max-height: 360px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: var(--bg-color);
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item.unread:hover {
  background-color: #dbeafe;
}

.notification-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.notification-icon-wrapper.credit {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.notification-icon-wrapper.contribution {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.notification-icon-wrapper.info {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #6366f1;
}

.notification-content {
  flex: 1;
}

.notification-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.notification-time {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.notification-message {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.unread-dot {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.dropdown-footer {
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color);
}

.view-all-link {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.view-all-link:hover {
  background: var(--primary-light);
}

/* User Menu */
.user-menu {
  width: 260px;
}

.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-profile-trigger:hover {
  background-color: var(--bg-color);
}

.user-profile-trigger.active {
  background-color: var(--primary-light);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-info .name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.user-info .role {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.2;
}

.user-menu-header {
  padding: 24px 20px;
  background: linear-gradient(135deg, var(--primary-light) 0%, #dbeafe 100%);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar.large {
  width: 72px;
  height: 72px;
  font-size: 28px;
  margin-bottom: 12px;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.user-menu-info .name {
  display: block;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  font-size: 16px;
}

.user-menu-info .email {
  font-size: 13px;
}

.user-menu-items {
  padding: 8px;
}

.menu-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin: 2px 0 !important;
  font-weight: 500;
}

.menu-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.menu-item:hover {
  background-color: var(--bg-color);
  color: var(--primary-color);
  transform: translateX(2px);
}

.menu-item.danger {
  color: var(--error);
}

.menu-item.danger:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

.menu-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 8px 0;
}

/* Page Content */
.page-content {
  padding: 30px;
  flex: 1;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Transitions */
.fade-slide-enter-active {
  transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.2s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 45;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.sidebar-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* Mobile Responsive */
@media (max-width: 992px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-wrapper,
  .main-wrapper.collapsed {
    margin-left: 0;
  }

  .app-header {
    padding: 0 16px;
  }

  .page-content {
    padding: 16px;
  }

  .notification-menu {
    width: calc(100vw - 32px);
    right: -8px;
  }

  .user-menu {
    width: 240px;
  }
}

@media (max-width: 480px) {
  .user-menu {
    width: calc(100vw - 32px);
    right: -8px;
  }
}
</style>
