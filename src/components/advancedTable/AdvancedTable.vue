<template>
  <div class="advanced-table-container">
    <!-- Search and Controls -->
    <div class="row mb-1">
      <div class="col-md-6">
        <TableSearch
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          @search="handleSearch"
        />
      </div>
      <div class="col-md-6 d-flex justify-content-end align-items-center">
        <TableFilters
          v-if="showFilters"
          :columns="filterableColumns"
          :filters="activeFilters"
          @filter-change="handleFilterChange"
          @clear-filters="clearFilters"
        />
        <div class="ms-2">
          <select
            v-model="itemsPerPage"
            class="form-select"
            style="width: auto"
            @change="handlePerPageChange"
          >
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && tableData.length == 0" class="table-responsive">
      <table class="table table-striped">
        <thead class="table-light">
          <tr>
            <th v-for="n in skeletonColumns" :key="n" scope="col">
              <div class="skeleton skeleton-text"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in skeletonRows" :key="n">
            <td v-for="m in skeletonColumns" :key="m">
              <div class="skeleton skeleton-text"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Data Table -->
    <div v-else class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-light">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="{ sortable: column.sortable !== false }"
              @click="column.sortable !== false ? handleSort(column.key) : null"
            >
              <div class="d-flex align-items-center justify-content-between">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable !== false" class="sort-icons">
                  <i
                    class="fas fa-chevron-up"
                    :class="{
                      'text-primary':
                        sortField === column.key && sortOrder === 'asc',
                    }"
                  ></i>
                  <i
                    class="fas fa-chevron-down"
                    :class="{
                      'text-primary':
                        sortField === column.key && sortOrder === 'desc',
                    }"
                  ></i>
                </div>
              </div>
            </th>
            <th v-if="hasActions" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="columns.length + (hasActions ? 1 : 0)"
              class="text-center py-4"
            >
              <div class="text-muted">
                <i class="fas fa-inbox fs-1 d-block mb-2"></i>
                {{ noDataMessage }}
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(item, index) in tableData"
            :key="getRowKey(item, index)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :style="{
                maxWidth: `${column.width || 'fit-content'} !important`,
              }"
            >
              <slot
                :name="`column-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
              >
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            <td v-if="hasActions">
              <slot
                name="actions"
                :item="item"
                :index="index"
                :open-details="handleShow"
              >
                <div class="btn-group">
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    @click="handleShow(item)"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="$emit('edit', item)"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="$emit('delete', item)"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <TablePagination
      v-if="!loading && tableData.length > 0 && paginationData"
      :pagination="paginationData"
      @page-change="handlePageChange"
    />

    <DetailsModal
      v-if="detailsEndpoint"
      v-model="showDetailsModal"
      :endpoint="detailsEndpoint"
      :item-id="detailsItemId"
      :title="detailsTitle"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import TableSearch from "./TableSearch.vue";
import TableFilters from "./TableFilters.vue";
import TablePagination from "./TablePagination.vue";
import DetailsModal from "../common/DetailsModal.vue";

// Props
const props = defineProps({
  // Laravel pagination response format
  data: {
    type: Object,
    default: () => ({
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    }),
  },
  columns: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  searchPlaceholder: {
    type: String,
    default: "Search...",
  },
  noDataMessage: {
    type: String,
    default: "No data available",
  },
  showFilters: {
    type: Boolean,
    default: true,
  },
  hasActions: {
    type: Boolean,
    default: true,
  },
  rowKey: {
    type: String,
    default: "id",
  },
  skeletonRows: {
    type: Number,
    default: 5,
  },
  skeletonColumns: {
    type: Number,
    default: 4,
  },
  detailsEndpoint: {
    type: String,
    default: null,
  },
  detailsTitle: {
    type: String,
    default: "Détails",
  },
});

// Emits
const emit = defineEmits([
  "edit",
  "delete",
  "show",
  "row-click",
  "search",
  "sort",
  "filter",
  "page-change",
  "per-page-change",
]);

// Reactive data
const searchQuery = ref("");
const sortField = ref("");
const sortOrder = ref("asc");
const itemsPerPage = ref(props.data.per_page || 10);
const activeFilters = ref({});

// Computed properties
const filterableColumns = computed(() =>
  props.columns.filter((col) => col.filterable !== false)
);

const tableData = computed(() => {
  return props.data.data || [];
});

const paginationData = computed(() => {
  if (!props.data) return null;

  return {
    current_page: props.data.current_page,
    last_page: props.data.last_page,
    per_page: props.data.per_page,
    total: props.data.total,
    from: props.data.from,
    to: props.data.to,
  };
});

// Methods
const getNestedValue = (obj, path) => {
  // Use ?? (not ||) so real values like 0 or false are kept; only missing values become "".
  return path.split(".").reduce((o, p) => (o == null ? undefined : o[p]), obj) ?? "";
};

const getRowKey = (item, index) => {
  return item[props.rowKey] || index;
};

const formatCellValue = (item, column) => {
  const value = getNestedValue(item, column.key);

  if (column.formatter && typeof column.formatter === "function") {
    return column.formatter(value, item);
  }

  return value;
};

const handleSearch = (query) => {
  searchQuery.value = query;
  emit("search", query);
};

const handleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }

  emit("sort", { field: sortField.value, order: sortOrder.value });
};

const handleFilterChange = (filters) => {
  activeFilters.value = { ...filters };
  emit("filter", filters);
};

const clearFilters = () => {
  activeFilters.value = {};
  emit("filter", {});
};

const handlePageChange = (page) => {
  emit("page-change", page);
};

const handlePerPageChange = () => {
  emit("per-page-change", itemsPerPage.value);
};

// Watch for per_page changes from parent
watch(
  () => props.data.per_page,
  (newPerPage) => {
    if (newPerPage) {
      itemsPerPage.value = newPerPage;
    }
  }
);

const showDetailsModal = ref(false);
const detailsItemId = ref(null);

const handleShow = (item) => {
  if (props.detailsEndpoint) {
    detailsItemId.value = getRowKey(item);
    showDetailsModal.value = true;
  }
  emit("show", item);
};
</script>

<style scoped>
.advanced-table-container {
  width: 100%;
}

.advanced-table-container .table tbody tr {
  vertical-align: middle;
}

.advanced-table-container .table tbody tr td.width-10 {
  width: 10px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sort-icons {
  display: flex;
  flex-direction: column;
  font-size: 0.7rem;
  line-height: 1;
}

.sort-icons i {
  opacity: 0.5;
  transition: all 0.2s;
}

.sort-icons i.text-primary {
  opacity: 1;
}

/* Skeleton Loading Styles */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-text {
  height: 16px;
  width: 80%;
}

.table td,
.table th {
  word-wrap: break-word;
  min-width: fit-content !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
}

th {
  font-weight: 600 !important;
}
</style>
