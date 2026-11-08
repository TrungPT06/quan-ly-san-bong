import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./assets/css/index.css";
import "./assets/css/club.css";

const app = createApp(App);
app.use(createPinia());
useAuthStore().listen(); // đồng bộ phiên đăng nhập giữa các tab / khi token hết hạn
app.use(router);
app.mount("#app");
