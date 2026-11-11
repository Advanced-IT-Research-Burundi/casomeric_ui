import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

// Import your components
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";
import PageNotFound from "../views/errors/PageNotFound.vue";

// Auth guard
const requireAuth = (to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  if (!isAuthenticated) {
    next("/login");
  } else {
    next();
  }
};

const routes = [

  {
    path: "/reports",
    name: "reports",
    component: () => import("../views/rapports/RapportComponent.vue"),
    meta: { requiresAuth: true },
  },
  // Public routes
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/auth/Register.vue"),
    meta: { guest: true },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("../views/auth/ForgotPassword.vue"),
    meta: { guest: true },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: () => import("../views/auth/ResetPassword.vue"),
  },
  // 404 route

  // Authenticated routes
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../views/Dashboard.vue"),
    alias: "/",
    meta: { requiresAuth: true },
  },
  {
    path: "/manager/dashboard",
    name: "managerDashboard",
    component: () => import("../views/manager/ManagerDashboard.vue"),
    meta: { requiresAuth: true },
  },
  // Test AdvancedTable
  {
    path: "/test",
    name: "TestAdvancedTable",
    component: () => import("../views/TestAdvancedTable.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/ma-situation",
    name: "maSituation",
    component: () => import("../views/members/MaSituation.vue"),
    meta: { requiresAuth: true, title: "Ma situation" },
  },
  {
    path: "/mesCotisations",
    name: "mesCotisations",
    component: () => import("../views/cotisations/MesCotisations.vue"),
    meta: { requiresAuth: true },
  },

  {
    path: "/assistance/demande",
    name: "assistanceDemande",
    component: () => import("../views/assistances/DemandeAssistance.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/mesAssistances",
    name: "mesAssistances",
    component: () => import("../views/assistances/MesAssistances.vue"),
    meta: { requiresAuth: true },
  },
  // Assistances
  {
    path: "/assistances",
    name: "assistances",
    children: [
      {
        path: "",
        name: "assistancesView",
        component: () => import("../views/assistances/AssistanceView.vue"),
      },
      {
        path: "add",
        name: "assistancesAdd",
        component: () => import("../views/assistances/AddAssistanceView.vue"),
      },
      {
        path: ":id/edit",
        name: "assistancesEdit",
        component: () => import("../views/assistances/EditAssistance.vue"),
        props: true,
      },
    ],
    meta: { requiresAuth: true },
  },

  {
    path: "/config",
    name: "Configuration",
    children: [
      {
        path: "",
        name: "configHub",
        component: () => import("../views/conf/ConfigHub.vue"),
      },
      {
        path: "generale",
        name: "configGenerale",
        component: () => import("../views/conf/ConfigGenerale.vue"),
      },
      {
        path: "categories",
        name: "configCategories",
        component: () => import("../views/conf/ConfigCategorieMembres.vue"),
      },
      {
        path: "assistances",
        name: "configAssistances",
        component: () => import("../views/conf/ConfigTypesAssistances.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },

  // Credits
  {
    path: "/credits",
    name: "credits",
    children: [
      {
        path: "",
        name: "creditsView",
        component: () => import("../views/credits/Credits.vue"),
      },
      {
        path: "mescredits",
        name: "mescredits",
        component: () => import("../views/credits/MemberCredits.vue"),
      },
      {
        path: "demande",
        name: "creditsDemande",
        component: () => import("../views/credits/DemandeCredit.vue"),
      },
    
      {
        path: "add",
        name: "creditsAdd",
        component: () => import("../views/credits/AddCredit.vue"),
      },
      {
        path: "view/:id",
        name: "creditsShow",
        component: () => import("../views/credits/ViewCredit.vue"),
        props: true,
      },
      {
        path: ":id/edit",
        name: "creditsEdit",
        component: () => import("../views/credits/EditCredit.vue"),
        props: true,
      },
    ],
    meta: { requiresAuth: true },
  },
  // Members
  {
    path: "/members",
    name: "members",
    children: [
      {
        path: "",
        name: "membersView",
        component: () => import("../views/members/AllMembers.vue"),
      },
      {
        path: ":id",
        name: "memberView",
        component: () => import("../views/members/ViewMember.vue"),
      },
      {
        path: "add",
        name: "membersAdd",
        component: () => import("../views/members/CreateMember.vue"),
      },
      {
        path: ":id/edit",
        name: "membersEdit",
        component: () => import("../views/members/EditMember.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: "/importationMensuel",
    name: "importationMensuel",
    component: () => import("../views/imports/ImportationComponent.vue"),
  },
  // Remboursements
  {
    path: "/remboursements",
    name: "remboursements",
    children: [
      {
        path: "",
        name: "remboursementsView",
        component: () => import("../views/remboursements/Remboursements.vue"),
      },
      {
        path: "mensuel",
        name: "remboursementsMensuel",
        component: () => import("../views/remboursements/RemboursementsMensuel.vue"),
      },
      {
        path: "add",
        name: "remboursementsAdd",
        component: () => import("../views/remboursements/AddRemboursement.vue"),
      },
      {
        path: ":id/edit",
        name: "remboursementsEdit",
        component: () =>
          import("../views/remboursements/EditRemboursement.vue"),
        props: true,
      },
      {
        path: "detail/:id",
        name: "remboursementDetail",
        component: () =>
          import("../views/remboursements/DetailRemboursement.vue"),
        props: true,
      },
    ],
    meta: { requiresAuth: true },
  },

  {
    path: "/notifications",
    name: "notifications",
    component: () => import("../views/notifications/Notifications.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/cotisationMensuelle",
    name: "cotisationMensuelle",
    component: () => import("../views/cotisations/CotisationMensuelle.vue"),
    meta: { requiresAuth: true },
  },

  {
    path: "/assistanceDetails/:id",
    name: "assistanceDetails",
    component: () => import("../views/assistances/AssistanceDetails.vue"),
    meta: { requiresAuth: true },
  },

  // Contributions
  {
    path: "/contributions",
    name: "contributions",
    children: [
      {
        path: "",
        name: "contributionsView",
        component: () => import("../views/contributions/ContributionView.vue"),
      },
      {
        path: "mensuelle",
        name: "contributionsMensuelleView",
        component: () => import("../views/contributions/ContributionMensuelleView.vue"),
      },
      
      {
        path: "add",
        name: "contributionsAdd",
        component: () => import("../views/contributions/AddContribution.vue"),
      },
      {
        path: ":id",
        name: "viewContribution",
        component: () => import("../views/contributions/ViewContribution.vue"),
      },

      {
        path: ":id/edit",
        name: "contributionsEdit",
        component: () => import("../views/contributions/EditContribution.vue"),
      },
    ],
    meta: { requiresAuth: true },
  },

  // Users
  {
    path: "/users",
    name: "users",
    children: [
      {
        path: "",
        name: "usersView",
        component: () => import("../views/users/Users.vue"),
      },
      {
        path: ":id",
        name: "usersShow",
        component: () => import("../views/users/ShowUser.vue"),
        props: true,
      },
      {
        path: "add",
        name: "usersAdd",
        component: () => import("../views/users/AddUser.vue"),
      },
      {
        path: ":id/edit",
        name: "usersEdit",
        component: () => import("../views/users/EditUser.vue"),
        props: true,
      },
    ],
    meta: { requiresAuth: true },
  },

  // Profile
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/profile/profile.vue"),
    meta: { requiresAuth: true },
  },

  // 404 - Keep this as last route
  {
    path: "/:pathMatch(.*)*",
    name: "PageNotFound",
    component: PageNotFound,
    meta: { title: "Page non trouvée", requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new route
    return { top: 0, behavior: "smooth" };
  },
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Set page title
  document.title = to.meta.title ? `${to.meta.title} | CASOMIREC` : "CASOMIREC";

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      console.log("not authenticated");
      authStore.setReturnUrl(to.fullPath);
      return next({ name: "Login" });
    }

    return next();
  }

  // Redirect to dashboard if user is already authenticated and trying to access guest pages
  if (to.meta.guest && authStore.isAuthenticated) {


    //if it a simple membre redirect him to mescredits
    if(authStore.user.role === "membre"){
      return next({ name: "maSituation" });
    }
    return next({ name: "dashboard" });
  }

  next();
});

export default router;
