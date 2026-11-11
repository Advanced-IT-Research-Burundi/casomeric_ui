<template>
  <div class="container-fluid py-4">
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white py-3">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <h5 class="mb-0 fw-bold text-primary">
            <i class="bi bi-people-fill me-2"></i>Gestion des Utilisateurs
          </h5>
          <div class="row g-2 align-items-center">
                 <div class="col-md-12">
                     <div class="input-group">
                        <span class="input-group-text bg-light border-end-0">
                          <i class="bi bi-search text-muted"></i>
                        </span>
                        <input 
                          type="text" 
                          class="form-control border-start-0 ps-0" 
                          v-model="search" 
                          @input="handleSearch"
                          placeholder="Rechercher par nom..."
                        >
                     </div>
                 </div>
             </div>
          <div class="d-flex gap-2 w-100 w-md-auto">
             <button class="btn btn-primary text-nowrap" @click="goToCreate">
                <i class="bi bi-plus-lg me-1"></i> Ajouter
             </button>
          </div>
        </div>
      </div>
      
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7">ID</th>
                <th class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7">Utilisateur</th>
                <th class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7">Contact</th>
                <th class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7">Rôle</th>
                <th class="py-3 text-secondary text-uppercase text-xs font-weight-bolder opacity-7 text-center">Statut</th>
                <th class="py-3 text-end pe-4 text-uppercase text-xs font-weight-bolder opacity-7">Actions</th>
              </tr>
            </thead>
            <tbody v-if="usersList && usersList.length > 0">
              <tr v-for="user in usersList" :key="user.id">
                <td class="ps-4">
                  <span class="text-secondary text-xs font-weight-bold">{{ user.id }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-2 bg-primary text-white d-flex justify-content-center align-items-center rounded-circle small-avatar">
                       {{ getInitials(user) }}
                    </div>
                    <div>
                      <h6 class="mb-0 text-sm">{{ user.name }}</h6>
                      <small class="text-xs text-muted">{{ user.prenom }} {{ user.nom }}</small>
                    </div>
                  </div>
                </td>
                <td>
                   <div class="d-flex flex-column">
                      <span class="text-xs mb-1"><i class="bi bi-envelope me-1 text-muted"></i> {{ user.email }}</span>
                      <span v-if="user.telephone" class="text-xs"><i class="bi bi-telephone me-1 text-muted"></i> {{ user.telephone }}</span>
                   </div>
                </td>
                <td>
                  <span class="text-sm fw-medium text-dark badge bg-light text-dark border">{{ user.role }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="user.is_active ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'">
                    {{ user.is_active ? 'Actif' : 'Suspendu' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="btn-group">
                    <button class="btn btn-sm btn-light text-info" @click="goToEdit(user)" title="Modifier">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                        class="btn btn-sm btn-light" 
                        :class="user.is_active ? 'text-warning' : 'text-success'"
                        @click="toggleUserStatus(user)" 
                        :title="user.is_active ? 'Suspendre' : 'Activer'"
                    >
                        <i class="bi" :class="user.is_active ? 'bi-slash-circle' : 'bi-check-circle'"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="loading">
                 <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Chargement...</span>
                        </div>
                    </td>
                 </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-people fs-1 d-block mb-2"></i>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
       <!-- Pagination -->
      <div class="card-footer bg-white py-3 border-top-0" v-if="pagination && pagination.total > 0">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <small class="text-muted">
                Affichage de {{ pagination.from || 0 }} à {{ pagination.to || 0 }} sur {{ pagination.total }} résultats
            </small>
             <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item" :class="{ disabled: !pagination.prev_page_url }">
                        <button class="page-link" @click="fetchUsers(pagination.current_page - 1)" :disabled="!pagination.prev_page_url">
                             <span aria-hidden="true">&laquo;</span>
                        </button>
                    </li>
                    <li v-for="link in pagination.links" :key="link.label" class="page-item" :class="{ active: link.active, disabled: !link.url }">
                         <button v-if="!link.label.includes('Previous') && !link.label.includes('Next')" class="page-link" @click="fetchUsersUrl(link.url)">
                             {{ link.label }}
                         </button>
                    </li>
                     <li class="page-item" :class="{ disabled: !pagination.next_page_url }">
                         <button class="page-link" @click="fetchUsers(pagination.current_page + 1)" :disabled="!pagination.next_page_url">
                             <span aria-hidden="true">&raquo;</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../services/api';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification";

const store = useStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const search = ref('');
let searchTimer = null;

onMounted(() => {
  fetchUsers();
});

const users = computed(() => store.state.users);
const usersList = computed(() => store.state.users?.data || []);
const pagination = computed(() => store.state.users || {});

const fetchUsers = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (search.value) {
        params.search = search.value;
    }
    const response = await api.get('/users', { params });
    store.state.users = response.data;
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs:", error);
    toast.error("Impossible de charger les utilisateurs.");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        fetchUsers(1);
    }, 500);
};

const fetchUsersUrl = async (url) => {
    if(!url) return;
    loading.value = true;
    try {
        // Extract page number safely, handling both absolute and relative URLs
        const urlObj = new URL(url, window.location.origin);
        const page = urlObj.searchParams.get('page');
        if (page) {
            await fetchUsers(page);
        } else {
             // Fallback if no page param found, just call fetchUsers()
             await fetchUsers(1);
        }
    } catch (error) {
         console.error("Erreur lors du changement de page:", error);
         loading.value = false;
    }
}

const goToCreate = () => {
    router.push({ name: 'usersAdd' });
};

const goToEdit = (user) => {
    router.push({ name: 'usersEdit', params: { id: user.id } });
};

const toggleUserStatus = async (user) => {
    if (!confirm(`Voulez-vous vraiment ${user.is_active ? 'suspendre' : 'activer'} cet utilisateur ?`)) {
        return;
    }

    try {
        // Toggle status implementation
        // Assuming there is an endpoint for this, or we use update (PUT)
        const newStatus = !user.is_active;
        await api.put(`/users/${user.id}/toggle-status`, { is_active: newStatus });
        
        toast.success(`Utilisateur ${newStatus ? 'activé' : 'suspendu'} avec succès.`);
        await fetchUsers(pagination.value.current_page);
    } catch (error) {
         console.error("Erreur lors du changement de statut:", error);
         // Fallback: try standard update if specific endpoint doesn't exist
         try {
             await api.put(`/users/${user.id}`, { ...user, is_active: !user.is_active });
             toast.success("Statut mis à jour.");
             await fetchUsers(pagination.value.current_page);
         } catch (e) {
             toast.error("Impossible de modifier le statut.");
         }
    }
};

// Utilities
const getInitials = (user) => {
    if (!user) return '';
    // Prefer name if available, otherwise nom/prenom
    if (user.nom && user.prenom) {
         return (user.nom.charAt(0) + user.prenom.charAt(0)).toUpperCase();
    }
    return user.name ? user.name.slice(0, 2).toUpperCase() : 'U';
};

</script>

<style scoped>
.avatar-circle {
    width: 40px;
    height: 40px;
    font-weight: 600;
}
.small-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
}
.text-xs {
    font-size: 0.75rem !important;
}
.bg-success-subtle {
    background-color: #d1e7dd !important;
}
.bg-danger-subtle {
    background-color: #f8d7da !important;
}
</style>